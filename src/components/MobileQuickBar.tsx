import React from 'react';
import { ClipboardList, Eye, Headphones, LayoutDashboard, Mic, Send, Users, UsersRound } from 'lucide-react';
import { useProject, type ActiveTab } from '../context/ProjectContext';
import { navigate, useSegments } from '../utils/router';
import type { AuthUser } from '../context/AuthContext';
import type { InstrumentType } from '../types';

// Atajos en pantalla para celular y tablet (vertical u horizontal): una barra fija abajo, en la zona del pulgar.
// Se oculta dentro de un formulario abierto, que ya tiene sus botones Anterior/Siguiente abajo.
export type QuickAction = { id: string; label: string; icon: React.ElementType; active: boolean; onClick: () => void };

// Accesos esenciales según el rol; los usan la barra inferior y el panel «Atajos» en pantallas táctiles.
export function useQuickActions(role: AuthUser['role']): QuickAction[] {
  const { appMode, setAppMode, activeTab, setActiveTab } = useProject();
  const inForms = role === 'tutor' || appMode === 'responder';

  const goTab = (tab: ActiveTab) => { setAppMode('admin'); setActiveTab(tab); };
  const newForm = (type: InstrumentType) => navigate(['formularios', 'nuevo', type]);

  return role === 'admin'
    ? [
        { id: 'panel', label: 'Panel', icon: LayoutDashboard, active: !inForms && activeTab === 'dashboard', onClick: () => goTab('dashboard') },
        { id: 'audios', label: 'Audios', icon: Headphones, active: !inForms && activeTab === 'audios', onClick: () => goTab('audios') },
        { id: 'sesiones', label: 'Sesiones', icon: ClipboardList, active: !inForms && activeTab === 'intake', onClick: () => goTab('intake') },
        { id: 'usuarios', label: 'Usuarios', icon: Users, active: !inForms && activeTab === 'users', onClick: () => goTab('users') },
        { id: 'formularios', label: 'Formularios', icon: Send, active: inForms, onClick: () => setAppMode('responder') }
      ]
    : [
        { id: 'OBS', label: 'Observación', icon: Eye, active: false, onClick: () => newForm('OBS') },
        { id: 'E', label: 'Entrevista', icon: Mic, active: false, onClick: () => newForm('E') },
        { id: 'GF', label: 'Grupo focal', icon: UsersRound, active: false, onClick: () => newForm('GF') },
        {
          id: 'historial', label: 'Mis envíos', icon: ClipboardList, active: false,
          onClick: () => {
            navigate(['formularios']);
            window.setTimeout(() => document.getElementById('tutor-history-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
          }
        }
      ];
}

export const MobileQuickBar: React.FC<{ role: AuthUser['role'] }> = ({ role }) => {
  const { appMode } = useProject();
  const segments = useSegments();
  const items = useQuickActions(role);
  const inForms = role === 'tutor' || appMode === 'responder';
  if (inForms && segments[0] === 'formularios' && segments[1]) return null;

  return (
    <>
      <div className="h-20 lg:hidden" aria-hidden="true" />
      <nav aria-label="Accesos rápidos" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map(({ id, label, icon: Icon, active, onClick }) => (
            <li key={id}>
              <button
                type="button"
                onClick={onClick}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-bold ${active ? 'text-emerald-800' : 'text-slate-600 active:bg-slate-100'}`}
              >
                <span className={`flex h-8 w-12 items-center justify-center rounded-full ${active ? 'bg-emerald-100' : ''}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="max-w-full truncate">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};
