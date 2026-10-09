import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { CategoryDefinition, CategoryFamily } from '../../types';
import {
  FolderTree,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  X,
  Save
} from 'lucide-react';

export const CategoryMatrixView: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, currentResearcher } =
    useProject();

  const [selectedFamily, setSelectedFamily] = useState<CategoryFamily | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    categories[0]?.id || null
  );

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);

  // Form states
  const [formFamily, setFormFamily] = useState<CategoryFamily>('EXP');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formIsTransversal, setFormIsTransversal] = useState(false);
  const [formDefinition, setFormDefinition] = useState('');
  const [formInclusion, setFormInclusion] = useState('');
  const [formExclusion, setFormExclusion] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formIndicators, setFormIndicators] = useState('OBS1, GF2, E3');
  const [formModificationReason, setFormModificationReason] = useState('');

  const families: { key: CategoryFamily | 'ALL'; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todas las Familias', count: categories.length },
    {
      key: 'EXP',
      label: 'EXP — Experiencias (9)',
      count: categories.filter((c) => c.family === 'EXP').length
    },
    {
      key: 'PER',
      label: 'PER — Percepciones (7)',
      count: categories.filter((c) => c.family === 'PER').length
    },
    {
      key: 'DIF',
      label: 'DIF — Dificultades (6)',
      count: categories.filter((c) => c.family === 'DIF').length
    },
    {
      key: 'PC',
      label: 'PC — Pensamiento Crítico (4)',
      count: categories.filter((c) => c.family === 'PC').length
    },
    {
      key: 'META',
      label: 'META — Metacognición (3)',
      count: categories.filter((c) => c.family === 'META').length
    }
  ];

  const filteredCategories = categories.filter((c) => {
    const matchesFamily = selectedFamily === 'ALL' || c.family === selectedFamily;
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.operationalDefinition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFamily && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormFamily(selectedFamily === 'ALL' ? 'EXP' : selectedFamily);
    setFormCode(`${selectedFamily === 'ALL' ? 'EXP' : selectedFamily}-NUEVO`);
    setFormName('');
    setFormIsTransversal(selectedFamily === 'PC' || selectedFamily === 'META');
    setFormDefinition('');
    setFormInclusion('');
    setFormExclusion('');
    setFormExample('[Ficticio] Ejemplo ilustrativo...');
    setFormIndicators('OBS1, GF2, E3');
    setFormModificationReason('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryDefinition) => {
    setEditingCategory(cat);
    setFormFamily(cat.family);
    setFormCode(cat.code);
    setFormName(cat.name);
    setFormIsTransversal(!!cat.isTransversal);
    setFormDefinition(cat.operationalDefinition);
    setFormInclusion(cat.inclusionCriteria);
    setFormExclusion(cat.exclusionCriteria);
    setFormExample(cat.illustrativeExample);
    setFormIndicators(cat.relatedIndicators.join(', '));
    setFormModificationReason('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const indicatorArray = formIndicators
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const now = new Date().toISOString().split('T')[0];

    if (editingCategory) {
      if (!formModificationReason.trim()) {
        alert('Por rigor metodológico y trazabilidad, debe consignar el motivo de la modificación.');
        return;
      }
      const updated: CategoryDefinition = {
        ...editingCategory,
        family: formFamily,
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        isTransversal: formIsTransversal,
        operationalDefinition: formDefinition.trim(),
        inclusionCriteria: formInclusion.trim(),
        exclusionCriteria: formExclusion.trim(),
        relatedIndicators: indicatorArray,
        illustrativeExample: formExample.trim()
      };
      updateCategory(updated, formModificationReason.trim());
    } else {
      const newCategory: CategoryDefinition = {
        id: formCode.trim().toUpperCase(),
        family: formFamily,
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        isTransversal: formIsTransversal,
        operationalDefinition: formDefinition.trim(),
        inclusionCriteria: formInclusion.trim(),
        exclusionCriteria: formExclusion.trim(),
        relatedIndicators: indicatorArray,
        illustrativeExample: formExample.trim(),
        auditTrail: {
          createdDate: now,
          createdBy: currentResearcher,
          lastModifiedDate: now,
          lastModifiedBy: currentResearcher,
          modificationReason: 'Creación de nueva categoría en el libro de códigos.'
        }
      };
      addCategory(newCategory);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (cat: CategoryDefinition) => {
    if (confirm(`¿Confirma retirar la categoría ${cat.code} del libro de códigos? Los datos brutos no se borrarán pero se desvinculará este código.`)) {
      deleteCategory(cat.id);
    }
  };

  const getFamilyColor = (family: CategoryFamily) => {
    switch (family) {
      case 'EXP':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'PER':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'DIF':
        return 'text-rose-800 bg-rose-50 border-rose-200';
      case 'PC':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'META':
        return 'text-amber-800 bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <FolderTree className="w-3.5 h-3.5" />
              <span>Libro de Códigos Metodológico</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Matriz Maestra de Categorías y Subcategorías (Codebook)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Estructura jerárquica con 24 subcategorías operacionales organizadas en 3 familias centrales
              (<strong>EXP</strong>: Experiencias, <strong>PER</strong>: Percepciones, <strong>DIF</strong>: Dificultades)
              y 2 dimensiones transversales (<strong>PC</strong>: Pensamiento Crítico, <strong>META</strong>: Metacognición).
              Todas las modificaciones quedan registradas con firma y motivo de auditoría.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría / Código</span>
          </button>
        </div>

        {/* Family Pills Selector */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
          {families.map((fam) => (
            <button
              key={fam.key}
              onClick={() => setSelectedFamily(fam.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedFamily === fam.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {fam.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Counts Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nombre o definición operacional..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white outline-none"
          />
        </div>

        <div className="text-slate-500 text-[11px]">
          Mostrando <strong>{filteredCategories.length}</strong> de {categories.length} categorías en el Codebook
        </div>
      </div>

      {/* Category List Accordion */}
      <div className="space-y-3">
        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategoryId === cat.id;
          const familyBadgeStyle = getFamilyColor(cat.family);

          return (
            <div
              key={cat.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all shadow-xs ${
                isExpanded
                  ? 'border-indigo-300 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Accordion Header */}
              <div
                onClick={() =>
                  setExpandedCategoryId(isExpanded ? null : cat.id)
                }
                className="px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}

                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${familyBadgeStyle}`}
                  >
                    {cat.code}
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {cat.operationalDefinition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {cat.isTransversal && (
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Dimensión Transversal
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span>{cat.relatedIndicators.length} ind.</span>
                  </div>
                </div>
              </div>

              {/* Accordion Expanded Body */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 space-y-4 text-xs bg-slate-50/40">
                  {/* Operational definition */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                    <span className="font-bold text-indigo-700 block mb-1 text-[11px] uppercase tracking-wider">
                      Definición Operacional Metodológica:
                    </span>
                    <p className="text-slate-800 leading-relaxed text-sm">
                      {cat.operationalDefinition}
                    </p>
                  </div>

                  {/* Criteria split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1 text-[11px] uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Criterios de Inclusión:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {cat.inclusionCriteria}
                      </p>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold mb-1 text-[11px] uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Criterios de Exclusión:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {cat.exclusionCriteria}
                      </p>
                    </div>
                  </div>

                  {/* Related indicators & example */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <span className="font-bold text-slate-800 block mb-2 text-[11px] uppercase tracking-wider">
                        Indicadores e Instrumentos Relacionados:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.relatedIndicators.map((ind) => (
                          <span
                            key={ind}
                            className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <span className="font-bold text-slate-800 block mb-1 text-[11px] uppercase tracking-wider">
                        Ejemplo Ilustrativo de Evidencia (Ficticio):
                      </span>
                      <p className="text-slate-700 italic leading-relaxed">
                        {cat.illustrativeExample}
                      </p>
                    </div>
                  </div>

                  {/* Audit Trail & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Autor: <strong>{cat.auditTrail.createdBy}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          Modificado: {cat.auditTrail.lastModifiedDate} (por{' '}
                          {cat.auditTrail.lastModifiedBy})
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-600" />
                        <span>Editar Categoría</span>
                      </button>

                      <button
                        onClick={() => handleDelete(cat)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 transition-colors"
                        title="Retirar categoría"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col my-auto text-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                <span>
                  {editingCategory ? `Editar Categoría [${editingCategory.code}]` : 'Nueva Subcategoría en el Codebook'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Familia Principal</label>
                  <select
                    value={formFamily}
                    onChange={(e) => setFormFamily(e.target.value as CategoryFamily)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  >
                    <option value="EXP">EXP — Experiencias de Interacción</option>
                    <option value="PER">PER — Percepciones del Estudiante</option>
                    <option value="DIF">DIF — Dificultades Observadas/Reportadas</option>
                    <option value="PC">PC — Dimensión: Pensamiento Crítico</option>
                    <option value="META">META — Dimensión: Metacognición</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Código Identificador</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="p. ej. EXP-NUEVO"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 uppercase font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="p. ej. Reflexión dialógica entre pares"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="transversalCheck"
                  checked={formIsTransversal}
                  onChange={(e) => setFormIsTransversal(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="transversalCheck" className="text-slate-700 font-medium">
                  Actuar como dimensión transversal (se puede asociar como segunda capa sin reemplazar categorías centrales)
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Definición Operacional</label>
                <textarea
                  rows={2}
                  required
                  value={formDefinition}
                  onChange={(e) => setFormDefinition(e.target.value)}
                  placeholder="Defina con exactitud el constructo cualitativo..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-800 font-semibold mb-1">Criterios de Inclusión</label>
                  <textarea
                    rows={2}
                    required
                    value={formInclusion}
                    onChange={(e) => setFormInclusion(e.target.value)}
                    placeholder="¿Qué evidencias justifican asignar este código?"
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-rose-800 font-semibold mb-1">Criterios de Exclusión</label>
                  <textarea
                    rows={2}
                    required
                    value={formExclusion}
                    onChange={(e) => setFormExclusion(e.target.value)}
                    placeholder="¿Qué NO debe ser codificado bajo este código?"
                    className="w-full bg-white border border-rose-300 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Indicadores Relacionados (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={formIndicators}
                    onChange={(e) => setFormIndicators(e.target.value)}
                    placeholder="OBS1, GF2, E3"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ejemplo Ilustrativo (marcado explícitamente como ficticio)
                  </label>
                  <input
                    type="text"
                    value={formExample}
                    onChange={(e) => setFormExample(e.target.value)}
                    placeholder="[Ficticio] Ejemplo..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              {editingCategory && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <label className="block text-amber-900 font-bold mb-1">
                    Motivo Metodológico de la Modificación (Obligatorio para auditoría):
                  </label>
                  <input
                    type="text"
                    required
                    value={formModificationReason}
                    onChange={(e) => setFormModificationReason(e.target.value)}
                    placeholder="p. ej. Ajuste de criterios de inclusión por consenso inter-jueces en sesión #3..."
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              )}

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
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar en Codebook</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
