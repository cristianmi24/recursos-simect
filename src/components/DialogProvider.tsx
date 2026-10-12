import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

// Diálogos propios del sitio en lugar de confirm/alert/prompt del navegador.
type Tone = 'danger' | 'info';
type DialogOptions = { title: string; message?: React.ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: Tone };
type PromptOptions = DialogOptions & { label?: string; placeholder?: string; required?: boolean };
type Pending =
  | { kind: 'confirm'; options: DialogOptions; resolve: (value: boolean) => void }
  | { kind: 'alert'; options: DialogOptions; resolve: () => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void };

interface DialogApi {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogApi | null>(null);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Pending[]>([]);
  const [text, setText] = useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const current = queue[0];

  const push = useCallback((item: Pending) => setQueue((items) => [...items, item]), []);
  const api = useRef<DialogApi>({
    confirm: (options) => new Promise((resolve) => push({ kind: 'confirm', options, resolve })),
    alert: (options) => new Promise((resolve) => push({ kind: 'alert', options, resolve })),
    prompt: (options) => new Promise((resolve) => push({ kind: 'prompt', options, resolve }))
  }).current;

  const close = useCallback((accepted: boolean) => {
    setQueue(([first, ...rest]) => {
      if (first?.kind === 'confirm') first.resolve(accepted);
      else if (first?.kind === 'alert') first.resolve();
      else if (first?.kind === 'prompt') first.resolve(accepted ? text.trim() : null);
      return rest;
    });
  }, [text]);

  useEffect(() => {
    if (!current) return;
    setText('');
    const timer = window.setTimeout(() => (current.kind === 'prompt' ? inputRef.current : confirmRef.current)?.focus(), 0);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const options = current?.options;
  const danger = options?.tone === 'danger';
  const promptRequired = current?.kind === 'prompt' && current.options.required !== false;

  return (
    <DialogContext.Provider value={api}>
      {children}
      {current && options && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(false); }}>
          <form
            role={current.kind === 'alert' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="site-dialog-title"
            onSubmit={(event) => { event.preventDefault(); if (!promptRequired || text.trim()) close(true); }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {danger ? <AlertTriangle size={22} aria-hidden="true" /> : <Info size={22} aria-hidden="true" />}
              </span>
              <div className="min-w-0 pt-1">
                <h2 id="site-dialog-title" className="text-lg font-extrabold leading-snug text-slate-900">{options.title}</h2>
                {options.message && <div className="mt-2 space-y-2 whitespace-pre-line text-sm leading-6 text-slate-700">{options.message}</div>}
              </div>
            </div>
            {current.kind === 'prompt' && (
              <div className="mt-4 space-y-2">
                {current.options.label && <label htmlFor="site-dialog-input" className="block text-sm font-semibold text-slate-800">{current.options.label}</label>}
                <textarea id="site-dialog-input" ref={inputRef} rows={3} value={text} onChange={(event) => setText(event.target.value)} placeholder={current.options.placeholder} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-indigo-600" />
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {current.kind !== 'alert' && (
                <button type="button" onClick={() => close(false)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{options.cancelLabel || 'Cancelar'}</button>
              )}
              <button
                ref={confirmRef}
                type="submit"
                disabled={promptRequired && !text.trim()}
                className={`min-h-12 rounded-xl px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${danger ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-800 hover:bg-emerald-900'}`}
              >
                {options.confirmLabel || (current.kind === 'alert' ? 'Entendido' : 'Aceptar')}
              </button>
            </div>
          </form>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export function useDialog(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) throw new Error('useDialog debe usarse dentro de DialogProvider');
  return api;
}
