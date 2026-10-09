import type {
  FocusGroupRecord,
  FocusGroupTurn,
  InstrumentType,
  InterviewRecord,
  ObservationRecord,
  ResearchSessionDraft
} from '../src/types';

export const MAX_SESSION_BYTES = 96 * 1024;
const QUESTION_ID = /^(OBS|GF|E)[A-Za-z0-9_-]{1,10}$/;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, field: string, max: number, required = false): ValidationResult<string> {
  if (value === undefined || value === null) {
    return required ? { ok: false, error: `Completa el campo ${field}.` } : { ok: true, value: '' };
  }
  if (typeof value !== 'string') return { ok: false, error: `El campo ${field} no es válido.` };
  const normalized = value.trim();
  if (required && !normalized) return { ok: false, error: `Completa el campo ${field}.` };
  if (normalized.length > max) return { ok: false, error: `El campo ${field} supera el límite permitido.` };
  return { ok: true, value: normalized };
}

function questionKey(key: string, expectedPrefix: string): boolean {
  return key.length <= 20 && key.startsWith(expectedPrefix) && QUESTION_ID.test(key);
}

function cleanObservationRecords(value: unknown): ValidationResult<Record<string, ObservationRecord>> {
  if (!isRecord(value) || Object.keys(value).length < 1 || Object.keys(value).length > 12) {
    return { ok: false, error: 'Incluye al menos una respuesta de observación válida.' };
  }
  const records: Record<string, ObservationRecord> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!questionKey(key, 'OBS') || !isRecord(raw)) return { ok: false, error: 'Una respuesta de observación no es válida.' };
    const observed = raw.observed;
    if (observed !== true && observed !== 'not_applicable') {
      return { ok: false, error: 'El valor observado no es válido.' };
    }
    const isNotObserved = observed === 'not_applicable';
    const scale = text(raw.scaleValue, 'escala', 120, !isNotObserved);
    const evidence = text(raw.observableEvidence, 'evidencia', 8000, !isNotObserved);
    const notes = text(raw.contextualNotes, 'notas contextuales', 3000);
    const reason = text(raw.notObservedReason, 'motivo de no observación', 1000, isNotObserved);
    if (!scale.ok || !evidence.ok || !notes.ok || !reason.ok) {
      const failure = [scale, evidence, notes, reason].find((item) => !item.ok);
      return { ok: false, error: failure && !failure.ok ? failure.error : 'Una respuesta de observación no es válida.' };
    }
    records[key] = {
      questionId: key,
      observed,
      ...(scale.value ? { scaleValue: scale.value } : {}),
      observableEvidence: evidence.value,
      contextualNotes: notes.value,
      ...(reason.value ? { notObservedReason: reason.value } : {})
    };
  }
  return { ok: true, value: records };
}

function cleanFocusGroupRecords(value: unknown): ValidationResult<Record<string, FocusGroupRecord>> {
  if (!isRecord(value) || Object.keys(value).length < 1 || Object.keys(value).length > 12) {
    return { ok: false, error: 'Incluye al menos una pregunta de grupo focal válida.' };
  }
  const records: Record<string, FocusGroupRecord> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!questionKey(key, 'GF') || !isRecord(raw) || !Array.isArray(raw.turns) || raw.turns.length < 1 || raw.turns.length > 40) {
      return { ok: false, error: 'Una respuesta de grupo focal no es válida.' };
    }
    const moderatorNotes = text(raw.moderatorNotes, 'notas de moderación', 4000);
    if (!moderatorNotes.ok) return moderatorNotes;
    const turns: FocusGroupTurn[] = [];
    for (const turn of raw.turns) {
      if (!isRecord(turn)) return { ok: false, error: 'Una intervención del grupo focal no es válida.' };
      const pseudonym = text(turn.participantPseudonym, 'seudónimo del participante', 80, true);
      const response = text(turn.text, 'intervención', 8000, true);
      const notes = text(turn.contextualNotes, 'notas de intervención', 2000);
      if (!pseudonym.ok || !response.ok || !notes.ok) {
        const failure = [pseudonym, response, notes].find((item) => !item.ok);
        return { ok: false, error: failure && !failure.ok ? failure.error : 'Una intervención del grupo focal no es válida.' };
      }
      turns.push({
        id: crypto.randomUUID(),
        participantPseudonym: pseudonym.value,
        text: response.value,
        ...(notes.value ? { contextualNotes: notes.value } : {})
      });
    }
    records[key] = { questionId: key, turns, moderatorNotes: moderatorNotes.value };
  }
  return { ok: true, value: records };
}

