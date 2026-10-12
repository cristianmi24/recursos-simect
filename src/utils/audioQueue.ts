// Cola de audios en el dispositivo (IndexedDB). Una grabación no se pierde aunque se vaya la señal,
// se recargue la página, se cambie de pregunta o se cierre la pestaña:
//  - 'recording': se guarda por trozos mientras se graba (recuperable si la página se cierra a mitad).
//  - 'review': grabada, esperando que la persona la escuche y la acepte o descarte.
//  - 'queued': aceptada; se sube a R2 en cuanto haya conexión y se reintenta sola.
// Al subirse y verificarse, se borra del dispositivo y se avisa con el evento AUDIO_UPLOADED.

export type AudioStatus = 'recording' | 'review' | 'queued';
export type StoredRecording = {
  id: string;
  questionId: string;
  studentCode: string;
  mime: string;
  seconds: number;
  status: AudioStatus;
  chunks: Blob[];
  updatedAt: number;
};
export type UploadedAudio = { audioKey: string; audioMime: string; audioSeconds: number };

export const AUDIO_CHANGED = 'simect:audio-changed';
export const AUDIO_UPLOADED = 'simect:audio-uploaded';
export const AUDIO_FAILED = 'simect:audio-failed';

const DB_NAME = 'simect-audios';
const STORE = 'recordings';
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = null; reject(request.error); };
  });
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const changed = (id: string) => window.dispatchEvent(new CustomEvent(AUDIO_CHANGED, { detail: { id } }));

export async function getRecording(id: string): Promise<StoredRecording | null> {
  try {
    return (await run<StoredRecording | undefined>('readonly', (store) => store.get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function putRecording(recording: StoredRecording): Promise<void> {
  try {
    await run('readwrite', (store) => store.put({ ...recording, updatedAt: Date.now() }));
  } catch {
    // Sin IndexedDB (modo privado estricto): la grabación queda solo en memoria.
  }
  changed(recording.id);
}

export async function deleteRecording(id: string): Promise<void> {
  try {
    await run('readwrite', (store) => store.delete(id));
  } catch {
    // Nada que borrar.
  }
  changed(id);
}

export async function listRecordings(prefix: string): Promise<StoredRecording[]> {
  try {
    const all = await run<StoredRecording[]>('readonly', (store) => store.getAll());
    return all.filter((item) => item.id.startsWith(prefix));
  } catch {
    return [];
  }
}

export async function clearRecordings(prefix: string): Promise<void> {
  for (const item of await listRecordings(prefix)) await deleteRecording(item.id);
}

export const recordingBlob = (recording: StoredRecording) => new Blob(recording.chunks, { type: recording.mime });

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

// Sube el audio a R2 con una URL firmada y verifica que quedó completo. Reintenta ante cortes breves.
export async function uploadAudio(blob: Blob, mime: string, seconds: number, studentCode: string, questionId: string): Promise<UploadedAudio> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await delay(1500 * attempt);
    try {
      const signed = await fetch('/api/audio/upload-url', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: mime, studentCode, questionId })
      });
      const payload = await signed.json().catch(() => ({}));
      if (!signed.ok) {
        // Errores de datos o de permisos no mejoran reintentando.
        if (signed.status < 500 && signed.status !== 429) throw Object.assign(new Error(payload.error || 'No se pudo preparar la subida.'), { final: true });
        throw new Error(payload.error || 'No se pudo preparar la subida.');
      }
      const put = await fetch(payload.url, { method: 'PUT', headers: { 'Content-Type': payload.contentType }, body: blob });
      if (!put.ok) throw new Error('El almacenamiento rechazó el audio.');
      const check = await fetch('/api/audio/verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: payload.key, size: blob.size })
      });
      if (!check.ok) throw new Error('El audio no se guardó completo.');
      return { audioKey: payload.key as string, audioMime: payload.contentType as string, audioSeconds: seconds };
    } catch (error) {
      lastError = error;
      if ((error as { final?: boolean })?.final || !navigator.onLine) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No se pudo subir el audio.');
}

const inFlight = new Set<string>();

// Sube todas las grabaciones aceptadas ('queued') de un formulario. Seguro de llamar varias veces.
export async function processQueue(prefix: string): Promise<void> {
  for (const item of await listRecordings(prefix)) {
    if (item.status !== 'queued' || inFlight.has(item.id)) continue;
    inFlight.add(item.id);
    try {
      const saved = await uploadAudio(recordingBlob(item), item.mime, item.seconds, item.studentCode, item.questionId);
      await deleteRecording(item.id);
      window.dispatchEvent(new CustomEvent(AUDIO_UPLOADED, { detail: { id: item.id, questionId: item.questionId, saved } }));
    } catch (error) {
      const offline = !navigator.onLine || error instanceof TypeError;
      window.dispatchEvent(new CustomEvent(AUDIO_FAILED, {
        detail: {
          id: item.id,
          offline,
          message: offline
            ? 'Sin conexión: el audio quedó guardado en este dispositivo y se enviará solo cuando vuelva la señal.'
            : error instanceof Error ? error.message : 'No se pudo subir el audio.'
        }
      }));
    } finally {
      inFlight.delete(item.id);
    }
  }
}

export const isUploading = (id: string) => inFlight.has(id);
