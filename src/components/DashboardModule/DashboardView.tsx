import React, { useEffect, useMemo, useState } from 'react';
import { formatDateTime as formatDateTime12 } from '../../utils/dateFormat';
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
  ArrowLeft,
  Search,
  RefreshCw,
  ArrowRight,
  Trash2,
  Users
} from 'lucide-react';
import { zipSync } from 'fflate';
import { useProject } from '../../context/ProjectContext';
import type { InstrumentType, QuestionDefinition, ResearchSession } from '../../types';
import { SessionDetailModal } from '../InstrumentsModule/SessionDetailModal';
import { StoredAudioPlayer } from '../DataEntryModule/AudioRecorder';
import { navigate, useSegments } from '../../utils/router';
import { useDialog } from '../DialogProvider';

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
  return formatDateTime12(date);
};

// Audios de entrevistas (uno por pregunta) y de grupos focales (uno por pregunta, de toda la conversación).
const audioRecordsOf = (session: ResearchSession): [string, { audioKey?: string; audioMime?: string; transcribedAt?: string }][] =>
  session.instrumentType === 'GF' ? Object.entries(session.focusGroupRecords || {}) : Object.entries(session.interviewRecords || {});

const audioKeysOf = (session: ResearchSession) =>
  audioRecordsOf(session)
    .filter(([, record]) => record.audioKey)
    .map(([questionId, record]) => ({ questionId, key: record.audioKey as string, mime: record.audioMime }));

