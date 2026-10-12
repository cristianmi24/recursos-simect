import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Archive,
  Tag,
  Download,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  Headphones,
  Languages,
  Search,
  Users
} from 'lucide-react';
import { zipSync } from 'fflate';
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

const FAMILY_LABEL: Record<string, string> = { EXP: 'Experiencias', PER: 'Percepciones', DIF: 'Dificultades' };

const safeName = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'sin_nombre';

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const DashboardView: React.FC = () => {
  const { sessions, questions, categories, transcriptionServerBusy: serverBusy, transcribingKey: transcribing, transcriptionProgress: transcribeProgress, transcriptionMessage: transcribeMessage, startTranscription } = useProject();
  const [simectUsers, setSimectUsers] = useState<SimectUser[]>([]);
  const [search, setSearch] = useState('');
  const [openInstitution, setOpenInstitution] = useState<string | null>(null);
  const [openStudent, setOpenStudent] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ResearchSession | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [zipProgress, setZipProgress] = useState('');

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
        const name = `${session.studentPseudonym || session.instrumentCode}_${audio.questionId}.${extension}`;
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

  // Reúne los audios en un ZIP organizado por institución / estudiante, directo desde el navegador.
  // Cada pregunta (E1…E5) pertenece a una subcategoría y, por ella, a una categoría principal.
  const categoryOf = (questionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    const category = categories.find((item) => item.id === question?.linkedCategories?.[0]);
    return category ? { id: category.id, name: category.name, family: FAMILY_LABEL[category.family] || category.family } : null;
  };

  const audiosByCategory = useMemo(() => {
    const map = new Map<string, { id: string; name: string; family: string; questions: Set<string>; count: number }>();
    for (const session of sessions) {
      for (const audio of audioKeysOf(session)) {
        const category = categoryOf(audio.questionId);
        if (!category) continue;
        const entry = map.get(category.id) || { ...category, questions: new Set<string>(), count: 0 };
        entry.questions.add(audio.questionId);
        entry.count += 1;
        map.set(category.id, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.family.localeCompare(b.family, 'es') || a.name.localeCompare(b.name, 'es'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, questions, categories]);

  const downloadZip = async (list: ResearchSession[], zipName: string, options: { layout?: 'institution' | 'category'; categoryId?: string } = {}) => {
    const items = list.flatMap((session) =>
      audioKeysOf(session)
        .filter((audio) => !options.categoryId || categoryOf(audio.questionId)?.id === options.categoryId)
        .map((audio) => ({ session, audio }))
    );
    if (items.length === 0) {
      setMessage('No hay audios para descargar.');
      return;
    }
    setBusy('zip');
    setMessage('');
    const files: Record<string, Uint8Array> = {};
    try {
      for (let index = 0; index < items.length; index += 1) {
        const { session, audio } = items[index];
        setZipProgress(`Reuniendo audios… ${index + 1} de ${items.length}`);
        const signed = await fetch(`/api/audio/url?key=${encodeURIComponent(audio.key)}`, { credentials: 'same-origin' });
        if (!signed.ok) throw new Error('url');
        const { url } = (await signed.json()) as { url: string };
        const file = await fetch(url);
        if (!file.ok) throw new Error('file');
        const extension = audio.key.split('.').pop() || 'webm';
        const code = session.studentPseudonym || 'sin_codigo';
        const category = categoryOf(audio.questionId);
        const folder = options.layout === 'category'
          ? `${safeName(category?.family || 'Sin categoría')}/${safeName(category?.name || 'Sin subcategoría')}`
          : `${safeName(session.institution)}/${safeName(code)}`;
        files[`${folder}/${safeName(code)}_${audio.questionId}.${extension}`] = new Uint8Array(await file.arrayBuffer());
      }
      setZipProgress('Comprimiendo…');
      await pause(50);
      const zipped = zipSync(files, { level: 0 });
      const blob = new Blob([zipped], { type: 'application/zip' });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `${zipName}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 5000);
    } catch {
      setMessage('No se pudo armar el ZIP de audios. Inténtalo de nuevo.');
    } finally {
      setBusy('');
      setZipProgress('');
    }
  };

  const pendingAudios = (list: ResearchSession[]) =>
    list
      .filter((session) => session.instrumentType === 'E')
      .flatMap((session) =>
        Object.entries(session.interviewRecords || {})
          .filter(([, record]) => record.audioKey && !record.transcribedAt)
          .map(([questionId]) => ({ session, questionId }))
      );

  const transcribeStudent = (studentKey: string, list: ResearchSession[]) =>
    startTranscription(studentKey, pendingAudios(list).map((job) => ({ sessionId: job.session.id, questionId: job.questionId })));

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

      {audiosByCategory.length > 0 && (
        <section aria-label="Audios por categoría" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Tag className="h-4 w-4 text-teal-700" aria-hidden="true" /> Audios por categoría</h2>
              <p className="text-xs text-slate-500">Cada pregunta de la entrevista pertenece a una subcategoría y a una categoría principal. Descarga los audios de una categoría o todos organizados por categoría.</p>
            </div>
            <button
              type="button"
              onClick={() => void downloadZip(sessions, `audios_por_categoria_${new Date().toISOString().slice(0, 10)}`, { layout: 'category' })}
              disabled={busy === 'zip'}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 text-xs font-bold text-teal-900 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" /> Todos, organizados por categoría (ZIP)
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {audiosByCategory.map((category) => (
              <article key={category.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{category.family}</span>
                  <h3 className="text-sm font-extrabold text-slate-900">{category.name}</h3>
                  <p className="mt-1 text-xs text-slate-600">{Array.from(category.questions).sort().join(', ')} · {category.count} {category.count === 1 ? 'audio' : 'audios'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void downloadZip(sessions, `audios_${safeName(category.name)}`, { layout: 'category', categoryId: category.id })}
                  disabled={busy === 'zip'}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Descargar categoría (ZIP)
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void downloadZip(sessions, `audios_simect_${new Date().toISOString().slice(0, 10)}`)}
          disabled={busy === 'zip' || stats.audios === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Archive className="h-4 w-4" aria-hidden="true" /> Descargar todos los audios (ZIP)
        </button>
        {zipProgress && <span role="status" className="text-sm font-semibold text-slate-700">{zipProgress}</span>}
        {stats.audios === 0 && <span className="text-xs text-slate-500">Aún no hay audios guardados.</span>}
      </div>

      {serverBusy && !transcribing && (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          Hay otra transcripción en curso. Espera a que termine para iniciar una nueva; este panel se actualizará solo.
        </p>
      )}
      {transcribeProgress && <p role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">{transcribeProgress}</p>}
      {transcribeMessage && (
        <p role={transcribeMessage.tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${transcribeMessage.tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{transcribeMessage.text}</p>
      )}

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
                  <div className="flex justify-end bg-slate-50/60 px-5 py-2">
                    <button
                      type="button"
                      onClick={() => void downloadZip(institution.sessions, `audios_${safeName(institution.name)}`)}
                      disabled={busy === 'zip' || institution.sessions.every((session) => audioKeysOf(session).length === 0)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 text-xs font-bold text-teal-900 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Archive className="h-3.5 w-3.5" aria-hidden="true" /> Audios de esta institución (ZIP)
                    </button>
                  </div>
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
                            <div className="flex flex-wrap justify-end gap-2">
                              {pendingAudios(list).length > 0 && (
                                <button type="button" onClick={() => void transcribeStudent(studentKey, list)} disabled={Boolean(transcribing) || serverBusy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                                  <Languages className="h-3.5 w-3.5" aria-hidden="true" /> {transcribing === studentKey ? 'Transcribiendo…' : `Transcribir audios (${pendingAudios(list).length})`}
                                </button>
                              )}
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
                                        {audios.length > 0 && Object.values(session.interviewRecords || {}).every((record) => !record.audioKey || record.transcribedAt) && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">Transcrito</span>}
                                        {audios.length > 0 && <span className="inline-flex items-center gap-1"><Headphones className="h-3.5 w-3.5" aria-hidden="true" /> {audios.length} {audios.length === 1 ? 'audio' : 'audios'}</span>}
                                      </div>
                                      {audios.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {audios.map((audio) => {
                                            const category = categoryOf(audio.questionId);
                                            return (
                                              <span key={audio.questionId} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                                                <Headphones className="h-3 w-3" aria-hidden="true" />
                                                <strong>{audio.questionId}</strong>
                                                {category ? <>· {category.name} <span className="text-slate-400">({category.family})</span></> : null}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
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
