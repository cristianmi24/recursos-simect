import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject, type ActiveTab } from '../context/ProjectContext';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  ChevronRight,
  CircleHelp,
  X
} from 'lucide-react';

const SHORTCUT_TABS: ActiveTab[] = ['deliverables', 'categories', 'coding', 'triangulation', 'reports', 'intake', 'audit', 'users'];
const BREADCRUMB_LABELS: Record<ActiveTab, string> = {
  deliverables: 'Entregables',
  categories: 'Categorías',
  coding: 'Codificación',
  triangulation: 'Triangulación',
  reports: 'Reportes',
  intake: 'Sesiones',
  audit: 'Trazabilidad y exportación',
  users: 'Usuarios'
};

export const WorkspaceBreadcrumbs: React.FC = () => {
  const { user } = useAuth();
  const { activeTab, appMode } = useProject();
  if (!user) return null;

  const isForms = user.role === 'tutor' || appMode === 'responder';
  const parentLabel = isForms ? (user.role === 'tutor' ? 'Área del tutor' : 'Espacio de trabajo') : 'Administración';
  const currentLabel = isForms ? 'Formularios' : BREADCRUMB_LABELS[activeTab];

  return (
    <nav className="workspace-breadcrumbs" aria-label="Migas de pan">
      <ol>
        <li><span>{parentLabel}</span></li>
        <li className="workspace-breadcrumb-current" aria-current="page">
          <ChevronRight aria-hidden="true" />
          <span>{currentLabel}</span>
        </li>
      </ol>
    </nav>
  );
};

