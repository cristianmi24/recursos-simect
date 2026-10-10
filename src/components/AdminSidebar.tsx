import React, { useEffect, useState } from 'react';
import { useProject, type ActiveTab } from '../context/ProjectContext';
import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileText,
  FolderTree,
  GitCompare,
  ShieldCheck,
  Tag,
  Users,
  X
} from 'lucide-react';

type SidebarItem = { id: ActiveTab; label: string; hint: string; tone: string; icon: React.ReactNode; badge?: number; alert?: boolean };

const COLLAPSED_KEY = 'simect.sidebar.collapsed';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export const AdminSidebar: React.FC<{ mobileOpen: boolean; onCloseMobile: () => void }> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, sessions, codedFragments, categories, triangulationEntries } = useProject();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // Preferencia opcional: si el navegador bloquea el almacenamiento, el menú sigue funcionando.
    }
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseMobile(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  const pending = codedFragments.filter((fragment) => fragment.status === 'propuesta_pendiente').length;
  const groups: { title: string; items: SidebarItem[] }[] = [
    {
      title: 'Documentación',
      items: [{ id: 'deliverables', label: 'Entregables', hint: 'Dossier 1 al 8', tone: 'sage', icon: <BookOpen aria-hidden="true" />, badge: 8 }]
    },
    {
      title: 'Análisis',
      items: [
        { id: 'categories', label: 'Categorías', hint: 'Matriz analítica', tone: 'teal', icon: <FolderTree aria-hidden="true" />, badge: categories.length },
        { id: 'coding', label: 'Codificación', hint: pending > 0 ? `${pending} por revisar` : 'Análisis cualitativo', tone: 'violet', icon: <Tag aria-hidden="true" />, badge: pending > 0 ? pending : codedFragments.length, alert: pending > 0 },
        { id: 'triangulation', label: 'Triangulación', hint: 'Matriz cruzada', tone: 'plum', icon: <GitCompare aria-hidden="true" />, badge: triangulationEntries.length },
        { id: 'reports', label: 'Reportes', hint: 'Informes analíticos', tone: 'ochre', icon: <FileText aria-hidden="true" />, badge: 8 }
      ]
    },
    {
      title: 'Datos',
      items: [
        { id: 'intake', label: 'Sesiones', hint: 'Catálogo de registros', tone: 'clay', icon: <ClipboardList aria-hidden="true" />, badge: sessions.length },
        { id: 'audit', label: 'Trazabilidad', hint: 'Auditoría y exportación', tone: 'steel', icon: <ShieldCheck aria-hidden="true" /> }
      ]
    },
    {
      title: 'Accesos',
      items: [{ id: 'users', label: 'Usuarios', hint: 'Cuentas de tutores', tone: 'rose', icon: <Users aria-hidden="true" /> }]
    }
  ];

  let shortcutIndex = 0;

  return (
    <>
      <div className={`side-backdrop ${mobileOpen ? 'is-open' : ''}`} onClick={onCloseMobile} aria-hidden="true" />
      <aside id="admin-sidebar" className={`side-nav ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`} aria-label="Menú de administración">
        <div className="side-nav-inner">
        <div className="side-nav-mobile-head">
          <span>Administración</span>
          <button type="button" onClick={onCloseMobile} aria-label="Cerrar menú"><X aria-hidden="true" /></button>
        </div>

        <div className="side-collapse-row">
          <button
            type="button"
            className="side-collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-controls="admin-sidebar"
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            title={collapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {collapsed ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
          </button>
        </div>

        <nav className="side-nav-list">
          {groups.map((group) => (
            <div key={group.title} className="side-group">
              <p className="side-group-title"><span>{group.title}</span></p>
              <ul>
                {group.items.map((item) => {
                  shortcutIndex += 1;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`side-item tone-${item.tone}`}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => { setActiveTab(item.id); onCloseMobile(); }}
                        title={collapsed ? `${item.label} · ${item.hint}` : `Atajo: G ${shortcutIndex}`}
                      >
                        <span className="side-item-icon">
                          {item.icon}
                          {item.badge !== undefined && <span className={`side-item-dot ${item.alert ? 'is-alert' : ''}`} aria-hidden="true">{item.badge}</span>}
                        </span>
                        <span className="side-item-text">
                          <span className="side-item-label">{item.label}</span>
                          <span className="side-item-hint">{item.hint}</span>
                        </span>
                        {item.badge !== undefined && (
                          <span className={`side-item-badge ${item.alert ? 'is-alert' : ''}`} aria-label={item.alert ? `${item.badge} propuestas pendientes` : `${item.badge} elementos`}>{item.badge}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        </div>
      </aside>
    </>
  );
};
