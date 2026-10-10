import React, { useMemo, useState } from 'react';
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
import { SessionDetailModal } from '../InstrumentsModule/SessionDetailModal';

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
    type: 'GF',
    title: 'Grupo focal',
    shortTitle: 'Grupo focal',
    range: 'GF1–GF10',
    count: 10,
    description: 'Captura las intervenciones del grupo por pregunta y participante.',
    accent: 'amber'
  },
  {
    type: 'E',
    title: 'Entrevista semiestructurada',
    shortTitle: 'Entrevista',
    range: 'E1–E5',
    count: 5,
    description: 'Registra respuestas textuales y repreguntas de cada entrevista.',
    accent: 'teal'
  }
];

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
  const [phase, setPhase] = useState<WizardPhase>('home');
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('OBS');
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<ResearchSessionDraft | null>(null);
  const [editingSession, setEditingSession] = useState<ResearchSession | null>(null);
  const [viewingSession, setViewingSession] = useState<ResearchSession | null>(null);
  const [filterType, setFilterType] = useState<InstrumentType | 'ALL'>('ALL');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const relevantQuestions = useMemo(
    () => questions.filter((question) => question.instrumentType === selectedInstrument),
    [questions, selectedInstrument]
  );
  const reviewStepIndex = relevantQuestions.length + 1;
  const activeQuestion = stepIndex > 0 && stepIndex < reviewStepIndex
    ? relevantQuestions[stepIndex - 1]
    : undefined;
  const instrumentInfo = instrumentCards.find((instrument) => instrument.type === selectedInstrument) || instrumentCards[0];

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

  const startNewForm = (type: InstrumentType) => {
    setSelectedInstrument(type);
    setDraft(blankDraft(type, questions));
    setEditingSession(null);
    setStepIndex(0);
    setErrorMessage('');
    setSuccessMessage('');
    setHasUnsavedChanges(false);
    setPhase('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditing = (session: ResearchSession) => {
    setSelectedInstrument(session.instrumentType);
    setDraft(sessionDraft(session, questions));
    setEditingSession(session);
    setStepIndex(0);
    setErrorMessage('');
    setSuccessMessage('');
    setHasUnsavedChanges(false);
    setPhase('form');
    setViewingSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToHome = () => {
    if (hasUnsavedChanges && !window.confirm('Hay cambios sin enviar. ¿Quieres salir y descartarlos?')) return;
    setPhase('home');
    setDraft(null);
    setEditingSession(null);
    setHasUnsavedChanges(false);
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateCurrentStep = (): boolean => {
    const form = document.getElementById('tutor-wizard-form') as HTMLFormElement | null;
    return form?.reportValidity() ?? false;
  };

  const continueToNextStep = () => {
    if (!validateCurrentStep()) return;
    if (stepIndex === 0 && selectedInstrument === 'GF' && (draft?.participantPseudonyms?.length || 0) > 30) {
      setErrorMessage('El grupo focal admite hasta 30 seudónimos de participantes.');
      return;
    }
    setErrorMessage('');
    setStepIndex((current) => Math.min(current + 1, reviewStepIndex));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    if (!record || record.turns.length <= 1) return;
    updateFocusGroup(questionId, { turns: record.turns.filter((turn) => turn.id !== turnId) });
  };

  const saveForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || stepIndex !== reviewStepIndex || isSaving) return;
    setErrorMessage('');
    setIsSaving(true);
    try {
      const saved = editingSession
        ? await updateSession({ ...editingSession, ...draft, instrumentType: editingSession.instrumentType })
        : await addSession(draft);
      setSuccessMessage(`${editingSession ? 'Se actualizaron tus respuestas' : 'Se envió el formulario'} (${saved.instrumentCode}).`);
      setPhase('home');
      setDraft(null);
      setEditingSession(null);
      setHasUnsavedChanges(false);
      setFilterType(saved.instrumentType);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    ['Grado / grupo', draft.grade],
    ['Número de sesión STI', String(draft.sessionNumber)],
    [selectedInstrument === 'GF' ? 'Seudónimos de participantes' : 'Seudónimo del estudiante', selectedInstrument === 'GF' ? (draft.participantPseudonyms?.join(', ') || 'Sin dato') : (draft.studentPseudonym || 'Sin dato')],
    ['Módulo o tarea del STI', draft.stiVersionOrTask],
    ...(selectedInstrument === 'GF' ? [['Duración', `${draft.sessionDurationMinutes || 45} minutos`]] : []),
    ['Consentimiento verificado', draft.recordingConsentApproved ? 'Sí' : 'No'],
    ['Referencia de grabación', draft.audioRecordingRef || 'No registrada'],
    ['Notas generales', draft.notes || 'Sin notas']
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
      const notObserved = record.observed === 'not_applicable';
      return (
        <div className="space-y-5">
          {question.description && <p className="text-sm leading-6 text-slate-600">{question.description}</p>}
          {question.methodologicalNote && <p className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-950"><strong>Guía metodológica:</strong> {question.methodologicalNote}</p>}
          {question.id === 'OBS8' && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">Registra la reacción conductual predominante y susténtala con evidencia observable; evita inferir estados internos.</p>}
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            <input type="checkbox" checked={notObserved} onChange={(event) => updateObservation(question.id, {
              observed: event.target.checked ? 'not_applicable' : true,
              ...(event.target.checked ? { scaleValue: '', observableEvidence: '' } : { notObservedReason: '' })
            })} className="h-5 w-5 accent-amber-700" />
            No observado / información insuficiente
          </label>
          {notObserved ? (
            <div className="space-y-2">
              <label htmlFor={`tutor-${question.id}-reason`} className="block text-sm font-semibold text-slate-800">Motivo de la no observación <span aria-hidden="true">*</span></label>
              <textarea id={`tutor-${question.id}-reason`} required maxLength={1000} rows={4} value={record.notObservedReason || ''} onChange={(event) => updateObservation(question.id, { notObservedReason: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-indigo-600" placeholder="Explica brevemente por qué no fue posible observar este indicador." />
              <p className="text-xs text-slate-500">La falta de observación no se interpreta como una respuesta negativa.</p>
            </div>
          ) : (
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
              <div className="space-y-2">
                <label htmlFor={`tutor-${question.id}-notes`} className="block text-sm font-semibold text-slate-800">Notas contextuales <span className="font-normal text-slate-500">(opcional)</span></label>
                <textarea id={`tutor-${question.id}-notes`} maxLength={3000} rows={3} value={record.contextualNotes || ''} onChange={(event) => updateObservation(question.id, { contextualNotes: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-indigo-600" placeholder="Contexto que ayude a interpretar la observación." />
              </div>
            </>
          )}
        </div>
      );
    }

    if (selectedInstrument === 'GF') {
      const record = draft.focusGroupRecords?.[question.id] || { questionId: question.id, turns: [], moderatorNotes: '' };
      return (
        <div className="space-y-5">
          {question.description && <p className="text-sm leading-6 text-slate-600">{question.description}</p>}
          <div className="space-y-3">
            {record.turns.map((turn, index) => (
              <fieldset key={turn.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <legend className="px-1 text-sm font-bold text-slate-800">Intervención {index + 1}</legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <label htmlFor={`tutor-${question.id}-${turn.id}-participant`} className="block text-sm font-semibold text-slate-800">Seudónimo <span aria-hidden="true">*</span></label>
                    <select id={`tutor-${question.id}-${turn.id}-participant`} required value={turn.participantPseudonym} onChange={(event) => updateFocusTurn(question.id, turn.id, { participantPseudonym: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-amber-600"><option value="" disabled>Selecciona un seudónimo</option>{draft.participantPseudonyms?.map((participant) => <option key={participant} value={participant}>{participant}</option>)}</select>
                  </div>
                  {record.turns.length > 1 && <button type="button" onClick={() => removeFocusTurn(question.id, turn.id)} aria-label={`Quitar intervención ${index + 1}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-800"><Trash2 size={17} aria-hidden="true" />Quitar</button>}
                </div>
                <div className="space-y-2">
                  <label htmlFor={`tutor-${question.id}-${turn.id}-text`} className="block text-sm font-semibold text-slate-800">Transcripción textual <span aria-hidden="true">*</span></label>
                  <textarea id={`tutor-${question.id}-${turn.id}-text`} required maxLength={8000} rows={4} value={turn.text} onChange={(event) => updateFocusTurn(question.id, turn.id, { text: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-amber-600" placeholder="Registra fielmente lo que expresó el participante." />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`tutor-${question.id}-${turn.id}-context`} className="block text-sm font-semibold text-slate-800">Notas contextuales <span className="font-normal text-slate-500">(opcional)</span></label>
                  <input id={`tutor-${question.id}-${turn.id}-context`} maxLength={2000} value={turn.contextualNotes || ''} onChange={(event) => updateFocusTurn(question.id, turn.id, { contextualNotes: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-amber-600" placeholder="Tono, gestos o dinámica del grupo." />
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
        <div className="space-y-2">
          <label htmlFor={`tutor-${question.id}-response`} className="block text-sm font-semibold text-slate-800">Respuesta textual íntegra <span aria-hidden="true">*</span></label>
          <textarea id={`tutor-${question.id}-response`} required maxLength={10000} rows={6} value={record.verbatimResponse} onChange={(event) => updateInterview(question.id, { verbatimResponse: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-teal-700" placeholder="Transcribe con fidelidad la respuesta del estudiante." />
        </div>
        <div className="space-y-2">
          <label htmlFor={`tutor-${question.id}-probing`} className="block text-sm font-semibold text-slate-800">Preguntas de profundización <span className="font-normal text-slate-500">(opcional)</span></label>
          <textarea id={`tutor-${question.id}-probing`} maxLength={4000} rows={3} value={record.probingQuestions || ''} onChange={(event) => updateInterview(question.id, { probingQuestions: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-teal-700" />
        </div>
        <div className="space-y-2">
          <label htmlFor={`tutor-${question.id}-context`} className="block text-sm font-semibold text-slate-800">Notas contextuales y paraverbales <span className="font-normal text-slate-500">(opcional)</span></label>
          <textarea id={`tutor-${question.id}-context`} maxLength={3000} rows={3} value={record.contextualNotes || ''} onChange={(event) => updateInterview(question.id, { contextualNotes: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:border-teal-700" />
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
        : <><p><strong>Respuesta:</strong> {record?.scaleValue || 'Sin dato'}</p><p className="mt-2"><strong>Evidencia:</strong> {record?.observableEvidence || 'Sin dato'}</p>{record?.contextualNotes && <p className="mt-2"><strong>Notas:</strong> {record.contextualNotes}</p>}</>;
    } else if (selectedInstrument === 'GF') {
      const record = draft.focusGroupRecords?.[question.id];
      answer = <><ul className="space-y-3">{record?.turns.map((turn, index) => <li key={turn.id} className="rounded-lg bg-white p-3"><strong>Intervención {index + 1} · {turn.participantPseudonym || 'Sin seudónimo'}</strong><p className="mt-1 whitespace-pre-wrap">{turn.text || 'Sin transcripción'}</p>{turn.contextualNotes && <p className="mt-1"><strong>Contexto:</strong> {turn.contextualNotes}</p>}</li>)}</ul>{record?.moderatorNotes && <p className="mt-2"><strong>Notas del moderador:</strong> {record.moderatorNotes}</p>}</>;
    } else {
      const record = draft.interviewRecords?.[question.id];
      answer = <><p className="whitespace-pre-wrap">{record?.verbatimResponse || 'Sin dato'}</p>{record?.probingQuestions && <p className="mt-2"><strong>Repreguntas:</strong> {record.probingQuestions}</p>}{record?.contextualNotes && <p className="mt-2"><strong>Contexto:</strong> {record.contextualNotes}</p>}</>;
    }
    return (
      <section key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><span className="font-mono text-xs font-bold text-slate-600">{question.code}</span><h3 className="mt-1 text-sm font-bold leading-6 text-slate-900">{question.prompt}</h3></div>
          <button type="button" onClick={() => setStepIndex(relevantQuestions.findIndex((item) => item.id === question.id) + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Pencil size={15} aria-hidden="true" />Editar</button>
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
                <option value="ALL">Todos</option><option value="OBS">OBS</option><option value="GF">GF</option><option value="E">E</option>
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
        <button type="button" onClick={returnToHome} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} aria-hidden="true" />Volver a formularios</button>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">{editingSession ? `Editando ${editingSession.instrumentCode}` : instrumentInfo.title}</span>
      </div>

      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><span className="font-mono text-xs font-extrabold text-slate-500">{instrumentInfo.range}</span><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{editingSession ? 'Editar formulario' : instrumentInfo.title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">Avanza paso a paso. Tus respuestas permanecerán en este formulario hasta que las envíes.</p></div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><ShieldCheck size={15} aria-hidden="true" />Acceso protegido</span>
        </div>
        <div className="mt-6" aria-label={`Progreso: ${progressPercent}%`}>
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600"><span>Paso {stepIndex + 1} de {reviewStepIndex + 1}</span><span>{progressPercent}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progressPercent}%` }} /></div>
          <nav aria-label="Pasos del formulario" className="tutor-progress-steps mt-3 flex flex-wrap gap-2">
            {progressLabels.map((label, index) => <button key={`${index}-${label}`} type="button" disabled={index >= stepIndex} aria-current={index === stepIndex ? 'step' : undefined} onClick={() => setStepIndex(index)} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${index === stepIndex ? 'bg-emerald-800 text-white' : index < stepIndex ? 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100' : 'cursor-not-allowed bg-slate-50 text-slate-400'}`}>{label}</button>)}
          </nav>
        </div>
      </header>

      {errorMessage && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-950">{errorMessage}</div>}

      <form id="tutor-wizard-form" onSubmit={(event) => void saveForm(event)} className="space-y-5">
        {stepIndex === 0 && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><h2 className="text-lg font-extrabold text-slate-900">1. Datos generales</h2><p className="mt-1 text-sm text-slate-600">Completa la información de la sesión antes de registrar respuestas.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><label htmlFor="tutor-session-date" className="block text-sm font-semibold text-slate-800">Fecha de aplicación <span aria-hidden="true">*</span></label><input id="tutor-session-date" required type="date" value={draft.date} onChange={(event) => updateDraft({ date: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            <div className="space-y-2"><label htmlFor="tutor-session-number" className="block text-sm font-semibold text-slate-800">Número de sesión STI <span aria-hidden="true">*</span></label><input id="tutor-session-number" required type="number" min="1" max="10000" value={draft.sessionNumber} onChange={(event) => updateDraft({ sessionNumber: Number(event.target.value) })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            <div className="space-y-2"><label htmlFor="tutor-institution" className="block text-sm font-semibold text-slate-800">Institución educativa <span aria-hidden="true">*</span></label><input id="tutor-institution" required maxLength={160} value={draft.institution} onChange={(event) => updateDraft({ institution: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            <div className="space-y-2"><label htmlFor="tutor-grade" className="block text-sm font-semibold text-slate-800">Grado / grupo <span aria-hidden="true">*</span></label><input id="tutor-grade" required maxLength={120} value={draft.grade} onChange={(event) => updateDraft({ grade: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            {selectedInstrument === 'GF' ? <>
              <div className="space-y-2"><label htmlFor="tutor-participants" className="block text-sm font-semibold text-slate-800">Seudónimos de participantes <span aria-hidden="true">*</span></label><input id="tutor-participants" required maxLength={2500} value={draft.participantPseudonyms?.join(', ') || ''} onChange={(event) => updateParticipants(event.target.value)} placeholder="EST-10B-01, EST-10B-02" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /><span className="text-xs text-slate-500">Sepáralos con comas; usa solo seudónimos y registra hasta 30.</span></div>
              <div className="space-y-2"><label htmlFor="tutor-duration" className="block text-sm font-semibold text-slate-800">Duración aproximada (minutos)</label><input id="tutor-duration" type="number" min="1" max="1440" value={draft.sessionDurationMinutes ?? 45} onChange={(event) => updateDraft({ sessionDurationMinutes: event.target.value === '' ? undefined : Number(event.target.value) })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            </> : <div className="space-y-2"><label htmlFor="tutor-student-pseudonym" className="block text-sm font-semibold text-slate-800">Seudónimo del estudiante <span aria-hidden="true">*</span></label><input id="tutor-student-pseudonym" required maxLength={80} value={draft.studentPseudonym || ''} onChange={(event) => updateDraft({ studentPseudonym: event.target.value })} placeholder="Ej.: EST-10B-04" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>}
            <div className="space-y-2 sm:col-span-2"><label htmlFor="tutor-sti-task" className="block text-sm font-semibold text-slate-800">Módulo o tarea del STI <span aria-hidden="true">*</span></label><input id="tutor-sti-task" required maxLength={240} value={draft.stiVersionOrTask} onChange={(event) => updateDraft({ stiVersionOrTask: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" /></div>
            <div className="space-y-2 sm:col-span-2"><label htmlFor="tutor-audio-reference" className="block text-sm font-semibold text-slate-800">Referencia interna de grabación <span className="font-normal text-slate-500">(opcional, no adjuntes el archivo)</span></label><input id="tutor-audio-reference" maxLength={250} value={draft.audioRecordingRef || ''} onChange={(event) => updateDraft({ audioRecordingRef: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" placeholder="Código de archivo autorizado" /></div>
            <div className="space-y-2 sm:col-span-2"><label htmlFor="tutor-general-notes" className="block text-sm font-semibold text-slate-800">Notas generales <span className="font-normal text-slate-500">(opcional)</span></label><textarea id="tutor-general-notes" maxLength={2000} rows={3} value={draft.notes || ''} onChange={(event) => updateDraft({ notes: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900" /></div>
          </div>
          <label className="flex min-h-14 items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><input required type="checkbox" checked={draft.recordingConsentApproved} onChange={(event) => updateDraft({ recordingConsentApproved: event.target.checked })} className="mt-1 h-5 w-5 shrink-0 accent-amber-800" /><span><strong>Verifiqué el consentimiento y asentimiento informado.</strong> Confirmo que se cuenta con la autorización requerida para esta recolección de datos.</span></label>
        </section>}

        {activeQuestion && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><span className="font-mono text-sm font-extrabold text-slate-500">{activeQuestion.code} · {stepIndex} de {relevantQuestions.length}</span><h2 className="mt-2 text-xl font-extrabold leading-7 text-slate-900">{activeQuestion.prompt}</h2></div>
          {renderQuestionEditor(activeQuestion)}
        </section>}

        {stepIndex === reviewStepIndex && <section className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm sm:p-7">
          <div><h2 className="text-xl font-extrabold text-slate-900">Revisa antes de enviar</h2><p className="mt-1 text-sm leading-6 text-slate-600">Comprueba los datos y las respuestas. Usa cada botón «Editar» para volver directamente al paso correspondiente.</p></div>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">Datos generales</h3><p className="mt-1 text-xs text-slate-500">{instrumentInfo.title}</p></div><button type="button" onClick={() => setStepIndex(0)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Pencil size={15} aria-hidden="true" />Editar</button></div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">{metadataSummary.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-sm text-slate-900">{value || 'Sin dato'}</dd></div>)}</dl>
          </section>
          {relevantQuestions.map(renderQuestionReview)}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>Una última comprobación:</strong> no incluyas datos identificables de estudiantes. Al confirmar, el registro quedará asociado a tu cuenta y Administración podrá revisarlo.</div>
        </section>}

        <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <button type="button" onClick={() => stepIndex === 0 ? returnToHome() : setStepIndex((current) => Math.max(0, current - 1))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} aria-hidden="true" />{stepIndex === 0 ? 'Cancelar y volver' : 'Paso anterior'}</button>
          {stepIndex === reviewStepIndex
            ? <button type="submit" disabled={isSaving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-extrabold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 size={17} aria-hidden="true" />{isSaving ? 'Guardando…' : editingSession ? 'Confirmar cambios' : 'Confirmar y enviar'}</button>
            : <button type="button" onClick={(event) => { event.preventDefault(); continueToNextStep(); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-extrabold text-white hover:bg-emerald-900">{stepIndex === 0 ? 'Continuar' : stepIndex === reviewStepIndex - 1 ? 'Revisar formulario' : 'Siguiente pregunta'}<ArrowRight size={17} aria-hidden="true" /></button>}
        </div>
      </form>
    </div>
  );
};
