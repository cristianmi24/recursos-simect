import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  Headphones,
  Search,
  Users
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { InstrumentType, QuestionDefinition, ResearchSession } from '../../types';
import { SessionDetailModal } from '../InstrumentsModule/SessionDetailModal';

type SimectUser = { institucion_nombre: string; usuario: string; nombres: string; apellidos: string };

const TYPE_LABEL: Record<InstrumentType, string> = { OBS: 'Observación', E: 'Entrevista', GF: 'Grupo focal' };
const TYPE_STYLE: Record<InstrumentType, string> = {
  OBS: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  E: 'bg-teal-50 text-teal-800 border-teal-200',
  GF: 'bg-amber-50 text-amber-800 border-amber-200'
};
const TYPE_ORDER: InstrumentType[] = ['OBS', 'E', 'GF'];

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
};

const audioKeysOf = (session: ResearchSession) =>
  Object.entries(session.interviewRecords || {})
    .filter(([, record]) => record.audioKey)
    .map(([questionId, record]) => ({ questionId, key: record.audioKey as string, mime: record.audioMime }));

const participantsOf = (session: ResearchSession): string[] =>
  session.instrumentType === 'GF' ? session.participantPseudonyms || [] : session.studentPseudonym ? [session.studentPseudonym] : [];

