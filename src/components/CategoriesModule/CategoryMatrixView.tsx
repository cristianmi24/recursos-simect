import React, { useState } from 'react';
import { useDialog } from '../DialogProvider';
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
  const { questions, categories, addCategory, updateCategory, deleteCategory, currentResearcher } =
    useProject();
  const dialog = useDialog();

  type FormKey = 'ALL' | 'OBS' | 'E' | 'GF';
  const FORM_PATTERNS: Record<Exclude<FormKey, 'ALL'>, RegExp> = {
    OBS: /^OBS\d+$/,
    E: /^E\d+$/,
    GF: /^GF\d+$/
  };
  const indicatorsOfForm = (cat: CategoryDefinition, form: FormKey) =>
    form === 'ALL' ? cat.relatedIndicators : cat.relatedIndicators.filter((i) => FORM_PATTERNS[form].test(i));
  const formRank = (cat: CategoryDefinition) => {
    const first = cat.relatedIndicators[0] || '';
    const base = first.startsWith('OBS') ? 0 : first.startsWith('E') ? 1 : 2;
    return base * 100 + (parseInt(first.replace(/\D/g, ''), 10) || 0);
  };

  const mainCategories: { key: CategoryFamily; label: string }[] = [
    { key: 'EXP', label: 'Experiencias' },
    { key: 'PER', label: 'Percepciones' },
    { key: 'DIF', label: 'Dificultades' }
  ];
  const [expandedMain, setExpandedMain] = useState<CategoryFamily | null>('EXP');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormKey>('ALL');
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

  const forms: { key: FormKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todos los formularios', count: categories.length },
    { key: 'OBS', label: '1. Observación (OBS1–8)', count: categories.filter((c) => indicatorsOfForm(c, 'OBS').length > 0).length },
    { key: 'E', label: '2. Entrevista (E1–5)', count: categories.filter((c) => indicatorsOfForm(c, 'E').length > 0).length },
    { key: 'GF', label: '3. Grupo focal (GF1–10)', count: categories.filter((c) => indicatorsOfForm(c, 'GF').length > 0).length }
  ];

  const filteredCategories = categories.filter((c) => {
    const matchesFamily = selectedForm === 'ALL' || indicatorsOfForm(c, selectedForm).length > 0;
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.operationalDefinition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFamily && matchesSearch;
  }).sort((a, b) => formRank(a) - formRank(b));

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormFamily('EXP');
    setFormCode('EXP-NUEVO');
    setFormName('');
    setFormIsTransversal(false);
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
        void dialog.alert({ title: 'Falta el motivo de la modificación', message: 'Por rigor metodológico y trazabilidad, debe consignar el motivo de la modificación.' });
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

  const handleDelete = async (cat: CategoryDefinition) => {
    const ok = await dialog.confirm({
      title: `¿Retirar la categoría ${cat.code}?`,
      message: 'Se retirará del libro de códigos. Los datos brutos no se borrarán, pero se desvinculará este código.',
      confirmLabel: 'Retirar categoría',
      tone: 'danger'
    });
    if (ok) deleteCategory(cat.id);
  };

  const getFamilyColor = (family: CategoryFamily) => {
    switch (family) {
      case 'EXP':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'PER':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'DIF':
        return 'text-rose-800 bg-rose-50 border-rose-200';
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
              Subcategorías organizadas por formulario (Observación, Entrevista y Grupo focal) según la matriz de
              categorización, dentro de 3 categorías principales (<strong>EXP</strong>: Experiencias,
              <strong> PER</strong>: Percepciones, <strong>DIF</strong>: Dificultades).
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

        {/* Formulario Pills Selector */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
          {forms.map((fam) => (
            <button
              key={fam.key}
              onClick={() => setSelectedForm(fam.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedForm === fam.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {fam.label} ({fam.count})
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
            placeholder="Buscar por pregunta, código o subcategoría..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white outline-none"
          />
        </div>

        <div className="text-slate-500 text-[11px]">
          {categories.length} subcategorías en el Codebook
        </div>
      </div>

      {/* Categorías principales → preguntas → subcategoría */}
      <div className="space-y-3">
        {mainCategories.map((main) => {
          const rows = questions
            .filter((q) => {
              const cat = categories.find((c) => c.id === q.linkedCategories?.[0]);
              if (!cat || cat.family !== main.key) return false;
              if (selectedForm !== 'ALL' && q.instrumentType !== selectedForm) return false;
              const term = searchTerm.trim().toLowerCase();
              return (
                !term ||
                q.code.toLowerCase().includes(term) ||
                q.prompt.toLowerCase().includes(term) ||
                cat.name.toLowerCase().includes(term) ||
                cat.code.toLowerCase().includes(term)
              );
            })
            .sort((a, b) => a.order - b.order);
          const isMainOpen = expandedMain === main.key;

          return (
            <div
              key={main.key}
              className={`bg-white border rounded-xl overflow-hidden shadow-xs ${
                isMainOpen ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200'
              }`}
            >
              <div
                onClick={() => setExpandedMain(isMainOpen ? null : main.key)}
                className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isMainOpen ? (
                    <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${getFamilyColor(main.key)}`}>
                    {main.key}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">{main.label}</h3>
                </div>
                <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  {rows.length} {rows.length === 1 ? 'pregunta' : 'preguntas'}
                </span>
              </div>

              {isMainOpen && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {rows.length === 0 && (
                    <p className="px-5 py-4 text-xs text-slate-500">
                      No hay preguntas de este formulario en esta categoría.
                    </p>
                  )}
                  {rows.map((q) => {
                    const cat = categories.find((c) => c.id === q.linkedCategories?.[0])!;
                    const isSel = selectedQuestionId === q.id;
                    return (
                      <div key={q.id}>
                        <div
                          onClick={() => setSelectedQuestionId(isSel ? null : q.id)}
                          className={`px-5 py-3 flex items-start gap-3 cursor-pointer text-xs transition-colors ${
                            isSel ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {q.code}
                          </span>
                          <p className="text-slate-800 leading-relaxed">{q.prompt}</p>
                        </div>
                        {isSel && (
                          <div className="px-5 pb-4 pt-1 bg-indigo-50/30 space-y-3">
                            <div className="text-xs text-slate-700">
                              Subcategoría:{' '}
                              <span className="font-bold text-slate-900">{cat.name}</span>
                            </div>
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
                              onClick={() => void handleDelete(cat)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 transition-colors"
                              title="Retirar categoría"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    <option value="EXP">EXP · Experiencias de Interacción</option>
                    <option value="PER">PER · Percepciones del Estudiante</option>
                    <option value="DIF">DIF · Dificultades Observadas/Reportadas</option>
                    <option value="PC">PC · Dimensión: Pensamiento Crítico</option>
                    <option value="META">META · Dimensión: Metacognición</option>
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
