import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

export const LISTINGS_URL = '/api/household-listings';

export default function ListingPhoto({ photo, alt, lazy = false }) {
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
    if (!visible) return;
    const controller = new AbortController();
    let preview;
    async function load() {
      try {
        let blob = photo;
        if (!(photo instanceof File)) {
          const response = await apiFetch(`${LISTINGS_URL}/photos/${photo}`, { signal: controller.signal });
          if (!response.ok) throw new Error();
          blob = await response.blob();
        }
        if (!controller.signal.aborted) {
          preview = URL.createObjectURL(blob);
          setUrl(preview);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    load();
    return () => {
      controller.abort();
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [photo, visible]);

  if (!url || failed) {
    return <div ref={setPlaceholder} className="listing-photo-placeholder">{failed ? 'Photo indisponible' : 'Chargement…'}</div>;
  }
  return <img src={url} alt={alt} onError={() => setFailed(true)} />;
}
