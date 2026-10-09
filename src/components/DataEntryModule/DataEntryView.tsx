import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  InstrumentType,
  ResearchSession,
  ObservationRecord,
  FocusGroupRecord,
  InterviewRecord,
  FocusGroupTurn,
  ResearchSessionDraft
} from '../../types';
import {
  Send,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  Calendar,
  School,
  User,
  ShieldCheck,
  Eye,
  FileCheck,
  ArrowRight,
  ClipboardCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { SessionDetailModal } from '../InstrumentsModule/SessionDetailModal';

export const DataEntryView: React.FC = () => {
  const { user } = useAuth();
  const {
    questions,
    addSession,
    sessions,
    currentResearcher,
    isPseudonymized,
    setAppMode,
    setActiveTab
  } = useProject();

  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('OBS');

  // Metadata form
  const [institution, setInstitution] = useState('');
  const [grade, setGrade] = useState('');
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [studentPseudonym, setStudentPseudonym] = useState('');
  const [stiTask, setStiTask] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [consentApproved, setConsentApproved] = useState(false);
  const [audioRef, setAudioRef] = useState('');
  const [participantsText, setParticipantsText] = useState('');

  // Specific response states
  const [obsData, setObsData] = useState<Record<string, ObservationRecord>>(() => {
    const init: Record<string, ObservationRecord> = {};
    questions
      .filter((q) => q.instrumentType === 'OBS')
      .forEach((q) => {
        init[q.id] = {
          questionId: q.id,
          observed: true,
          scaleValue: '',
          observableEvidence: '',
          contextualNotes: ''
        };
      });
    return init;
  });

  const [gfData, setGfData] = useState<Record<string, FocusGroupRecord>>(() => {
    const init: Record<string, FocusGroupRecord> = {};
    questions
      .filter((q) => q.instrumentType === 'GF')
      .forEach((q) => {
        init[q.id] = {
          questionId: q.id,
          turns: [
            {
              id: `t-init-${q.id}`,
              participantPseudonym: '',
              text: '',
              contextualNotes: ''
            }
          ],
          moderatorNotes: ''
        };
      });
    return init;
  });

  const [eData, setEData] = useState<Record<string, InterviewRecord>>(() => {
    const init: Record<string, InterviewRecord> = {};
    questions
      .filter((q) => q.instrumentType === 'E')
      .forEach((q) => {
        init[q.id] = {
          questionId: q.id,
          verbatimResponse: '',
          probingQuestions: '',
          contextualNotes: ''
        };
      });
    return init;
  });

  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingSession, setViewingSession] = useState<ResearchSession | null>(null);

  const relevantQuestions = questions.filter((q) => q.instrumentType === selectedInstrument);

  // OBS handlers
  const handleObsChange = (qId: string, field: keyof ObservationRecord, value: any) => {
    setObsData((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value
      }
    }));
  };

  // GF handlers
  const handleAddGfTurn = (qId: string) => {
    const firstSpeaker = participantsText.split(',')[0]?.trim() || '';
    setGfData((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        turns: [
          ...(prev[qId]?.turns || []),
          {
            id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            participantPseudonym: firstSpeaker,
            text: '',
            contextualNotes: ''
          }
        ]
      }
    }));
  };

  const handleUpdateGfTurn = (
    qId: string,
    turnId: string,
    field: keyof FocusGroupTurn,
    val: string
  ) => {
    setGfData((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        turns: (prev[qId]?.turns || []).map((t) =>
          t.id === turnId ? { ...t, [field]: val } : t
        )
      }
    }));
  };

  const handleRemoveGfTurn = (qId: string, turnId: string) => {
    setGfData((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        turns: (prev[qId]?.turns || []).filter((t) => t.id !== turnId)
      }
    }));
  };

  // E handlers
  const handleEChange = (qId: string, field: keyof InterviewRecord, val: string) => {
    setEData((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: val
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    const newSession: ResearchSessionDraft = {
      instrumentType: selectedInstrument,
      date,
      institution,
      grade,
      sessionNumber: Number(sessionNumber),
      stiVersionOrTask: stiTask,
      studentPseudonym: selectedInstrument !== 'GF' ? studentPseudonym.trim() : undefined,
      participantPseudonyms:
        selectedInstrument === 'GF'
          ? participantsText
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : undefined,
      recordingConsentApproved: consentApproved,
      audioRecordingRef: audioRef,
      notes: 'Registro enviado mediante el Módulo de Entrega Directa de Respuestas.',
      observationRecords: selectedInstrument === 'OBS' ? obsData : undefined,
      focusGroupRecords: selectedInstrument === 'GF' ? gfData : undefined,
      interviewRecords: selectedInstrument === 'E' ? eData : undefined
    };

    setIsSubmitting(true);
    try {
      const saved = await addSession(newSession);
      setSubmissionSuccess(saved.instrumentCode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => setSubmissionSuccess(null), 7000);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'No se pudo guardar el formulario. Tus respuestas siguen disponibles en esta pantalla.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mySessions = sessions.filter((s) => s.instrumentType === selectedInstrument);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Módulo Principal de Recolección y Entrega</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Entrega de Respuestas de los Instrumentos del STI
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Diligencie y entregue aquí las respuestas y evidencias de los 3 instrumentos de
              investigación. Las preguntas se encuentran precargadas en su formulación original.
            </p>
          </div>

          {user?.role === 'admin' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row lg:flex-col items-start gap-3 shrink-0">
              <div>
                <span className="text-xs font-bold text-slate-900 block">¿Desea ver los análisis y entregables?</span>
                <span className="text-[11px] text-slate-500 block">Consulte los 8 Entregables y la Triangulación</span>
              </div>
              <button
                onClick={() => { setAppMode('admin'); setActiveTab('deliverables'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors w-full justify-center"
              >
                <span>Ir al Módulo Administrador</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Instrument Selector Cards (3 options) */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Paso 1: Seleccione el Instrumento a Entregar
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. OBS */}
            <button
              type="button"
              onClick={() => setSelectedInstrument('OBS')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedInstrument === 'OBS'
                  ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      selectedInstrument === 'OBS'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    OBS1–OBS8
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">
                    8 Indicadores
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-2">
                  1. Observación Estructurada
                </h3>
                <p className="text-xs text-slate-600 leading-snug">
                  Diligenciada por el investigador mientras observa la interacción del estudiante con el STI.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                {sessions.filter((s) => s.instrumentType === 'OBS').length} registros entregados
              </div>
            </button>

            {/* 2. GF */}
            <button
              type="button"
              onClick={() => setSelectedInstrument('GF')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedInstrument === 'GF'
                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      selectedInstrument === 'GF'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    GF1–GF10
                  </span>
                  <span className="text-xs font-semibold text-amber-700">
                    10 Preguntas
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-2">
                  2. Grupo Focal
                </h3>
                <p className="text-xs text-slate-600 leading-snug">
                  Formuladas oralmente a un grupo de estudiantes, registrando intervenciones por turnos.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                {sessions.filter((s) => s.instrumentType === 'GF').length} registros entregados
              </div>
            </button>

            {/* 3. E */}
            <button
              type="button"
              onClick={() => setSelectedInstrument('E')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedInstrument === 'E'
                  ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      selectedInstrument === 'E'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    E1–E5
                  </span>
                  <span className="text-xs font-semibold text-teal-700">
                    5 Preguntas
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-2">
                  3. Entrevista Semiestructurada
                </h3>
                <p className="text-xs text-slate-600 leading-snug">
                  Formuladas individualmente a cada estudiante, capturando respuestas textuales en profundidad.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                {sessions.filter((s) => s.instrumentType === 'E').length} registros entregados
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submissionError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">{submissionError}</div>}
      {submissionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in duration-300" role="status" aria-live="polite">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <strong className="block text-sm font-bold">
                ¡Respuestas entregadas y registradas con éxito!
              </strong>
              <p className="text-xs text-emerald-800">
                Se guardó la sesión con código <strong>{submissionSuccess}</strong>. Los datos
                están listos para codificación y triangulación en el panel administrador.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubmissionSuccess(null)}
            className="text-xs text-emerald-700 underline font-semibold hover:text-emerald-900"
          >
            Aceptar
          </button>
        </div>
      )}

      {/* Main Form for Response Delivery */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 2: Metadata Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>Datos Generales de la Sesión y del Sujeto</span>
            </h2>
            <span className="text-xs text-slate-500">
              Investigador: <strong>{currentResearcher}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="session-institution" className="block text-slate-700 font-semibold mb-1">
                Institución Educativa:
              </label>
              <input
                id="session-institution"
                type="text"
                required
                maxLength={160}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div>
              <label htmlFor="session-grade" className="block text-slate-700 font-semibold mb-1">
                Grado / Grupo:
              </label>
              <input
                id="session-grade"
                type="text"
                required
                maxLength={120}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div>
              <label htmlFor="session-date" className="block text-slate-700 font-semibold mb-1">
                Fecha de Aplicación:
              </label>
              <input
                id="session-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div>
              <label htmlFor="session-number" className="block text-slate-700 font-semibold mb-1">
                Número de Sesión STI:
              </label>
              <input
                id="session-number"
                type="number"
                min="1"
                max="10000"
                required
                value={sessionNumber}
                onChange={(e) => setSessionNumber(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div>
              <label htmlFor={selectedInstrument === 'GF' ? 'session-participants' : 'session-student-pseudonym'} className="block text-slate-700 font-semibold mb-1">
                {selectedInstrument === 'GF'
                  ? 'Participantes del Grupo Focal (Seudónimos):'
                  : 'Seudónimo del Estudiante (Protección Ética):'}
              </label>
              {selectedInstrument === 'GF' ? (
                <input
                  id="session-participants"
                  type="text"
                  required
                  maxLength={2500}
                  value={participantsText}
                  onChange={(e) => setParticipantsText(e.target.value)}
                  placeholder="EST-10B-01, EST-10B-04, EST-10B-08..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              ) : (
                <input
                  id="session-student-pseudonym"
                  type="text"
                  required
                  maxLength={80}
                  value={studentPseudonym}
                  onChange={(e) => setStudentPseudonym(e.target.value)}
                  placeholder="p. ej. EST-10B-04"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              )}
            </div>

            <div>
              <label htmlFor="session-sti-task" className="block text-slate-700 font-semibold mb-1">
                Módulo o Tarea del Tutor Inteligente:
              </label>
              <input
                id="session-sti-task"
                type="text"
                required
                maxLength={240}
                value={stiTask}
                onChange={(e) => setStiTask(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="consentAgreement"
              required
              checked={consentApproved}
              onChange={(e) => setConsentApproved(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="consentAgreement" className="text-xs text-slate-700 cursor-pointer">
              <strong>Consentimiento y asentimiento informado verificado</strong> (reserva de
              identidad y protección de datos conforme a principios metodológicos).
            </label>
          </div>
        </div>

        {/* Step 3: Exact Instrument Questions / Delivery Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>
                Formulario de Respuestas e Indicadores ({relevantQuestions.length} ítems precargados)
              </span>
            </h2>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Redacción original obligatoria
            </span>
          </div>

          {/* 1. OBSERVACIÓN ESTRUCTURADA FIELDS (OBS1-8) */}
          {selectedInstrument === 'OBS' &&
            relevantQuestions.map((q) => {
              const rec = obsData[q.id] || {
                questionId: q.id,
                observed: true,
                scaleValue: '',
                observableEvidence: '',
                contextualNotes: ''
              };
              const isNotObs = rec.observed === 'not_applicable';

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {q.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{q.prompt}</h4>
                      </div>
                      {q.description && (
                        <p className="text-xs text-slate-600 mt-1">{q.description}</p>
                      )}
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={isNotObs}
                        onChange={(e) =>
                          handleObsChange(
                            q.id,
                            'observed',
                            e.target.checked ? 'not_applicable' : true
                          )
                        }
                        className="rounded border-amber-300 text-amber-600"
                      />
                      <span>No observado / Información insuficiente</span>
                    </label>
                  </div>

                  {/* OBS8 Special Guidance */}
                  {q.id === 'OBS8' && (
                    <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Aclaración metodológica OBS8:</strong> Pregunta por una reacción
                        predominante. Seleccione la opción conductual adecuada y sustente con la
                        evidencia física observada.
                      </div>
                    </div>
                  )}

                  {isNotObs ? (
                    <div>
                      <label htmlFor={`obs-${q.id}-reason`} className="block text-xs font-semibold text-amber-900 mb-1">
                        Motivo por el cual no pudo observarse (sin considerarse respuesta negativa):
                      </label>
                      <textarea
                        id={`obs-${q.id}-reason`}
                        rows={2}
                        maxLength={1000}
                        value={rec.notObservedReason || ''}
                        required
                        onChange={(e) =>
                          handleObsChange(q.id, 'notObservedReason', e.target.value)
                        }
                        placeholder="p. ej. El estudiante resolvió el ejercicio sin cometer fallas, por lo que el sistema no emitió retroalimentación."
                        className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs text-slate-800 focus:border-amber-500 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor={`obs-${q.id}-scale`} className="block text-xs font-semibold text-slate-700 mb-1">
                          Respuesta Prevista:
                        </label>
                        <select
                          id={`obs-${q.id}-scale`}
                          value={rec.scaleValue}
                          required
                          onChange={(e) =>
                            handleObsChange(q.id, 'scaleValue', e.target.value)
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 outline-none font-medium"
                        >
                          <option value="" disabled>Seleccione una respuesta…</option>
                          {q.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        {q.methodologicalNote && (
                          <p className="text-[11px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded border border-slate-200">
                            Guía: {q.methodologicalNote}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <div>
                          <label htmlFor={`obs-${q.id}-evidence`} className="block text-xs font-semibold text-emerald-800 mb-1">
                            Evidencia Concreta de la Conducta Observable (Dato Fáctico Objetivo):
                          </label>
                          <textarea
                            id={`obs-${q.id}-evidence`}
                            rows={2}
                            required
                            maxLength={8000}
                            value={rec.observableEvidence}
                            onChange={(e) =>
                              handleObsChange(q.id, 'observableEvidence', e.target.value)
                            }
                            placeholder="Describa tiempos de pausa, clics, movimientos del ratón o gestos observables sin inferir pensamientos internos..."
                            className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor={`obs-${q.id}-notes`} className="block text-xs font-semibold text-slate-600 mb-1">
                            Notas Contextuales del Observador:
                          </label>
                          <input
                            id={`obs-${q.id}-notes`}
                            type="text"
                            maxLength={3000}
                            value={rec.contextualNotes}
                            onChange={(e) =>
                              handleObsChange(q.id, 'contextualNotes', e.target.value)
                            }
                            placeholder="Ruidos, distracción, intervención del docente, etc."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-600 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* 2. GRUPO FOCAL FIELDS (GF1-10) */}
          {selectedInstrument === 'GF' &&
            relevantQuestions.map((q) => {
              const rec = gfData[q.id] || { questionId: q.id, turns: [], moderatorNotes: '' };

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {q.code}
                        </span>
                        <h4 className="break-words text-sm font-bold text-slate-900">{q.prompt}</h4>
                      </div>
                      {q.description && (
                        <p className="text-xs text-slate-600 mt-1">{q.description}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddGfTurn(q.id)}
                      className="flex w-full items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors sm:w-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Intervención</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rec.turns.map((turn, tIdx) => (
                      <div
                        key={turn.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">
                              Intervención #{tIdx + 1}:
                            </span>
                            <input
                              type="text"
                              required
                              maxLength={80}
                              aria-label={`Seudónimo de la intervención ${tIdx + 1} para ${q.code}`}
                              value={turn.participantPseudonym}
                              onChange={(e) =>
                                handleUpdateGfTurn(
                                  q.id,
                                  turn.id,
                                  'participantPseudonym',
                                  e.target.value
                                )
                              }
                              placeholder="EST-10B-01"
                              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-amber-800 font-mono font-bold outline-none"
                            />
                          </div>

                          {rec.turns.length > 1 && (
                            <button
                              type="button"
                              aria-label={`Eliminar intervención ${tIdx + 1} de ${q.code}`}
                              onClick={() => handleRemoveGfTurn(q.id, turn.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Eliminar intervención"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <textarea
                          rows={2}
                          required
                          maxLength={8000}
                          aria-label={`Transcripción de la intervención ${tIdx + 1} para ${q.code}`}
                          value={turn.text}
                          onChange={(e) =>
                            handleUpdateGfTurn(q.id, turn.id, 'text', e.target.value)
                          }
                          placeholder="Transcripción textual de lo expresado oralmente por el estudiante..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:border-amber-500 outline-none"
                        />

                        <input
                          type="text"
                          maxLength={2000}
                          aria-label={`Notas contextuales de la intervención ${tIdx + 1} para ${q.code}`}
                          value={turn.contextualNotes || ''}
                          onChange={(e) =>
                            handleUpdateGfTurn(
                              q.id,
                              turn.id,
                              'contextualNotes',
                              e.target.value
                            )
                          }
                          placeholder="Notas contextuales del moderador (tono, gesticulación, asentimiento del grupo)..."
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-600 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          {/* 3. ENTREVISTA FIELDS (E1-5) */}
          {selectedInstrument === 'E' &&
            relevantQuestions.map((q) => {
              const rec = eData[q.id] || {
                questionId: q.id,
                verbatimResponse: '',
                probingQuestions: '',
                contextualNotes: ''
              };

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3"
                >
                  <div className="border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {q.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{q.prompt}</h4>
                    </div>
                    {q.description && (
                      <p className="text-xs text-slate-600 mt-1">{q.description}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`interview-${q.id}-response`} className="block text-xs font-semibold text-emerald-800 mb-1">
                        Respuesta Textual Íntegra (Transcripción Verbatim del Estudiante):
                      </label>
                      <textarea
                        id={`interview-${q.id}-response`}
                        rows={3}
                        required
                        maxLength={10000}
                        value={rec.verbatimResponse}
                        onChange={(e) => handleEChange(q.id, 'verbatimResponse', e.target.value)}
                        placeholder="Transcriba con fidelidad la respuesta oral del estudiante..."
                        className="w-full bg-white border border-emerald-300 rounded-lg p-3 text-xs text-slate-800 focus:border-teal-600 outline-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`interview-${q.id}-probing`} className="block text-xs font-semibold text-slate-700 mb-1">
                          Preguntas de Profundización Realizadas (Repreguntas):
                        </label>
                        <input
                          id={`interview-${q.id}-probing`}
                          type="text"
                          maxLength={4000}
                          value={rec.probingQuestions || ''}
                          onChange={(e) => handleEChange(q.id, 'probingQuestions', e.target.value)}
                          placeholder="¿Qué repregunta formuló el investigador para profundizar?"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor={`interview-${q.id}-notes`} className="block text-xs font-semibold text-slate-600 mb-1">
                          Notas Contextuales y Paraverbales:
                        </label>
                        <input
                          id={`interview-${q.id}-notes`}
                          type="text"
                          maxLength={3000}
                          value={rec.contextualNotes || ''}
                          onChange={(e) => handleEChange(q.id, 'contextualNotes', e.target.value)}
                          placeholder="Tono, seguridad, titubeos, entusiasmo..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Submit Button Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Al entregar las respuestas, los registros se guardarán con sellado de tiempo y
            quedarán disponibles para la codificación y triangulación del equipo investigador.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando en Neon…' : 'Entregar y Registrar Respuestas'}</span>
          </button>
        </div>
      </form>

      {/* Recent Submissions List in this Instrument */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Respuestas Entregadas Recientemente ({mySessions.length} sesiones en {selectedInstrument})
            </h3>
            <p className="text-xs text-slate-500">
              Registros guardados para este instrumento listos para análisis.
            </p>
          </div>

          {user?.role === 'admin' && (
            <button onClick={() => { setAppMode('admin'); setActiveTab('intake'); }} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              <span>Ver todas las sesiones en el Administrador</span><ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mySessions.map((s) => (
            <div
              key={s.id}
              className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                    {s.instrumentCode}
                  </span>
                  <span className="text-slate-500">{s.date}</span>
                </div>
                <div className="font-semibold text-slate-900 mt-1">
                  {s.instrumentType === 'GF'
                    ? `Grupo: ${s.participantPseudonyms?.join(', ')}`
                    : `Estudiante: ${s.studentPseudonym}`}
                </div>
                <div className="text-slate-500 text-[11px] truncate">{s.institution}</div>
              </div>

              <button
                type="button"
                onClick={() => setViewingSession(s)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 font-medium transition-colors shrink-0 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ver respuestas</span>
              </button>
            </div>
          ))}

          {mySessions.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs italic">
              No hay respuestas registradas aún para este instrumento. Diligencie el formulario superior y pulse «Entregar Respuestas».
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal for inspect */}
      {viewingSession && (
        <SessionDetailModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  );
};
