/**
 * Centralized API Configuration & Fetch Utility
 *
 * - In local development, Vite proxies `/api` to `http://localhost:3001` when `VITE_API_BASE_URL` is unset.
 * - In production, if the backend is hosted on a separate origin (e.g. Render / Railway),
 *   set `VITE_API_BASE_URL` (for example `https://flange-craft-api.onrender.com`) or configure Vercel rewrites.
 */

const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const rawBaseUrl = metaEnv?.VITE_API_BASE_URL || '';
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '');

export function buildApiUrl(endpoint: string): string {
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  // Avoid duplicating /api if VITE_API_BASE_URL already ends with /api
  if (API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 0, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
  token?: string | null;
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function apiRequest<T = Record<string, unknown>>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<{ status: number; data: T }> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, token, headers: customHeaders, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>)
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    if (typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams) {
      serializedBody = body;
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      serializedBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(buildApiUrl(endpoint), {
      ...rest,
      headers,
      body: serializedBody,
      signal: controller.signal
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');

    let parsedData: unknown = null;
    const rawText = await response.text();

    if (rawText) {
      if (isJson) {
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          throw new ApiError(
            'Received a malformed JSON response from the server.',
            response.status || 502,
            'MALFORMED_RESPONSE'
          );
        }
      } else {
        // Sometimes JSON is returned without application/json header, or HTML is returned by a SPA fallback / gateway
        const trimmed = rawText.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            parsedData = JSON.parse(trimmed);
          } catch {
            parsedData = null;
          }
        }
      }
    }

    // If a 200 HTML page was returned (e.g. SPA index.html fallback when backend API is not deployed)
    if (response.ok && !isJson && parsedData === null) {
      throw new ApiError(
        'Backend API service is unreachable or not configured for this environment.',
        503,
        'BACKEND_UNAVAILABLE'
      );
    }

    if (!response.ok) {
      const serverErrorMsg =
        parsedData &&
        typeof parsedData === 'object' &&
        'error' in parsedData &&
        typeof (parsedData as { error?: unknown }).error === 'string'
          ? (parsedData as { error: string }).error
          : null;

      if (serverErrorMsg) {
        throw new ApiError(serverErrorMsg, response.status, `HTTP_${response.status}`);
      }

      if (response.status === 401) {
        throw new ApiError('Authentication required. Please sign in and try again.', 401, 'UNAUTHORIZED');
      }
      if (response.status === 403) {
        throw new ApiError('You do not have permission to perform this action.', 403, 'FORBIDDEN');
      }
      if (response.status === 404) {
        throw new ApiError(
          'Requested API endpoint or resource was not found (404). Please verify the backend service is running.',
          404,
          'NOT_FOUND'
        );
      }
      if (response.status === 429) {
        throw new ApiError(
          'Too many requests. Please wait a moment before trying again.',
          429,
          'RATE_LIMITED'
        );
      }
      if (response.status >= 500) {
        throw new ApiError(
          'The server encountered a temporary error. Please try again shortly.',
          response.status,
          'SERVER_ERROR'
        );
      }

      throw new ApiError(
        `Request failed with status ${response.status}.`,
        response.status,
        `HTTP_${response.status}`
      );
    }

    return {
      status: response.status,
      data: (parsedData ?? {}) as T
    };
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if ((err instanceof DOMException || err instanceof Error) && err.name === 'AbortError') {
      throw new ApiError(
        'The request timed out. Please check your connection and try again.',
        408,
        'TIMEOUT'
      );
    }
    throw new ApiError(
      'Unable to connect to the server. Please verify your internet connection or backend availability.',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error && err.message) {
    // Avoid exposing raw TypeError: Failed to fetch
    if (/failed to fetch|networkerror|load failed/i.test(err.message)) {
      return 'Unable to connect to the server. Please verify your internet connection or backend availability.';
    }
    return err.message;
  }
  return fallback;
}
