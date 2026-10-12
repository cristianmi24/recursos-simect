import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import type {
  FocusGroupRecord,
  FocusGroupTurn,
  InstrumentType,
  InterviewRecord,
  ObservationRecord,
  QuestionDefinition,
  ResearchSession,
  ResearchSessionDraft
} from '../../types';
import { AudioRecorder, StoredAudioPlayer } from './AudioRecorder';
import { SessionDetailModal } from '../InstrumentsModule/SessionDetailModal';
import { navigate, useSegments } from '../../utils/router';
import { useDialog } from '../DialogProvider';
import { readStoredDraft, storeDraft } from '../../utils/draftStorage';
import { AUDIO_CHANGED, AUDIO_UPLOADED, clearRecordings, listRecordings, processQueue, type AudioStatus, type UploadedAudio } from '../../utils/audioQueue';

// Código con el que se nombra el audio del grupo focal (solo códigos SIMECT, nunca nombres).
const groupAudioCode = (participants: string[] | undefined) => (participants?.length ? `grupo-${participants.join('-')}` : '');

// Un grupo focal con audio no necesita intervenciones escritas: se descartan las que quedaron vacías.
function draftForSubmit(draft: ResearchSessionDraft): ResearchSessionDraft {
  if (!draft.focusGroupRecords) return draft;
  return {
    ...draft,
    focusGroupRecords: Object.fromEntries(Object.entries(draft.focusGroupRecords).map(([questionId, record]) => [
      questionId,
      record.audioKey ? { ...record, turns: record.turns.filter((turn) => turn.text.trim()) } : record
    ]))
  };
}

type WizardPhase = 'home' | 'form';
type InstrumentCardInfo = {
  type: InstrumentType;
  title: string;
  shortTitle: string;
  range: string;
  count: number;
  description: string;
  accent: string;
};

const instrumentCards: InstrumentCardInfo[] = [
  {
    type: 'OBS',
    title: 'Observación estructurada',
    shortTitle: 'Observación',
    range: 'OBS1–OBS8',
    count: 8,
    description: 'Registra conductas observables durante la interacción con el STI.',
    accent: 'indigo'
  },
  {
    type: 'E',
    title: 'Entrevista semiestructurada',
    shortTitle: 'Entrevista',
    range: 'E1–E5',
    count: 5,
    description: 'Registra respuestas textuales y repreguntas de cada entrevista.',
    accent: 'teal'
  },
  {
    type: 'GF',
    title: 'Grupo focal',
    shortTitle: 'Grupo focal',
    range: 'GF1–GF10',
    count: 10,
    description: 'Captura las intervenciones del grupo por pregunta y participante.',
    accent: 'amber'
  }
];

type SimectUser = { institucion_codigo: string; institucion_nombre: string; usuario: string; nombres: string; apellidos: string };
const fullName = (user: SimectUser) => `${user.nombres} ${user.apellidos}`.trim();
const selectClass = 'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900';

function blankDraft(type: InstrumentType, questions: QuestionDefinition[]): ResearchSessionDraft {
  const date = new Date().toISOString().slice(0, 10);
  const base: ResearchSessionDraft = {
    instrumentType: type,
    date,
    institution: '',
    grade: '',
    sessionNumber: 1,
    stiVersionOrTask: '',
    recordingConsentApproved: false,
    notes: ''
  };

  if (type === 'OBS') {
    base.observationRecords = Object.fromEntries(
      questions.filter((question) => question.instrumentType === type).map((question) => [question.id, {
        questionId: question.id,
        observed: true,
        scaleValue: '',
        observableEvidence: '',
        contextualNotes: ''
      } satisfies ObservationRecord])
    );
  } else if (type === 'GF') {
    base.sessionDurationMinutes = 45;
    base.participantPseudonyms = [];
    base.focusGroupRecords = Object.fromEntries(
      questions.filter((question) => question.instrumentType === type).map((question) => [question.id, {
        questionId: question.id,
        turns: [{
          id: `turn-${question.id}-${crypto.randomUUID()}`,
          participantPseudonym: '',
          text: '',
          contextualNotes: ''
        }],
        moderatorNotes: ''
      } satisfies FocusGroupRecord])
    );
  } else {
    base.studentPseudonym = '';
    base.interviewRecords = Object.fromEntries(
      questions.filter((question) => question.instrumentType === type).map((question) => [question.id, {
        questionId: question.id,
        verbatimResponse: '',
        probingQuestions: '',
        contextualNotes: ''
      } satisfies InterviewRecord])
    );
  }
  return base;
}

function sessionDraft(session: ResearchSession, questions: QuestionDefinition[]): ResearchSessionDraft {
  const defaults = blankDraft(session.instrumentType, questions);
  return {
    ...defaults,
    ...session,
    observationRecords: session.instrumentType === 'OBS'
      ? { ...defaults.observationRecords, ...session.observationRecords }
      : undefined,
    focusGroupRecords: session.instrumentType === 'GF'
      ? { ...defaults.focusGroupRecords, ...session.focusGroupRecords }
      : undefined,
    interviewRecords: session.instrumentType === 'E'
      ? { ...defaults.interviewRecords, ...session.interviewRecords }
      : undefined
  };
}