// Nombre con el que se guarda un audio al descargarlo: código del estudiante o del grupo focal.
const audioOwnerOf = (session: ResearchSession) =>
  session.instrumentType === 'GF' ? `grupo_${session.instrumentCode}` : session.studentPseudonym || 'sin_codigo';

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
      if (record.audioKey) {
        lines.push('  Audio de la conversación: disponible (descargar desde el panel)');
        lines.push(`  Transcripción del audio: ${record.audioTranscript || 'Sin transcripción'}`);
      }
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
  const { sessions, questions, categories, transcriptionServerBusy: serverBusy, transcribingKey: transcribing, transcriptionProgress: transcribeProgress, transcriptionMessage: transcribeMessage, startTranscription, deleteSession, refreshSessions } = useProject();
  const [simectUsers, setSimectUsers] = useState<SimectUser[]>([]);
  const [search, setSearch] = useState('');
  // La institución y el estudiante abiertos viven en la URL: /panel/<institución>/<código>.
  const dialog = useDialog();
  const segments = useSegments();
  const openInstitution = segments[0] === 'panel' && segments[1] ? segments[1] : null;
  const openStudent = openInstitution && segments[2] ? `${openInstitution}|${segments[2]}` : null;
  const setOpenInstitution = (name: string | null) => navigate(name ? ['panel', name] : ['panel']);
  const setOpenStudent = (key: string | null) => {
    if (!openInstitution) return;
    const code = key ? key.split('|').slice(1).join('|') : '';
    navigate(code ? ['panel', openInstitution, code] : ['panel', openInstitution]);
  };
  const [viewing, setViewing] = useState<ResearchSession | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [zipProgress, setZipProgress] = useState('');
  // Verificación de instituciones contra SIMECT (un estudiante puede haber cambiado de institución).
  type InstitutionCheck = { sessionId: string; instrumentCode: string; instrumentType: InstrumentType; codes: string[]; currentInstitution: string; newInstitution?: string; status: 'changed' | 'mixed' | 'not_found' };
  const [institutionChecks, setInstitutionChecks] = useState<InstitutionCheck[] | null>(null);
  const [checkState, setCheckState] = useState<'idle' | 'checking' | 'applying'>('idle');
  const [checkMessage, setCheckMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/simect/usuarios', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SimectUser[]) => { if (active && Array.isArray(data)) setSimectUsers(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [openInstitution, openStudent]);

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
        const name = `${audioOwnerOf(session)}_${audio.questionId}.${extension}`;
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
        const code = audioOwnerOf(session);
        const category = categoryOf(audio.questionId);
        const folder = options.layout === 'category'
          ? `${safeName(category?.family || 'Sin categoría')}/${safeName(category?.name || 'Sin subcategoría')}`
          : `${safeName(session.institution)}/${session.instrumentType === 'GF' ? 'grupos_focales' : safeName(code)}`;
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

  // Borra formularios con sus audios; el estudiante queda libre para que el tutor lo vuelva a llenar.
  const removeSessions = async (list: ResearchSession[], code: string, wholeStudent: boolean) => {
    if (list.length === 0) return;
    const audios = list.reduce((total, session) => total + audioKeysOf(session).length, 0);
    const groups = list.filter((session) => session.instrumentType === 'GF');
    const what = list.length === 1 ? `el formulario ${list[0].instrumentCode} (${TYPE_LABEL[list[0].instrumentType]})` : `los ${list.length} formularios`;
    const ok = await dialog.confirm({
      title: `¿Borrar ${what} del estudiante ${code}${audios === 1 ? ' y su audio' : audios > 1 ? ` y sus ${audios} audios` : ''}?`,
      message: [
        'Se eliminan de la base de datos y no se pueden recuperar. El estudiante volverá a aparecer para que el tutor llene el formulario de nuevo.',
        ...(groups.length ? ['Atención: un grupo focal incluye a varios estudiantes; se borrará para todos sus participantes.'] : [])
      ].join('\n\n'),
      confirmLabel: 'Borrar',
      tone: 'danger'
    });
    if (!ok) return;
    setBusy('delete');
    setMessage('');
    let removed = 0;
    try {
      for (const session of list) {
        await deleteSession(session.id);
        removed += 1;
      }
      if (wholeStudent) setOpenStudent(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo borrar el formulario.');
    } finally {
      setBusy('');
    }
  };

  const verifyInstitutions = async () => {
    setCheckState('checking');
    setCheckMessage('');
    try {
      const response = await fetch('/api/admin/institutions/check', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo verificar con SIMECT.');
      setInstitutionChecks(data.checks as InstitutionCheck[]);
    } catch (error) {
      setCheckMessage(error instanceof Error ? error.message : 'No se pudo verificar con SIMECT.');
    } finally {
      setCheckState('idle');
    }
  };

  const applyInstitutions = async (items: InstitutionCheck[]) => {
    if (items.length === 0) return;
    const ok = await dialog.confirm({
      title: items.length === 1 ? `¿Actualizar la institución de ${items[0].instrumentCode}?` : `¿Actualizar la institución de ${items.length} formularios?`,
      message: 'Solo cambia el nombre de la institución por el que tiene hoy el estudiante en SIMECT. Las respuestas, audios, transcripciones y demás datos quedan igual. El cambio queda en la bitácora.',
      confirmLabel: 'Actualizar'
    });
    if (!ok) return;
    setCheckState('applying');
    setCheckMessage('');
    try {
      const response = await fetch('/api/admin/institutions/apply', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: items.map((item) => item.sessionId) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudieron actualizar las instituciones.');
      const updated = new Set((data.updated as { sessionId: string }[]).map((item) => item.sessionId));
      setInstitutionChecks((current) => current?.filter((item) => !updated.has(item.sessionId)) ?? null);
      setCheckMessage(`Se actualizaron ${updated.size} ${updated.size === 1 ? 'formulario' : 'formularios'}.`);
      await refreshSessions();
    } catch (error) {
      setCheckMessage(error instanceof Error ? error.message : 'No se pudieron actualizar las instituciones.');
    } finally {
      setCheckState('idle');
    }
  };

  const pendingAudios = (list: ResearchSession[]) =>
    list
      .filter((session) => session.instrumentType === 'E' || session.instrumentType === 'GF')
      .flatMap((session) =>
        audioRecordsOf(session)
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

      {!openInstitution && (
        <>
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

      <section aria-label="Verificar instituciones con SIMECT" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Instituciones según SIMECT</h2>
            <p className="text-xs text-slate-500">Si un estudiante cambió de institución en SIMECT, aquí lo ves y puedes actualizar solo el nombre de la institución en sus formularios.</p>
          </div>
          <button type="button" onClick={() => void verifyInstitutions()} disabled={checkState !== 'idle'} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 text-sm font-bold text-indigo-900 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${checkState === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" /> {checkState === 'checking' ? 'Verificando…' : 'Verificar con SIMECT'}
          </button>
        </div>
        {checkMessage && <p role="status" className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{checkMessage}</p>}
        {institutionChecks && (() => {
          const changed = institutionChecks.filter((item) => item.status === 'changed');
          const others = institutionChecks.filter((item) => item.status !== 'changed');
          if (institutionChecks.length === 0) return <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">Todo coincide: ningún estudiante cambió de institución.</p>;
          return (
            <div className="mt-4 space-y-3">
              {changed.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-amber-900">{changed.length} {changed.length === 1 ? 'formulario tiene' : 'formularios tienen'} una institución distinta a la de SIMECT.</p>
                  {changed.length > 1 && <button type="button" onClick={() => void applyInstitutions(changed)} disabled={checkState !== 'idle'} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-3 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50">Actualizar todas ({changed.length})</button>}
                </div>
              )}
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {[...changed, ...others].map((item) => (
                  <li key={item.sessionId} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${TYPE_STYLE[item.instrumentType]}`}>{item.instrumentType}</span>
                    <span className="font-mono text-xs font-bold text-slate-700">{item.instrumentCode}</span>
                    <span className="font-mono text-xs text-indigo-700">{item.codes.join(', ')}</span>
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-slate-700">
                      <span className="line-through decoration-slate-400">{item.currentInstitution}</span>
                      {item.status === 'changed' && <><ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /><strong className="text-slate-900">{item.newInstitution}</strong></>}
                      {item.status === 'mixed' && <span className="text-xs font-semibold text-amber-800">· los participantes ahora están en instituciones distintas; revísalo a mano</span>}
                      {item.status === 'not_found' && <span className="text-xs font-semibold text-slate-500">· el estudiante ya no aparece en SIMECT; no se cambia nada</span>}
                    </span>
                    {item.status === 'changed' && (
                      <button type="button" onClick={() => void applyInstitutions([item])} disabled={checkState !== 'idle'} className="inline-flex min-h-10 items-center rounded-lg border border-indigo-300 px-3 text-xs font-bold text-indigo-900 hover:bg-indigo-50 disabled:opacity-50">Actualizar</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </section>

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

        </>
      )}

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

      {/* ---------- Página 1: carpetas por institución ---------- */}
      {!openInstitution && (
        <>
          {institutions.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Todavía no hay formularios que mostrar.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => {
              const tutors = new Set(institution.sessions.map((s) => s.researcherName));
              return (
                <button
                  key={institution.name}
                  type="button"
                  onClick={() => setOpenInstitution(institution.name)}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
                >
                  <span className="flex items-center gap-3">
                    <FolderOpen className="h-7 w-7 shrink-0 text-amber-600" aria-hidden="true" />
                    <span className="text-base font-extrabold leading-snug text-slate-900">{institution.name}</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {institution.sessions.length} formularios · {institution.students.size} estudiantes · {tutors.size} {tutors.size === 1 ? 'tutor' : 'tutores'}
                    <br />Último registro {formatDateTime(institution.latest)}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {TYPE_ORDER.map((type) => (
                      <span key={type} className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${TYPE_STYLE[type]}`}>{type} {institution.sessions.filter((s) => s.instrumentType === type).length}</span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- Página 2: estudiantes de una institución ---------- */}
      {openInstitution && !openStudent && (() => {
        const institution = institutions.find((item) => item.name === openInstitution)
          || (() => {
            const list = sessions.filter((s) => s.institution === openInstitution);
            const students = new Map<string, ResearchSession[]>();
            for (const session of list) for (const code of participantsOf(session)) students.set(code, [...(students.get(code) || []), session]);
            return { name: openInstitution, sessions: list, students, latest: '' };
          })();
        const entries = Array.from(institution.students.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
        return (
          <section className="space-y-4" aria-label={`Estudiantes de ${institution.name}`}>
            <button type="button" onClick={() => setOpenInstitution(null)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todas las instituciones
            </button>
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-8 w-8 text-amber-600" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{institution.name}</h2>
                  <p className="text-xs text-slate-500">{institution.sessions.length} formularios · {entries.length} estudiantes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void downloadZip(institution.sessions, `audios_${safeName(institution.name)}`)}
                disabled={busy === 'zip' || institution.sessions.every((session) => audioKeysOf(session).length === 0)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 text-xs font-bold text-teal-900 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" /> Audios de esta institución (ZIP)
              </button>
            </header>
            {entries.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Sin estudiantes registrados.</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map(([code, list]) => {
                const audioCount = list.reduce((total, session) => total + audioKeysOf(session).length, 0);
                const pendingCount = pendingAudios(list).length;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setOpenStudent(`${institution.name}|${code}`)}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-slate-500" aria-hidden="true" />
                      <span className="font-mono text-sm font-bold text-indigo-700">{code}</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{nameOf(institution.name, code) || 'Sin nombre en SIMECT'}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {TYPE_ORDER.map((type) => {
                        const total = list.filter((s) => s.instrumentType === type).length;
                        return total > 0 ? <span key={type} className={`rounded-full border px-2 py-0.5 font-bold ${TYPE_STYLE[type]}`}>{type} {total}</span> : null;
                      })}
                      {audioCount > 0 && <span className="inline-flex items-center gap-1 text-slate-600"><Headphones className="h-3.5 w-3.5" aria-hidden="true" />{audioCount}</span>}
                      {pendingCount > 0 && <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-bold text-amber-900">{pendingCount} sin transcribir</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ---------- Página 3: el estudiante, como lo llenó el tutor ---------- */}
      {openInstitution && openStudent && (() => {
        const code = openStudent.split('|').slice(1).join('|');
        const list = sessions.filter((session) => session.institution === openInstitution && participantsOf(session).includes(code))
          .sort((a, b) => TYPE_ORDER.indexOf(a.instrumentType) - TYPE_ORDER.indexOf(b.instrumentType) || a.createdAt.localeCompare(b.createdAt));
        const studentName = nameOf(openInstitution, code);
        const pendingCount = pendingAudios(list).length;
        const sortedQuestions = (type: InstrumentType) => questions.filter((question) => question.instrumentType === type).sort((a, b) => a.order - b.order);
        return (
          <section className="space-y-4" aria-label={`Formularios de ${code}`}>
            <button type="button" onClick={() => setOpenStudent(null)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {openInstitution}
            </button>
            <header className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-slate-500" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900"><span className="font-mono text-indigo-700">{code}</span> {studentName && <span>· {studentName}</span>}</h2>
                  <p className="text-xs text-slate-500">{openInstitution} · {list.length} {list.length === 1 ? 'formulario' : 'formularios'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingCount > 0 && (
                  <button type="button" onClick={() => void transcribeStudent(openStudent, list)} disabled={Boolean(transcribing) || serverBusy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                    <Languages className="h-3.5 w-3.5" aria-hidden="true" /> {transcribing === openStudent ? 'Transcribiendo…' : `Transcribir audios (${pendingCount})`}
                  </button>
                )}
                <button type="button" onClick={() => downloadStudentText(openInstitution, code, list)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Descargar todos los textos
                </button>
                {list.some((session) => audioKeysOf(session).length > 0) && (
                  <button type="button" onClick={() => void downloadZip(list, `audios_${safeName(code)}`)} disabled={busy === 'zip'} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 text-xs font-bold text-teal-900 hover:bg-teal-50 disabled:opacity-50">
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" /> Audios del estudiante (ZIP)
                  </button>
                )}
                {list.length > 0 && (
                  <button type="button" onClick={() => void removeSessions(list, code, true)} disabled={busy === 'delete'} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> {busy === 'delete' ? 'Borrando…' : 'Borrar formularios y audios del estudiante'}
                  </button>
                )}
              </div>
            </header>

            {list.map((session) => (
              <article key={session.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${TYPE_STYLE[session.instrumentType]}`}>{TYPE_LABEL[session.instrumentType]}</span>
                      <span className="font-mono text-xs font-bold text-slate-700">{session.instrumentCode}</span>
                      <span className="text-xs text-slate-500">{session.grade} · sesión {session.sessionNumber}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" /> Tutor: <strong className="text-slate-800">{session.researcherName}</strong></span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatDateTime(session.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => downloadText(session)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Texto
                    </button>
                    <button type="button" onClick={() => void removeSessions([session], code, list.length === 1)} disabled={busy === 'delete'} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Borrar
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedQuestions(session.instrumentType).map((question) => {
                    const category = categoryOf(question.id);
                    const header = (
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700">{question.code}</span>
                          {category && <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">{category.name} <span className="text-slate-400">({category.family})</span></span>}
                        </div>
                        <p className="text-sm font-semibold leading-snug text-slate-900">{question.prompt}</p>
                      </div>
                    );
                    if (session.instrumentType === 'OBS') {
                      const record = session.observationRecords?.[question.id];
                      if (!record) return null;
                      return (
                        <div key={question.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                          {header}
                          <p className="text-sm text-slate-800"><strong>Respuesta:</strong> {record.observed === 'not_applicable' ? 'No observado' : record.scaleValue || 'Sin dato'}</p>
                          {record.observableEvidence && <p className="whitespace-pre-wrap text-sm text-slate-700"><strong>Evidencia:</strong> {record.observableEvidence}</p>}
                        </div>
                      );
                    }
                    if (session.instrumentType === 'GF') {
                      const record = session.focusGroupRecords?.[question.id];
                      if (!record) return null;
                      return (
                        <div key={question.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                          {header}
                          {record.audioKey && (
                            <div className="space-y-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-800"><Headphones className="h-3.5 w-3.5" aria-hidden="true" /> Audio de la conversación</span>
                              <StoredAudioPlayer audioKey={record.audioKey} />
                              <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Transcripción del audio</span>
                                  {record.transcribedAt && (
                                    <button type="button" onClick={() => void startTranscription(openStudent, [{ sessionId: session.id, questionId: question.id, force: true }])} disabled={Boolean(transcribing) || serverBusy} className="text-[11px] font-bold text-teal-800 underline hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-50">Volver a transcribir</button>
                                  )}
                                </div>
                                {record.audioTranscript?.trim()
                                  ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{record.audioTranscript}</p>
                                  : <p className="text-sm font-semibold text-amber-800">Aún sin transcripción: usa «Transcribir audios» arriba.</p>}
                              </div>
                            </div>
                          )}
                          <ul className="space-y-2">
                            {record.turns.map((turn, index) => (
                              <li key={turn.id} className={`rounded-lg border p-3 text-sm ${turn.participantPseudonym === code ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-200 bg-white'}`}>
                                <strong className="font-mono text-xs text-indigo-700">{turn.participantPseudonym || `Intervención ${index + 1}`}</strong>
                                <p className="mt-1 whitespace-pre-wrap text-slate-800">{turn.text || 'Sin transcripción'}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    const record = session.interviewRecords?.[question.id];
                    if (!record) return null;
                    const text = (record.verbatimResponse || '').trim();
                    return (
                      <div key={question.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        {header}
                        {record.audioKey ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-800"><Headphones className="h-3.5 w-3.5" aria-hidden="true" /> Audio</span>
                            <StoredAudioPlayer audioKey={record.audioKey} />
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Esta respuesta no tiene audio.</p>
                        )}
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Transcripción</span>
                            {record.audioKey && record.transcribedAt && (
                              <button
                                type="button"
                                onClick={() => void startTranscription(openStudent, [{ sessionId: session.id, questionId: question.id, force: true }])}
                                disabled={Boolean(transcribing) || serverBusy}
                                className="text-[11px] font-bold text-teal-800 underline hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Volver a transcribir
                              </button>
                            )}
                          </div>
                          {text ? (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{text}</p>
                          ) : (
                            <p className="text-sm font-semibold text-amber-800">Aún sin transcripción{record.audioKey ? ': usa «Transcribir audios» arriba.' : '.'}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        );
      })()}

      {viewing && <SessionDetailModal session={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};
