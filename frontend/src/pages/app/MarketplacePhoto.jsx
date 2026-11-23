import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

export default function MarketplacePhoto({ photoId, alt = 'Photo de l’article', className = '', lazy = true }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(!lazy);
  const [placeholder, setPlaceholder] = useState(null);

  useEffect(() => {
    if (visible || !placeholder) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { rootMargin: '200px' });
    observer.observe(placeholder);
    return () => observer.disconnect();
  }, [placeholder, visible]);

  useEffect(() => {
    if (!visible || !photoId) return;
    const controller = new AbortController();
    let previewUrl;

    async function load() {
      try {
        if (photoId instanceof File) {
          previewUrl = URL.createObjectURL(photoId);
          setUrl(previewUrl);
          return;
        }

        const response = await apiFetch(`/api/marketplace/photos/${photoId}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const blob = await response.blob();
        if (!controller.signal.aborted) {
          previewUrl = URL.createObjectURL(blob);
          setUrl(previewUrl);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }

    load();
    return () => {
      controller.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [photoId, visible]);

  if (!photoId) {
    return (
      <div ref={setPlaceholder} className={`mp-photo-placeholder ${className}`}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  if (!url || failed) {
    return (
      <div ref={setPlaceholder} className={`mp-photo-placeholder ${className}`}>
        <span>{failed ? 'Photo indisponible' : 'Chargement…'}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={`mp-photo-img ${className}`}
      onError={() => setFailed(true)}
      loading={lazy ? 'lazy' : 'eager'}
    />
  );
}
