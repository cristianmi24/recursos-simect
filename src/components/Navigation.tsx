import React from 'react';
import { useProject, ActiveTab } from '../context/ProjectContext';
import {
  ClipboardList,
  FolderTree,
  Tag,
  GitCompare,
  FileText,
  ShieldCheck,
  BookOpen,
  UserCheck,
  Eye,
  EyeOff,
  Send,
  Lock,
  ArrowRight,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    appMode,
    setAppMode,
    sessions,
    codedFragments,
    categories,
    triangulationEntries,
    currentResearcher,
    setCurrentResearcher,
    isPseudonymized,
    setIsPseudonymized
  } = useProject();

  const researchersList = [
    'Dra. Elena Restrepo (Investigadora Principal - Metodóloga)',
    'Dr. Fernando Arbeláez (Especialista en Triangulación y GF)',
    'Lic. Carlos Mejía (Observador de Campo y Entrevistador)',
    'Equipo Interdisciplinario ROCAS'
  ];

  const pendingProposalsCount = codedFragments.filter(
    (f) => f.status === 'propuesta_pendiente'
  ).length;

  const adminTabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'deliverables',
      label: 'Dossier de Entregables (1 al 8)',
      icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
      badge: '8 Docs'
    },
    {
      id: 'categories',
      label: 'Matriz de Categorías',
      icon: <FolderTree className="w-4 h-4 text-emerald-600" />,
      badge: categories.length
    },
    {
      id: 'coding',
      label: 'Codificación Cualitativa',
      icon: <Tag className="w-4 h-4 text-blue-600" />,
      badge: pendingProposalsCount > 0 ? `${pendingProposalsCount} pend.` : codedFragments.length
    },
    {
      id: 'triangulation',
      label: 'Matriz de Triangulación',
      icon: <GitCompare className="w-4 h-4 text-purple-600" />,
      badge: triangulationEntries.length
    },
    {
      id: 'reports',
      label: 'Reportes Analíticos',
      icon: <FileText className="w-4 h-4 text-amber-600" />,
      badge: '8 Rep.'
    },
    {
      id: 'intake',
      label: 'Catálogo de Sesiones',
      icon: <ClipboardList className="w-4 h-4 text-slate-600" />,
      badge: sessions.length
    },
    {
      id: 'audit',
      label: 'Trazabilidad y Exportación',
      icon: <ShieldCheck className="w-4 h-4 text-slate-600" />
    }
  ];

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs">
      {/* Top Academic Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black tracking-tight text-sm shadow-xs">
            ROCAS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                SISTEMA ROCAS
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Gestión y Análisis Cualitativo STI
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Investigación Educativa: Experiencias, Percepciones y Dificultades con el Sistema Tutor Inteligente
            </p>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => {
                setAppMode('responder');
                setActiveTab('intake');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                appMode === 'responder'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Entregar Respuestas</span>
            </button>

            <button
              onClick={() => {
                setAppMode('admin');
                if (activeTab === 'intake') {
                  setActiveTab('deliverables');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                appMode === 'admin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>2. Módulo Admin y Entregables</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  appMode === 'admin'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-indigo-100 text-indigo-700 font-bold'
                }`}
              >
                1–8
              </span>
            </button>
          </div>
        </div>

        {/* Security & Researcher Context */}
        <div className="flex items-center gap-2.5 text-xs">
          <button
            onClick={() => setIsPseudonymized(!isPseudonymized)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isPseudonymized
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
            title="Activar / Desactivar máscara de seudonimización ética"
          >
            {isPseudonymized ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Seudonimización: <strong>ACTIVA</strong></span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Seudonimización: <strong>INACTIVA</strong></span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={currentResearcher}
              onChange={(e) => setCurrentResearcher(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer text-xs max-w-[190px] truncate font-medium text-slate-800"
            >
              {researchersList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Admin Tabs Bar (Only shown in Admin Mode) */}
      {appMode === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto bg-slate-50/70 border-t border-slate-100">
          <nav className="flex space-x-1 py-1.5" aria-label="Admin Tabs">
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 ring-1 ring-slate-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-800'
                          : tab.id === 'coding' && pendingProposalsCount > 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