function cleanInterviewRecords(value: unknown): ValidationResult<Record<string, InterviewRecord>> {
  if (!isRecord(value) || Object.keys(value).length < 1 || Object.keys(value).length > 8) {
    return { ok: false, error: 'Incluye al menos una respuesta de entrevista válida.' };
  }
  const records: Record<string, InterviewRecord> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!questionKey(key, 'E') || !isRecord(raw)) return { ok: false, error: 'Una respuesta de entrevista no es válida.' };
    const response = text(raw.verbatimResponse, 'respuesta textual', 10000, true);
    const probing = text(raw.probingQuestions, 'preguntas de profundización', 4000);
    const notes = text(raw.contextualNotes, 'notas contextuales', 3000);
    if (!response.ok || !probing.ok || !notes.ok) {
      const failure = [response, probing, notes].find((item) => !item.ok);
      return { ok: false, error: failure && !failure.ok ? failure.error : 'Una respuesta de entrevista no es válida.' };
    }
    records[key] = {
      questionId: key,
      verbatimResponse: response.value,
      ...(probing.value ? { probingQuestions: probing.value } : {}),
      contextualNotes: notes.value
    };
  }
  return { ok: true, value: records };
}

export function validateSessionDraft(input: unknown): ValidationResult<ResearchSessionDraft> {
  if (!isRecord(input)) return { ok: false, error: 'El envío no contiene un formulario válido.' };
  if (Buffer.byteLength(JSON.stringify(input), 'utf8') > MAX_SESSION_BYTES) {
    return { ok: false, error: 'El formulario supera el tamaño máximo permitido.' };
  }

  const instrumentType = input.instrumentType;
  if (instrumentType !== 'OBS' && instrumentType !== 'GF' && instrumentType !== 'E') {
    return { ok: false, error: 'El instrumento seleccionado no es válido.' };
  }
  const date = text(input.date, 'fecha', 10, true);
  const parsedDate = date.ok ? new Date(`${date.value}T00:00:00Z`) : null;
  if (!date.ok || !/^\d{4}-\d{2}-\d{2}$/.test(date.value) || !parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date.value) {
    return { ok: false, error: 'La fecha de aplicación no es válida.' };
  }
  const institution = text(input.institution, 'institución', 160, true);
  const grade = text(input.grade, 'grado o grupo', 120, true);
  const task = text(input.stiVersionOrTask, 'módulo o tarea', 240, true);
  const notes = text(input.notes, 'notas', 2000);
  const audioRef = text(input.audioRecordingRef, 'referencia de grabación', 250);
  if (!institution.ok || !grade.ok || !task.ok || !notes.ok || !audioRef.ok) {
    const failure = [institution, grade, task, notes, audioRef].find((item) => !item.ok);
    return { ok: false, error: failure && !failure.ok ? failure.error : 'Los datos generales no son válidos.' };
  }
  if (!Number.isInteger(input.sessionNumber) || Number(input.sessionNumber) < 1 || Number(input.sessionNumber) > 10000) {
    return { ok: false, error: 'El número de sesión debe ser un entero positivo.' };
  }
  if (input.recordingConsentApproved !== true) {
    return { ok: false, error: 'Confirma que se verificó el consentimiento informado antes de enviar.' };
  }

  const draft: ResearchSessionDraft = {
    instrumentType: instrumentType as InstrumentType,
    date: date.value,
    institution: institution.value,
    grade: grade.value,
    sessionNumber: Number(input.sessionNumber),
    stiVersionOrTask: task.value,
    recordingConsentApproved: true,
    notes: notes.value,
    ...(audioRef.value ? { audioRecordingRef: audioRef.value } : {})
  };

  if (instrumentType === 'GF') {
    if (!Array.isArray(input.participantPseudonyms) || input.participantPseudonyms.length < 1 || input.participantPseudonyms.length > 30) {
      return { ok: false, error: 'Indica entre 1 y 30 seudónimos de participantes.' };
    }
    const participants: string[] = [];
    for (const raw of input.participantPseudonyms) {
      const pseudonym = text(raw, 'seudónimo del participante', 80, true);
      if (!pseudonym.ok) return pseudonym;
      participants.push(pseudonym.value);
    }
    const duration = input.sessionDurationMinutes;
    if (duration !== undefined && (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 1440)) {
      return { ok: false, error: 'La duración del grupo focal no es válida.' };
    }
    const records = cleanFocusGroupRecords(input.focusGroupRecords);
    if (!records.ok) return records;
    const participantSet = new Set(participants);
    for (const record of Object.values(records.value)) {
      if (record.turns.some((turn) => !participantSet.has(turn.participantPseudonym))) {
        return { ok: false, error: 'Cada intervención debe usar un seudónimo incluido en la lista del grupo focal.' };
      }
    }
    draft.participantPseudonyms = participants;
    if (duration !== undefined) draft.sessionDurationMinutes = Number(duration);
    draft.focusGroupRecords = records.value;
  } else {
    const pseudonym = text(input.studentPseudonym, 'seudónimo del estudiante', 80, true);
    if (!pseudonym.ok) return pseudonym;
    draft.studentPseudonym = pseudonym.value;
    if (instrumentType === 'OBS') {
      const records = cleanObservationRecords(input.observationRecords);
      if (!records.ok) return records;
      draft.observationRecords = records.value;
    } else {
      const records = cleanInterviewRecords(input.interviewRecords);
      if (!records.ok) return records;
      draft.interviewRecords = records.value;
    }
  }

  return { ok: true, value: draft };
}

export function parseJsonObject(value: unknown): JsonRecord | null {
  if (isRecord(value)) return value;
  if (typeof value !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
