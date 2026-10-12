import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessagesSquare, Send, User } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Summary = { interviews: number; transcripts: number; truncated: boolean; configured: boolean };

const SUGGESTIONS = [
  '¿Qué dificultades mencionan los estudiantes al usar el tutor inteligente?',
  '¿Qué proponen los estudiantes para mejorar el tutor?',
  '¿Cómo describen su experiencia general? Resume por institución.',
  '¿Hay diferencias entre las respuestas de grado 8 y grado 9?'
];

export const AudiosView: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/audios/summary', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('summary'))))
      .then((data: Summary) => { if (active) setSummary(data); })
      .catch(() => { if (active) setSummaryError('No se pudo cargar el resumen de transcripciones.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, sending]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setError('');
    setSending(true);
    try {
      const response = await fetch('/api/audios/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo obtener la respuesta.');
      setMessages([...next, { role: 'assistant', content: String(data.reply || '') }]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'No se pudo obtener la respuesta.');
    } finally {
      setSending(false);
    }
  };

  const hasData = (summary?.transcripts || 0) > 0;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><MessagesSquare size={22} aria-hidden="true" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Audios</h1>
            <p className="text-sm text-slate-600">Haz preguntas sobre las transcripciones de las entrevistas. Qwen responde solo con lo que dijeron los estudiantes y cita la sesión y la pregunta.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
          {summary && (
            <>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-teal-800">{summary.interviews} entrevistas con texto</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">{summary.transcripts} respuestas transcritas</span>
              {!summary.configured && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-900">Falta configurar QWEN_API_KEY</span>}
              {summary.truncated && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-900">Se consultan las transcripciones más recientes (límite de contexto)</span>}
            </>
          )}
          {!summary && !summaryError && <span className="text-slate-500">Cargando transcripciones…</span>}
          {summaryError && <span className="text-rose-700">{summaryError}</span>}
        </div>
        <p className="mt-3 text-xs text-slate-500">Los estudiantes aparecen solo con su código. El texto de las transcripciones se envía a Qwen para responder; no se envían nombres.</p>
      </header>

      <section className="flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Chat con las transcripciones">
        <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">{hasData ? 'Prueba con una de estas preguntas o escribe la tuya:' : 'Cuando haya entrevistas transcritas podrás preguntar sobre ellas.'}</p>
              {hasData && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50">{suggestion}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800"><Bot size={16} aria-hidden="true" /></span>}
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-900'}`}>{message.content}</div>
              {message.role === 'user' && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800"><User size={16} aria-hidden="true" /></span>}
            </div>
          ))}
          {sending && <p className="flex items-center gap-2 text-sm text-slate-600"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Qwen está leyendo las transcripciones…</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(event) => { event.preventDefault(); void send(input); }}
          className="flex items-end gap-3 border-t border-slate-200 p-4"
        >
          <label htmlFor="audios-chat-input" className="sr-only">Pregunta sobre las transcripciones</label>
          <textarea
            id="audios-chat-input"
            value={input}
            maxLength={2000}
            rows={2}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(input); } }}
            placeholder="Escribe tu pregunta sobre las entrevistas…"
            className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-teal-700"
          />
          <button type="submit" disabled={sending || !input.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
            <Send size={16} aria-hidden="true" /> Enviar
          </button>
        </form>
      </section>
    </div>
  );
};
