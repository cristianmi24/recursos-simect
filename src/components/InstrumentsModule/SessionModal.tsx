import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  InstrumentType,
  ResearchSession,
  ObservationRecord,
  FocusGroupRecord,
  InterviewRecord,
  FocusGroupTurn
} from '../../types';
import { X, AlertCircle, Save, Plus, Trash2, HelpCircle } from 'lucide-react';

interface SessionModalProps {
  initialType: InstrumentType;
  existingSession?: ResearchSession;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  initialType,
  existingSession,
  onClose
}) => {
  const { questions, addSession, updateSession, currentResearcher } = useProject();

  const [instrumentType, setInstrumentType] = useState<InstrumentType>(
    existingSession?.instrumentType || initialType
  );
  const [instrumentCode, setInstrumentCode] = useState(
    existingSession?.instrumentCode ||
      `${initialType}-2026-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [date, setDate] = useState(
    existingSession?.date || new Date().toISOString().split('T')[0]
  );
  const [institution, setInstitution] = useState(
    existingSession?.institution || 'Institución Educativa Departamental San Martín'
  );
  const [grade, setGrade] = useState(existingSession?.grade || '10° Grado - Grupo B');
  const [sessionNumber, setSessionNumber] = useState(
    existingSession?.sessionNumber || 1
  );
  const [stiVersionOrTask, setStiVersionOrTask] = useState(
    existingSession?.stiVersionOrTask || 'Módulo de Falacias Lógicas y Argumentación Crítica v2.1'
  );
  const [studentPseudonym, setStudentPseudonym] = useState(
    existingSession?.studentPseudonym || (initialType !== 'GF' ? 'EST-10B-01' : '')
  );
  const [participantPseudonymsText, setParticipantPseudonymsText] = useState(
    existingSession?.participantPseudonyms?.join(', ') ||
      'EST-10B-01, EST-10B-04, EST-10B-08, EST-10B-12, EST-10B-15'
  );
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(
    existingSession?.sessionDurationMinutes || 45
  );
  const [recordingConsentApproved, setRecordingConsentApproved] = useState(
    existingSession ? existingSession.recordingConsentApproved : true
  );
  const [audioRecordingRef, setAudioRecordingRef] = useState(
    existingSession?.audioRecordingRef || 'REC-AUD-202610-01.m4a (Autorizado)'
  );
  const [notes, setNotes] = useState(existingSession?.notes || '');

  // Specific records state
  const [obsRecords, setObsRecords] = useState<Record<string, ObservationRecord>>(() => {
    if (existingSession?.observationRecords) return existingSession.observationRecords;
    const initial: Record<string, ObservationRecord> = {};
    questions
      .filter((q) => q.instrumentType === 'OBS')
      .forEach((q) => {
        initial[q.id] = {
          questionId: q.id,
          observed: true,
          scaleValue: q.options ? q.options[0] : 'Sí',
          observableEvidence: '',
          contextualNotes: ''
        };
      });
    return initial;
  });

  const [gfRecords, setGfRecords] = useState<Record<string, FocusGroupRecord>>(() => {
    if (existingSession?.focusGroupRecords) return existingSession.focusGroupRecords;
    const initial: Record<string, FocusGroupRecord> = {};
    questions
      .filter((q) => q.instrumentType === 'GF')
      .forEach((q) => {
        initial[q.id] = {
          questionId: q.id,
          turns: [],
          moderatorNotes: ''
        };
      });
    return initial;
  });

  const [eRecords, setERecords] = useState<Record<string, InterviewRecord>>(() => {
    if (existingSession?.interviewRecords) return existingSession.interviewRecords;
    const initial: Record<string, InterviewRecord> = {};
    questions
      .filter((q) => q.instrumentType === 'E')
      .forEach((q) => {
        initial[q.id] = {
          questionId: q.id,
          verbatimResponse: '',
          probingQuestions: '',
          contextualNotes: ''
        };
      });
    return initial;
  });

  const relevantQuestions = questions.filter(
    (q) => q.instrumentType === instrumentType
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const participantList =
      instrumentType === 'GF'
        ? participantPseudonymsText
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined;

    const sessionPayload: ResearchSession = {
      id: existingSession?.id || `ses-${Date.now()}`,
      instrumentType,
      instrumentCode,
      date,
      institution,
      grade,
      sessionNumber: Number(sessionNumber),
      stiVersionOrTask,
      researcherName: existingSession?.researcherName || currentResearcher,
      studentPseudonym: instrumentType !== 'GF' ? studentPseudonym.trim() : undefined,
      participantPseudonyms: participantList,
      sessionDurationMinutes:
        instrumentType === 'GF' ? Number(sessionDurationMinutes) : undefined,
      recordingConsentApproved,
      audioRecordingRef: audioRecordingRef.trim() || undefined,
      notes,
      createdAt: existingSession?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      observationRecords: instrumentType === 'OBS' ? obsRecords : undefined,
      focusGroupRecords: instrumentType === 'GF' ? gfRecords : undefined,
      interviewRecords: instrumentType === 'E' ? eRecords : undefined
    };

    if (existingSession) {
      updateSession(sessionPayload);
    } else {
      addSession(sessionPayload);
    }
    onClose();
  };

  const updateObsField = (
    qId: string,
    field: keyof ObservationRecord,
    value: any
  ) => {
    setObsRecords((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value
      }
    }));
  };

  const addGfTurn = (qId: string) => {
    const defaultSpeaker =
      participantPseudonymsText.split(',')[0]?.trim() || 'EST-10B-01';
    const newTurn: FocusGroupTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      participantPseudonym: defaultSpeaker,
      text: '',
      contextualNotes: ''
    };
    setGfRecords((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        turns: [...(prev[qId]?.turns || []), newTurn]
      }
    }));
  };

  const removeGfTurn = (qId: string, turnId: string) => {
    setGfRecords((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        turns: (prev[qId]?.turns || []).filter((t) => t.id !== turnId)
      }
    }));
  };

  const updateGfTurn = (
    qId: string,
    turnId: string,
    field: keyof FocusGroupTurn,
    value: string
  ) => {
    setGfRecords((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        turns: (prev[qId]?.turns || []).map((t) =>
          t.id === turnId ? { ...t, [field]: value } : t
        )
      }
    }));
  };

  const updateGfModeratorNotes = (qId: string, notesVal: string) => {
    setGfRecords((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        moderatorNotes: notesVal
      }
    }));
  };

  const updateEField = (
    qId: string,
    field: keyof InterviewRecord,
    value: string
  ) => {
    setERecords((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col my-auto text-slate-800">
        {/* Header - Light Theme */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 border border-indigo-200 text-indigo-700">
                {instrumentType === 'OBS'
                  ? 'Observación Estructurada (8 Indicadores)'
                  : instrumentType === 'GF'
                  ? 'Grupo Focal (10 Preguntas)'
                  : 'Entrevista Semiestructurada (5 Preguntas)'}
              </span>
              <span className="text-xs text-slate-600 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {instrumentCode}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">
              {existingSession ? 'Editar Registro de Sesión' : 'Nuevo Registro de Instrumento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Metadata Section - Light Theme */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              Datos Contextuales de la Sesión
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipo de Instrumento</label>
                <select
                  value={instrumentType}
                  onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
                  disabled={!!existingSession}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                >
                  <option value="OBS">Observación Estructurada (OBS1-OBS8)</option>
                  <option value="GF">Grupo Focal (GF1-GF10)</option>
                  <option value="E">Entrevista Semiestructurada (E1-E5)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Código de Sesión</label>
                <input
                  type="text"
                  required
                  value={instrumentCode}
                  onChange={(e) => setInstrumentCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fecha de Aplicación</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">No. de Sesión STI</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Institución Educativa</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Grado / Grupo</label>
                <input
                  type="text"
                  required
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  {instrumentType === 'GF'
                    ? 'Duración de la Sesión (min)'
                    : 'Seudónimo del Estudiante'}
                </label>
                {instrumentType === 'GF' ? (
                  <input
                    type="number"
                    min="10"
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={studentPseudonym}
                    onChange={(e) => setStudentPseudonym(e.target.value)}
                    placeholder="p. ej. EST-10B-04"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                  />
                )}
              </div>

              {instrumentType === 'GF' && (
                <div className="sm:col-span-4">
                  <label className="block text-slate-600 font-semibold mb-1">
                    Lista de Seudónimos de Participantes (separados por coma)
                  </label>
                  <input
                    type="text"
                    required
                    value={participantPseudonymsText}
                    onChange={(e) => setParticipantPseudonymsText(e.target.value)}
                    placeholder="EST-10B-01, EST-10B-04, EST-10B-08..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  Módulo o Tarea del Tutor Inteligente (STI)
                </label>
                <input
                  type="text"
                  required
                  value={stiVersionOrTask}
                  onChange={(e) => setStiVersionOrTask(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  Referencia de Grabación de Audio / Archivo Seguro
                </label>
                <input
                  type="text"
                  value={audioRecordingRef}
                  onChange={(e) => setAudioRecordingRef(e.target.value)}
                  placeholder="p. ej. REC-AUD-202610-01.m4a (Autorizado)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-indigo-600 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="consentCheck"
                checked={recordingConsentApproved}
                onChange={(e) => setRecordingConsentApproved(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-700 cursor-pointer">
                Cuenta con consentimiento y asentimiento informado firmado (protección de datos de menores).
              </label>
            </div>
          </div>

          {/* Instrument Specific Questions Container */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>Indicadores / Preguntas Precargadas ({relevantQuestions.length})</span>
                <span className="text-xs font-normal text-slate-500">
                  (Redacción original e inalterable)
                </span>
              </h3>
              <span className="text-xs text-slate-500">
                Separación: evidencia fáctica vs. notas de campo
              </span>
            </div>

            {/* 1. OBSERVACIÓN ESTRUCTURADA CARDS */}
            {instrumentType === 'OBS' &&
              relevantQuestions.map((q) => {
                const rec = obsRecords[q.id] || {
                  questionId: q.id,
                  observed: true,
                  scaleValue: 'Sí',
                  observableEvidence: '',
                  contextualNotes: ''
                };
                const isNotObs = rec.observed === 'not_applicable';

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {q.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {q.prompt}
                          </h4>
                        </div>
                        {q.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {q.description}
                          </p>
                        )}
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={isNotObs}
                          onChange={(e) =>
                            updateObsField(
                              q.id,
                              'observed',
                              e.target.checked ? 'not_applicable' : true
                            )
                          }
                          className="rounded border-amber-300 text-amber-600"
                        />
                        <span>No observado / Sin información</span>
                      </label>
                    </div>

                    {q.id === 'OBS8' && (
                      <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Tratamiento metodológico de OBS8:</strong> Pregunta por una reacción. Registre la tipología conductual y sustente con la evidencia observable.
                        </div>
                      </div>
                    )}

                    {isNotObs ? (
                      <div>
                        <label className="block text-xs font-semibold text-amber-900 mb-1">
                          Justificación de no observación (sin sesgo negativo):
                        </label>
                        <textarea
                          rows={2}
                          value={rec.notObservedReason || ''}
                          onChange={(e) =>
                            updateObsField(q.id, 'notObservedReason', e.target.value)
                          }
                          placeholder="p. ej. No se emitieron pistas de error en esta sección..."
                          className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Respuesta Prevista:
                          </label>
                          <select
                            value={rec.scaleValue || (q.options ? q.options[0] : 'Sí')}
                            onChange={(e) =>
                              updateObsField(q.id, 'scaleValue', e.target.value)
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 outline-none font-medium"
                          >
                            {q.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <div>
                            <label className="block text-xs font-semibold text-emerald-800 mb-1">
                              Evidencia Concreta de la Conducta Observable:
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={rec.observableEvidence}
                              onChange={(e) =>
                                updateObsField(
                                  q.id,
                                  'observableEvidence',
                                  e.target.value
                                )
                              }
                              placeholder="Describa la acción física, tiempo de pausa o movimientos del ratón..."
                              className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Notas Contextuales del Observador:
                            </label>
                            <input
                              type="text"
                              value={rec.contextualNotes}
                              onChange={(e) =>
                                updateObsField(
                                  q.id,
                                  'contextualNotes',
                                  e.target.value
                                )
                              }
                              placeholder="Postura corporal, ruidos, etc."
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* 2. GRUPO FOCAL CARDS */}
            {instrumentType === 'GF' &&
              relevantQuestions.map((q) => {
                const rec = gfRecords[q.id] || {
                  questionId: q.id,
                  turns: [],
                  moderatorNotes: ''
                };

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {q.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {q.prompt}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addGfTurn(q.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors border border-amber-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Intervención</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {rec.turns.map((turn) => (
                        <div
                          key={turn.id}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={turn.participantPseudonym}
                              onChange={(e) =>
                                updateGfTurn(
                                  q.id,
                                  turn.id,
                                  'participantPseudonym',
                                  e.target.value
                                )
                              }
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-amber-800 font-mono font-bold outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeGfTurn(q.id, turn.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            required
                            value={turn.text}
                            onChange={(e) =>
                              updateGfTurn(q.id, turn.id, 'text', e.target.value)
                            }
                            placeholder="Transcripción textual..."
                            className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* 3. ENTREVISTA CARDS */}
            {instrumentType === 'E' &&
              relevantQuestions.map((q) => {
                const rec = eRecords[q.id] || {
                  questionId: q.id,
                  verbatimResponse: '',
                  probingQuestions: '',
                  contextualNotes: ''
                };

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                  >
                    <div className="border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {q.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {q.prompt}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">
                          Respuesta Textual Verbatim:
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={rec.verbatimResponse}
                          onChange={(e) =>
                            updateEField(q.id, 'verbatimResponse', e.target.value)
                          }
                          placeholder="Transcriba la respuesta..."
                          className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs text-slate-800 outline-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
