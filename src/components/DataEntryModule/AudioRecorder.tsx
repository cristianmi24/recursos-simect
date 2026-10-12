import React, { useCallback, useEffect, useRef, useState } from 'react';
import fixWebmDuration from 'fix-webm-duration';
import { Check, Loader2, Mic, RotateCcw, Square, Trash2 } from 'lucide-react';
import { AUDIO_FAILED, AUDIO_UPLOADED, deleteRecording, getRecording, isUploading, processQueue, putRecording, recordingBlob } from '../../utils/audioQueue';

const MAX_SECONDS = 900;

type RecorderValue = { audioKey?: string; audioMime?: string; audioSeconds?: number };

const pickMime = (): string => {
  if (typeof MediaRecorder === 'undefined') return '';
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

// Reproduce un audio guardado en R2 pidiendo una URL firmada de corta vida.
export const StoredAudioPlayer: React.FC<{ audioKey: string }> = ({ audioKey }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setUrl('');
    setError('');
    fetch(`/api/audio/url?key=${encodeURIComponent(audioKey)}`, { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('audio'))))
      .then((data: { url: string }) => { if (active) setUrl(data.url); })
      .catch(() => { if (active) setError('No se pudo cargar el audio.'); });
    return () => { active = false; };
  }, [audioKey]);
  if (error) return <p className="text-xs text-rose-700">{error}</p>;
  if (!url) return <p className="text-xs text-slate-500">Cargando audio…</p>;
  return <audio controls preload="none" src={url} className="w-full" />;
};

type Props = {
  value: RecorderValue;
  onChange: (value: RecorderValue) => void;
  consentApproved: boolean;
  label?: string;
  studentCode?: string;
  questionId?: string;
  /** Identificador de la grabación en el dispositivo (formulario + pregunta). */
  storageId: string;
  /** Mensaje cuando falta el código con el que se nombra el archivo. */
  missingCodeHint?: string;
};

type Pending = { blob: Blob; mime: string; seconds: number; url: string };