export const TutorDataEntryFlow: React.FC = () => {
  const { questions, sessions, addSession, updateSession } = useProject();
  const isAdmin = useAuth().user?.role === 'admin';
  const dialog = useDialog();
  const segments = useSegments();
  const formPathRef = useRef<string[]>([]);
  const [phase, setPhase] = useState<WizardPhase>('home');
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('OBS');
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<ResearchSessionDraft | null>(null);
  const [showRecordingNotice, setShowRecordingNotice] = useState(false);
  const [simectUsers, setSimectUsers] = useState<SimectUser[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/simect/usuarios', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: SimectUser[]) => { if (active && Array.isArray(data)) setSimectUsers(data); })
      .catch(() => { if (active) setSimectUsers([]); });
    return () => { active = false; };
  }, []);
  const simectReady = (simectUsers?.length || 0) > 0;
  const simectStatus = simectUsers === null ? 'Cargando instituciones y estudiantes de SIMECT…' : 'No se pudo cargar la lista de SIMECT. Recarga la página; sin ella no se puede elegir institución ni estudiante.';
  const simectInstitutions = useMemo(
    () => Array.from(new Set((simectUsers || []).map((user) => user.institucion_nombre))).sort((a, b) => a.localeCompare(b, 'es')),
    [simectUsers]
  );
  const [editingSession, setEditingSession] = useState<ResearchSession | null>(null);
  const [viewingSession, setViewingSession] = useState<ResearchSession | null>(null);
  const [filterType, setFilterType] = useState<InstrumentType | 'ALL'>('ALL');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  // Audios grabados en este formulario que aún no están en el almacenamiento (por pregunta).
  const [pendingAudios, setPendingAudios] = useState<Record<string, AudioStatus>>({});

  const relevantQuestions = useMemo(
    () => questions.filter((question) => question.instrumentType === selectedInstrument),
    [questions, selectedInstrument]
  );
  const reviewStepIndex = relevantQuestions.length + 1;
  const activeQuestion = stepIndex > 0 && stepIndex < reviewStepIndex
    ? relevantQuestions[stepIndex - 1]
    : undefined;
  const instrumentInfo = instrumentCards.find((instrument) => instrument.type === selectedInstrument) || instrumentCards[0];

  // Lo que falta para poder enviar, con el paso donde se completa. Se puede recorrer el formulario
  // en cualquier orden; la comprobación se hace al enviar.
  const missingItems = useMemo(() => {
    if (!draft) return [];
    const items: { step: number; label: string }[] = [];
    const blank = (value: string | undefined) => !value?.trim();
    if (blank(draft.date)) items.push({ step: 0, label: 'Fecha de aplicación' });
    if (blank(draft.institution)) items.push({ step: 0, label: 'Institución educativa' });
    if (blank(draft.grade)) items.push({ step: 0, label: 'Grado' });
    if (selectedInstrument === 'GF') {
      const count = draft.participantPseudonyms?.length || 0;
      if (count === 0) items.push({ step: 0, label: 'Estudiantes participantes' });
      if (count > 30) items.push({ step: 0, label: 'Máximo 30 estudiantes participantes' });
    } else if (blank(draft.studentPseudonym)) {
      items.push({ step: 0, label: 'Estudiante' });
    }
    if (!draft.recordingConsentApproved) items.push({ step: 0, label: 'Confirmación del consentimiento informado' });
    relevantQuestions.forEach((question, index) => {
      const step = index + 1;
      if (selectedInstrument === 'OBS') {
        const record = draft.observationRecords?.[question.id];
        if (record?.observed === 'not_applicable') {
          if (blank(record.notObservedReason)) items.push({ step, label: `${question.code}: motivo de no observación` });
          return;
        }
        if (blank(record?.scaleValue)) items.push({ step, label: `${question.code}: respuesta registrada` });
        if (blank(record?.observableEvidence)) items.push({ step, label: `${question.code}: evidencia observable` });
      } else if (selectedInstrument === 'GF') {
        const record = draft.focusGroupRecords?.[question.id];
        // Con audio, solo cuentan las intervenciones que tienen texto.
        const turns = (record?.turns || []).filter((turn) => !record?.audioKey || !blank(turn.text));
        if (!record?.audioKey && turns.length === 0) items.push({ step, label: `${question.code}: audio o al menos una intervención` });
        if (turns.some((turn) => blank(turn.participantPseudonym))) items.push({ step, label: `${question.code}: seudónimo de cada intervención` });
        if (!record?.audioKey && turns.some((turn) => blank(turn.text))) items.push({ step, label: `${question.code}: transcripción de cada intervención` });
      } else {
        const record = draft.interviewRecords?.[question.id];
        if (!record?.audioKey && blank(record?.verbatimResponse)) items.push({ step, label: `${question.code}: audio o transcripción de la respuesta` });
      }
      const audio = pendingAudios[question.id];
      if (audio === 'queued') items.push({ step, label: `${question.code}: el audio aún se está enviando (espera la conexión)` });
      else if (audio) items.push({ step, label: `${question.code}: hay un audio grabado sin guardar (acéptalo o descártalo)` });
    });
    return items;
  }, [draft, relevantQuestions, selectedInstrument, pendingAudios]);
  const incompleteSteps = new Set(missingItems.map((item) => item.step));

  const goToStep = (step: number) => {
    setStepIndex(step);
    if (formPathRef.current.length) navigate([...formPathRef.current, ...(step > 0 ? [String(step + 1)] : [])], { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateDraft = (patch: Partial<ResearchSessionDraft>) => {
    setDraft((current) => current ? { ...current, ...patch } : current);
    setHasUnsavedChanges(true);
    setErrorMessage('');
  };

  const updateParticipants = (value: string) => {
    const participants = Array.from(new Set(value.split(',').map((participant) => participant.trim()).filter(Boolean)));
    setDraft((current) => {
      if (!current) return current;
      const currentRecords = current.focusGroupRecords || {};
      const nextRecords = Object.fromEntries(Object.entries(currentRecords).map(([questionId, record]) => [
        questionId,
        { ...record, turns: record.turns.map((turn) => participants.includes(turn.participantPseudonym)
          ? turn
          : { ...turn, participantPseudonym: participants[0] || '' }) }
      ]));
      return { ...current, participantPseudonyms: participants, focusGroupRecords: nextRecords };
    });
    setHasUnsavedChanges(true);
    setErrorMessage('');
  };

  // La URL manda: /formularios, /formularios/nuevo/<tipo>[/<paso>] o /formularios/editar/<id>[/<paso>].
  // Las acciones solo navegan y este bloque abre o cierra el formulario, así que recargar o usar
  // atrás/adelante deja a la persona en el mismo lugar. El borrador sin enviar se recupera de esta pestaña.
  const openForm = (type: InstrumentType, session: ResearchSession | null, path: string[]) => {
    const stored = readStoredDraft(path.join('/'));
    setSelectedInstrument(type);
    setDraft(stored ?? (session ? sessionDraft(session, questions) : blankDraft(type, questions)));
    setEditingSession(session);
    setErrorMessage('');
    setSuccessMessage('');
    setHasUnsavedChanges(Boolean(stored));
    setSubmitAttempted(false);
    setPhase('form');
    setViewingSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    if (formPathRef.current.length) {
      storeDraft(formPathRef.current.join('/'), null);
      void clearRecordings(`${formPathRef.current.join('/')}|`);
    }
    formPathRef.current = [];
    setPhase('home');
    setDraft(null);
    setEditingSession(null);
    setHasUnsavedChanges(false);
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const [, kind, target, stepRaw] = segments;
    const type = kind === 'nuevo' && (target === 'OBS' || target === 'E' || target === 'GF') ? target : null;
    const session = kind === 'editar' ? sessions.find((item) => item.id === target) ?? null : null;
    if (type || session) {
      const path = ['formularios', kind, target];
      const instrument = type ?? session!.instrumentType;
      if (formPathRef.current.join('/') !== path.join('/')) {
        formPathRef.current = path;
        openForm(instrument, session, path);
      }
      const lastStep = questions.filter((question) => question.instrumentType === instrument).length + 1;
      setStepIndex(Math.min(Math.max((Number(stepRaw) || 1) - 1, 0), lastStep));
      return;
    }
    if (kind) {
      navigate(['formularios'], { replace: true });
      return;
    }
    if (phase !== 'form') return;
    if (!hasUnsavedChanges) {
      closeForm();
      return;
    }
    // Atrás con cambios sin enviar: se vuelve al formulario y se pregunta antes de descartar.
    const path = [...formPathRef.current];
    navigate([...path, ...(stepIndex > 0 ? [String(stepIndex + 1)] : [])]);
    void dialog.confirm({
      title: '¿Salir sin enviar?',
      message: 'Hay cambios sin enviar en este formulario. Si sales, se descartarán.',
      confirmLabel: 'Salir y descartar',
      cancelLabel: 'Seguir editando',
      tone: 'danger'
    }).then((ok) => {
      if (!ok) return;
      setHasUnsavedChanges(false);
      storeDraft(path.join('/'), null);
      formPathRef.current = [];
      navigate(['formularios']);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  // Guarda el borrador en esta pestaña para no perderlo al recargar.
  useEffect(() => {
    if (phase === 'form' && hasUnsavedChanges && draft && formPathRef.current.length) storeDraft(formPathRef.current.join('/'), draft);
  }, [draft, phase, hasUnsavedChanges]);

  // Audios del formulario abierto: lista de pendientes, subida automática al volver la señal y,
  // cuando un audio termina de subir, se enlaza a su pregunta aunque esa pregunta no esté abierta.
  const formKey = phase === 'form' ? formPathRef.current.join('/') : '';
  useEffect(() => {
    if (!formKey) {
      setPendingAudios({});
      return;
    }
    const prefix = `${formKey}|`;
    const refresh = () => {
      void listRecordings(prefix).then((items) => setPendingAudios(Object.fromEntries(items.map((item) => [item.questionId, item.status]))));
    };
    const onUploaded = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; questionId: string; saved: UploadedAudio }>).detail;
      if (!detail.id.startsWith(prefix)) return;
      const audio = { ...detail.saved, transcribedAt: undefined };
      if (detail.questionId.startsWith('GF')) updateFocusGroup(detail.questionId, audio);
      else updateInterview(detail.questionId, audio);
    };
    const onOnline = () => { void processQueue(prefix); };
    refresh();
    void processQueue(prefix);
    window.addEventListener(AUDIO_CHANGED, refresh);
    window.addEventListener(AUDIO_UPLOADED, onUploaded);
    window.addEventListener('online', onOnline);
    const retry = window.setInterval(onOnline, 30000);
    return () => {
      window.clearInterval(retry);
      window.removeEventListener(AUDIO_CHANGED, refresh);
      window.removeEventListener(AUDIO_UPLOADED, onUploaded);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  const startNewForm = (type: InstrumentType) => navigate(['formularios', 'nuevo', type]);

  const startEditing = (session: ResearchSession) => navigate(['formularios', 'editar', session.id]);

  const returnToHome = async () => {
    if (hasUnsavedChanges && !(await dialog.confirm({
      title: '¿Salir sin enviar?',
      message: 'Hay cambios sin enviar en este formulario. Si sales, se descartarán.',
      confirmLabel: 'Salir y descartar',
      cancelLabel: 'Seguir editando',
      tone: 'danger'
    }))) return;
    closeForm();
    navigate(['formularios']);
  };

  const continueToNextStep = () => {
    setErrorMessage('');
    goToStep(Math.min(stepIndex + 1, reviewStepIndex));
  };

  // Ctrl/⌘ + Enter: siguiente pregunta (o enviar en la revisión); con ⇧, pregunta anterior. Funciona mientras se escribe.
  useEffect(() => {
    if (phase !== 'form') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      if (event.shiftKey) {
        if (stepIndex > 0) goToStep(stepIndex - 1);
      } else if (stepIndex === reviewStepIndex) {
        (document.getElementById('tutor-wizard-form') as HTMLFormElement | null)?.requestSubmit();
      } else {
        continueToNextStep();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const updateObservation = (questionId: string, patch: Partial<ObservationRecord>) => {
    setDraft((current) => {
      if (!current) return current;
      const records = current.observationRecords || {};
      const existing = records[questionId] || {
        questionId,
        observed: true,
        scaleValue: '',
        observableEvidence: '',
        contextualNotes: ''
      };
      return { ...current, observationRecords: { ...records, [questionId]: { ...existing, ...patch } } };
    });
    setHasUnsavedChanges(true);
    setErrorMessage('');
  };

  const updateInterview = (questionId: string, patch: Partial<InterviewRecord>) => {
    setDraft((current) => {
      if (!current) return current;
      const records = current.interviewRecords || {};
      const existing = records[questionId] || { questionId, verbatimResponse: '', probingQuestions: '', contextualNotes: '' };
      return { ...current, interviewRecords: { ...records, [questionId]: { ...existing, ...patch } } };
    });
    setHasUnsavedChanges(true);
    setErrorMessage('');
  };

  const updateFocusGroup = (questionId: string, patch: Partial<FocusGroupRecord>) => {
    setDraft((current) => {
      if (!current) return current;
      const records = current.focusGroupRecords || {};
      const existing = records[questionId] || { questionId, turns: [], moderatorNotes: '' };
      return { ...current, focusGroupRecords: { ...records, [questionId]: { ...existing, ...patch } } };
    });
    setHasUnsavedChanges(true);
    setErrorMessage('');
  };

  const updateFocusTurn = (questionId: string, turnId: string, patch: Partial<FocusGroupTurn>) => {
    const record = draft?.focusGroupRecords?.[questionId];
    if (!record) return;
    updateFocusGroup(questionId, {
      turns: record.turns.map((turn) => turn.id === turnId ? { ...turn, ...patch } : turn)
    });
  };

  const addFocusTurn = (questionId: string) => {
    const record = draft?.focusGroupRecords?.[questionId];
    if (!record) return;
    const firstParticipant = draft?.participantPseudonyms?.[0] || '';
    updateFocusGroup(questionId, {
      turns: [...record.turns, {
        id: `turn-${questionId}-${crypto.randomUUID()}`,
        participantPseudonym: firstParticipant,
        text: '',
        contextualNotes: ''
      }]
    });
  };

  const removeFocusTurn = (questionId: string, turnId: string) => {
    const record = draft?.focusGroupRecords?.[questionId];
    if (!record || (record.turns.length <= 1 && !record.audioKey)) return;
    updateFocusGroup(questionId, { turns: record.turns.filter((turn) => turn.id !== turnId) });
  };

  const saveForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || stepIndex !== reviewStepIndex || isSaving) return;
    setErrorMessage('');
    if (missingItems.length > 0) {
      setSubmitAttempted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsSaving(true);
    try {
      const saved = editingSession
        ? await updateSession({ ...editingSession, ...draftForSubmit(draft), instrumentType: editingSession.instrumentType })
        : await addSession(draftForSubmit(draft));
      closeForm();
      navigate(['formularios']);
      setSuccessMessage(`${editingSession ? 'Se actualizaron tus respuestas' : 'Se envió el formulario'} (${saved.instrumentCode}).`);
      setFilterType(saved.instrumentType);
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? error.message
        : 'No se pudo guardar el formulario. Tus respuestas siguen disponibles en esta pantalla.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSessions = sessions
    .filter((session) => filterType === 'ALL' || session.instrumentType === filterType)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const visibleSessions = showAllSessions ? filteredSessions : filteredSessions.slice(0, 5);

  const metadataSummary = draft ? [
    ['Fecha', draft.date],
    ['Institución', draft.institution],
    ['Grado', draft.grade],
    ['Número de sesión STI', String(draft.sessionNumber)],
    [selectedInstrument === 'GF' ? 'Seudónimos de participantes' : 'Seudónimo del estudiante', selectedInstrument === 'GF' ? (draft.participantPseudonyms?.join(', ') || 'Sin dato') : (draft.studentPseudonym || 'Sin dato')],
    ...(selectedInstrument === 'GF' ? [['Duración', `${draft.sessionDurationMinutes || 45} minutos`]] : []),
    ['Consentimiento verificado', draft.recordingConsentApproved ? 'Sí' : 'No'],
  ] : [];

  const renderQuestionEditor = (question: QuestionDefinition) => {
    if (!draft) return null;
    if (selectedInstrument === 'OBS') {
      const record = draft.observationRecords?.[question.id] || {
        questionId: question.id,
        observed: true,
        scaleValue: '',
        observableEvidence: '',
        contextualNotes: ''
      };
      return (
        <div className="space-y-5">
          {question.description && <p className="text-sm leading-6 text-slate-600">{question.description}</p>}
          {question.methodologicalNote && <p className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-950"><strong>Guía metodológica:</strong> {question.methodologicalNote}</p>}
          {question.id === 'OBS8' && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">Registra la reacción conductual predominante y susténtala con evidencia observable; evita inferir estados internos.</p>}
          <>
              <div className="space-y-2">
                <label htmlFor={`tutor-${question.id}-scale`} className="block text-sm font-semibold text-slate-800">Respuesta registrada <span aria-hidden="true">*</span></label>
                <select id={`tutor-${question.id}-scale`} required value={record.scaleValue || ''} onChange={(event) => updateObservation(question.id, { scaleValue: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600">
                  <option value="" disabled>Selecciona una opción</option>
                  {question.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor={`tutor-${question.id}-evidence`} className="block text-sm font-semibold text-slate-800">Evidencia concreta observable <span aria-hidden="true">*</span></label>
                <textarea id={`tutor-${question.id}-evidence`} required maxLength={8000} rows={5} value={record.observableEvidence || ''} onChange={(event) => updateObservation(question.id, { observableEvidence: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-indigo-600" placeholder="Describe acciones visibles, palabras, tiempos o movimientos. No incluyas nombres reales ni inferencias sobre pensamientos." />
              </div>
          </>
        </div>
      );
    }

    if (selectedInstrument === 'GF') {
      const record = draft.focusGroupRecords?.[question.id] || { questionId: question.id, turns: [], moderatorNotes: '' };
      return (
        <div className="space-y-5">
          {question.description && <p className="text-sm leading-6 text-slate-600">{question.description}</p>}
          <AudioRecorder
            label="Audio de la conversación (toda la pregunta)"
            value={{ audioKey: record.audioKey, audioMime: record.audioMime, audioSeconds: record.audioSeconds }}
            consentApproved={draft.recordingConsentApproved}
            studentCode={groupAudioCode(draft.participantPseudonyms)}
            missingCodeHint="Marca a los estudiantes participantes en los datos generales para poder grabar."
            questionId={question.id}
            storageId={`${formPathRef.current.join('/')}|${question.id}`}
            onChange={(audio) => updateFocusGroup(question.id, { audioKey: audio.audioKey, audioMime: audio.audioMime, audioSeconds: audio.audioSeconds, audioTranscript: undefined, transcribedAt: undefined })}
          />
          <p className="text-xs leading-5 text-slate-500">{record.audioKey ? 'Con el audio guardado, las intervenciones escritas son opcionales: úsalas para anotar quién dijo qué.' : 'Graba la conversación o escribe las intervenciones (al menos una de las dos).'}</p>
          <div className="space-y-3">
            {record.turns.map((turn, index) => (
              <fieldset key={turn.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <legend className="px-1 text-sm font-bold text-slate-800">Intervención {index + 1}</legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <label htmlFor={`tutor-${question.id}-${turn.id}-participant`} className="block text-sm font-semibold text-slate-800">Seudónimo <span aria-hidden="true">*</span></label>
                    <select id={`tutor-${question.id}-${turn.id}-participant`} required value={turn.participantPseudonym} onChange={(event) => updateFocusTurn(question.id, turn.id, { participantPseudonym: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-amber-600"><option value="" disabled>Selecciona un seudónimo</option>{draft.participantPseudonyms?.map((participant) => <option key={participant} value={participant}>{participant}</option>)}</select>
                  </div>
                  {(record.turns.length > 1 || record.audioKey) && <button type="button" onClick={() => removeFocusTurn(question.id, turn.id)} aria-label={`Quitar intervención ${index + 1}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-800"><Trash2 size={17} aria-hidden="true" />Quitar</button>}
                </div>
                <div className="space-y-2">
                  <label htmlFor={`tutor-${question.id}-${turn.id}-text`} className="block text-sm font-semibold text-slate-800">Transcripción textual <span aria-hidden="true">*</span></label>
                  <textarea id={`tutor-${question.id}-${turn.id}-text`} required maxLength={8000} rows={4} value={turn.text} onChange={(event) => updateFocusTurn(question.id, turn.id, { text: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-amber-600" placeholder="Registra fielmente lo que expresó el participante." />
                </div>
              </fieldset>
            ))}
          </div>
          <button type="button" onClick={() => addFocusTurn(question.id)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-950 hover:bg-amber-100"><Plus size={17} aria-hidden="true" />Añadir otra intervención</button>
          <div className="space-y-2">
            <label htmlFor={`tutor-${question.id}-moderator`} className="block text-sm font-semibold text-slate-800">Notas del moderador <span className="font-normal text-slate-500">(opcional)</span></label>
            <textarea id={`tutor-${question.id}-moderator`} maxLength={3000} rows={3} value={record.moderatorNotes || ''} onChange={(event) => updateFocusGroup(question.id, { moderatorNotes: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-amber-600" />
          </div>
        </div>
      );
    }

    const record = draft.interviewRecords?.[question.id] || { questionId: question.id, verbatimResponse: '', probingQuestions: '', contextualNotes: '' };
    return (
      <div className="space-y-5">
        {question.description && <p className="text-sm leading-6 text-slate-600">{question.description}</p>}
        <AudioRecorder
          value={{ audioKey: record.audioKey, audioMime: record.audioMime, audioSeconds: record.audioSeconds }}
          consentApproved={draft.recordingConsentApproved}
          studentCode={draft.studentPseudonym}
          questionId={question.id}
          storageId={`${formPathRef.current.join('/')}|${question.id}`}
          onChange={(audio) => updateInterview(question.id, { audioKey: audio.audioKey, audioMime: audio.audioMime, audioSeconds: audio.audioSeconds })}
        />
        <div className="space-y-2">
          <label htmlFor={`tutor-${question.id}-response`} className="block text-sm font-semibold text-slate-800">Transcripción de la respuesta {record.audioKey ? <span className="font-normal text-slate-500">(opcional con audio)</span> : <span aria-hidden="true">*</span>}</label>
          <textarea id={`tutor-${question.id}-response`} required={!record.audioKey} maxLength={10000} rows={6} value={record.verbatimResponse} onChange={(event) => updateInterview(question.id, { verbatimResponse: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-teal-700" placeholder="Transcribe con fidelidad la respuesta del estudiante." />
        </div>
      </div>
    );
  };

  const renderQuestionReview = (question: QuestionDefinition) => {
    if (!draft) return null;
    let answer: React.ReactNode;
    if (selectedInstrument === 'OBS') {
      const record = draft.observationRecords?.[question.id];
      answer = record?.observed === 'not_applicable'
        ? <p><strong>No observado:</strong> {record.notObservedReason || 'Sin motivo registrado'}</p>
        : <><p><strong>Respuesta:</strong> {record?.scaleValue || 'Sin dato'}</p><p className="mt-2"><strong>Evidencia:</strong> {record?.observableEvidence || 'Sin dato'}</p></>;
    } else if (selectedInstrument === 'GF') {
      const record = draft.focusGroupRecords?.[question.id];
      answer = <>{record?.audioKey && <div className="mb-3"><StoredAudioPlayer audioKey={record.audioKey} /></div>}<ul className="space-y-3">{record?.turns.map((turn, index) => <li key={turn.id} className="rounded-lg bg-white p-3"><strong>Intervención {index + 1} · {turn.participantPseudonym || 'Sin seudónimo'}</strong><p className="mt-1 whitespace-pre-wrap">{turn.text || 'Sin transcripción'}</p></li>)}</ul>{record?.moderatorNotes && <p className="mt-2"><strong>Notas del moderador:</strong> {record.moderatorNotes}</p>}</>;
    } else {
      const record = draft.interviewRecords?.[question.id];
      answer = <>{record?.audioKey && <div className="mb-2"><StoredAudioPlayer audioKey={record.audioKey} /></div>}<p className="whitespace-pre-wrap">{record?.verbatimResponse || (record?.audioKey ? 'Sin transcripción (solo audio)' : 'Sin dato')}</p></>;
    }
    return (
      <section key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><span className="font-mono text-xs font-bold text-slate-600">{question.code}</span>{incompleteSteps.has(relevantQuestions.indexOf(question) + 1) && <span className="ml-2 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">Falta completar</span>}<h3 className="mt-1 text-sm font-bold leading-6 text-slate-900">{question.prompt}</h3></div>
          <button type="button" onClick={() => goToStep(relevantQuestions.indexOf(question) + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Pencil size={15} aria-hidden="true" />Editar</button>
        </div>
        <div className="mt-4 text-sm leading-6 text-slate-700">{answer}</div>
      </section>
    );
  };

  if (phase === 'home') {
    return (
      <div className="tutor-home mx-auto max-w-7xl">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900"><ShieldCheck size={15} aria-hidden="true" />{isAdmin ? 'Formularios · Administración' : 'Espacio de formularios del tutor'}</div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">¿Qué formulario vas a completar?</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Elige un instrumento para comenzar. Te guiaremos por los datos de la sesión, cada pregunta y una revisión completa antes de enviar.</p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-600"><LockKeyhole size={14} aria-hidden="true" />{isAdmin ? 'Como Administración ves y puedes editar los formularios de todos los tutores.' : 'Verás tus propios registros; Administración puede revisar los formularios de todos los tutores.'}</p>
          {successMessage && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950" role="status" aria-live="polite"><CheckCircle2 className="mt-0.5 shrink-0" size={19} aria-hidden="true" /><p className="font-semibold">{successMessage}</p><button type="button" onClick={() => setSuccessMessage('')} className="ml-auto min-h-11 px-3 font-bold underline">Cerrar</button></div>}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Selecciona uno de los tres formularios">
            {instrumentCards.map((instrument) => {
              const count = sessions.filter((session) => session.instrumentType === instrument.type).length;
              const accentClasses = instrument.accent === 'indigo'
                ? 'border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/60 text-indigo-800'
                : instrument.accent === 'amber'
                  ? 'border-amber-200 hover:border-amber-500 hover:bg-amber-50/60 text-amber-900'
                  : 'border-teal-200 hover:border-teal-600 hover:bg-teal-50/60 text-teal-900';
              return (
                <button key={instrument.type} type="button" onClick={() => startNewForm(instrument.type)} className={`group flex min-h-52 flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${accentClasses}`}>
                  <span className="inline-flex w-fit items-center rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-extrabold shadow-sm">{instrument.range}</span>
                  <span className="mt-4 text-lg font-extrabold text-slate-900">{instrument.title}</span>
                  <span className="mt-2 text-sm leading-6 text-slate-600">{instrument.description}</span>
                  <span className="mt-auto flex w-full items-center justify-between gap-2 pt-5 text-sm font-bold"><span>{count} {count === 1 ? 'formulario enviado' : 'formularios enviados'}</span><span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-sm">Comenzar <ArrowRight size={16} aria-hidden="true" /></span></span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong>Protección de datos:</strong> usa seudónimos, no escribas nombres completos ni datos que identifiquen directamente a estudiantes. Verifica el consentimiento antes de enviar.</div>
        </header>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="tutor-history-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><ClipboardList size={15} aria-hidden="true" />{isAdmin ? 'Historial general' : 'Historial personal'}</div><h2 id="tutor-history-title" className="mt-1 text-xl font-extrabold text-slate-900">Formularios enviados</h2><p className="mt-1 text-sm text-slate-600">Puedes consultar y editar tus registros; los cambios quedarán registrados con la fecha de actualización.</p></div>
            <label className="flex min-h-12 items-center gap-2 text-sm font-semibold text-slate-700">Filtrar
              <select value={filterType} onChange={(event) => { setFilterType(event.target.value as InstrumentType | 'ALL'); setShowAllSessions(false); }} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900">
                <option value="ALL">Todos</option><option value="OBS">OBS</option><option value="E">E</option><option value="GF">GF</option>
              </select>
            </label>
          </div>
          {visibleSessions.length > 0 ? <div className="grid gap-3 md:grid-cols-2">
            {visibleSessions.map((session) => {
              const label = instrumentCards.find((instrument) => instrument.type === session.instrumentType)?.shortTitle || session.instrumentType;
              const participant = session.instrumentType === 'GF' ? session.participantPseudonyms?.join(', ') : session.studentPseudonym;
              return <article key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700">{label} · {session.instrumentCode}</span><span className="text-xs text-slate-500">{session.date}</span></div>
                <h3 className="mt-3 truncate text-sm font-bold text-slate-900">{session.stiVersionOrTask || 'Formulario enviado'}</h3>
                <p className="mt-1 text-sm text-slate-600">{session.institution} · {session.grade}</p>
                <p className="mt-1 text-xs text-slate-500">{session.instrumentType === 'GF' ? 'Participantes' : 'Seudónimo'}: {participant || 'No registrado'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setViewingSession(session)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"><Eye size={16} aria-hidden="true" />Revisar</button>
                  <button type="button" onClick={() => startEditing(session)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 text-sm font-bold text-white hover:bg-emerald-900"><Pencil size={16} aria-hidden="true" />Editar información</button>
                </div>
              </article>;
            })}
          </div> : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-9 text-center"><FileText size={25} className="mx-auto text-slate-400" aria-hidden="true" /><p className="mt-2 text-sm font-bold text-slate-700">Aún no hay formularios enviados</p><p className="mt-1 text-sm text-slate-500">Cuando completes uno, podrás volver aquí para revisarlo o editarlo.</p></div>}
          {filteredSessions.length > 5 && <button type="button" onClick={() => setShowAllSessions((showing) => !showing)} className="min-h-11 rounded-xl px-3 text-sm font-bold text-emerald-900 underline">{showAllSessions ? 'Mostrar menos' : `Ver todos (${filteredSessions.length})`}</button>}
        </section>
        {viewingSession && <SessionDetailModal session={viewingSession} onClose={() => setViewingSession(null)} />}
      </div>
    );
  }

  if (!draft) return null;
  const progressLabels = ['Datos generales', ...relevantQuestions.map((question) => question.code), 'Revisar y enviar'];
  const progressPercent = Math.round((stepIndex / reviewStepIndex) * 100);
  const currentStepTitle = stepIndex === 0
    ? 'Datos generales de la sesión'
    : stepIndex === reviewStepIndex
      ? 'Revisa toda la información'
      : `${activeQuestion?.code || ''} · Pregunta ${stepIndex} de ${relevantQuestions.length}`;

  return (
    <div className="tutor-form mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => void returnToHome()} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} aria-hidden="true" />Volver a formularios</button>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">{editingSession ? `Editando ${editingSession.instrumentCode}` : instrumentInfo.title}</span>
      </div>

      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><span className="font-mono text-xs font-extrabold text-slate-500">{instrumentInfo.range}</span><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{editingSession ? 'Editar formulario' : instrumentInfo.title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">Puedes recorrer las preguntas en el orden que quieras usando los pasos de abajo. Al enviar te avisaremos si falta algo.</p></div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><ShieldCheck size={15} aria-hidden="true" />Acceso protegido</span>
        </div>
        <div className="mt-6" aria-label={`Progreso: ${progressPercent}%`}>
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600"><span>Paso {stepIndex + 1} de {reviewStepIndex + 1}</span><span>{progressPercent}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progressPercent}%` }} /></div>
          <nav aria-label="Pasos del formulario" className="tutor-progress-steps mt-3 flex flex-wrap gap-2">
            {progressLabels.map((label, index) => {
              const flagged = submitAttempted && incompleteSteps.has(index);
              return <button key={`${index}-${label}`} type="button" aria-current={index === stepIndex ? 'step' : undefined} onClick={() => goToStep(index)} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${index === stepIndex ? 'bg-emerald-800 text-white' : flagged ? 'border border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100'}`}>{label}{flagged && <span className="sr-only"> (falta completar)</span>}</button>;
            })}
          </nav>
        </div>
      </header>

      {errorMessage && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-950">{errorMessage}</div>}
      {submitAttempted && missingItems.length > 0 && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-950">
        <p className="font-bold">No se puede enviar todavía. Falta completar:</p>
        <ul className="mt-2 space-y-1">{missingItems.map((item) => <li key={`${item.step}-${item.label}`} className="flex flex-wrap items-center justify-between gap-2"><span>• {item.label}</span><button type="button" onClick={() => goToStep(item.step)} className="min-h-9 rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-900 hover:bg-rose-100">Ir a {item.step === 0 ? 'Datos generales' : relevantQuestions[item.step - 1]?.code}</button></li>)}</ul>
      </div>}

      <form id="tutor-wizard-form" noValidate onSubmit={(event) => void saveForm(event)} className={`space-y-5 ${submitAttempted ? 'was-submitted' : ''}`}>
        {stepIndex === 0 && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><h2 className="text-lg font-extrabold text-slate-900">1. Datos generales</h2><p className="mt-1 text-sm text-slate-600">Completa la información de la sesión antes de registrar respuestas.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><label htmlFor="tutor-session-date" className="block text-sm font-semibold text-slate-800">Fecha de aplicación <span aria-hidden="true">*</span></label><input id="tutor-session-date" required type="date" value={draft.date} onChange={(event) => updateDraft({ date: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            <div className="space-y-2"><label htmlFor="tutor-session-number" className="block text-sm font-semibold text-slate-800">Número de sesión STI</label><select id="tutor-session-number" disabled value="1" className={selectClass}><option value="1">Sesión 1</option></select></div>
            <div className="space-y-2"><label htmlFor="tutor-institution" className="block text-sm font-semibold text-slate-800">Institución educativa <span aria-hidden="true">*</span></label><select id="tutor-institution" required disabled={!simectReady} value={draft.institution} onChange={(event) => { updateDraft({ institution: event.target.value, studentPseudonym: '' }); updateParticipants(''); }} className={selectClass}><option value="" disabled>{simectReady ? 'Selecciona la institución' : simectStatus}</option>{draft.institution && !simectInstitutions.includes(draft.institution) && <option value={draft.institution}>{draft.institution}</option>}{simectInstitutions.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
            <div className="space-y-2"><label htmlFor="tutor-grade" className="block text-sm font-semibold text-slate-800">Grado <span aria-hidden="true">*</span></label><select id="tutor-grade" required value={draft.grade} onChange={(event) => updateDraft({ grade: event.target.value })} className={selectClass}><option value="" disabled>Selecciona el grado</option>{draft.grade && !['Grado 8', 'Grado 9'].includes(draft.grade) && <option value={draft.grade}>{draft.grade}</option>}<option value="Grado 8">Grado 8</option><option value="Grado 9">Grado 9</option></select></div>
            {selectedInstrument === 'GF' ? <>
              <div className="space-y-2 sm:col-span-2"><label htmlFor="tutor-participants" className="block text-sm font-semibold text-slate-800">Estudiantes participantes <span aria-hidden="true">*</span></label>{draft.institution ? <fieldset id="tutor-participants" className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-300 bg-white p-3">{(simectUsers || []).filter((user) => user.institucion_nombre === draft.institution).map((user) => { const checked = draft.participantPseudonyms?.includes(user.usuario) || false; return <label key={user.usuario} className="flex min-h-10 items-center gap-3 text-sm text-slate-800"><input type="checkbox" checked={checked} onChange={() => { const current = draft.participantPseudonyms || []; updateParticipants((checked ? current.filter((code) => code !== user.usuario) : [...current, user.usuario]).join(',')); }} className="h-4 w-4" /><span className="font-mono text-xs font-bold text-amber-800">{user.usuario}</span><span>{fullName(user)}</span></label>; })}</fieldset> : <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">Primero selecciona la institución para ver sus estudiantes.</p>}<span className="text-xs text-slate-500">Marca a los estudiantes de la institución que participaron (máximo 30). Se guarda solo el código.</span></div>
              <div className="space-y-2"><label htmlFor="tutor-duration" className="block text-sm font-semibold text-slate-800">Duración aproximada (minutos)</label><input id="tutor-duration" type="number" min="1" max="1440" value={draft.sessionDurationMinutes ?? 45} onChange={(event) => updateDraft({ sessionDurationMinutes: event.target.value === '' ? undefined : Number(event.target.value) })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            </> : <div className="space-y-2"><label htmlFor="tutor-student-pseudonym" className="block text-sm font-semibold text-slate-800">Estudiante <span aria-hidden="true">*</span></label><select id="tutor-student-pseudonym" required value={draft.studentPseudonym || ''} disabled={!draft.institution} onChange={(event) => updateDraft({ studentPseudonym: event.target.value })} className={selectClass}><option value="" disabled>{draft.institution ? 'Selecciona el estudiante' : 'Primero selecciona la institución'}</option>{draft.studentPseudonym && !(simectUsers || []).some((user) => user.usuario === draft.studentPseudonym && user.institucion_nombre === draft.institution) && <option value={draft.studentPseudonym}>{draft.studentPseudonym}</option>}{(simectUsers || []).filter((user) => user.institucion_nombre === draft.institution).map((user) => <option key={user.usuario} value={user.usuario}>{user.usuario} · {fullName(user)}</option>)}</select><span className="text-xs text-slate-500">Solo aparecen los estudiantes de la institución elegida. Se guarda solo el código.</span></div>}
            
          </div>
          <label className="flex min-h-14 items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><input required type="checkbox" checked={draft.recordingConsentApproved} onChange={(event) => { if (event.target.checked) setShowRecordingNotice(true); else updateDraft({ recordingConsentApproved: false }); }} className="mt-1 h-5 w-5 shrink-0 accent-amber-800" /><span><strong>Verifiqué el consentimiento y asentimiento informado.</strong> Confirmo que se cuenta con la autorización requerida para esta recolección de datos.</span></label>
        </section>}

        {activeQuestion && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><span className="font-mono text-sm font-extrabold text-slate-500">{activeQuestion.code} · {stepIndex} de {relevantQuestions.length}</span><h2 className="mt-2 text-xl font-extrabold leading-7 text-slate-900">{activeQuestion.prompt}</h2></div>
          {renderQuestionEditor(activeQuestion)}
        </section>}

        {stepIndex === reviewStepIndex && <section className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm sm:p-7">
          <div><h2 className="text-xl font-extrabold text-slate-900">Revisa antes de enviar</h2><p className="mt-1 text-sm leading-6 text-slate-600">Comprueba los datos y las respuestas. Usa cada botón «Editar» para volver directamente al paso correspondiente.</p></div>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">Datos generales{incompleteSteps.has(0) && <span className="ml-2 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">Falta completar</span>}</h3><p className="mt-1 text-xs text-slate-500">{instrumentInfo.title}</p></div><button type="button" onClick={() => goToStep(0)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Pencil size={15} aria-hidden="true" />Editar</button></div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">{metadataSummary.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-sm text-slate-900">{value || 'Sin dato'}</dd></div>)}</dl>
          </section>
          {relevantQuestions.map(renderQuestionReview)}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>Una última comprobación:</strong> no incluyas datos identificables de estudiantes. Al confirmar, el registro quedará asociado a tu cuenta y Administración podrá revisarlo.</div>
        </section>}

        <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <button type="button" onClick={() => stepIndex === 0 ? void returnToHome() : goToStep(Math.max(0, stepIndex - 1))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} aria-hidden="true" />{stepIndex === 0 ? 'Cancelar y volver' : 'Paso anterior'}</button>
          {stepIndex === reviewStepIndex
            ? <button type="submit" disabled={isSaving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-extrabold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 size={17} aria-hidden="true" />{isSaving ? 'Guardando…' : editingSession ? 'Confirmar cambios' : 'Confirmar y enviar'}</button>
            : <button type="button" onClick={(event) => { event.preventDefault(); continueToNextStep(); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-extrabold text-white hover:bg-emerald-900">{stepIndex === 0 ? 'Continuar' : stepIndex === reviewStepIndex - 1 ? 'Revisar formulario' : 'Siguiente pregunta'}<ArrowRight size={17} aria-hidden="true" /></button>}
        </div>
      </form>
      {showRecordingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="recording-notice-title">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800"><ShieldCheck size={22} aria-hidden="true" /></span>
              <h2 id="recording-notice-title" className="text-lg font-extrabold text-slate-900">Antes de empezar: avisa al estudiante</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p><strong>Explícale al estudiante, con palabras sencillas, que su voz será grabada</strong> durante la entrevista y para qué se usará la grabación en esta investigación.</p>
              <p>Cuéntale que la grabación se maneja con medidas de seguridad:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>El audio se guarda en un almacenamiento privado y cifrado, sin enlaces públicos.</li>
                <li>Solo pueden escucharlo el tutor que hizo la entrevista y el equipo investigador autorizado.</li>
                <li>El estudiante se identifica solo con un código, no con su nombre, en los registros de la investigación.</li>
              </ul>
              <p><strong>Transcripción con inteligencia artificial:</strong> para convertir el audio en texto pueden usarse transcriptores de voz con IA. Se usan <strong>sin datos personales</strong>: no se envían nombres ni documentos del estudiante, solo el audio asociado a un código.</p>
              <p>Si el estudiante no quiere ser grabado, respeta su decisión y no uses el grabador.</p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowRecordingNotice(false)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={() => { updateDraft({ recordingConsentApproved: true }); setShowRecordingNotice(false); }} className="min-h-12 rounded-xl bg-amber-700 px-4 text-sm font-bold text-white hover:bg-amber-800">Ya se lo expliqué al estudiante</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
