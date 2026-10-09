import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ResearchSession } from '../../types';
import { X, Tag, Calendar, School, User, Clock, FileAudio, ExternalLink, CheckCircle } from 'lucide-react';

interface SessionDetailModalProps {
  session: ResearchSession;
  onClose: () => void;
  onCodeFragmentDirectly?: (
    sessionId: string,
    sessionCode: string,
    instrumentType: ResearchSession['instrumentType'],
    questionId: string,
    excerptText: string,
    participantPseudonym?: string
  ) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onCodeFragmentDirectly
}) => {
  const { questions, isPseudonymized, setActiveTab } = useProject();
  const [quickCodedId, setQuickCodedId] = useState<string | null>(null);

  const getQuestion = (qId: string) => questions.find((q) => q.id === qId);

  const handleSendToCoding = (
    qId: string,
    text: string,
    speaker?: string
  ) => {
    if (onCodeFragmentDirectly) {
      onCodeFragmentDirectly(
        session.id,
        session.instrumentCode,
        session.instrumentType,
        qId,
        text,
        speaker || session.studentPseudonym
      );
    }
    setQuickCodedId(qId + (speaker || ''));
    setTimeout(() => setQuickCodedId(null), 2500);
  };

  const studentDisplay = isPseudonymized
    ? session.studentPseudonym || 'EST-XX'
    : `${session.studentPseudonym || 'Sin seudónimo'} (Sujeto Confidencial)`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col my-auto text-slate-800">
        {/* Header - Light Theme */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 border border-indigo-200 text-indigo-700">
                {session.instrumentType === 'OBS'
                  ? 'Observación Estructurada'
                  : session.instrumentType === 'GF'
                  ? 'Grupo Focal'
                  : 'Entrevista Semiestructurada'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {session.instrumentCode}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">
              Registro Empírico Primario y Notas de Campo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Bar - Light Theme */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <School className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="truncate">
              <span className="text-slate-500 block text-[10px]">Institución:</span>
              <strong className="truncate text-slate-900">{session.institution}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px]">Fecha y Grado:</span>
              <strong className="text-slate-900">{session.date} ({session.grade})</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="text-slate-500 block text-[10px]">
                {session.instrumentType === 'GF' ? 'Participantes:' : 'Estudiante:'}
              </span>
              <strong className="text-amber-800 truncate">
                {session.instrumentType === 'GF'
                  ? `${session.participantPseudonyms?.length || 0} estudiantes (${session.participantPseudonyms?.join(', ')})`
                  : studentDisplay}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px]">Investigador:</span>
              <strong className="truncate text-slate-900">{session.researcherName}</strong>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {session.audioRecordingRef && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-indigo-600" />
                <span>
                  <strong>Referencia de audio/video:</strong> {session.audioRecordingRef}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">
                ✓ Consentimiento verificado
              </span>
            </div>
          )}

          {/* OBS RECORDS */}
          {session.instrumentType === 'OBS' && session.observationRecords && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                Indicadores Observados (OBS1 a OBS8)
              </h3>

              {Object.entries(session.observationRecords).map(([qId, rec]) => {
                const qDef = getQuestion(qId);
                const isNotObs = rec.observed === 'not_applicable';

                return (
                  <div
                    key={qId}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {qId}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {qDef?.prompt}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                            isNotObs
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {isNotObs ? 'No observado' : rec.scaleValue}
                        </span>

                        {!isNotObs && rec.observableEvidence && (
                          <button
                            onClick={() =>
                              handleSendToCoding(qId, rec.observableEvidence)
                            }
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-semibold transition-colors"
                            title="Extraer esta evidencia observable hacia el espacio de codificación cualitativa"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Codificar evidencia</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isNotObs ? (
                      <p className="text-xs text-amber-900 italic bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <strong>Motivo de no observación:</strong>{' '}
                        {rec.notObservedReason || 'Sin oportunidad contextual durante la sesión.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5 text-xs">
                          <span className="block text-emerald-800 font-bold mb-1">
                            Evidencia Concreta de la Conducta Observable:
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {rec.observableEvidence || 'Sin evidencia redactada.'}
                          </p>
                        </div>

                        {rec.contextualNotes && (
                          <div className="text-xs text-slate-600 pl-2 border-l-2 border-slate-300">
                            <span className="font-semibold text-slate-700">
                              Notas de contexto del observador:
                            </span>{' '}
                            {rec.contextualNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* GF RECORDS */}
          {session.instrumentType === 'GF' && session.focusGroupRecords && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                Preguntas Formuladas y Turnos de Habla (GF1 a GF10)
              </h3>

              {Object.entries(session.focusGroupRecords).map(([qId, rec]) => {
                const qDef = getQuestion(qId);

                return (
                  <div
                    key={qId}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                  >
                    <div className="border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {qId}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {qDef?.prompt}
                        </h4>
                      </div>
                    </div>

                    {rec.turns && rec.turns.length > 0 ? (
                      <div className="space-y-2">
                        {rec.turns.map((turn) => (
                          <div
                            key={turn.id}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-amber-800 font-bold font-mono">
                                {turn.participantPseudonym}:
                              </span>
                              <button
                                onClick={() =>
                                  handleSendToCoding(
                                    qId,
                                    turn.text,
                                    turn.participantPseudonym
                                  )
                                }
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-semibold transition-colors"
                              >
                                <Tag className="w-3 h-3" />
                                <span>Codificar intervención</span>
                              </button>
                            </div>
                            <p className="text-slate-800 leading-relaxed italic font-medium">
                              "{turn.text}"
                            </p>
                            {turn.contextualNotes && (
                              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                                <em>Contexto: {turn.contextualNotes}</em>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Sin intervenciones registradas en esta pregunta.
                      </p>
                    )}

                    {rec.moderatorNotes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <strong>Notas del moderador:</strong> {rec.moderatorNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* E RECORDS */}
          {session.instrumentType === 'E' && session.interviewRecords && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                Preguntas de la Entrevista Semiestructurada (E1 a E5)
              </h3>

              {Object.entries(session.interviewRecords).map(([qId, rec]) => {
                const qDef = getQuestion(qId);

                return (
                  <div
                    key={qId}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {qId}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {qDef?.prompt}
                        </h4>
                      </div>

                      {rec.verbatimResponse && (
                        <button
                          onClick={() =>
                            handleSendToCoding(
                              qId,
                              rec.verbatimResponse,
                              session.studentPseudonym
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-semibold transition-colors shrink-0"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Codificar respuesta</span>
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-emerald-200 rounded-xl p-3.5 text-xs">
                      <span className="block text-emerald-800 font-bold mb-1">
                        Respuesta Textual (Transcripción Verbatim):
                      </span>
                      <p className="text-slate-800 leading-relaxed italic font-medium">
                        "{rec.verbatimResponse || 'Sin transcripción registrada.'}"
                      </p>
                    </div>

                    {rec.probingQuestions && (
                      <div className="text-xs text-indigo-900 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
                        <strong>Repregunta de profundización:</strong> {rec.probingQuestions}
                      </div>
                    )}

                    {rec.contextualNotes && (
                      <div className="text-xs text-slate-600 pl-2 border-l-2 border-slate-300">
                        <strong>Notas paraverbales:</strong> {rec.contextualNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {session.notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
              <strong className="text-slate-900 block mb-1">
                Observaciones Generales de la Sesión:
              </strong>
              {session.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Última actualización: {new Date(session.updatedAt).toLocaleString()}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                setActiveTab('coding');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
            >
              <span>Ir a Codificación Cualitativa</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
