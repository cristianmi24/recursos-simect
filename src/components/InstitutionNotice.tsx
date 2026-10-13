import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

type Notice = { sessionId: string; instrumentType: string; instrumentCode: string; codes: string[]; from: string; to: string; changedAt: string };

// Aviso flotante, solo informativo, para quien llenó formularios a los que Administración les cambió
// la institución según SIMECT. Se revisa al abrir, cada minuto y al volver a la pestaña; al aceptarlo
// queda marcado como leído en el servidor (no vuelve a salir en ningún dispositivo).
export const InstitutionNotice: React.FC = () => {
  const { refreshSessions } = useProject();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/notices', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { notices?: Notice[] };
      const next = data.notices || [];
      setNotices((current) => {
        // Si llegó un aviso nuevo, se recargan los formularios para mostrar la institución actualizada.
        if (next.some((item) => !current.some((known) => known.sessionId === item.sessionId))) void refreshSessions();
        return next;
      });
    } catch {
      // Sin conexión: se vuelve a intentar en la siguiente revisión.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    const onFocus = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  const accept = async () => {
    setClosing(true);
    const ids = notices.map((item) => item.sessionId);
    setNotices([]);
    try {
      await fetch('/api/notices/ack', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: ids })
      });
    } finally {
      setClosing(false);
    }
  };

  if (notices.length === 0) return null;
  return (
    <aside
      role="status"
      aria-live="polite"
      aria-labelledby="institution-notice-title"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-indigo-200 bg-white p-5 shadow-2xl lg:inset-x-auto lg:bottom-6 lg:right-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"><Building2 size={20} aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 id="institution-notice-title" className="text-base font-extrabold text-slate-900">
            Administración asignó una nueva institución
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {notices.length === 1 ? 'A uno de tus formularios' : `A ${notices.length} de tus formularios`} se le actualizó la institución según SIMECT, porque el estudiante cambió de institución.
          </p>
        </div>
      </div>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {notices.map((item) => (
          <li key={item.sessionId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs font-semibold text-slate-500"><span className="font-mono">{item.instrumentCode}</span>{item.codes.length > 0 && <> · <span className="font-mono text-indigo-700">{item.codes.join(', ')}</span></>}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-slate-800">
              <span className="line-through decoration-slate-400">{item.from}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <strong>{item.to}</strong>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
        Tus respuestas, audios y demás datos ya registrados se conservan: solo cambió el nombre de la institución. Si estás llenando un formulario nuevo para este estudiante, elige la nueva institución.
      </p>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => void accept()} disabled={closing} className="min-h-12 rounded-xl bg-emerald-800 px-5 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60">
          Aceptar
        </button>
      </div>
    </aside>
  );
};
