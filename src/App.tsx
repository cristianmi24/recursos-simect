/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navigation } from './components/Navigation';
import { DataEntryView } from './components/DataEntryModule/DataEntryView';
import { InstrumentList } from './components/InstrumentsModule/InstrumentList';
import { CategoryMatrixView } from './components/CategoriesModule/CategoryMatrixView';
import { CodingWorkspaceView } from './components/CodingWorkspace/CodingWorkspaceView';
import { TriangulationView } from './components/TriangulationModule/TriangulationView';
import { ReportsView } from './components/ReportsModule/ReportsView';
import { AuditExportView } from './components/AuditExportModule/AuditExportView';
import { DeliverablesView } from './components/DeliverablesModule/DeliverablesView';

const MainContent: React.FC = () => {
  const { appMode, activeTab } = useProject();

  // Mode 1: Primary Data Entry & Delivery Module (First view!)
  if (appMode === 'responder') {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <DataEntryView />
      </main>
    );
  }

  // Mode 2: Admin & Deliverables Workstation
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
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

export default function App() {
  return (
    <ProjectProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
        <Navigation />
        <MainContent />

        {/* Academic Footer - Clean Light Theme */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-700">
                SISTEMA ROCAS — Metodología Cualitativa del STI
              </span>{' '}
              • Gestión, Codificación y Triangulación de Instrumentos Educativos
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Tema Claro • Salvaguardas Éticas • Separación de Dato Bruto vs. Interpretación
            </div>
          </div>
        </footer>
      </div>
    </ProjectProvider>
  );
}
