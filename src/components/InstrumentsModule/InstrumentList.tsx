import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { InstrumentType, ResearchSession } from '../../types';
import { SessionModal } from './SessionModal';
import { SessionDetailModal } from './SessionDetailModal';
import {
  ClipboardList,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  School,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const InstrumentList: React.FC = () => {
  const { sessions, deleteSession, isPseudonymized, addCodedFragment, setActiveTab } =
    useProject();

  const [filterType, setFilterType] = useState<InstrumentType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('ALL');

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newModalType, setNewModalType] = useState<InstrumentType>('OBS');
  const [editingSession, setEditingSession] = useState<ResearchSession | null>(null);
  const [viewingSession, setViewingSession] = useState<ResearchSession | null>(null);

  const institutions = Array.from(new Set(sessions.map((s) => s.institution)));

  const filteredSessions = sessions.filter((s) => {
    const matchesType = filterType === 'ALL' || s.instrumentType === filterType;
    const matchesInst =
      selectedInstitution === 'ALL' || s.institution === selectedInstitution;
    const matchesSearch =
      s.instrumentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentPseudonym &&
        s.studentPseudonym.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stiVersionOrTask.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesInst && matchesSearch;
  });

  const obsCount = sessions.filter((s) => s.instrumentType === 'OBS').length;
  const gfCount = sessions.filter((s) => s.instrumentType === 'GF').length;
  const eCount = sessions.filter((s) => s.instrumentType === 'E').length;

  const handleOpenNew = (type: InstrumentType) => {
    setNewModalType(type);
    setEditingSession(null);
    setIsNewModalOpen(true);
  };

  const handleEdit = (session: ResearchSession) => {
    setEditingSession(session);
    setNewModalType(session.instrumentType);
    setIsNewModalOpen(true);
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`¿Confirma eliminar la sesión ${code}? Esta acción es irreversible.`)) {
      deleteSession(id);
    }
  };

  const handleCodeFragmentDirectly = (
    sessionId: string,
    sessionCode: string,
    instrumentType: ResearchSession['instrumentType'],
    questionId: string,
    excerptText: string,
    participantPseudonym?: string
  ) => {
    addCodedFragment({
      sessionId,
      sessionCode,
      instrumentType,
      questionId,
      participantPseudonym,
      excerptText,
      categoryIds: ['EXP-GEN'],
      justification: 'Fragmento enviado desde el registro del instrumento para codificación cualitativa.',
      status: 'propuesta_pendiente',
      researcherName: 'Investigador Asignado'
    });
    alert(`Fragmento de ${sessionCode} (${questionId}) transferido exitosamente a la cola de codificación.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Inventario de Sesiones Empíricas</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Catálogo General de Sesiones e Instrumentos</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Base de datos de sesiones de campo registradas en los 3 instrumentos: Observación (OBS1-8),
              Grupo Focal (GF1-10) y Entrevistas (E1-5).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenNew('OBS')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Observación</span>
            </button>
            <button
              onClick={() => handleOpenNew('GF')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Grupo Focal</span>
            </button>
            <button
              onClick={() => handleOpenNew('E')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Entrevista</span>
            </button>
          </div>
        </div>

        {/* 3 Instruments Quick Stats - Light Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
                1. Observación Estructurada
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {obsCount}{' '}
                <span className="text-xs font-semibold text-slate-500">sesiones (OBS1-8)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-xs">
              OBS
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                2. Grupo Focal
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {gfCount}{' '}
                <span className="text-xs font-semibold text-slate-500">sesiones (GF1-10)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
              GF
            </div>
          </div>

          <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                3. Entrevista Semiestructurada
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {eCount}{' '}
                <span className="text-xs font-semibold text-slate-500">sesiones (E1-5)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs">
              E
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, seudónimo o tarea..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white outline-none"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            {(['ALL', 'OBS', 'GF', 'E'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                  filterType === t
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'ALL' ? 'Todos' : t}
              </button>
            ))}
          </div>

          {/* Institution filter */}
          {institutions.length > 1 && (
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none font-medium"
            >
              <option value="ALL">Todas las instituciones</option>
              {institutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-slate-500 text-[11px]">
          Mostrando <strong>{filteredSessions.length}</strong> de {sessions.length} registros
        </div>
      </div>

      {/* Session Cards Grid - Light Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map((session) => {
          const typeBadgeColor =
            session.instrumentType === 'OBS'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : session.instrumentType === 'GF'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-teal-50 text-teal-800 border-teal-200';

          const indicatorsCount =
            session.instrumentType === 'OBS'
              ? Object.keys(session.observationRecords || {}).length
              : session.instrumentType === 'GF'
              ? Object.keys(session.focusGroupRecords || {}).length
              : Object.keys(session.interviewRecords || {}).length;

          const totalExpected =
            session.instrumentType === 'OBS' ? 8 : session.instrumentType === 'GF' ? 10 : 5;

          const studentDisplay = isPseudonymized
            ? session.studentPseudonym || 'EST-XX'
            : session.studentPseudonym || 'Confidencial';

          return (
            <div
              key={session.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-sm"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeBadgeColor}`}
                  >
                    {session.instrumentType === 'OBS'
                      ? 'OBS (8 Ind.)'
                      : session.instrumentType === 'GF'
                      ? 'GF (10 Preg.)'
                      : 'E (5 Preg.)'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {session.instrumentCode}
                  </span>
                </div>

                {/* STI Task Title */}
                <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-1">
                  {session.stiVersionOrTask}
                </h3>

                {/* Metadata Details */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{session.institution}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {session.date} • {session.grade} • Sesión #{session.sessionNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-900 font-semibold">
                      {session.instrumentType === 'GF'
                        ? `${session.participantPseudonyms?.length || 0} estudiantes (${session.participantPseudonyms?.slice(0, 3).join(', ')}${(session.participantPseudonyms?.length || 0) > 3 ? '...' : ''})`
                        : studentDisplay}
                    </span>
                  </div>
                </div>

                {/* Indicator completion badge */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Completitud:</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {indicatorsCount} de {totalExpected} ítems registrados
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingSession(session)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-2xs"
                  title="Ver datos brutos y notas de campo"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ver registro</span>
                </button>

                <button
                  onClick={() => handleEdit(session)}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
                  title="Editar sesión"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(session.id, session.instrumentCode)}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors"
                  title="Eliminar sesión"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <ClipboardList className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold">No se encontraron sesiones con los filtros seleccionados.</p>
            <p className="text-xs text-slate-400 mt-1">
              Haga clic en «Nueva Observación», «Nuevo Grupo Focal» o «Nueva Entrevista» para agregar un registro.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isNewModalOpen && (
        <SessionModal
          initialType={newModalType}
          existingSession={editingSession || undefined}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingSession(null);
          }}
        />
      )}

      {viewingSession && (
        <SessionDetailModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
          onCodeFragmentDirectly={handleCodeFragmentDirectly}
        />
      )}
    </div>
  );
};
