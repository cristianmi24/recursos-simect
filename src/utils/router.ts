import { useEffect, useState } from 'react';

// Rutas mínimas sobre la History API: la URL guarda dónde está la persona para que,
// al recargar o usar atrás/adelante, vuelva a la misma pantalla.
const NAVIGATE_EVENT = 'simect:navigate';

export const TOP_LEVEL_ROUTES = [
  'panel', 'audios', 'categorias', 'codificacion', 'triangulacion', 'reportes', 'registro', 'auditoria', 'usuarios', 'formularios'
] as const;

export function currentSegments(): string[] {
  return window.location.pathname.split('/').filter(Boolean).map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

export function navigate(segments: string[], options: { replace?: boolean } = {}): void {
  const path = `/${segments.map(encodeURIComponent).join('/')}`;
  if (path === window.location.pathname) return;
  if (options.replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

export function useSegments(): string[] {
  const [segments, setSegments] = useState(currentSegments);
  useEffect(() => {
    const update = () => setSegments(currentSegments());
    window.addEventListener('popstate', update);
    window.addEventListener(NAVIGATE_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(NAVIGATE_EVENT, update);
    };
  }, []);
  return segments;
}