export const AudioRecorder: React.FC<Props> = ({
  value, onChange, consentApproved, label = 'Respuesta en audio', studentCode, questionId, storageId,
  missingCodeHint = 'Selecciona al estudiante en los datos generales para poder grabar: el audio se guarda con su código.'
}) => {
  // idle: sin acción · recording: grabando · uploading: subiendo · waiting: aceptado, esperando conexión
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'waiting'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savedPreview, setSavedPreview] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const startedAtRef = useRef(0);
  const pendingRef = useRef<Pending | null>(null);
  pendingRef.current = pending;

  const releaseStream = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => {
    releaseStream();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, [releaseStream]);

  useEffect(() => () => { if (pending) URL.revokeObjectURL(pending.url); }, [pending]);
  useEffect(() => () => { if (savedPreview) URL.revokeObjectURL(savedPreview); }, [savedPreview]);

  // Al abrir la pregunta se recupera lo que hubiera en el dispositivo: una grabación interrumpida,
  // una por revisar o una aceptada que aún no se subió.
  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = await getRecording(storageId);
      if (!active || !stored || stored.chunks.length === 0) return;
      let blob = recordingBlob(stored);
      if (stored.status === 'recording') {
        if (stored.mime === 'audio/webm') {
          try { blob = await fixWebmDuration(blob, stored.seconds * 1000, { logger: false }); } catch { /* se usa tal cual */ }
        }
        await putRecording({ ...stored, status: 'review', chunks: [blob] });
        if (!active) return;
        setNotice('Se recuperó una grabación que se interrumpió. Escúchala y decide si la guardas.');
      }
      setPending({ blob, mime: stored.mime, seconds: stored.seconds, url: URL.createObjectURL(blob) });
      setSeconds(stored.seconds);
      if (stored.status === 'queued') {
        setStatus(isUploading(storageId) ? 'uploading' : 'waiting');
        void processQueue(storageId);
      }
    })();
    return () => { active = false; };
  }, [storageId]);

  // Resultado de la subida (la hace la cola, también si la pregunta no está abierta).
  useEffect(() => {
    const onUploaded = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail.id !== storageId) return;
      const current = pendingRef.current;
      if (current) setSavedPreview(URL.createObjectURL(current.blob));
      setPending(null);
      setStatus('idle');
      setError('');
      setNotice('');
    };
    const onFailed = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; offline: boolean; message: string }>).detail;
      if (detail.id !== storageId) return;
      setStatus('waiting');
      setError(detail.message);
    };
    const onOnline = () => { void processQueue(storageId); };
    window.addEventListener(AUDIO_UPLOADED, onUploaded);
    window.addEventListener(AUDIO_FAILED, onFailed);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener(AUDIO_UPLOADED, onUploaded);
      window.removeEventListener(AUDIO_FAILED, onFailed);
      window.removeEventListener('online', onOnline);
    };
  }, [storageId]);

  const accept = async () => {
    if (!pending || !questionId) return;
    setStatus('uploading');
    setError('');
    await putRecording({ id: storageId, questionId, studentCode: studentCode || '', mime: pending.mime, seconds: pending.seconds, status: 'queued', chunks: [pending.blob], updatedAt: Date.now() });
    await processQueue(storageId);
  };

  const discard = () => {
    void deleteRecording(storageId);
    setPending(null);
    setSeconds(0);
    setError('');
    setNotice('');
  };

  const start = async () => {
    setError('');
    setNotice('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador no permite grabar audio.');
      return;
    }
    const mimeType = pickMime();
    if (!mimeType || !questionId) {
      setError('Este navegador no tiene un formato de audio compatible.');
      return;
    }
    const baseMime = mimeType.split(';')[0];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      const base = { id: storageId, questionId, studentCode: studentCode || '', mime: baseMime, updatedAt: Date.now() };
      // Cada 4 s se guarda en el dispositivo lo grabado hasta ahora: si la página se cierra, se recupera.
      recorder.ondataavailable = (event) => {
        if (event.data.size === 0) return;
        chunksRef.current.push(event.data);
        if (recorder.state === 'recording') {
          void putRecording({ ...base, seconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)), status: 'recording', chunks: [...chunksRef.current] });
        }
      };
      recorder.onstop = async () => {
        let blob = new Blob(chunksRef.current, { type: baseMime });
        const durationMs = Math.max(0, Date.now() - startedAtRef.current);
        releaseStream();
        if (blob.size === 0) {
          setStatus('idle');
          void deleteRecording(storageId);
          setError('No se capturó audio. Inténtalo de nuevo.');
          return;
        }
        // El WebM de MediaRecorder no trae la duración: sin ella algunos reproductores no muestran el
        // tiempo total ni dejan avanzar. Se escribe en el archivo antes de guardarlo.
        if (baseMime === 'audio/webm') {
          try { blob = await fixWebmDuration(blob, durationMs, { logger: false }); } catch { /* se guarda tal cual */ }
        }
        const recordedSeconds = Math.max(1, Math.round(durationMs / 1000));
        await putRecording({ ...base, seconds: recordedSeconds, status: 'review', chunks: [blob] });
        setStatus('idle');
        setPending({ blob, mime: baseMime, seconds: recordedSeconds, url: URL.createObjectURL(blob) });
      };
      startedAtRef.current = Date.now();
      recorder.start(4000);
      secondsRef.current = 0;
      setSeconds(0);
      setStatus('recording');
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_SECONDS && recorder.state === 'recording') recorder.stop();
      }, 1000);
    } catch {
      releaseStream();
      setError('No se pudo acceder al micrófono. Revisa el permiso del navegador.');
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const reset = () => {
    setSavedPreview('');
    setSeconds(0);
    onChange({});
  };

  const hasAudio = Boolean(value.audioKey);
  const busy = status === 'uploading' || status === 'waiting';

  return (
    <div className="space-y-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {status === 'recording' && <span className="flex items-center gap-2 font-mono text-sm font-bold text-rose-700"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" aria-hidden="true" />{formatTime(seconds)} / {formatTime(MAX_SECONDS)}</span>}
      </div>

      {consentApproved && !studentCode && <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">{missingCodeHint}</p>}
      {!consentApproved && <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">Para grabar, confirma primero el consentimiento en los datos generales.</p>}
      {notice && <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {status !== 'recording' && !hasAudio && !pending && (
          <button type="button" onClick={() => void start()} disabled={!consentApproved || !studentCode} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
            <Mic size={16} aria-hidden="true" /> Grabar audio
          </button>
        )}
        {status === 'recording' && (
          <button type="button" onClick={stop} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700">
            <Square size={16} aria-hidden="true" /> Detener
          </button>
        )}
        {pending && status === 'idle' && (
          <>
            <button type="button" onClick={() => void accept()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">
              <Check size={16} aria-hidden="true" /> Aceptar y guardar
            </button>
            <button type="button" onClick={discard} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">
              <Trash2 size={16} aria-hidden="true" /> Descartar y grabar de nuevo
            </button>
          </>
        )}
        {status === 'uploading' && <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Guardando audio…</span>}
        {status === 'waiting' && (
          <button type="button" onClick={() => { setStatus('uploading'); setError(''); void processQueue(storageId); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-950 hover:bg-amber-100">
            <RotateCcw size={16} aria-hidden="true" /> Reintentar ahora
          </button>
        )}
        {hasAudio && status === 'idle' && !pending && (
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">
            <RotateCcw size={16} aria-hidden="true" /> Grabar de nuevo
          </button>
        )}
      </div>

      {pending && (
        <div className="space-y-1">
          <audio controls src={pending.url} className="w-full" />
          <p className="text-xs font-semibold text-amber-900">
            {busy
              ? `Audio aceptado (${formatTime(pending.seconds)}). Está guardado en este dispositivo y se envía solo; no cierres sesión hasta que diga «Audio guardado».`
              : `Escúchalo antes de guardar: este audio todavía solo está en tu dispositivo (${formatTime(pending.seconds)}). Se enviará cuando pulses «Aceptar y guardar».`}
          </p>
        </div>
      )}

      {hasAudio && status === 'idle' && !pending && (
        <div className="space-y-1">
          {savedPreview ? <audio controls src={savedPreview} className="w-full" /> : <StoredAudioPlayer audioKey={value.audioKey!} />}
          <p className="text-xs font-semibold text-emerald-800">Audio guardado en el almacenamiento seguro{value.audioSeconds ? ` · ${formatTime(value.audioSeconds)}` : ''}.</p>
        </div>
      )}
      {error && <p role="alert" className={`text-xs font-semibold ${status === 'waiting' ? 'text-amber-900' : 'text-rose-700'}`}>{error}</p>}
    </div>
  );
};
