import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AuthUser } from './AuthContext';
import type {
  QuestionDefinition,
  CategoryDefinition,
  ResearchSession,
  ResearchSessionDraft,
  CodedFragment,
  TriangulationMatrixEntry,
  AuditLogEntry,
  CodingStatus
} from '../types';
import { INITIAL_QUESTIONS } from '../data/initialInstruments';
import { INITIAL_CATEGORIES } from '../data/initialCategories';

export type ActiveTab =
  | 'dashboard'
  | 'audios'
  | 'intake'
  | 'categories'
  | 'coding'
  | 'triangulation'
  | 'reports'
  | 'audit'
  | 'users';

export type AppMode = 'responder' | 'admin';
type DataStatus = 'loading' | 'ready' | 'error';
interface AdminProjectState {
  categories: CategoryDefinition[];
  codedFragments: CodedFragment[];
  triangulationEntries: TriangulationMatrixEntry[];
}

interface ProjectContextType {
  questions: QuestionDefinition[];
  categories: CategoryDefinition[];
  sessions: ResearchSession[];
  codedFragments: CodedFragment[];
  triangulationEntries: TriangulationMatrixEntry[];
  auditLogs: AuditLogEntry[];
  currentResearcher: string;
  isPseudonymized: boolean;
  setIsPseudonymized: (val: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  dataStatus: DataStatus;
  dataError: string;
  persistenceError: string;
  sessionsTruncated: boolean;
  retryData: () => void;
  refreshSessions: () => Promise<void>;
  transcriptionServerBusy: boolean;
  transcribingKey: string;
  transcriptionProgress: string;
  transcriptionMessage: { tone: 'error' | 'ok'; text: string } | null;
  startTranscription: (studentKey: string, jobs: { sessionId: string; questionId: string; force?: boolean }[]) => Promise<void>;

  addSession: (session: ResearchSessionDraft) => Promise<ResearchSession>;
  updateSession: (session: ResearchSession) => Promise<ResearchSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  addCategory: (category: CategoryDefinition) => void;
  updateCategory: (category: CategoryDefinition, reason: string) => void;
  deleteCategory: (categoryId: string) => void;
  addCodedFragment: (fragment: Omit<CodedFragment, 'id' | 'dateCoded'>) => void;
  updateFragmentStatus: (
    fragmentId: string,
    status: CodingStatus,
    reviewNotes?: string,
    updatedCategoryIds?: string[]
  ) => void;
  deleteCodedFragment: (fragmentId: string) => void;
  saveTriangulationEntry: (entry: TriangulationMatrixEntry) => void;
  logAction: (
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    summary: string,
    details?: Record<string, unknown>
  ) => void;
  exportProjectJson: () => string;
  importProjectJson: (jsonString: string) => boolean;
  suggestCodingForExcerpt: (text: string) => {
    categoryIds: string[];
    transversalIds: string[];
    confidence: string;
    rationale: string;
  };
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function defaultAdminState(): AdminProjectState {
  return {
    categories: INITIAL_CATEGORIES,
    codedFragments: [],
    triangulationEntries: []
  };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers }
  });
  const payload: unknown = await response.json().catch(() => null);
  const errorText = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
    ? payload.error
    : 'No se pudo completar la operación.';
  if (!response.ok) throw new Error(errorText);
  if (typeof payload !== 'object' || payload === null) throw new Error('La respuesta del servidor no es válida.');
  return payload as T;
}

function isAdminState(value: unknown): value is AdminProjectState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return Array.isArray(state.categories) && Array.isArray(state.codedFragments) && Array.isArray(state.triangulationEntries);
}

function serializeAdminState(state: AdminProjectState): string {
  return JSON.stringify({
    categories: state.categories,
    codedFragments: state.codedFragments,
    triangulationEntries: state.triangulationEntries
  });
}

