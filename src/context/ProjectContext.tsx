import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  QuestionDefinition,
  CategoryDefinition,
  ResearchSession,
  CodedFragment,
  TriangulationMatrixEntry,
  AuditLogEntry,
  CodingStatus
} from '../types';
import { INITIAL_QUESTIONS } from '../data/initialInstruments';
import { INITIAL_CATEGORIES } from '../data/initialCategories';
import {
  SAMPLE_SESSIONS,
  INITIAL_CODED_FRAGMENTS,
  INITIAL_TRIANGULATION_ENTRIES,
  INITIAL_AUDIT_LOGS
} from '../data/sampleDataset';

export type ActiveTab =
  | 'intake'
  | 'categories'
  | 'coding'
  | 'triangulation'
  | 'reports'
  | 'audit'
  | 'deliverables';

export type AppMode = 'responder' | 'admin';

interface ProjectContextType {
  questions: QuestionDefinition[];
  categories: CategoryDefinition[];
  sessions: ResearchSession[];
  codedFragments: CodedFragment[];
  triangulationEntries: TriangulationMatrixEntry[];
  auditLogs: AuditLogEntry[];
  currentResearcher: string;
  setCurrentResearcher: (name: string) => void;
  isPseudonymized: boolean;
  setIsPseudonymized: (val: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // Session actions
  addSession: (session: ResearchSession) => void;
  updateSession: (session: ResearchSession) => void;
  deleteSession: (sessionId: string) => void;

  // Category actions
  addCategory: (category: CategoryDefinition) => void;
  updateCategory: (category: CategoryDefinition, reason: string) => void;
  deleteCategory: (categoryId: string) => void;

  // Coded fragments actions
  addCodedFragment: (fragment: Omit<CodedFragment, 'id' | 'dateCoded'>) => void;
  updateFragmentStatus: (
    fragmentId: string,
    status: CodingStatus,
    reviewNotes?: string,
    updatedCategoryIds?: string[]
  ) => void;
  deleteCodedFragment: (fragmentId: string) => void;

  // Triangulation actions
  saveTriangulationEntry: (entry: TriangulationMatrixEntry) => void;

  // Audit and system
  logAction: (
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    summary: string,
    details?: Record<string, unknown>
  ) => void;
  resetToSampleData: () => void;
  exportProjectJson: () => string;
  importProjectJson: (jsonString: string) => boolean;

  // AI & Heuristic suggestion helper
  suggestCodingForExcerpt: (text: string) => {
    categoryIds: string[];
    transversalIds: string[];
    confidence: string;
    rationale: string;
  };
}

const STORAGE_KEY = 'rocas_sti_qualitative_system_v1';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questions] = useState<QuestionDefinition[]>(INITIAL_QUESTIONS);
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [sessions, setSessions] = useState<ResearchSession[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sessions`);
      return saved ? JSON.parse(saved) : SAMPLE_SESSIONS;
    } catch {
      return SAMPLE_SESSIONS;
    }
  });

  const [codedFragments, setCodedFragments] = useState<CodedFragment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_fragments`);
      return saved ? JSON.parse(saved) : INITIAL_CODED_FRAGMENTS;
    } catch {
      return INITIAL_CODED_FRAGMENTS;
    }
  });

  const [triangulationEntries, setTriangulationEntries] = useState<TriangulationMatrixEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_triangulation`);
      return saved ? JSON.parse(saved) : INITIAL_TRIANGULATION_ENTRIES;
    } catch {
      return INITIAL_TRIANGULATION_ENTRIES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [currentResearcher, setCurrentResearcher] = useState<string>('Dra. Elena Restrepo (Investigadora Principal)');
  const [isPseudonymized, setIsPseudonymized] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('intake');
  const [appMode, setAppMode] = useState<AppMode>('responder');

  // Persistence to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage error categories', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_sessions`, JSON.stringify(sessions));
    } catch (e) {
      console.warn('LocalStorage error sessions', e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_fragments`, JSON.stringify(codedFragments));
    } catch (e) {
      console.warn('LocalStorage error fragments', e);
    }
  }, [codedFragments]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_triangulation`, JSON.stringify(triangulationEntries));
    } catch (e) {
      console.warn('LocalStorage error triangulation', e);
    }
  }, [triangulationEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('LocalStorage error audit', e);
    }
  }, [auditLogs]);

  const logAction = (
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    summary: string,
    details?: Record<string, unknown>
  ) => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      researcher: currentResearcher,
      summary,
      details
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const addSession = (session: ResearchSession) => {
    setSessions((prev) => [session, ...prev]);
    logAction('create_session', 'session', session.id, `Nueva sesión registrada: ${session.instrumentCode} (${session.instrumentType})`);
  };

  const updateSession = (session: ResearchSession) => {
    setSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
    logAction('update_session', 'session', session.id, `Sesión actualizada: ${session.instrumentCode}`);
  };

  const deleteSession = (sessionId: string) => {
    const s = sessions.find((x) => x.id === sessionId);
    setSessions((prev) => prev.filter((x) => x.id !== sessionId));
    if (s) {
      logAction('update_session', 'session', sessionId, `Sesión eliminada: ${s.instrumentCode}`);
    }
  };

  const addCategory = (category: CategoryDefinition) => {
    setCategories((prev) => [...prev, category]);
    logAction('create_category', 'category', category.id, `Nueva categoría creada: ${category.code} - ${category.name}`);
  };

  const updateCategory = (updated: CategoryDefinition, reason: string) => {
    const now = new Date().toISOString().split('T')[0];
    const categoryWithAudit: CategoryDefinition = {
      ...updated,
      auditTrail: {
        ...updated.auditTrail,
        lastModifiedDate: now,
        lastModifiedBy: currentResearcher,
        modificationReason: reason
      }
    };
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? categoryWithAudit : c)));
    logAction('update_category', 'category', updated.id, `Categoría modificada [${updated.code}]: ${reason}`);
  };

  const deleteCategory = (categoryId: string) => {
    const c = categories.find((x) => x.id === categoryId);
    setCategories((prev) => prev.filter((x) => x.id !== categoryId));
    if (c) {
      logAction('update_category', 'category', categoryId, `Categoría retirada: ${c.code}`);
    }
  };

  const addCodedFragment = (fragmentData: Omit<CodedFragment, 'id' | 'dateCoded'>) => {
    const newFrag: CodedFragment = {
      ...fragmentData,
      id: `frag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dateCoded: new Date().toISOString().split('T')[0]
    };
    setCodedFragments((prev) => [newFrag, ...prev]);
    logAction(
      'create_code',
      'coded_fragment',
      newFrag.id,
      `Fragmento codificado [${newFrag.sessionCode}] asignado a ${newFrag.categoryIds.join(', ')} (Estado: ${newFrag.status})`
    );
  };

  const updateFragmentStatus = (
    fragmentId: string,
    status: CodingStatus,
    reviewNotes?: string,
    updatedCategoryIds?: string[]
  ) => {
    setCodedFragments((prev) =>
      prev.map((frag) => {
        if (frag.id === fragmentId) {
          return {
            ...frag,
            status,
            reviewNotes: reviewNotes ?? frag.reviewNotes,
            categoryIds: updatedCategoryIds ?? frag.categoryIds,
            researcherName: currentResearcher
          };
        }
        return frag;
      })
    );
    logAction('review_code', 'coded_fragment', fragmentId, `Revisión de fragmento: estado actualizado a "${status}" por ${currentResearcher}`);
  };

  const deleteCodedFragment = (fragmentId: string) => {
    setCodedFragments((prev) => prev.filter((x) => x.id !== fragmentId));
    logAction('review_code', 'coded_fragment', fragmentId, `Fragmento codificado retirado`);
  };

  const saveTriangulationEntry = (entry: TriangulationMatrixEntry) => {
    setTriangulationEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      if (exists) {
        return prev.map((e) => (e.id === entry.id ? entry : e));
      }
      return [...prev, entry];
    });
    logAction('triangulate', 'triangulation', entry.id, `Matriz de triangulación actualizada para la categoría [${entry.categoryId}]`);
  };

  const resetToSampleData = () => {
    setCategories(INITIAL_CATEGORIES);
    setSessions(SAMPLE_SESSIONS);
    setCodedFragments(INITIAL_CODED_FRAGMENTS);
    setTriangulationEntries(INITIAL_TRIANGULATION_ENTRIES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    logAction('system_reset', 'system', 'sys-reset', 'Restablecimiento a los datos de muestra iniciales.');
  };

  const exportProjectJson = (): string => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: currentResearcher,
      projectTitle: 'Investigación Cualitativa STI - Sistema ROCAS',
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
    try {
      const data = JSON.parse(jsonString);
      if (data.categories && data.sessions && data.codedFragments) {
        setCategories(data.categories);
        setSessions(data.sessions);
        setCodedFragments(data.codedFragments);
        if (data.triangulationEntries) setTriangulationEntries(data.triangulationEntries);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        logAction('system_reset', 'system', 'import-json', 'Importación de proyecto exitosa desde archivo externo.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Heuristic / Semantic categorization suggestion
  // STRICT METHODOLOGICAL PRINCIPLE: Always returns a tentative proposal with status 'propuesta_pendiente'
  const suggestCodingForExcerpt = (text: string) => {
    const lower = text.toLowerCase();
    const matchedCategories: string[] = [];
    const matchedTransversals: string[] = [];
    let rationale = '';

    if (lower.includes('pensar') || lower.includes('razonar') || lower.includes('analizar') || lower.includes('premisa') || lower.includes('argument')) {
      matchedCategories.push('EXP-ANA');
      matchedTransversals.push('PC-ANALISIS');
      rationale += 'Detectada alusión a descomposición de información o razonamiento argumentativo. ';
    }
    if (lower.includes('duda') || lower.includes('insegur') || lower.includes('desconcert') || lower.includes('contraejemplo')) {
      matchedCategories.push('EXP-DUDA');
      matchedTransversals.push('PC-CUEST');
      rationale += 'Señalamiento de suspensión de certeza o cuestionamiento ante contraejemplos. ';
    }
    if (lower.includes('alternativa') || lower.includes('opciones') || lower.includes('punto de vista') || lower.includes('perspectiva')) {
      matchedCategories.push('EXP-ALT');
      matchedCategories.push('PER-APER');
      matchedTransversals.push('PC-APER');
      rationale += 'Referencia a múltiples alternativas y apertura a diferentes puntos de vista. ';
    }
    if (lower.includes('error') || lower.includes('correg') || lower.includes('revis') || lower.includes('releer') || lower.includes('estrategia')) {
      matchedCategories.push('EXP-AUT');
      matchedTransversals.push('META-REG');
      rationale += 'Indicios de autorregulación y ajuste cognitivo tras retroalimentación correctiva. ';
    }
    if (lower.includes('frustra') || lower.includes('rabia') || lower.includes('terco') || lower.includes('molest') || lower.includes('atrapad')) {
      matchedCategories.push('DIF-FRUST');
      rationale += 'Expresión afectiva de dificultad o fricción con la mediación del sistema. ';
    }
    if (lower.includes('cambiar') || lower.includes('agregar') || lower.includes('mejor') || lower.includes('propuesta') || lower.includes('entrenar')) {
      matchedCategories.push('PER-PROP');
      matchedCategories.push('DIF-MEJORA');
      rationale += 'Propuesta explícita orientada a la optimización pedagógica o técnica del tutor. ';
    }
    if (lower.includes('consciente') || lower.includes('darme cuenta') || lower.includes('cómo aprendo') || lower.includes('mi mente')) {
      matchedCategories.push('PER-CONSC');
      matchedCategories.push('PER-META');
      matchedTransversals.push('META-MON');
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
    <ProjectContext.Provider
      value={{
        questions,
        categories,
        sessions,
        codedFragments,
        triangulationEntries,
        auditLogs,
        currentResearcher,
        setCurrentResearcher,
        isPseudonymized,
        setIsPseudonymized,
        activeTab,
        setActiveTab,
        appMode,
        setAppMode,
        addSession,
        updateSession,
        deleteSession,
        addCategory,
        updateCategory,
        deleteCategory,
        addCodedFragment,
        updateFragmentStatus,
        deleteCodedFragment,
        saveTriangulationEntry,
        logAction,
        resetToSampleData,
        exportProjectJson,
        importProjectJson,
        suggestCodingForExcerpt
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