function sessionToText(session: ResearchSession, questions: QuestionDefinition[], nameOf: (code: string) => string): string {
  const lines: string[] = [
    `${TYPE_LABEL[session.instrumentType].toUpperCase()} · ${session.instrumentCode}`,
    `Institución: ${session.institution}`,
    `Grado: ${session.grade}`,
    `Tutor: ${session.researcherName}`,
    `Fecha de aplicación: ${session.date}`,
    `Registrado: ${formatDateTime(session.createdAt)}`,
    `Participantes: ${participantsOf(session).map((code) => `${code}${nameOf(code) ? ` (${nameOf(code)})` : ''}`).join(', ') || 'Sin dato'}`,
    ''
  ];
  const promptOf = (id: string) => questions.find((question) => question.id === id)?.prompt || '';
  const ordered = (ids: string[]) => ids.sort((a, b) => (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0));
  if (session.instrumentType === 'OBS') {
    for (const id of ordered(Object.keys(session.observationRecords || {}))) {
      const record = session.observationRecords![id];
      lines.push(`${id}. ${promptOf(id)}`);
      if (record.observed === 'not_applicable') lines.push(`  No observado: ${record.notObservedReason || 'Sin motivo registrado'}`);
      else {
        lines.push(`  Respuesta: ${record.scaleValue || 'Sin dato'}`);
        lines.push(`  Evidencia: ${record.observableEvidence || 'Sin dato'}`);
      }
      lines.push('');
    }
  } else if (session.instrumentType === 'GF') {
    for (const id of ordered(Object.keys(session.focusGroupRecords || {}))) {
      const record = session.focusGroupRecords![id];
      lines.push(`${id}. ${promptOf(id)}`);
      record.turns.forEach((turn, index) => lines.push(`  ${index + 1}. ${turn.participantPseudonym || 'Sin código'}: ${turn.text || 'Sin transcripción'}`));
      if (record.moderatorNotes) lines.push(`  Notas del moderador: ${record.moderatorNotes}`);
      lines.push('');
    }
  } else {
    for (const id of ordered(Object.keys(session.interviewRecords || {}))) {
      const record = session.interviewRecords![id];
      lines.push(`${id}. ${promptOf(id)}`);
      if (record.audioKey) lines.push('  Audio: disponible (descargar desde el panel)');
      lines.push(`  Respuesta: ${record.verbatimResponse || (record.audioKey ? 'Sin transcripción (solo audio)' : 'Sin dato')}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function saveBlob(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const DashboardView: React.FC = () => {
  const { sessions, questions } = useProject();
  const [simectUsers, setSimectUsers] = useState<SimectUser[]>([]);
  const [search, setSearch] = useState('');
  const [openInstitution, setOpenInstitution] = useState<string | null>(null);
  const [openStudent, setOpenStudent] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ResearchSession | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/simect/usuarios', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SimectUser[]) => { if (active && Array.isArray(data)) setSimectUsers(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const nameOf = (institution: string, code: string) => {
    const user = simectUsers.find((item) => item.usuario === code && item.institucion_nombre === institution)
      || simectUsers.find((item) => item.usuario === code);
    return user ? `${user.nombres} ${user.apellidos}`.trim() : '';
  };

  const stats = useMemo(() => {
    const byType = { OBS: 0, E: 0, GF: 0 } as Record<InstrumentType, number>;
    const tutors = new Set<string>();
    const students = new Set<string>();
    let audios = 0;
    for (const session of sessions) {
      byType[session.instrumentType] += 1;
      tutors.add(session.researcherName);
      participantsOf(session).forEach((code) => students.add(`${session.institution}|${code}`));
      audios += audioKeysOf(session).length;
    }
    return { byType, tutors: tutors.size, institutions: new Set(sessions.map((s) => s.institution)).size, students: students.size, audios };
  }, [sessions]);

  const institutions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = new Map<string, ResearchSession[]>();
    for (const session of sessions) {
      const list = map.get(session.institution) || [];
      list.push(session);
      map.set(session.institution, list);
    }
    return Array.from(map.entries())
      .map(([name, list]) => {
        const students = new Map<string, ResearchSession[]>();
        for (const session of list) {
          for (const code of participantsOf(session)) {
            const items = students.get(code) || [];
            items.push(session);
            students.set(code, items);
          }
        }
        const latest = list.reduce((max, session) => (session.createdAt > max ? session.createdAt : max), '');
        return { name, sessions: list, students, latest };
      })
      .filter((institution) => {
        if (!term) return true;
        if (institution.name.toLowerCase().includes(term)) return true;
        return Array.from(institution.students.keys()).some((code) => code.toLowerCase().includes(term) || nameOf(institution.name, code).toLowerCase().includes(term))
          || institution.sessions.some((session) => session.researcherName.toLowerCase().includes(term));
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, search, simectUsers]);

  const downloadText = (session: ResearchSession) => {
    saveBlob(sessionToText(session, questions, (code) => nameOf(session.institution, code)), `${session.instrumentCode}.txt`);
  };

  const downloadStudentText = (institution: string, code: string, list: ResearchSession[]) => {
    const body = list
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((session) => sessionToText(session, questions, (c) => nameOf(institution, c)))
      .join('\n\n==============================\n\n');
    saveBlob(body, `${code}_formularios.txt`);
  };

  const downloadAudios = async (session: ResearchSession) => {
    const audios = audioKeysOf(session);
    if (audios.length === 0) return;
    setBusy(session.id);
    setMessage('');
    try {
      for (const audio of audios) {
        const extension = audio.key.split('.').pop() || 'webm';
        const name = `${session.instrumentCode}_${audio.questionId}.${extension}`;
        const response = await fetch(`/api/audio/url?key=${encodeURIComponent(audio.key)}&download=1&name=${encodeURIComponent(name)}`, { credentials: 'same-origin' });
        if (!response.ok) throw new Error('audio');
        const { url } = (await response.json()) as { url: string };
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        await pause(600);
      }
    } catch {
      setMessage('No se pudo descargar uno de los audios. Inténtalo de nuevo.');
    } finally {
      setBusy('');
    }
  };

  const statCards: { label: string; value: number; tone: string }[] = [
    { label: 'Formularios llenos', value: sessions.length, tone: 'text-slate-900' },
    { label: 'Observaciones', value: stats.byType.OBS, tone: 'text-indigo-700' },
    { label: 'Entrevistas', value: stats.byType.E, tone: 'text-teal-700' },
    { label: 'Grupos focales', value: stats.byType.GF, tone: 'text-amber-700' },
    { label: 'Instituciones', value: stats.institutions, tone: 'text-slate-900' },
    { label: 'Estudiantes', value: stats.students, tone: 'text-slate-900' },
    { label: 'Tutores activos', value: stats.tutors, tone: 'text-slate-900' },
    { label: 'Audios guardados', value: stats.audios, tone: 'text-slate-900' }
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Panel de formularios</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          Formularios llenados, organizados por institución y por estudiante. Abre una carpeta para ver a los estudiantes, y a cada estudiante para ver sus formularios, quién los hizo y cuándo.
        </p>
      </header>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className={`text-3xl font-black ${card.tone}`}>{card.value}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{card.label}</div>
          </div>
        ))}
      </section>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar institución, estudiante (código o nombre) o tutor…"
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-600"
        />
      </div>

      {message && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{message}</p>}

      {institutions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Todavía no hay formularios que mostrar.</p>
      )}

      <div className="space-y-3">
        {institutions.map((institution) => {
          const isOpen = openInstitution === institution.name;
          const counts = TYPE_ORDER.map((type) => ({ type, total: institution.sessions.filter((s) => s.instrumentType === type).length }));
          const tutors = Array.from(new Set(institution.sessions.map((s) => s.researcherName)));
          const studentEntries = Array.from(institution.students.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
          return (
            <section key={institution.name} className={`overflow-hidden rounded-xl border bg-white shadow-xs ${isOpen ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => { setOpenInstitution(isOpen ? null : institution.name); setOpenStudent(null); }}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
                  <FolderOpen className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-base font-extrabold text-slate-900">{institution.name}</span>
                    <span className="block text-xs text-slate-500">
                      {institution.sessions.length} formularios · {studentEntries.length} estudiantes · {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutores'} · último registro {formatDateTime(institution.latest)}
                    </span>
                  </span>
                </span>
                <span className="hidden shrink-0 gap-1.5 sm:flex">
                  {counts.map(({ type, total }) => (
                    <span key={type} className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${TYPE_STYLE[type]}`}>{type} {total}</span>
                  ))}
                </span>
              </button>

              {isOpen && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {studentEntries.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">Sin estudiantes registrados.</p>}
                  {studentEntries.map(([code, list]) => {
                    const studentKey = `${institution.name}|${code}`;
                    const isStudentOpen = openStudent === studentKey;
                    const studentName = nameOf(institution.name, code);
                    const audioCount = list.reduce((total, session) => total + audioKeysOf(session).length, 0);
                    return (
                      <div key={studentKey}>
                        <button
                          type="button"
                          onClick={() => setOpenStudent(isStudentOpen ? null : studentKey)}
                          aria-expanded={isStudentOpen}
                          className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm hover:bg-slate-50 ${isStudentOpen ? 'bg-indigo-50/50' : ''}`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            {isStudentOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
                            <GraduationCap className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                            <span className="font-mono text-xs font-bold text-indigo-700">{code}</span>
                            <span className="truncate font-semibold text-slate-900">{studentName || 'Sin nombre en SIMECT'}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500">
                            {TYPE_ORDER.map((type) => {
                              const total = list.filter((s) => s.instrumentType === type).length;
                              return total > 0 ? <span key={type} className={`rounded-full border px-2 py-0.5 font-bold ${TYPE_STYLE[type]}`}>{type} {total}</span> : null;
                            })}
                            {audioCount > 0 && <span className="inline-flex items-center gap-1"><Headphones className="h-3.5 w-3.5" aria-hidden="true" />{audioCount}</span>}
                          </span>
                        </button>

                        {isStudentOpen && (
                          <div className="space-y-2 bg-slate-50/60 px-5 py-4">
                            <div className="flex justify-end">
                              <button type="button" onClick={() => downloadStudentText(institution.name, code, list)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50">
                                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Descargar todos los textos del estudiante
                              </button>
                            </div>
                            {list
                              .slice()
                              .sort((a, b) => TYPE_ORDER.indexOf(a.instrumentType) - TYPE_ORDER.indexOf(b.instrumentType) || a.createdAt.localeCompare(b.createdAt))
                              .map((session) => {
                                const audios = audioKeysOf(session);
                                return (
                                  <article key={session.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${TYPE_STYLE[session.instrumentType]}`}>{TYPE_LABEL[session.instrumentType]}</span>
                                        <span className="font-mono text-xs font-bold text-slate-700">{session.instrumentCode}</span>
                                        <span className="text-xs text-slate-500">{session.grade}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" /> Tutor: <strong className="text-slate-800">{session.researcherName}</strong></span>
                                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatDateTime(session.createdAt)}</span>
                                        {session.instrumentType === 'GF' && <span>{participantsOf(session).length} participantes</span>}
                                        {audios.length > 0 && <span className="inline-flex items-center gap-1"><Headphones className="h-3.5 w-3.5" aria-hidden="true" /> {audios.length} {audios.length === 1 ? 'audio' : 'audios'}</span>}
                                      </div>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                      <button type="button" onClick={() => setViewing(session)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50">
                                        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Ver
                                      </button>
                                      <button type="button" onClick={() => downloadText(session)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50">
                                        <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Texto
                                      </button>
                                      {audios.length > 0 && (
                                        <button type="button" onClick={() => void downloadAudios(session)} disabled={busy === session.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60">
                                          <Download className="h-3.5 w-3.5" aria-hidden="true" /> {busy === session.id ? 'Descargando…' : `Audios (${audios.length})`}
                                        </button>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {viewing && <SessionDetailModal session={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};
