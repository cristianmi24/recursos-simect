import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, Mic, RotateCcw, Square, Trash2 } from 'lucide-react';

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
};

export const AudioRecorder: React.FC<Props> = ({ value, onChange, consentApproved, label = 'Respuesta en audio', studentCode, questionId }) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [savedPreview, setSavedPreview] = useState('');
  const [pending, setPending] = useState<{ blob: Blob; mime: string; seconds: number; url: string } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);

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

  const accept = async () => {
    if (!pending) return;
    setStatus('uploading');
    setError('');
    try {
      const signed = await fetch('/api/audio/upload-url', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: pending.mime, studentCode, questionId })
      });
      const payload = await signed.json().catch(() => ({}));
      if (!signed.ok) throw new Error(payload.error || 'No se pudo preparar la subida.');
      const put = await fetch(payload.url, { method: 'PUT', headers: { 'Content-Type': payload.contentType }, body: pending.blob });
      if (!put.ok) throw new Error('El almacenamiento rechazó el audio.');
      const saved = { audioKey: payload.key as string, audioMime: payload.contentType as string, audioSeconds: pending.seconds };
      setSavedPreview(URL.createObjectURL(pending.blob));
      setPending(null);
      onChange(saved);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo guardar el audio. Inténtalo de nuevo.');
    } finally {
      setStatus('idle');
    }
  };

  const discard = () => {
    setPending(null);
    setSeconds(0);
    setError('');
  };

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador no permite grabar audio.');
      return;
    }
    const mimeType = pickMime();
    if (!mimeType) {
      setError('Este navegador no tiene un formato de audio compatible.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const baseMime = mimeType.split(';')[0];
        const blob = new Blob(chunksRef.current, { type: baseMime });
        releaseStream();
        if (blob.size === 0) {
          setStatus('idle');
          setError('No se capturó audio. Inténtalo de nuevo.');
          return;
        }
        setStatus('idle');
        setPending({ blob, mime: baseMime, seconds: secondsRef.current, url: URL.createObjectURL(blob) });
      };
      recorder.start();
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

  return (
    <div className="space-y-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {status === 'recording' && <span className="flex items-center gap-2 font-mono text-sm font-bold text-rose-700"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" aria-hidden="true" />{formatTime(seconds)} / {formatTime(MAX_SECONDS)}</span>}
      </div>

      {consentApproved && !studentCode && <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">Selecciona al estudiante en los datos generales para poder grabar: el audio se guarda con su código.</p>}
      {!consentApproved && <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">Para grabar, confirma primero el consentimiento en los datos generales.</p>}

      <div className="flex flex-wrap items-center gap-2">
        {status !== 'recording' && !hasAudio && !pending && (
          <button type="button" onClick={() => void start()} disabled={!consentApproved || !studentCode || status === 'uploading'} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
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
        {hasAudio && status === 'idle' && !pending && (
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">
            <RotateCcw size={16} aria-hidden="true" /> Grabar de nuevo
          </button>
        )}
      </div>

      {pending && (
        <div className="space-y-1">
          <audio controls src={pending.url} className="w-full" />
          <p className="text-xs font-semibold text-amber-900">Escúchalo antes de guardar: este audio todavía solo está en tu dispositivo ({formatTime(pending.seconds)}). Se enviará a Cloudflare cuando pulses «Aceptar y guardar».</p>
          <input tabIndex={-1} aria-hidden="true" required value="" onChange={() => undefined} onInvalid={(event) => (event.target as HTMLInputElement).setCustomValidity('Acepta o descarta la grabación antes de continuar.')} className="sr-only" />
        </div>
      )}

      {hasAudio && status === 'idle' && !pending && (
        <div className="space-y-1">
          {savedPreview ? <audio controls src={savedPreview} className="w-full" /> : <StoredAudioPlayer audioKey={value.audioKey!} />}
          <p className="text-xs font-semibold text-emerald-800">Audio guardado en el almacenamiento seguro{value.audioSeconds ? ` · ${formatTime(value.audioSeconds)}` : ''}.</p>
        </div>
      )}
      {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
};
