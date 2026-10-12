import type { ResearchSessionDraft } from '../types';

// Borrador del formulario en curso, solo en esta pestaña (sessionStorage): sobrevive a una recarga,
// se borra al cerrar la pestaña, al enviar, al descartar o al cerrar sesión.
const PREFIX = 'simect:borrador:';

export function readStoredDraft(path: string): ResearchSessionDraft | null {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + path);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ResearchSessionDraft : null;
  } catch {
    return null;
  }
}

export function storeDraft(path: string, draft: ResearchSessionDraft | null): void {
  try {
    if (draft) window.sessionStorage.setItem(PREFIX + path, JSON.stringify(draft));
    else window.sessionStorage.removeItem(PREFIX + path);
  } catch {
    // Sin almacenamiento disponible (modo privado o bloqueado): el borrador queda solo en memoria.
  }
}

export function clearStoredDrafts(): void {
  try {
    Object.keys(window.sessionStorage).filter((key) => key.startsWith(PREFIX)).forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignorado: nada que limpiar.
  }
}
