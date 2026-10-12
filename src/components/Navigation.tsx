import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject, type ActiveTab } from '../context/ProjectContext';
import { useQuickActions } from './MobileQuickBar';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  ChevronRight,
  CircleHelp,
  X
} from 'lucide-react';

// Atajos esenciales de Administración: G y luego la inicial de la sección.
export const NAV_SHORTCUTS: { key: string; label: string; tab: ActiveTab | 'forms' }[] = [
  { key: 'p', label: 'Panel', tab: 'dashboard' },
  { key: 'a', label: 'Audios', tab: 'audios' },
  { key: 's', label: 'Sesiones', tab: 'intake' },
  { key: 'u', label: 'Usuarios', tab: 'users' },
  { key: 'f', label: 'Formularios', tab: 'forms' }
];
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const MOD_KEY_LABEL = isMac ? '⌘' : 'Ctrl';
const BREADCRUMB_LABELS: Record<ActiveTab, string> = {
  dashboard: 'Panel',
  audios: 'Audios',
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
  const quickActions = useQuickActions(userRole);
  const goToSection = (tab: ActiveTab | 'forms') => {
    if (tab === 'forms') {
      setAppMode('responder');
      return;
    }
    setAppMode('admin');
    setActiveTab(tab);
  };

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
    const resetPrefix = () => {
      shortcutPrefixRef.current = false;
      setShortcutPrefix(false);
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const isEditing = Boolean(target?.isContentEditable || target?.matches('input, textarea, select, [role="textbox"]'));
      // Con un diálogo del sitio abierto, el teclado es solo para el diálogo.
      if (isEditing || document.querySelector('[aria-modal="true"]')) {
        resetPrefix();
        return;
      }

      if (event.key === 'Escape') {
        setShortcutsOpen(false);
        resetPrefix();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === '?') {
        event.preventDefault();
        setShortcutsOpen((open) => !open);
        resetPrefix();
        return;
      }

      if (event.key === '/') {
        const search = document.querySelector<HTMLInputElement>('main input[type="search"]');
        if (search) {
          event.preventDefault();
          search.focus();
          search.select();
        }
        return;
      }

      if (userRole !== 'admin') return;
      const key = event.key.toLowerCase();
      if (!shortcutPrefixRef.current) {
        if (key !== 'g') return;
        shortcutPrefixRef.current = true;
        setShortcutPrefix(true);
        if (prefixTimer.current) clearTimeout(prefixTimer.current);
        prefixTimer.current = setTimeout(resetPrefix, 1600);
        return;
      }
      const shortcut = NAV_SHORTCUTS.find((item) => item.key === key);
      resetPrefix();
      if (!shortcut) return;
      event.preventDefault();
      setShortcutsOpen(false);
      goToSection(shortcut.tab);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveTab, setAppMode, userRole]);

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
          <div className="workspace-brand-mark h-10 rounded-xl bg-emerald-900 px-3 flex items-center shadow-xs"><img src="/simectblanco.png" alt="SIMECT" className="h-6 w-auto" /></div>
          <div>
            <div className="flex items-center gap-2">
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
                onClick={() => { setAppMode('admin'); if (activeTab === 'intake') setActiveTab('dashboard'); }}
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
            aria-label={shortcutsOpen ? 'Ocultar atajos' : 'Mostrar atajos'}
            title="Atajos (?)"
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
            <div><h2>Atajos</h2><p className="shortcuts-keys-only">Presiona <kbd>Esc</kbd> para cerrar</p></div>
            <button type="button" onClick={() => setShortcutsOpen(false)} aria-label="Cerrar atajos"><X aria-hidden="true" /></button>
          </div>
          <div className="shortcuts-touch">
            <h3 className="shortcuts-group-title">Accesos rápidos</h3>
            <div className="shortcuts-touch-grid">
              {quickActions.map(({ id, label, icon: Icon, active, onClick }) => (
                <button key={id} type="button" aria-current={active ? 'page' : undefined} onClick={() => { setShortcutsOpen(false); onClick(); }}>
                  <Icon aria-hidden="true" /><span>{label}</span>
                </button>
              ))}
            </div>
            <p className="shortcuts-hint">También los tienes siempre en la barra de abajo de la pantalla.</p>
          </div>
          <div className="shortcuts-keys">
          {user.role === 'admin' && (
            <><h3 className="shortcuts-group-title">Ir a</h3><p className="shortcuts-instructions">Pulsa <kbd>G</kbd> y después la inicial de la sección.</p><dl className="shortcuts-list">
              {NAV_SHORTCUTS.map((item) => <div key={item.key}><dt>{item.label}</dt><dd><kbd>G</kbd><kbd>{item.key.toUpperCase()}</kbd></dd></div>)}
            </dl></>
          )}
          <h3 className="shortcuts-group-title">En los formularios</h3>
          <dl className="shortcuts-list">
            <div><dt>Siguiente pregunta (o enviar en la revisión)</dt><dd><kbd>{MOD_KEY_LABEL}</kbd><kbd>Enter</kbd></dd></div>
            <div><dt>Pregunta anterior</dt><dd><kbd>{MOD_KEY_LABEL}</kbd><kbd>⇧</kbd><kbd>Enter</kbd></dd></div>
          </dl>
          <h3 className="shortcuts-group-title">General</h3>
          <dl className="shortcuts-list">
            {user.role === 'admin' && <div><dt>Buscar en el panel</dt><dd><kbd>/</kbd></dd></div>}
            <div><dt>Mostrar u ocultar esta ayuda</dt><dd><kbd>?</kbd></dd></div>
            <div><dt>Cerrar ventanas y ayudas</dt><dd><kbd>Esc</kbd></dd></div>
          </dl>
          <p className="shortcuts-hint">Los atajos con <kbd>{MOD_KEY_LABEL}</kbd> funcionan también mientras escribes; los demás, fuera de los campos de texto.</p>
          </div>
      </section>
      {shortcutPrefix && <span className="shortcut-prefix-status" role="status" aria-live="polite">G… elige: P Panel · A Audios · S Sesiones · U Usuarios · F Formularios</span>}
    </header>
  );
};