export const Navigation: React.FC<{ onOpenSidebar?: () => void; sidebarOpen?: boolean }> = ({ onOpenSidebar, sidebarOpen = false }) => {
  const { user, logout } = useAuth();
  const {
    activeTab,
    setActiveTab,
    appMode,
    setAppMode,
  } = useProject();
  const [logoutError, setLogoutError] = useState('');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutPrefix, setShortcutPrefix] = useState(false);
  const shortcutPrefixRef = useRef(false);
  const prefixTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const userRole = user?.role ?? 'tutor';
  const headerRef = useRef<HTMLElement>(null);

  // La altura de la cabecera fija dónde se ancla el menú lateral.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => document.documentElement.style.setProperty('--app-header-h', `${header.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = Boolean(target?.isContentEditable || target?.matches('input, textarea, select, [role="textbox"]'));
      if (isEditing) {
        shortcutPrefixRef.current = false;
        setShortcutPrefix(false);
        if (prefixTimer.current) clearTimeout(prefixTimer.current);
        return;
      }

      if (event.key === 'Escape') {
        setShortcutsOpen(false);
        shortcutPrefixRef.current = false;
        setShortcutPrefix(false);
        if (prefixTimer.current) clearTimeout(prefixTimer.current);
        return;
      }

      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setShortcutsOpen((open) => !open);
        shortcutPrefixRef.current = false;
        setShortcutPrefix(false);
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey || userRole !== 'admin') return;
      if (event.key.toLowerCase() === 'g') {
        shortcutPrefixRef.current = true;
        setShortcutPrefix(true);
        if (prefixTimer.current) clearTimeout(prefixTimer.current);
        prefixTimer.current = setTimeout(() => {
          shortcutPrefixRef.current = false;
          setShortcutPrefix(false);
          prefixTimer.current = undefined;
        }, 1600);
        return;
      }

      if (!shortcutPrefixRef.current) return;
      const shortcutKey = event.key.toLowerCase();
      const tabIndex = Number(shortcutKey) - 1;
      if (Number.isInteger(tabIndex) && tabIndex >= 0 && tabIndex < SHORTCUT_TABS.length) {
        event.preventDefault();
        setAppMode('admin');
        setActiveTab(SHORTCUT_TABS[tabIndex]);
      } else if (shortcutKey === 'f') {
        event.preventDefault();
        setAppMode('responder');
        setActiveTab('intake');
      } else if (shortcutKey === 'a') {
        event.preventDefault();
        setAppMode('admin');
        if (activeTab === 'intake') setActiveTab('deliverables');
      }
      shortcutPrefixRef.current = false;
      setShortcutPrefix(false);
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
    };
  }, [activeTab, setActiveTab, setAppMode, userRole]);

  if (!user) return null;

  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';

  const handleLogout = async () => {
    setLogoutError('');
    const closed = await logout();
    if (!closed) setLogoutError('No se pudo confirmar el cierre con el servidor. Inténtalo de nuevo.');
  };

  return (
    <header ref={headerRef} className={`app-navigation ${user.role === 'tutor' ? 'app-navigation--tutor' : ''} bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs`}>
      <div className="w-full px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button type="button" className="side-hamburger" onClick={onOpenSidebar} aria-label="Abrir menú de administración" aria-expanded={sidebarOpen} aria-controls="admin-sidebar">
              <Menu aria-hidden="true" />
            </button>
          )}
          <div className="workspace-brand-mark w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-black tracking-tight text-sm shadow-xs">S</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">SIMECT</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">Gestión y Análisis Cualitativo STI</span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Investigación Educativa: Experiencias, Percepciones y Dificultades con el Sistema Tutor Inteligente</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.role === 'admin' ? (
            <div className="mode-switch" aria-label="Modo de administración">
              <button
                type="button"
                aria-pressed={appMode === 'responder'}
                onClick={() => { setAppMode('responder'); setActiveTab('intake'); }}
                className="mode-switch-option mode-switch-option--forms"
              >
                <Send className="w-3.5 h-3.5" /><span>Formularios</span>
              </button>
              <button
                type="button"
                aria-pressed={appMode === 'admin'}
                onClick={() => { setAppMode('admin'); if (activeTab === 'intake') setActiveTab('deliverables'); }}
                className="mode-switch-option mode-switch-option--admin"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /><span>Administración</span>
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800">
              <Send className="w-3.5 h-3.5" /> Módulo tutor
            </span>
          )}

          <button
            type="button"
            className="shortcuts-trigger"
            onClick={() => setShortcutsOpen((open) => !open)}
            aria-expanded={shortcutsOpen}
            aria-controls="workspace-shortcuts"
            aria-label={shortcutsOpen ? 'Ocultar atajos de teclado' : 'Mostrar atajos de teclado'}
            title="Atajos de teclado (?)"
          >
            <CircleHelp aria-hidden="true" />
            <span className="hidden sm:inline">Atajos</span>
            <kbd aria-hidden="true">?</kbd>
          </button>

          <div className={`user-chip ${user.role === 'admin' ? 'user-chip--admin' : ''}`} title={user.email}>
            <span className="user-chip-avatar" aria-hidden="true">{initials}</span>
            <span className="user-chip-name">{user.name}</span>
            <span className="user-chip-role">{user.role === 'admin' ? 'Admin' : 'Tutor'}</span>
          </div>
          <button onClick={() => void handleLogout()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" title="Cerrar sesión">
            <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {logoutError && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-xs text-rose-800">{logoutError}</div>}

      <section id="workspace-shortcuts" className="shortcuts-popover" aria-label="Atajos de teclado" hidden={!shortcutsOpen}>
          <div className="shortcuts-popover-heading">
            <div><h2>Atajos de teclado</h2><p>Presiona <kbd>Esc</kbd> para cerrar</p></div>
            <button type="button" onClick={() => setShortcutsOpen(false)} aria-label="Cerrar atajos"><X aria-hidden="true" /></button>
          </div>
          {user.role === 'admin' ? (
            <><p className="shortcuts-instructions">Pulsa <kbd>G</kbd> y después la tecla indicada.</p><dl className="shortcuts-list">
              {SHORTCUT_TABS.map((tab, index) => <div key={tab}><dt>{BREADCRUMB_LABELS[tab]}</dt><dd><kbd>G</kbd><kbd>{index + 1}</kbd></dd></div>)}
              <div><dt>Formularios</dt><dd><kbd>G</kbd><kbd>F</kbd></dd></div>
              <div><dt>Administración</dt><dd><kbd>G</kbd><kbd>A</kbd></dd></div>
            </dl></>
          ) : (
            <p className="shortcuts-tutor-note">Los atajos de navegación están disponibles para el área de administración.</p>
          )}
          <p className="shortcuts-hint">Escribe <kbd>?</kbd> en cualquier momento para abrir o cerrar esta ayuda.</p>
      </section>
      {shortcutPrefix && <span className="shortcut-prefix-status" role="status" aria-live="polite">Atajo: elige una opción…</span>}
    </header>
  );
};
