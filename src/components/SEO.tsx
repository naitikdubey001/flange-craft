import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  structuredData?: Record<string, unknown>;
}

export function SEO({
  title,
  description = 'Flange Craft designs and manufactures premium illuminated Lollipop Flange projecting storefront signage. Owned by Sunil Shukla and Team.',
  canonicalPath,
  ogImage = '/logo/logo.jpeg',
  structuredData
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes('Flange Craft') ? title : `${title} | Flange Craft`;
    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.startsWith('meta[property=')) {
          el.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        } else if (selector.startsWith('meta[name=')) {
          el.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', ogImage);
    if (canonicalPath) {
      setMeta('meta[property="og:url"]', 'content', window.location.origin + canonicalPath);
    }

    const existingScript = document.getElementById('fc-jsonld');
    if (structuredData) {
      const script = existingScript || document.createElement('script');
      script.id = 'fc-jsonld';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(structuredData);
      if (!existingScript) document.head.appendChild(script);
    } else if (existingScript) {
      existingScript.remove();
    }
  }, [title, description, canonicalPath, ogImage, structuredData]);

  return null;
}
