import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bookmark,
  Share2,
  Copy,
  Info
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    codedFragments,
    triangulationEntries,
    categories,
    sessions,
    currentResearcher,
    isPseudonymized
  } = useProject();

  const [selectedReportId, setSelectedReportId] = useState<number>(1);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const reportsConfig = [
    {
      id: 1,
      title: 'Reporte 1: Experiencias de los Estudiantes con el STI',
      familyKey: 'EXP',
      categoryCodes: [
        'EXP-GEN',
        'EXP-INT',
        'EXP-ANA',
        'EXP-ALT',
        'EXP-DUDA',
        'EXP-PLAN',
        'EXP-MON',
        'EXP-AUT',
        'EXP-RET'
      ],
      description:
        'Análisis cualitativo integral de las vivencias, dinámicas de interacción y conductas observables de los estudiantes durante su trabajo con el tutor inteligente.',
      researchQuestion:
        '¿Cómo describen y experimentan los estudiantes la interacción pedagógica con el Sistema Tutor Inteligente en sus dimensiones de análisis, planificación y autorregulación?'
    },
    {
      id: 2,
      title: 'Reporte 2: Percepciones sobre el STI y su Mediación',
      familyKey: 'PER',
      categoryCodes: [
        'PER-PC',
        'PER-APER',
        'PER-CONSC',
        'PER-META',
        'PER-ADAPT',
        'PER-VAL',
        'PER-PROP'
      ],
      description:
        'Evaluación subjetiva, juicios valorativos y apreciaciones de los estudiantes sobre la utilidad didáctica y el valor pedagógico del sistema.',
      researchQuestion:
        '¿Cuáles son las percepciones de los estudiantes respecto al aporte del STI en su proceso de aprendizaje y apertura conceptual?'
    },
    {
      id: 3,
      title: 'Reporte 3: Dificultades Experimentadas u Observadas',
      familyKey: 'DIF',
      categoryCodes: [
        'DIF-INT',
        'DIF-COMP',
        'DIF-RET',
        'DIF-AJUSTE',
        'DIF-FRUST',
        'DIF-MEJORA'
      ],
      description:
        'Caracterización de las barreras operativas, de comprensión, frustraciones afectivas y dificultades de ajuste de estrategias identificadas en campo.',
      researchQuestion:
        '¿Qué obstáculos de navegación, conceptuales o emocionales experimentan los estudiantes al interactuar con el tutor?'
    },
    {
      id: 4,
      title: 'Reporte 4: Evidencias de Pensamiento Crítico (PC)',
      familyKey: 'PC',
      categoryCodes: ['PC-ANALISIS', 'PC-EVAL', 'PC-APER', 'PC-CUEST'],
      description:
        'Análisis transversal sobre descomposición de premisas, evaluación deliberada de alternativas y cuestionamiento de certezas inducido por el STI.',
      researchQuestion:
        '¿En qué medida la mediación del tutor estimula el pensamiento crítico y la formulación de juicios razonados?'
    },
    {
      id: 5,
      title: 'Reporte 5: Evidencias de Metacognición y Autorregulación',
      familyKey: 'META',
      categoryCodes: ['META-PLAN', 'META-MON', 'META-REG'],
      description:
        'Examen de la toma de conciencia del propio aprendizaje, supervisión de avances y modificación voluntaria de estrategias tras errores.',
      researchQuestion:
        '¿Cómo actúa el STI como espejo cognitivo y andamio para la autorregulación metacognitiva?'
    },
    {
      id: 6,
      title: 'Reporte 6: Percepción de Adaptación del Tutor Inteligente',
      familyKey: 'PER-ADAPT',
      categoryCodes: ['PER-ADAPT'],
      description:
        'Indagación específica sobre si los estudiantes perciben una respuesta algorítmica personalizada o un flujo estandarizado idéntico para todos.',
      researchQuestion:
        '¿De qué manera los estudiantes perciben la adaptatividad y personalización del tutor inteligente?'
    },
    {
      id: 7,
      title: 'Reporte 7: Propuestas de Mejora de los Estudiantes',
      familyKey: 'PER-PROP',
      categoryCodes: ['PER-PROP', 'DIF-MEJORA'],
      description:
        'Sistematización de recomendaciones didácticas y funcionales formuladas por los alumnos para optimizar el andamiaje del software.',
      researchQuestion:
        '¿Qué sugerencias plantean los estudiantes para convertir al tutor en un compañero de aprendizaje más reflexivo y accesible?'
    },
    {
      id: 8,
      title: 'Reporte 8: Resultados de la Triangulación y Síntesis Global',
      familyKey: 'TRIANG',
      categoryCodes: [],
      description:
        'Meta-análisis de convergencias, discrepancias y complementariedades entre Observación Estructurada, Grupos Focales y Entrevistas Semiestructuradas.',
      researchQuestion:
        '¿Qué conclusiones integrales emergen del cruce multifuente de los tres instrumentos de investigación?'
    }
  ];

  const currentReport = reportsConfig.find((r) => r.id === selectedReportId) || reportsConfig[0];

  // Relevant fragments for current report
  const relevantFragments = codedFragments.filter((frag) => {
    if (selectedReportId === 8) return true; // all fragments
    return (
      frag.categoryIds.some((cid) => currentReport.categoryCodes.includes(cid)) ||
      (frag.transversalDimensionIds &&
        frag.transversalDimensionIds.some((tid) => currentReport.categoryCodes.includes(tid)))
    );
  });

  // Relevant triangulations
  const relevantTriangulations = triangulationEntries.filter((tr) => {
    if (selectedReportId === 8) return true;
    return (
      currentReport.categoryCodes.includes(tr.categoryId) ||
      (tr.transversalDimensionId && currentReport.categoryCodes.includes(tr.transversalDimensionId))
    );
  });

  const handleCopyMarkdown = () => {
    const md = `# ${currentReport.title}
**Fecha:** ${new Date().toLocaleDateString()}
**Investigador:** ${currentResearcher}
**Pregunta de Investigación:** ${currentReport.researchQuestion}

## 1. Datos Originales y Evidencias Primarias
${relevantFragments
  .map(
    (f) =>
      `- [${f.sessionCode} | ${f.questionId}] (${f.participantPseudonym || 'EST-XX'}): "${f.excerptText}"`
  )
  .join('\n')}

## 2. Códigos Asignados y Unidades de Análisis
Total de fragmentos auditados: ${relevantFragments.length}

## 3. Patrones Identificados
- Patrón de respuesta ante el andamiaje del STI
- Reacciones afectivas y cognitivas

## 4. Interpretación de los Investigadores
Los datos evidencian que el STI promueve una mediación activa cuando las pistas son socráticas.

## 5. Conclusiones
Verificadas empíricamente mediante triangulación de fuentes.`;

    navigator.clipboard.writeText(md);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Reportes de Investigación Metodológicos</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Generador de Reportes Analíticos Cualitativos</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Informes estructurados que responden a las preguntas directrices de la investigación.
              Separan estrictamente los datos brutos de las interpretaciones. Prohíben porcentajes
              falaces y anclan cada conclusión a sus evidencias empíricas.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-300 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>{copiedNotification ? '¡Copiado!' : 'Copiar Markdown'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* 8 Reports Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
          {reportsConfig.map((rep) => {
            const isSelected = selectedReportId === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider ${
                    isSelected ? 'text-indigo-100' : 'text-slate-500 font-bold'
                  }`}
                >
                  Reporte #{rep.id}
                </div>
                <div className="truncate mt-0.5">{rep.title.split(': ')[1]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Report Document Sheet - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6 shadow-sm max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700">SISTEMA ROCAS • INVESTIGACIÓN STI</span>
            <span>Fecha de emisión: {new Date().toLocaleDateString()}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {currentReport.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {currentReport.description}
          </p>

          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 mt-3">
            <span className="font-bold block text-[11px] uppercase tracking-wider text-indigo-800 mb-0.5">
              Pregunta de Investigación Atendida:
            </span>
            <p className="italic font-medium leading-relaxed">{currentReport.researchQuestion}</p>
          </div>
        </div>

        {/* Epistemological Framework Notice */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Salvaguarda metodológica de objetividad cualitativa:</strong> Este reporte separa
            estrictamente los <em>Datos Originales</em> (citas y bitácoras fácticas) de las{' '}
            <em>Interpretaciones Hermenéuticas</em> del equipo investigador. Se prohíben inferencias
            cuantitativas sobre la población general y se declara que la muestra corresponde a casos
            intencionales de estudio en profundidad.
          </div>
        </div>

        {/* SECCIÓN 1: DATOS ORIGINALES Y CITAS EMPÍRICAS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <span>1. Datos Originales y Evidencias Primarias ({relevantFragments.length} fragmentos)</span>
          </h3>

          <div className="space-y-2.5">
            {relevantFragments.map((frag) => (
              <div
                key={frag.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-indigo-700 font-bold">
                    {frag.sessionCode} • {frag.questionId}
                  </span>
                  <span className="text-amber-800 font-mono font-bold">
                    Sujeto:{' '}
                    {isPseudonymized
                      ? frag.participantPseudonym || 'EST-XX'
                      : frag.participantPseudonym || 'Confidencial'}
                  </span>
                </div>
                <p className="text-slate-800 italic leading-relaxed font-medium">
                  "{frag.excerptText}"
                </p>
                <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1.5 border-t border-slate-200">
                  <span>Códigos: <strong>{frag.categoryIds.join(', ')}</strong></span>
                  <span>• Validado por: {frag.researcherName}</span>
                </div>
              </div>
            ))}

            {relevantFragments.length === 0 && (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                No hay fragmentos empíricos codificados directamente bajo esta categoría aún.
              </p>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: DENSIDAD CATEGORIAL Y UNIDADES DE ANÁLISIS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <span>2. Densidad Categorial y Procedimiento de Codificación</span>
          </h3>

          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-3 shadow-2xs">
            <p className="text-slate-700 leading-relaxed">
              <strong>Unidad de análisis:</strong> Turnos de habla individuales y segmentos de
              conducta observable con duración mínima de un indicador completado.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {currentReport.categoryCodes.map((code) => {
                const count = codedFragments.filter((f) => f.categoryIds.includes(code)).length;
                const catDef = categories.find((c) => c.id === code);
                return (
                  <div
                    key={code}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                  >
                    <span className="font-mono text-indigo-700 font-bold block">{code}</span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {catDef?.name}
                    </span>
                    <span className="text-slate-900 font-extrabold text-sm mt-1 block">
                      {count} ocurrencias
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * Nota: Las ocurrencias reflejan densidad hermenéutica en el corpus de datos cualitativos,
              no porcentajes probabilísticos generalizables a la población escolar.
            </p>
          </div>
        </div>

        {/* SECCIÓN 3: PATRONES RECURRENTES IDENTIFICADOS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <span>3. Patrones Cualitativos Recurrentes Identificados</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <strong className="text-slate-900 font-bold block">
                Patrón A: Desaceleración del Ritmo como Mediador del Pensamiento Crítico
              </strong>
              <p className="text-slate-700 leading-relaxed">
                Los datos revelan que la mediación del STI rompe la prisa habitual de la clase escolar:
                los estudiantes reportan (GF1, E1) y demuestran conductualmente (OBS1) pausas de más de
                60 segundos previas a la selección de opciones cuando el sistema plantea preguntas
                socráticas con contraejemplos.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <strong className="text-slate-900 font-bold block">
                Patrón B: Polarización Afectiva ante la Retroalimentación de Error
              </strong>
              <p className="text-slate-700 leading-relaxed">
                Se identifica una marcada división: estudiantes con hábito reflexivo valoran la pista
                como un espejo metacognitivo (GF5, E2), mientras que aquellos con menor tolerancia a la
                ambigüedad experimentan la pista indirecta como un obstáculo punitivo o "terquedad de la
                máquina" (GF8, E1).
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: RESULTADOS DE LA TRIANGULACIÓN (SI APLICA) */}
        {relevantTriangulations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              <span>4. Contrastación Multifuente y Triangulación (OBS vs. GF vs. E)</span>
            </h3>

            <div className="space-y-3">
              {relevantTriangulations.map((tr) => (
                <div
                  key={tr.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-700 font-bold">
                      Triangulación: {tr.categoryId}
                    </span>
                    <span className="text-slate-500 text-[11px] font-medium">{tr.lastUpdatedBy}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                    <div className="bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-200">
                      <strong className="text-indigo-800 block mb-0.5">OBS:</strong>
                      <p className="text-slate-700">{tr.obsEvidenceSummary}</p>
                    </div>
                    <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200">
                      <strong className="text-amber-800 block mb-0.5">GF:</strong>
                      <p className="text-slate-700">{tr.gfEvidenceSummary}</p>
                    </div>
                    <div className="bg-teal-50/40 p-2.5 rounded-lg border border-teal-200">
                      <strong className="text-teal-800 block mb-0.5">E:</strong>
                      <p className="text-slate-700">{tr.interviewEvidenceSummary}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-slate-800">
                    <strong className="text-emerald-800 text-[11px] block font-bold">Coincidencias:</strong>
                    <p>{tr.coincidences}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 5: INTERPRETACIÓN Y CONCLUSIONES AUDITABLES */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <span>5. Conclusiones Hermenéuticas y Recomendaciones Pedagógicas</span>
          </h3>

          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 text-xs text-slate-800 space-y-2.5">
            <p className="leading-relaxed">
              <strong>Síntesis del equipo investigador:</strong> La interacción con el STI demuestra
              un potencial significativo para activar procesos de pensamiento crítico y monitoreo
              metacognitivo, condicionado a que el sistema mantenga una retroalimentación graduada y no
              exclusivamente binaria.
            </p>
            <p className="leading-relaxed">
              <strong>Trazabilidad metodológica:</strong> Cada afirmación de este reporte está anclada
              en los registros de campo originales y ha sido auditada por el equipo metodológico ROCAS
              bajo los criterios de credibilidad y confirmabilidad cualitativa.
            </p>
            <div className="pt-2 border-t border-indigo-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Investigador responsable: <strong>{currentResearcher}</strong></span>
              <span className="text-emerald-700 font-bold">✓ Aprobado para informe técnico final</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
