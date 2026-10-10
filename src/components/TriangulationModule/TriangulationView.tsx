import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { TriangulationMatrixEntry } from '../../types';
import {
  GitCompare,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Edit3,
  User,
  Clock,
  Layers,
  ArrowRight,
  Save,
  X
} from 'lucide-react';

export const TriangulationView: React.FC = () => {
  const {
    triangulationEntries,
    categories,
    codedFragments,
    saveTriangulationEntry,
    currentResearcher
  } = useProject();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TriangulationMatrixEntry | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState<string>('EXP-AUT');
  const [formTransversal, setFormTransversal] = useState<string>('META-REG');
  const [formObsSummary, setFormObsSummary] = useState('');
  const [formObsAvailable, setFormObsAvailable] = useState(true);
  const [formGfSummary, setFormGfSummary] = useState('');
  const [formGfAvailable, setFormGfAvailable] = useState(true);
  const [formInterviewSummary, setFormInterviewSummary] = useState('');
  const [formInterviewAvailable, setFormInterviewAvailable] = useState(true);
  const [formCoincidences, setFormCoincidences] = useState('');
  const [formDivergences, setFormDivergences] = useState('');
  const [formComplements, setFormComplements] = useState('');
  const [formAbsenceNotes, setFormAbsenceNotes] = useState('');
  const [formInterpretation, setFormInterpretation] = useState('');
  const [formPendingQuestions, setFormPendingQuestions] = useState('');

  const filteredEntries = triangulationEntries.filter((entry) => {
    const cat = categories.find((c) => c.id === entry.categoryId);
    const matchesCat =
      selectedCategoryId === 'ALL' ||
      entry.categoryId === selectedCategoryId ||
      entry.transversalDimensionId === selectedCategoryId;
    const matchesSearch =
      (cat && cat.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.coincidences.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.researcherInterpretation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormCategory('EXP-AUT');
    setFormTransversal('META-REG');
    setFormObsSummary('');
    setFormObsAvailable(true);
    setFormGfSummary('');
    setFormGfAvailable(true);
    setFormInterviewSummary('');
    setFormInterviewAvailable(true);
    setFormCoincidences('');
    setFormDivergences('');
    setFormComplements('');
    setFormAbsenceNotes('');
    setFormInterpretation('');
    setFormPendingQuestions('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: TriangulationMatrixEntry) => {
    setEditingEntry(entry);
    setFormCategory(entry.categoryId);
    setFormTransversal(entry.transversalDimensionId || '');
    setFormObsSummary(entry.obsEvidenceSummary);
    setFormObsAvailable(entry.obsEvidenceAvailable);
    setFormGfSummary(entry.gfEvidenceSummary);
    setFormGfAvailable(entry.gfEvidenceAvailable);
    setFormInterviewSummary(entry.interviewEvidenceSummary);
    setFormInterviewAvailable(entry.interviewEvidenceAvailable);
    setFormCoincidences(entry.coincidences);
    setFormDivergences(entry.divergencesAndContradictions);
    setFormComplements(entry.complementaryFindings);
    setFormAbsenceNotes(entry.absenceOfEvidenceNotes);
    setFormInterpretation(entry.researcherInterpretation);
    setFormPendingQuestions(entry.pendingQuestions);
    setIsModalOpen(true);
  };

  const handleAutoPopulateFromFragments = (catId: string) => {
    const obsFrags = codedFragments.filter(
      (f) => f.instrumentType === 'OBS' && f.categoryIds.includes(catId)
    );
    const gfFrags = codedFragments.filter(
      (f) => f.instrumentType === 'GF' && f.categoryIds.includes(catId)
    );
    const eFrags = codedFragments.filter(
      (f) => f.instrumentType === 'E' && f.categoryIds.includes(catId)
    );

    if (obsFrags.length > 0) {
      setFormObsSummary(
        `Registrado en ${obsFrags.length} observación(es): ` +
          obsFrags.map((f) => f.excerptText).join(' | ')
      );
      setFormObsAvailable(true);
    } else {
      setFormObsAvailable(false);
      setFormObsSummary('No se dispone de evidencias observacionales directas para esta categoría.');
    }

    if (gfFrags.length > 0) {
      setFormGfSummary(
        `Expresado en grupo focal (${gfFrags.length} citas): ` +
          gfFrags.map((f) => `"${f.excerptText}" (${f.participantPseudonym || 'GF'})`).join(' | ')
      );
      setFormGfAvailable(true);
    } else {
      setFormGfAvailable(false);
      setFormGfSummary('No se registraron menciones en el grupo focal para esta categoría.');
    }

    if (eFrags.length > 0) {
      setFormInterviewSummary(
        `Reportado en entrevistas (${eFrags.length} citas): ` +
          eFrags.map((f) => `"${f.excerptText}"`).join(' | ')
      );
      setFormInterviewAvailable(true);
    } else {
      setFormInterviewAvailable(false);
      setFormInterviewSummary('No se cuenta con respuestas individuales directas en entrevista.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: TriangulationMatrixEntry = {
      id: editingEntry?.id || `triang-${Date.now()}`,
      categoryId: formCategory,
      transversalDimensionId: formTransversal || undefined,
      obsEvidenceSummary: formObsSummary.trim(),
      obsEvidenceAvailable: formObsAvailable,
      obsFragmentIds: editingEntry?.obsFragmentIds || [],
      gfEvidenceSummary: formGfSummary.trim(),
      gfEvidenceAvailable: formGfAvailable,
      gfFragmentIds: editingEntry?.gfFragmentIds || [],
      interviewEvidenceSummary: formInterviewSummary.trim(),
      interviewEvidenceAvailable: formInterviewAvailable,
      interviewFragmentIds: editingEntry?.interviewFragmentIds || [],
      coincidences: formCoincidences.trim(),
      divergencesAndContradictions: formDivergences.trim(),
      complementaryFindings: formComplements.trim(),
      absenceOfEvidenceNotes: formAbsenceNotes.trim(),
      researcherInterpretation: formInterpretation.trim(),
      pendingQuestions: formPendingQuestions.trim(),
      lastUpdatedBy: currentResearcher,
      updatedAt: new Date().toISOString()
    };

    saveTriangulationEntry(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-2">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Cruce de Fuentes Cualitativas</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Matriz de Triangulación Cualitativa Multifuente</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Cruce sistemático de evidencias entre <strong>Observación Estructurada (OBS)</strong>,{' '}
              <strong>Grupo Focal (GF)</strong> y <strong>Entrevista Semiestructurada (E)</strong>.
              Distingue rigurosamente entre coincidencias, contradicciones/discrepancias, complementariedades
              y ausencias de información justificadas metodológicamente.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Ficha de Triangulación</span>
          </button>
        </div>

        {/* Methodological notice - Light */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-700 flex items-center gap-2.5 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Principio metodológico:</strong> No se exige que toda categoría aparezca en los 3
            instrumentos. Si un instrumento no reporta evidencia, se consigna formalmente como{' '}
            <em>«No disponible»</em> sin interpretarse como un fallo o resultado negativo.
          </span>
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
              placeholder="Buscar en interpretaciones, coincidencias..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white outline-none"
            />
          </div>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none max-w-[240px] truncate font-medium"
          >
            <option value="ALL">Todas las categorías trianguladas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 text-[11px]">
          Mostrando <strong>{filteredEntries.length}</strong> matrices consolidadas
        </div>
      </div>

      {/* Triangulation Cards - Light Theme */}
      <div className="space-y-6">
        {filteredEntries.map((entry) => {
          const cat = categories.find((c) => c.id === entry.categoryId);

          return (
            <div
              key={entry.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Card Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {entry.categoryId}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {cat?.name || entry.categoryId}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Familia: {cat?.family} • {cat?.operationalDefinition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {entry.transversalDimensionId && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono text-xs font-bold">
                      {entry.transversalDimensionId} (Transversal)
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenEdit(entry)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Editar Triangulación</span>
                  </button>
                </div>
              </div>

              {/* 3-Column Comparative Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-200 text-xs">
                {/* 1. OBS Evidence */}
                <div className="p-5 space-y-2 bg-indigo-50/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>1. Observación Estructurada (OBS)</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        entry.obsEvidenceAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {entry.obsEvidenceAvailable ? 'Evidencia fáctica' : 'Sin evidencia'}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed min-h-[50px]">
                    {entry.obsEvidenceSummary || 'Sin datos registrados.'}
                  </p>
                </div>

                {/* 2. GF Evidence */}
                <div className="p-5 space-y-2 bg-amber-50/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      <span>2. Grupo Focal (GF)</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        entry.gfEvidenceAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {entry.gfEvidenceAvailable ? 'Voz colectiva' : 'Sin evidencia'}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed min-h-[50px]">
                    {entry.gfEvidenceSummary || 'Sin datos registrados.'}
                  </p>
                </div>

                {/* 3. Interview Evidence */}
                <div className="p-5 space-y-2 bg-teal-50/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      <span>3. Entrevista Semiestructurada (E)</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        entry.interviewEvidenceAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {entry.interviewEvidenceAvailable ? 'Voz individual' : 'Sin evidencia'}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed min-h-[50px]">
                    {entry.interviewEvidenceSummary || 'Sin datos registrados.'}
                  </p>
                </div>
              </div>

              {/* Analytical Triangulation Dimensions */}
              <div className="p-6 space-y-4 text-xs bg-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Coincidences */}
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1 text-[11px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Coincidencias (Convergencias):</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{entry.coincidences}</p>
                  </div>

                  {/* Divergences */}
                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold mb-1 text-[11px] uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Divergencias / Contradicciones:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {entry.divergencesAndContradictions || 'No se registraron contradicciones sustanciales.'}
                    </p>
                  </div>

                  {/* Complements */}
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-indigo-800 font-bold mb-1 text-[11px] uppercase tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Evidencias Complementarias:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{entry.complementaryFindings}</p>
                  </div>
                </div>

                {/* Absence notes if any */}
                {entry.absenceOfEvidenceNotes && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-amber-900">
                    <strong className="block text-[11px] uppercase tracking-wider text-amber-800 mb-0.5 font-bold">
                      Justificación de Ausencia de Evidencia (Sin Sesgo Punitivo):
                    </strong>
                    <p className="leading-relaxed">{entry.absenceOfEvidenceNotes}</p>
                  </div>
                )}

                {/* Interpretation */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <strong className="block text-indigo-800 font-bold mb-1 text-[11px] uppercase tracking-wider">
                    Interpretación Sintética del Investigador (Hermenéutica):
                  </strong>
                  <p className="text-slate-900 text-sm leading-relaxed font-medium">
                    {entry.researcherInterpretation}
                  </p>
                </div>

                {/* Pending questions */}
                {entry.pendingQuestions && (
                  <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-3.5">
                    <strong className="block text-slate-600 font-bold mb-1 text-[11px] uppercase tracking-wider">
                      Interrogantes Metodológicos Abiertos:
                    </strong>
                    <p className="text-slate-700 italic">{entry.pendingQuestions}</p>
                  </div>
                )}

                {/* Card footer */}
                <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                  <span>Actualizado por: <strong>{entry.lastUpdatedBy}</strong></span>
                  <span>Fecha: {new Date(entry.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <GitCompare className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold">No hay fichas de triangulación para los filtros actuales.</p>
            <p className="text-xs text-slate-500 mt-1">
              Haga clic en «Nueva Ficha de Triangulación» para cruzar evidencias de los 3 instrumentos.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Triangulation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto text-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-indigo-600" />
                <span>
                  {editingEntry ? 'Editar Ficha de Triangulación' : 'Construir Nueva Matriz de Triangulación'}
                </span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    Categoría a Triangular:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      handleAutoPopulateFromFragments(e.target.value);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  >
                    {categories
                      .filter((c) => !c.isTransversal)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} · {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-900 font-bold mb-1">
                    Dimensión Transversal (Opcional):
                  </label>
                  <select
                    value={formTransversal}
                    onChange={(e) => setFormTransversal(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  >
                    <option value="">Sin dimensión transversal</option>
                    {categories
                      .filter((c) => c.isTransversal)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} · {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 3 Instruments Evidence Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Evidencias de los Tres Instrumentos
                </h3>

                {/* OBS */}
                <div className="bg-indigo-50/30 border border-indigo-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-indigo-800 font-bold">
                      1. Evidencia de la Observación Estructurada (OBS):
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={formObsAvailable}
                        onChange={(e) => setFormObsAvailable(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      <span>¿Hay evidencia disponible en OBS?</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={formObsSummary}
                    onChange={(e) => setFormObsSummary(e.target.value)}
                    placeholder="Resumen sintético de las conductas observadas..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>

                {/* GF */}
                <div className="bg-amber-50/30 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-amber-900 font-bold">
                      2. Evidencia del Grupo Focal (GF):
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={formGfAvailable}
                        onChange={(e) => setFormGfAvailable(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600"
                      />
                      <span>¿Hay evidencia disponible en GF?</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={formGfSummary}
                    onChange={(e) => setFormGfSummary(e.target.value)}
                    placeholder="Resumen de las intervenciones colectivas..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>

                {/* E */}
                <div className="bg-teal-50/30 border border-teal-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-teal-900 font-bold">
                      3. Evidencia de la Entrevista Semiestructurada (E):
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={formInterviewAvailable}
                        onChange={(e) => setFormInterviewAvailable(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600"
                      />
                      <span>¿Hay evidencia disponible en E?</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={formInterviewSummary}
                    onChange={(e) => setFormInterviewSummary(e.target.value)}
                    placeholder="Resumen de las declaraciones individuales..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Analytical Triangulation Dimensions Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dimensiones de Análisis Comparativo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-800 font-bold mb-1">
                      Coincidencias entre Fuentes:
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formCoincidences}
                      onChange={(e) => setFormCoincidences(e.target.value)}
                      placeholder="Convergencias entre lo observado y lo expresado..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-800 font-bold mb-1">
                      Diferencias o Contradicciones:
                    </label>
                    <textarea
                      rows={2}
                      value={formDivergences}
                      onChange={(e) => setFormDivergences(e.target.value)}
                      placeholder="Tensiones entre el discurso y la acción observable..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-indigo-800 font-bold mb-1">
                      Evidencias Complementarias:
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formComplements}
                      onChange={(e) => setFormComplements(e.target.value)}
                      placeholder="¿Qué matices aporta un instrumento que los otros no capturan?"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-900 font-bold mb-1">
                      Ausencia de Evidencia (Aclaración Metodológica):
                    </label>
                    <textarea
                      rows={2}
                      value={formAbsenceNotes}
                      onChange={(e) => setFormAbsenceNotes(e.target.value)}
                      placeholder="Explique por qué alguna fuente no tuvo datos, evitando sesgo negativo..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    Interpretación Sintética del Investigador (Hermenéutica):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formInterpretation}
                    onChange={(e) => setFormInterpretation(e.target.value)}
                    placeholder="Conclusión analítica fundamentada sin sobreinterpretar la evidencia..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Interrogantes Metodológicos Abiertos:
                  </label>
                  <input
                    type="text"
                    value={formPendingQuestions}
                    onChange={(e) => setFormPendingQuestions(e.target.value)}
                    placeholder="Preguntas que requieren profundizar en nuevas sesiones..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Guardar Ficha de Triangulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
