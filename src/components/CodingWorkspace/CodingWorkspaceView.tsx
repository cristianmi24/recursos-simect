import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  CodedFragment,
  CodingStatus,
  InstrumentType
} from '../../types';
import {
  Tag,
  Plus,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  User,
  Quote,
  Layers,
  ArrowRight
} from 'lucide-react';

export const CodingWorkspaceView: React.FC = () => {
  const {
    codedFragments,
    categories,
    sessions,
    questions,
    addCodedFragment,
    updateFragmentStatus,
    deleteCodedFragment,
    suggestCodingForExcerpt,
    currentResearcher,
    isPseudonymized
  } = useProject();

  const [filterStatus, setFilterStatus] = useState<CodingStatus | 'ALL'>('ALL');
  const [filterInstrument, setFilterInstrument] = useState<InstrumentType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFragment, setEditingFragment] = useState<CodedFragment | null>(null);

  // New fragment form states
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || '');
  const [selectedQuestionId, setSelectedQuestionId] = useState('OBS1');
  const [excerptText, setExcerptText] = useState('');
  const [participantPseudonym, setParticipantPseudonym] = useState('EST-10B-04');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['EXP-GEN']);
  const [selectedTransversals, setSelectedTransversals] = useState<string[]>([]);
  const [justification, setJustification] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // AI Assistance Banner in form
  const [aiSuggestionState, setAiSuggestionState] = useState<{
    applied: boolean;
    confidence?: string;
    rationale?: string;
  }>({ applied: false });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const filteredFragments = codedFragments.filter((frag) => {
    const matchesStatus = filterStatus === 'ALL' || frag.status === filterStatus;
    const matchesInst = filterInstrument === 'ALL' || frag.instrumentType === filterInstrument;
    const matchesCat =
      filterCategory === 'ALL' ||
      frag.categoryIds.includes(filterCategory) ||
      (frag.transversalDimensionIds && frag.transversalDimensionIds.includes(filterCategory));
    const matchesSearch =
      frag.excerptText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frag.justification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frag.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (frag.participantPseudonym &&
        frag.participantPseudonym.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesInst && matchesCat && matchesSearch;
  });

  const countPending = codedFragments.filter((f) => f.status === 'propuesta_pendiente').length;
  const countAccepted = codedFragments.filter((f) => f.status === 'revisada_aceptada').length;
  const countModified = codedFragments.filter((f) => f.status === 'modificada').length;
  const countRejected = codedFragments.filter((f) => f.status === 'rechazada').length;

  const handleOpenAdd = () => {
    setEditingFragment(null);
    setExcerptText('');
    setJustification('');
    setReviewNotes('');
    setSelectedCategories(['EXP-GEN']);
    setSelectedTransversals([]);
    setAiSuggestionState({ applied: false });
    setIsAddModalOpen(true);
  };

  const handleOpenModify = (frag: CodedFragment) => {
    setEditingFragment(frag);
    setSelectedSessionId(frag.sessionId);
    setSelectedQuestionId(frag.questionId);
    setExcerptText(frag.excerptText);
    setParticipantPseudonym(frag.participantPseudonym || '');
    setSelectedCategories(frag.categoryIds);
    setSelectedTransversals(frag.transversalDimensionIds || []);
    setJustification(frag.justification);
    setReviewNotes(frag.reviewNotes || '');
    setAiSuggestionState({ applied: false });
    setIsAddModalOpen(true);
  };

  const handleAiSuggest = () => {
    if (!excerptText.trim()) {
      alert('Por favor ingrese o pegue el fragmento textual antes de solicitar la sugerencia.');
      return;
    }
    const suggestion = suggestCodingForExcerpt(excerptText);
    setSelectedCategories(suggestion.categoryIds);
    setSelectedTransversals(suggestion.transversalIds);
    setJustification(
      `[Propuesta asistida]: ${suggestion.rationale} Se somete a revisión del investigador según criterios del Codebook.`
    );
    setAiSuggestionState({
      applied: true,
      confidence: suggestion.confidence,
      rationale: suggestion.rationale
    });
  };

  const handleSaveFragment = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      alert('Debe asignar al menos una categoría al fragmento.');
      return;
    }

    const sess = sessions.find((s) => s.id === selectedSessionId);
    const sessionCode = sess?.instrumentCode || 'SES-DESCONOCIDA';
    const instrumentType = sess?.instrumentType || 'OBS';

    if (editingFragment) {
      updateFragmentStatus(
        editingFragment.id,
        'modificada',
        reviewNotes || `Modificado por ${currentResearcher}`,
        selectedCategories
      );
    } else {
      addCodedFragment({
        sessionId: selectedSessionId,
        sessionCode,
        instrumentType,
        questionId: selectedQuestionId,
        participantPseudonym: participantPseudonym.trim() || undefined,
        excerptText: excerptText.trim(),
        categoryIds: selectedCategories,
        transversalDimensionIds: selectedTransversals,
        justification: justification.trim(),
        status: aiSuggestionState.applied ? 'propuesta_pendiente' : 'revisada_aceptada',
        suggestedByAI: aiSuggestionState.applied,
        aiConfidence: aiSuggestionState.confidence,
        researcherName: currentResearcher
      });
    }

    setIsAddModalOpen(false);
  };

  const handleAcceptProposal = (fragId: string) => {
    updateFragmentStatus(
      fragId,
      'revisada_aceptada',
      `Validada y aceptada formalmente por ${currentResearcher} tras verificar criterios de inclusión.`
    );
  };

  const handleRejectProposal = (fragId: string) => {
    const reason = prompt('Indique el motivo del rechazo metodológico de esta propuesta:');
    if (reason !== null) {
      updateFragmentStatus(
        fragId,
        'rechazada',
        reason || 'Rechazada por no cumplir los criterios de inclusión de la categoría.'
      );
    }
  };

  const toggleCategorySelection = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const toggleTransversalSelection = (tId: string) => {
    setSelectedTransversals((prev) =>
      prev.includes(tId) ? prev.filter((t) => t !== tId) : [...prev, tId]
    );
  };

  const getStatusBadge = (status: CodingStatus) => {
    switch (status) {
      case 'propuesta_pendiente':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-300 text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Propuesta pendiente de revisión</span>
          </span>
        );
      case 'revisada_aceptada':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Revisada y aceptada</span>
          </span>
        );
      case 'modificada':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 border border-blue-300 text-blue-800">
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Modificada por investigador</span>
          </span>
        );
      case 'rechazada':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 line-through border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Rechazada</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Análisis Textual y Evidencias</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Espacio de Codificación Cualitativa y Arbitraje</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Asociación de fragmentos textuales y evidencias observacionales con los códigos del
              Codebook. Soporta multicodificación y dimensiones transversales. Las sugerencias
              asistidas se rotulan obligatoriamente como <em>«Propuestas pendientes de revisión»</em> hasta
              que un investigador humano las valida, ajusta o rechaza.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Codificar Nuevo Fragmento</span>
          </button>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={() => setFilterStatus('propuesta_pendiente')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'propuesta_pendiente'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider text-amber-800 block font-bold">
              Pendientes de Revisión
            </span>
            <div className="text-2xl font-black mt-0.5 text-amber-900">{countPending}</div>
          </button>

          <button
            onClick={() => setFilterStatus('revisada_aceptada')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'revisada_aceptada'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 block font-bold">
              Aceptadas y Validadas
            </span>
            <div className="text-2xl font-black mt-0.5 text-emerald-900">{countAccepted}</div>
          </button>

          <button
            onClick={() => setFilterStatus('modificada')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'modificada'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider text-blue-800 block font-bold">
              Modificadas por Jueces
            </span>
            <div className="text-2xl font-black mt-0.5 text-blue-900">{countModified}</div>
          </button>

          <button
            onClick={() => setFilterStatus('rechazada')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'rechazada'
                ? 'bg-slate-100 border-slate-400 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider text-slate-600 block font-bold">
              Rechazadas
            </span>
            <div className="text-2xl font-black mt-0.5 text-slate-700">{countRejected}</div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en citas, justificaciones o seudónimos..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white outline-none"
            />
          </div>

          <select
            value={filterInstrument}
            onChange={(e) => setFilterInstrument(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none font-medium"
          >
            <option value="ALL">Todos los instrumentos</option>
            <option value="OBS">Solo Observación (OBS)</option>
            <option value="GF">Solo Grupo Focal (GF)</option>
            <option value="E">Solo Entrevista (E)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none font-medium"
          >
            <option value="ALL">Todos los estados</option>
            <option value="propuesta_pendiente">Propuesta pendiente</option>
            <option value="revisada_aceptada">Revisada y aceptada</option>
            <option value="modificada">Modificada</option>
            <option value="rechazada">Rechazada</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none max-w-[200px] truncate font-medium"
          >
            <option value="ALL">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 text-[11px]">
          Mostrando <strong>{filteredFragments.length}</strong> de {codedFragments.length} fragmentos
        </div>
      </div>

      {/* Fragments List - Light Theme */}
      <div className="space-y-4">
        {filteredFragments.map((frag) => {
          const isPending = frag.status === 'propuesta_pendiente';

          return (
            <div
              key={frag.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                isPending
                  ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {frag.sessionCode}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {frag.questionId}
                  </span>
                  {frag.participantPseudonym && (
                    <span className="text-xs text-amber-800 font-mono font-bold">
                      ({isPseudonymized ? frag.participantPseudonym : frag.participantPseudonym})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(frag.status)}
                  {frag.suggestedByAI && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Sugerido Asistido ({frag.aiConfidence || 'Auto'})</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Excerpt text verbatim */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 text-slate-800 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
                <Quote className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="italic font-medium">"{frag.excerptText}"</p>
              </div>

              {/* Assigned Categories & Transversals */}
              <div className="space-y-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-xs font-bold text-slate-700 mr-1">
                    Códigos Asignados:
                  </span>
                  {frag.categoryIds.map((cId) => {
                    const cDef = categories.find((c) => c.id === cId);
                    return (
                      <span
                        key={cId}
                        className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"
                        title={cDef?.name}
                      >
                        {cId}
                      </span>
                    );
                  })}

                  {frag.transversalDimensionIds &&
                    frag.transversalDimensionIds.map((tId) => (
                      <span
                        key={tId}
                        className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200"
                        title="Dimensión Transversal"
                      >
                        {tId} (Transversal)
                      </span>
                    ))}
                </div>

                {/* Methodological justification */}
                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                    Justificación Epistemológica:
                  </strong>
                  <p>{frag.justification}</p>
                </div>

                {frag.reviewNotes && (
                  <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <strong className="text-[11px] uppercase tracking-wider block font-bold">
                      Nota de Revisión Colegiada:
                    </strong>
                    {frag.reviewNotes}
                  </div>
                )}
              </div>

              {/* Footer row: Researcher info & Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{frag.researcherName}</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{frag.dateCoded}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleAcceptProposal(frag.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Aceptar Propuesta</span>
                      </button>

                      <button
                        onClick={() => handleOpenModify(frag)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modificar</span>
                      </button>

                      <button
                        onClick={() => handleRejectProposal(frag.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-300 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </>
                  )}

                  {!isPending && (
                    <>
                      <button
                        onClick={() => handleOpenModify(frag)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                        title="Modificar codificación"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Confirma retirar este fragmento codificado?')) {
                            deleteCodedFragment(frag.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredFragments.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <Tag className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold">No se encontraron fragmentos con los filtros actuales.</p>
            <p className="text-xs text-slate-500 mt-1">
              Haga clic en «Codificar Nuevo Fragmento» o seleccione fragmentos desde el registro de instrumentos.
            </p>
          </div>
        )}
      </div>

      {/* Add / Modify Coded Fragment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col my-auto text-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>
                  {editingFragment ? 'Modificar Codificación de Fragmento' : 'Codificar Unidad Hermenéutica'}
                </span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFragment} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Origin session and indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Sesión de Origen</label>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.instrumentCode} ({s.instrumentType}) — {s.studentPseudonym || 'Grupo Focal'} ({s.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Indicador / Pregunta</label>
                  <select
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none font-mono font-bold"
                  >
                    {questions
                      .filter((q) => !selectedSession || q.instrumentType === selectedSession.instrumentType)
                      .map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.code}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Seudónimo de Atribución (Estudiante)</label>
                <input
                  type="text"
                  value={participantPseudonym}
                  onChange={(e) => setParticipantPseudonym(e.target.value)}
                  placeholder="p. ej. EST-10B-04"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                />
              </div>

              {/* Excerpt input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-emerald-800 font-bold">
                    Cita Textual o Evidencia Observable a Codificar:
                  </label>
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-semibold transition-colors"
                    title="Analiza el texto y sugiere categorías tentativas bajo el estatus 'propuesta pendiente'"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Sugerir Codificación Tentativa</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={excerptText}
                  onChange={(e) => setExcerptText(e.target.value)}
                  placeholder="Pegue aquí el fragmento textual de la transcripción o la evidencia conductual directa..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:border-indigo-600 outline-none italic leading-relaxed"
                />
              </div>

              {/* AI suggestion banner alert */}
              {aiSuggestionState.applied && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-800">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Propuesta Tentativa Generada (Confianza: {aiSuggestionState.confidence})</span>
                  </div>
                  <p className="text-slate-700">{aiSuggestionState.rationale}</p>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    ⚠️ Esta sugerencia quedará registrada con estatus «Propuesta pendiente de revisión» para su arbitraje metodológico.
                  </p>
                </div>
              )}

              {/* Categories Selection */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Seleccionar Categorías Principales (Multicodificación permitida):
                </label>
                <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {categories
                    .filter((c) => !c.isTransversal)
                    .map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleCategorySelection(cat.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 border border-indigo-300 font-semibold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-slate-300 text-indigo-600 pointer-events-none"
                          />
                          <span className="font-mono font-bold text-[11px] text-indigo-700">
                            {cat.code}
                          </span>
                          <span className="truncate">{cat.name}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Transversal Dimensions Selection */}
              <div>
                <label className="block text-purple-900 font-bold mb-1.5">
                  Dimensiones Transversales (Pensamiento Crítico / Metacognición):
                </label>
                <div className="max-h-28 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {categories
                    .filter((c) => c.isTransversal)
                    .map((cat) => {
                      const isSelected = selectedTransversals.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleTransversalSelection(cat.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-50 text-purple-900 border border-purple-300 font-semibold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-slate-300 text-purple-600 pointer-events-none"
                          />
                          <span className="font-mono font-bold text-[11px] text-purple-700">
                            {cat.code}
                          </span>
                          <span className="truncate">{cat.name}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Justification input */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Justificación de la Codificación (Por qué se asignaron estos códigos):
                </label>
                <textarea
                  rows={2}
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Fundamente con base en los criterios de inclusión del Codebook..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                />
              </div>

              {editingFragment && (
                <div>
                  <label className="block text-amber-900 font-bold mb-1">
                    Nota de Revisión Colegiada:
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Detalle de modificaciones realizadas en consenso..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  {editingFragment ? 'Guardar Cambios' : 'Registrar Fragmento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
