export type InstrumentType = 'OBS' | 'GF' | 'E';

export interface QuestionDefinition {
  id: string; // e.g., 'OBS1', 'GF1', 'E1'
  instrumentType: InstrumentType;
  order: number;
  code: string;
  prompt: string;
  description?: string;
  responseType: 'structured_scale' | 'text' | 'reaction_scale' | 'mixed';
  options?: string[];
  methodologicalNote?: string;
  linkedCategories?: string[]; // Recommended initial mappings
}

export interface ObservationRecord {
  questionId: string; // OBS1 to OBS8
  observed: boolean | 'not_applicable'; // Distinguishes "not observed / info not available" from negative answer!
  scaleValue?: string; // e.g. "Sí", "No", "Parcialmente", or reaction type
  observableEvidence: string; // Exact factual description of what the researcher saw
  contextualNotes: string; // Researcher's contextual notes
  notObservedReason?: string;
}

export interface FocusGroupTurn {
  id: string;
  participantPseudonym: string; // e.g., 'EST-A1', 'EST-A2'
  text: string; // Textual verbatim or transcription
  contextualNotes?: string;
}

export interface FocusGroupRecord {
  questionId: string; // GF1 to GF10
  turns: FocusGroupTurn[];
  moderatorNotes: string;
}

export interface InterviewRecord {
  questionId: string; // E1 to E5
  verbatimResponse: string; // Textual student answer
  probingQuestions?: string; // Follow-up / deepening questions asked by researcher
  contextualNotes: string;
}

export interface ResearchSession {
  id: string;
  instrumentType: InstrumentType;
  instrumentCode: string; // e.g. "OBS-2026-001"
  date: string; // YYYY-MM-DD
  institution: string; // e.g. "Colegio San Martín - Sede Principal"
  grade: string; // e.g. "10° Grado - Grupo B"
  sessionNumber: number; // e.g. 1, 2, 3
  stiVersionOrTask: string; // e.g. "Módulo de Argumentación y Lógica Proposicional"
  researcherName: string;
  
  // Specific to OBS & E (individual):
  studentPseudonym?: string; // e.g. "EST-04"
  studentRealNameEncrypted?: string; // Optional pseudonymized link
  
  // Specific to GF:
  participantPseudonyms?: string[]; // e.g. ["EST-01", "EST-03", "EST-07", "EST-09"]
  sessionDurationMinutes?: number;

  // Records for each question/indicator:
  observationRecords?: Record<string, ObservationRecord>;
  focusGroupRecords?: Record<string, FocusGroupRecord>;
  interviewRecords?: Record<string, InterviewRecord>;

  audioRecordingRef?: string; // Secure reference / authorization confirmation
  recordingConsentApproved: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CategoryFamily = 'EXP' | 'PER' | 'DIF' | 'PC' | 'META';

export interface CategoryDefinition {
  id: string; // e.g., 'EXP-GEN', 'PC-EVAL'
  family: CategoryFamily;
  code: string;
  name: string;
  isTransversal?: boolean;
  parentCategoryId?: string;
  operationalDefinition: string;
  inclusionCriteria: string;
  exclusionCriteria: string;
  relatedIndicators: string[]; // e.g., ['OBS1', 'GF2', 'E3']
  illustrativeExample: string; // Identified as fictional
  auditTrail: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
    modificationReason?: string;
  };
}

export type CodingStatus = 'propuesta_pendiente' | 'revisada_aceptada' | 'modificada' | 'rechazada';

export interface CodedFragment {
  id: string;
  sessionId: string;
  sessionCode: string;
  instrumentType: InstrumentType;
  questionId: string; // OBS1, GF1, etc.
  participantPseudonym?: string;
  excerptText: string; // Verbatim quote or exact observable evidence
  categoryIds: string[]; // Associated codes (multi-coding allowed)
  transversalDimensionIds?: string[]; // PC or META
  justification: string;
  status: CodingStatus;
  suggestedByAI?: boolean;
  aiConfidence?: string;
  researcherName: string;
  dateCoded: string;
  reviewNotes?: string;
}

export interface TriangulationMatrixEntry {
  id: string;
  categoryId: string; // Main category or subcategory being triangulated
  transversalDimensionId?: string; // Optional PC / META
  
  // Evidence from 3 instruments
  obsEvidenceSummary: string;
  obsEvidenceAvailable: boolean;
  obsFragmentIds: string[];

  gfEvidenceSummary: string;
  gfEvidenceAvailable: boolean;
  gfFragmentIds: string[];

  interviewEvidenceSummary: string;
  interviewEvidenceAvailable: boolean;
  interviewFragmentIds: string[];

  // Qualitative Analysis dimensions
  coincidences: string; // Agreement among sources
  divergencesAndContradictions: string; // Discrepancies or opposing patterns
  complementaryFindings: string; // Nuances provided by one instrument to another
  absenceOfEvidenceNotes: string; // Clarifying why an instrument has no data without negative bias

  researcherInterpretation: string; // Hermeneutic synthesis by researcher
  pendingQuestions: string; // Open questions for the research team
  
  lastUpdatedBy: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create_session' | 'update_session' | 'create_category' | 'update_category' | 'create_code' | 'review_code' | 'triangulate' | 'export_data' | 'system_reset';
  entityType: 'session' | 'category' | 'coded_fragment' | 'triangulation' | 'system';
  entityId: string;
  researcher: string;
  summary: string;
  details?: Record<string, unknown>;
}
