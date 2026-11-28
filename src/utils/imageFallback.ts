import React from 'react';

export function createSignagePlaceholderDataUri(label = 'Flange Craft', shape: 'Round' | 'Square' | string = 'Round'): string {
  const safeLabel = String(label || 'Flange Craft')
    .replace(/[&<>"']/g, '')
    .slice(0, 32);
  const isSquare = String(shape).toLowerCase() === 'square';

  const shapeElement = isSquare
    ? `<rect x="130" y="95" width="140" height="140" rx="22" fill="#111318" stroke="#38BDF8" stroke-width="3" stroke-opacity="0.65" />
       <rect x="144" y="109" width="112" height="112" rx="14" fill="#1A1C22" stroke="#8B5CF6" stroke-width="1.5" stroke-opacity="0.45" />`
    : `<circle cx="200" cy="165" r="72" fill="#111318" stroke="#38BDF8" stroke-width="3" stroke-opacity="0.65" />
       <circle cx="200" cy="165" r="56" fill="#1A1C22" stroke="#8B5CF6" stroke-width="1.5" stroke-opacity="0.45" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <radialGradient id="glow" cx="50%" cy="42%" r="50%">
        <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.18" />
        <stop offset="60%" stop-color="#8B5CF6" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#1A1C22" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="#1A1C22" />
    <circle cx="200" cy="165" r="150" fill="url(#glow)" />
    <rect x="78" y="153" width="52" height="24" rx="4" fill="#252834" stroke="#ffffff" stroke-opacity="0.15" />
    <rect x="70" y="138" width="10" height="54" rx="3" fill="#38BDF8" fill-opacity="0.5" />
    ${shapeElement}
    <text x="200" y="162" text-anchor="middle" fill="#F5F5F7" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5">FLANGE CRAFT</text>
    <text x="200" y="180" text-anchor="middle" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="10" font-weight="600" letter-spacing="1">ILLUMINATED SIGN</text>
    <text x="200" y="295" text-anchor="middle" fill="#A1A1AA" font-family="system-ui, sans-serif" font-size="12" font-weight="500">${safeLabel}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function applyImageFallbackOnError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  label = 'Flange Craft',
  shape: 'Round' | 'Square' | string = 'Round'
): void {
  const img = event.currentTarget;
  // Prevent infinite error loops
  if (img.dataset.fallbackApplied === 'true') {
    img.onerror = null;
    return;
  }
  img.dataset.fallbackApplied = 'true';
  img.src = createSignagePlaceholderDataUri(label, shape);
}