export const ProjectProvider: React.FC<{ children: React.ReactNode; user: AuthUser; initialMode?: AppMode }> = ({
  children,
  user,
  initialMode = user.role === 'admin' ? 'admin' : 'responder'
}) => {
  const [questions] = useState<QuestionDefinition[]>(INITIAL_QUESTIONS);
  const initialState = defaultAdminState();
  const [categories, setCategories] = useState<CategoryDefinition[]>(user.role === 'admin' ? initialState.categories : []);
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [codedFragments, setCodedFragments] = useState<CodedFragment[]>(user.role === 'admin' ? initialState.codedFragments : []);
  const [triangulationEntries, setTriangulationEntries] = useState<TriangulationMatrixEntry[]>(user.role === 'admin' ? initialState.triangulationEntries : []);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentResearcher] = useState<string>(user.name);
  const [isPseudonymized, setIsPseudonymized] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>(user.role === 'admin' ? 'dashboard' : 'intake');
  const [appMode, setAppMode] = useState<AppMode>(initialMode);
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const [dataError, setDataError] = useState('');
  const [persistenceError, setPersistenceError] = useState('');
  const [sessionsTruncated, setSessionsTruncated] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);
  const versionRef = useRef(0);
  const baselineRef = useRef('');
  const saveBlockedRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setDataStatus('loading');
      setDataError('');
      setPersistenceError('');
      saveBlockedRef.current = false;
      try {
        const sessionsPromise = requestJson<{ sessions: ResearchSession[]; total: number; truncated: boolean }>('/api/sessions');
        const adminStatePromise = user.role === 'admin'
          ? requestJson<{ state: unknown; version: number }>('/api/admin/project-state')
          : Promise.resolve(null);
        const auditPromise = user.role === 'admin'
          ? requestJson<{ auditLogs: AuditLogEntry[] }>('/api/admin/audit')
          : Promise.resolve(null);
        const [sessionPayload, statePayload, auditPayload] = await Promise.all([sessionsPromise, adminStatePromise, auditPromise]);
        if (cancelled) return;
        if (!Array.isArray(sessionPayload.sessions)) throw new Error('El servidor devolvió un listado de formularios inválido.');
        setSessions(sessionPayload.sessions);
        setSessionsTruncated(Boolean(sessionPayload.truncated));
        if (user.role === 'admin') {
          const loadedState = statePayload?.state === null ? defaultAdminState() : statePayload?.state;
          if (!isAdminState(loadedState)) throw new Error('El estado administrativo almacenado en Neon no tiene un formato válido.');
          setCategories(loadedState.categories);
          setCodedFragments(loadedState.codedFragments);
          setTriangulationEntries(loadedState.triangulationEntries);
          setAuditLogs(Array.isArray(auditPayload?.auditLogs) ? auditPayload.auditLogs : []);
          versionRef.current = Number(statePayload?.version ?? 0);
          baselineRef.current = serializeAdminState(loadedState);
        } else {
          setCategories([]);
          setCodedFragments([]);
          setTriangulationEntries([]);
          setAuditLogs([]);
          versionRef.current = 0;
          baselineRef.current = '';
        }
        setDataStatus('ready');
      } catch (error) {
        if (cancelled) return;
        setDataError(error instanceof Error ? error.message : 'No se pudieron cargar los datos autorizados.');
        setDataStatus('error');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user.id, user.role, retryCounter]);

  useEffect(() => {
    if (user.role !== 'admin' || dataStatus !== 'ready' || saveBlockedRef.current) return;
    const state: AdminProjectState = { categories, codedFragments, triangulationEntries };
    const snapshot = serializeAdminState(state);
    if (snapshot === baselineRef.current) return;
    const timer = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        if (saveBlockedRef.current) return;
        try {
          const result = await requestJson<{ version: number }>('/api/admin/project-state', {
            method: 'PUT',
            body: JSON.stringify({ state, expectedVersion: versionRef.current })
          });
          versionRef.current = result.version;
          baselineRef.current = snapshot;
          setPersistenceError('');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'No se pudieron guardar los cambios.';
          if (message.includes('Otro administrador')) saveBlockedRef.current = true;
          setPersistenceError(message);
        }
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [categories, codedFragments, triangulationEntries, dataStatus, user.role]);

  const retryData = () => setRetryCounter((current) => current + 1);

  // Actualiza los formularios sin mostrar la pantalla de carga (no interrumpe lo que el administrador está haciendo).
  const refreshSessions = async () => {
    try {
      const payload = await requestJson<{ sessions: ResearchSession[]; truncated: boolean }>('/api/sessions');
      if (Array.isArray(payload.sessions)) {
        setSessions(payload.sessions);
        setSessionsTruncated(Boolean(payload.truncated));
      }
    } catch {
      /* si falla, se conserva la lista actual */
    }
  };

  // ---- Transcripción de audios (administrador). Vive aquí para que siga aunque se cambie de sección. ----
  const [transcriptionServerBusy, setTranscriptionServerBusy] = useState(false);
  const [transcribingKey, setTranscribingKey] = useState('');
  const [transcriptionProgress, setTranscriptionProgress] = useState('');
  const [transcriptionMessage, setTranscriptionMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const transcribingRef = useRef(false);
  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const startTranscription = async (studentKey: string, jobs: { sessionId: string; questionId: string; force?: boolean }[]) => {
    if (jobs.length === 0 || transcribingRef.current) return;
    transcribingRef.current = true;
    setTranscribingKey(studentKey);
    setTranscriptionMessage(null);
    let done = 0;
    try {
      for (const [index, job] of jobs.entries()) {
        setTranscriptionProgress(`Transcribiendo ${index + 1} de ${jobs.length}… puede tardar unos minutos por audio. Puedes cambiar de sección: seguirá en segundo plano.`);
        const started = await fetch('/api/admin/transcriptions/start', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job)
        });
        const startData = await started.json().catch(() => ({}));
        if (!started.ok) {
          setTranscriptionMessage({ tone: 'error', text: startData.error || 'No se pudo iniciar la transcripción.' });
          if (startData.code === 'busy') setTranscriptionServerBusy(true);
          return;
        }
        if (startData.state !== 'done') {
          let finished = false;
          for (let attempt = 0; attempt < 270 && !finished; attempt += 1) {
            await wait(5000);
            let pollData: { state?: string; message?: string } = {};
            try {
              const poll = await fetch(`/api/admin/transcriptions/${job.sessionId}/${job.questionId}`, { credentials: 'same-origin' });
              pollData = await poll.json().catch(() => ({}));
            } catch {
              continue; // corte momentáneo de red: se reintenta; la petición sigue viva en el servidor
            }
            if (pollData.state === 'done') finished = true;
            else if (pollData.state === 'failed') {
              setTranscriptionMessage({ tone: 'error', text: pollData.message || 'No se pudo transcribir el audio.' });
              return;
            } else if (pollData.state === 'idle') {
              setTranscriptionMessage({ tone: 'error', text: 'La transcripción se interrumpió. Inténtalo de nuevo.' });
              return;
            }
          }
          if (!finished) {
            setTranscriptionMessage({ tone: 'error', text: 'La transcripción tardó demasiado. Inténtalo de nuevo más tarde.' });
            return;
          }
        }
        done += 1;
        await refreshSessions();
      }
      setTranscriptionMessage({ tone: 'ok', text: `Listo: ${done} ${done === 1 ? 'audio transcrito' : 'audios transcritos'} y guardado${done === 1 ? '' : 's'} en la base de datos.` });
    } catch {
      setTranscriptionMessage({ tone: 'error', text: 'Se perdió la conexión durante la transcripción. Revisa y vuelve a intentarlo.' });
    } finally {
      transcribingRef.current = false;
      setTranscribingKey('');
      setTranscriptionProgress('');
      await refreshSessions();
    }
  };

  // Aviso si se intenta cerrar la pestaña con una transcripción en marcha.
  useEffect(() => {
    if (!transcribingKey) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [transcribingKey]);

  // Si hay otra transcripción en curso (otro administrador o una sesión anterior), se refleja y se espera a que termine.
  useEffect(() => {
    if (user.role !== 'admin' || dataStatus !== 'ready') return;
    let active = true;
    let timer: number | undefined;
    let wasBusy = false;
    const check = async () => {
      try {
        const response = await fetch('/api/admin/transcriptions/status', { credentials: 'same-origin' });
        if (!response.ok || !active) return;
        const data = (await response.json()) as { busy: boolean };
        if (!active) return;
        const busyNow = Boolean(data.busy) && !transcribingRef.current;
        setTranscriptionServerBusy(busyNow);
        if (wasBusy && !data.busy) await refreshSessions();
        wasBusy = busyNow;
        if (data.busy || transcribingRef.current) timer = window.setTimeout(check, 8000);
      } catch {
        timer = window.setTimeout(check, 15000);
      }
    };
    void check();
    return () => { active = false; if (timer) window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role, dataStatus, transcribingKey]);

  const logAction = (
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    summary: string,
    details?: Record<string, unknown>
  ) => {
    if (dataStatus !== 'ready' || user.role !== 'admin') return;
    void requestJson<{ auditEvent: AuditLogEntry }>('/api/admin/audit', {
      method: 'POST',
      body: JSON.stringify({ action, entityType, entityId, summary, details })
    }).then(({ auditEvent }) => {
      setAuditLogs((previous) => [auditEvent, ...previous].slice(0, 500));
    }).catch((error: unknown) => {
      setPersistenceError(error instanceof Error ? error.message : 'No se pudo registrar la acción en la bitácora.');
    });
  };

  const addSession = async (session: ResearchSessionDraft): Promise<ResearchSession> => {
    const result = await requestJson<{ session: ResearchSession; auditEvent: AuditLogEntry | null }>('/api/sessions', {
      method: 'POST', body: JSON.stringify(session)
    });
    setSessions((previous) => [result.session, ...previous]);
    if (result.auditEvent) setAuditLogs((previous) => [result.auditEvent as AuditLogEntry, ...previous].slice(0, 500));
    return result.session;
  };

  const updateSession = async (session: ResearchSession): Promise<ResearchSession> => {
    const result = await requestJson<{ session: ResearchSession; auditEvent: AuditLogEntry | null }>(`/api/sessions/${encodeURIComponent(session.id)}`, {
      method: 'PUT', body: JSON.stringify(session)
    });
    setSessions((previous) => previous.map((existing) => existing.id === result.session.id ? result.session : existing));
    if (result.auditEvent) setAuditLogs((previous) => [result.auditEvent as AuditLogEntry, ...previous].slice(0, 500));
    return result.session;
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    const result = await requestJson<{ ok: boolean; auditEvent: AuditLogEntry | null }>(`/api/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE', body: '{}' });
    if (!result.ok) throw new Error('No se pudo eliminar la sesión.');
    setSessions((previous) => previous.filter((session) => session.id !== sessionId));
    if (result.auditEvent) setAuditLogs((previous) => [result.auditEvent as AuditLogEntry, ...previous].slice(0, 500));
  };

  const addCategory = (category: CategoryDefinition) => {
    setCategories((previous) => [...previous, category]);
    logAction('create_category', 'category', category.id, `Nueva categoría creada: ${category.code} - ${category.name}`);
  };

  const updateCategory = (updated: CategoryDefinition, reason: string) => {
    const now = new Date().toISOString().split('T')[0];
    const categoryWithAudit: CategoryDefinition = {
      ...updated,
      auditTrail: { ...updated.auditTrail, lastModifiedDate: now, lastModifiedBy: currentResearcher, modificationReason: reason }
    };
    setCategories((previous) => previous.map((category) => category.id === updated.id ? categoryWithAudit : category));
    logAction('update_category', 'category', updated.id, `Categoría modificada [${updated.code}]: ${reason}`);
  };

  const deleteCategory = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    setCategories((previous) => previous.filter((item) => item.id !== categoryId));
    if (category) logAction('update_category', 'category', categoryId, `Categoría retirada: ${category.code}`);
  };

  const addCodedFragment = (fragmentData: Omit<CodedFragment, 'id' | 'dateCoded'>) => {
    const newFragment: CodedFragment = {
      ...fragmentData,
      id: `frag-${crypto.randomUUID()}`,
      dateCoded: new Date().toISOString().split('T')[0],
      researcherName: currentResearcher
    };
    setCodedFragments((previous) => [newFragment, ...previous]);
    logAction('create_code', 'coded_fragment', newFragment.id,
      `Fragmento codificado [${newFragment.sessionCode}] asignado a ${newFragment.categoryIds.join(', ')} (Estado: ${newFragment.status})`);
  };

  const updateFragmentStatus = (
    fragmentId: string,
    status: CodingStatus,
    reviewNotes?: string,
    updatedCategoryIds?: string[]
  ) => {
    setCodedFragments((previous) => previous.map((fragment) => fragment.id === fragmentId ? {
      ...fragment,
      status,
      reviewNotes: reviewNotes ?? fragment.reviewNotes,
      categoryIds: updatedCategoryIds ?? fragment.categoryIds,
      researcherName: currentResearcher
    } : fragment));
    logAction('review_code', 'coded_fragment', fragmentId, `Revisión de fragmento: estado actualizado a "${status}" por ${currentResearcher}`);
  };

  const deleteCodedFragment = (fragmentId: string) => {
    setCodedFragments((previous) => previous.filter((fragment) => fragment.id !== fragmentId));
    logAction('review_code', 'coded_fragment', fragmentId, 'Fragmento codificado retirado');
  };

  const saveTriangulationEntry = (entry: TriangulationMatrixEntry) => {
    setTriangulationEntries((previous) => previous.some((existing) => existing.id === entry.id)
      ? previous.map((existing) => existing.id === entry.id ? entry : existing)
      : [...previous, entry]);
    logAction('triangulate', 'triangulation', entry.id, `Matriz de triangulación actualizada para la categoría [${entry.categoryId}]`);
  };

  const exportProjectJson = (): string => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: currentResearcher,
      projectTitle: 'Investigación Cualitativa STI - SIMECT',
      categories,
      sessions,
      codedFragments,
      triangulationEntries,
      auditLogs
    };
    logAction('export_data', 'system', 'export-json', 'Exportación consolidada del proyecto a archivo JSON.');
    return JSON.stringify(payload, null, 2);
  };

  const importProjectJson = (jsonString: string): boolean => {
    if (user.role !== 'admin' || jsonString.length > 800 * 1024) return false;
    try {
      const data: unknown = JSON.parse(jsonString);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
      const project = data as Record<string, unknown>;
      if (!Array.isArray(project.categories) || !Array.isArray(project.codedFragments)) return false;
      setCategories(project.categories as CategoryDefinition[]);
      setCodedFragments(project.codedFragments as CodedFragment[]);
      if (Array.isArray(project.triangulationEntries)) setTriangulationEntries(project.triangulationEntries as TriangulationMatrixEntry[]);
      logAction('system_reset', 'system', 'import-json', 'Importación de matrices administrativas; se conservaron los formularios y la bitácora.');
      return true;
    } catch {
      return false;
    }
  };

  const suggestCodingForExcerpt = (text: string) => {
    const lower = text.toLowerCase();
    const matchedCategories: string[] = [];
    const matchedTransversals: string[] = [];
    let rationale = '';
    if (lower.includes('pensar') || lower.includes('razonar') || lower.includes('analizar') || lower.includes('premisa') || lower.includes('argument')) {
      matchedCategories.push('EXP-ANA', 'PER-PC');
      rationale += 'Detectada alusión a descomposición de información o razonamiento argumentativo. ';
    }
    if (lower.includes('duda') || lower.includes('insegur') || lower.includes('desconcert') || lower.includes('contraejemplo')) {
      matchedCategories.push('EXP-DUDA');
      rationale += 'Señalamiento de suspensión de certeza o cuestionamiento ante contraejemplos. ';
    }
    if (lower.includes('alternativa') || lower.includes('opciones') || lower.includes('punto de vista') || lower.includes('perspectiva')) {
      matchedCategories.push('EXP-ALT', 'PER-PERSP');
      rationale += 'Referencia a múltiples alternativas y apertura a diferentes puntos de vista. ';
    }
    if (lower.includes('error') || lower.includes('correg') || lower.includes('revis') || lower.includes('releer') || lower.includes('estrategia')) {
      matchedCategories.push('EXP-AUT', 'EXP-RETAUT');
      rationale += 'Indicios de autorregulación y ajuste cognitivo tras retroalimentación correctiva. ';
    }
    if (lower.includes('frustra') || lower.includes('rabia') || lower.includes('terco') || lower.includes('molest') || lower.includes('atrapad')) {
      matchedCategories.push('DIF-INT');
      rationale += 'Expresión afectiva de dificultad o fricción con la mediación del sistema. ';
    }
    if (lower.includes('cambiar') || lower.includes('agregar') || lower.includes('mejor') || lower.includes('propuesta') || lower.includes('entrenar')) {
      matchedCategories.push('PER-PROP');
      rationale += 'Propuesta explícita orientada a la optimización pedagógica o técnica del tutor. ';
    }
    if (lower.includes('consciente') || lower.includes('darme cuenta') || lower.includes('cómo aprendo') || lower.includes('mi mente')) {
      matchedCategories.push('PER-CONSC', 'PER-META');
      rationale += 'Autoinforme de toma de conciencia metacognitiva sobre el propio aprendizaje. ';
    }
    if (lower.includes('adapt') || lower.includes('igual a todos') || lower.includes('personaliz') || lower.includes('diferente')) {
      matchedCategories.push('PER-ADAPT');
      rationale += 'Evaluación de la adaptatividad y personalización del tutor inteligente. ';
    }
    if (matchedCategories.length === 0) {
      matchedCategories.push('EXP-GEN');
      rationale = 'Asignación general preliminar por contenido contextual amplio.';
    }
    return {
      categoryIds: Array.from(new Set(matchedCategories)),
      transversalIds: Array.from(new Set(matchedTransversals)),
      confidence: matchedCategories.length > 1 ? 'Alta (85%)' : 'Moderada (68%)',
      rationale: rationale.trim() || 'Coincidencia con patrones léxicos de la matriz conceptual.'
    };
  };

  return (
    <ProjectContext.Provider value={{
      questions, categories, sessions, codedFragments, triangulationEntries, auditLogs,
      currentResearcher, isPseudonymized, setIsPseudonymized, activeTab, setActiveTab,
      appMode, setAppMode, dataStatus, dataError, persistenceError, sessionsTruncated, retryData,
      refreshSessions, transcriptionServerBusy, transcribingKey, transcriptionProgress, transcriptionMessage, startTranscription,
      addSession, updateSession, deleteSession, addCategory, updateCategory, deleteCategory,
      addCodedFragment, updateFragmentStatus, deleteCodedFragment, saveTriangulationEntry,
      logAction, exportProjectJson, importProjectJson, suggestCodingForExcerpt
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
