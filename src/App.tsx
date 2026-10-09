/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { AuthProvider, type AuthUser, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Navigation, WorkspaceBreadcrumbs } from './components/Navigation';
import { NotFoundPage } from './components/NotFoundPage';
import { DataEntryView } from './components/DataEntryModule/DataEntryView';
import { InstrumentList } from './components/InstrumentsModule/InstrumentList';
import { CategoryMatrixView } from './components/CategoriesModule/CategoryMatrixView';
import { CodingWorkspaceView } from './components/CodingWorkspace/CodingWorkspaceView';
import { TriangulationView } from './components/TriangulationModule/TriangulationView';
import { ReportsView } from './components/ReportsModule/ReportsView';
import { AuditExportView } from './components/AuditExportModule/AuditExportView';
import { DeliverablesView } from './components/DeliverablesModule/DeliverablesView';
import { TutorDataEntryFlow } from './components/DataEntryModule/TutorDataEntryFlow';
import { LoadingScreen } from './components/LoadingScreen';

const MainContent: React.FC<{ role: AuthUser['role'] }> = ({ role }) => {
  const { appMode, activeTab, dataStatus, dataError, persistenceError, sessionsTruncated, retryData } = useProject();

  if (dataStatus === 'loading') {
    return <LoadingScreen message="Cargando tus datos de SIMECT…" />;
  }

  if (dataStatus === 'error') {
    return <main className="app-content flex-1 max-w-7xl w-full mx-auto px-4 py-8"><section className="connection-card connection-card--offline" role="alert"><span className="connection-offline-icon" aria-hidden="true"><CloudOff /></span><div className="connection-card-copy"><p className="connection-eyebrow">Conexión interrumpida</p><h1>No pudimos cargar tus datos</h1><p>{dataError} No mostraremos una copia local que pueda estar desactualizada.</p><button onClick={retryData} className="connection-retry"><RefreshCw aria-hidden="true" /> Volver a intentar</button></div></section></main>;
  }

  const syncNotice = persistenceError && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert"><strong>No se pudieron confirmar los cambios:</strong> {persistenceError} No recargues antes de exportar cualquier cambio aún no sincronizado.</div>;
  const limitNotice = sessionsTruncated && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">La vista muestra hasta 1.000 sesiones; hay más formularios disponibles. Los informes y exportaciones todavía no incluyen esos registros adicionales.</div>;

  // Los tutores usan el asistente paso a paso; Administración conserva su vista de captura.
  if (role === 'tutor') {
    return (
      <main className="app-content flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {syncNotice}{limitNotice}<TutorDataEntryFlow />
      </main>
    );
  }

  if (appMode === 'responder') {
    return (
      <main className="app-content flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {syncNotice}{limitNotice}<DataEntryView />
      </main>
    );
  }

  return (
    <main className="app-content flex-1 max-w-7xl w-full mx-auto px-4 py-8">
      {syncNotice}{limitNotice}
      {activeTab === 'deliverables' && <DeliverablesView />}
      {activeTab === 'categories' && <CategoryMatrixView />}
      {activeTab === 'coding' && <CodingWorkspaceView />}
      {activeTab === 'triangulation' && <TriangulationView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'intake' && <InstrumentList />}
      {activeTab === 'audit' && <AuditExportView />}
    </main>
  );
};

const Workspace: React.FC<{ user: AuthUser }> = ({ user }) => {
  return (
    <div className="workspace-shell min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navigation />
      {user.demo && <div className="demo-mode-banner" role="status"><strong>Modo de revisión local</strong><span>Los cambios son temporales, se mantienen solo en esta sesión y no se envían a Neon.</span></div>}
      <WorkspaceBreadcrumbs />
      <MainContent role={user.role} />
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-700">SIMECT — Metodología Cualitativa del STI</span>{' '}
            · Gestión, Codificación y Triangulación de Instrumentos Educativos
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Acceso por roles · Salvaguardas Éticas · Separación de Dato Bruto vs. Interpretación
          </div>
        </div>
      </footer>
    </div>
  );
};

const Application: React.FC = () => {
  const { user, status, configured } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen message="Comprobando el acceso seguro…" />;
  }

  if (!user) return <LoginPage configured={configured} offline={status === 'offline'} />;

  return (
    <ProjectProvider key={user.id} user={user} initialMode={user.role === 'admin' ? 'admin' : 'responder'}>
      <Workspace user={user} />
    </ProjectProvider>
  );
};

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname !== '/' && pathname !== '/index.html') return <NotFoundPage />;

  return (
    <AuthProvider>
      <Application />
    </AuthProvider>
  );
}
