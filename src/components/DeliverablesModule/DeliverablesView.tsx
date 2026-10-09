import React, { useState } from 'react';
import { DELIVERABLES_DATA, DeliverableSection } from '../../data/deliverablesContent';
import {
  BookOpen,
  Search,
  CheckCircle,
  Copy,
  Printer,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  FileText
} from 'lucide-react';

export const DeliverablesView: React.FC = () => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    DELIVERABLES_DATA[0].id
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedDeliverable =
    DELIVERABLES_DATA.find((d) => d.id === selectedSectionId) || DELIVERABLES_DATA[0];

  const filteredDeliverables = DELIVERABLES_DATA.filter((d) => {
    return (
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.contentMarkdown.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `# ${selectedDeliverable.title}\n## ${selectedDeliverable.subtitle}\n\n${selectedDeliverable.contentMarkdown}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSimpleMarkdown = (content: string) => {
    const lines = content.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];

    const elements: React.ReactNode[] = [];

    const flushTable = (key: number) => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(2); // Skip separator row

        elements.push(
          <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="px-3 py-2.5 text-left font-bold text-slate-900">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2.5 leading-relaxed">
                        {cell.trim().startsWith('**') && cell.trim().endsWith('**') ? (
                          <strong className="text-slate-900 font-bold">{cell.trim().replace(/\*\*/g, '')}</strong>
                        ) : cell.trim().startsWith('*[Ficticio]*') ? (
                          <span className="italic text-amber-800 font-medium">{cell.trim()}</span>
                        ) : (
                          cell.trim()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      // Table check
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cells = line
          .trim()
          .slice(1, -1)
          .split('|');
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable(index);
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={index}
            className="text-base sm:text-lg font-bold text-slate-900 mt-6 mb-2 border-b border-slate-200 pb-1.5 flex items-center gap-2"
          >
            <span className="w-1.5 h-4 bg-indigo-600 rounded"></span>
            <span>{line.replace('### ', '')}</span>
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={index} className="text-sm font-bold text-indigo-700 mt-4 mb-1.5">
            {line.replace('#### ', '')}
          </h4>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={index} className="text-xs sm:text-sm text-slate-700 ml-5 list-disc leading-relaxed my-0.5">
            {line.replace('- ', '')}
          </li>
        );
      } else if (line.startsWith('```')) {
        // preformatted block
        elements.push(
          <pre
            key={index}
            className="p-3 my-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-indigo-800 overflow-x-auto leading-relaxed"
          >
            {line.replace(/```/g, '')}
          </pre>
        );
      } else if (line.trim() === '---') {
        elements.push(<hr key={index} className="my-5 border-slate-200" />);
      } else if (line.trim().length > 0) {
        elements.push(
          <p key={index} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
            {line}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Dossier Metodológico Completo</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Entregables Metodológicos del Sistema ROCAS (1 al 8)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Consulte aquí la fundamentación y especificación formal de los 8 entregables metodológicos:
              Especificación Funcional, Matriz Maestra de Categorías, Modelo de Datos, Flujos de Trabajo,
              Diseño de Interfaces, Reglas de Análisis, Plan de Pruebas y Preguntas Metodológicas Pendientes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-300 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>{copied ? '¡Copiado!' : 'Copiar Entregable'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Table of Contents & Reader Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table of contents sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 sticky top-24 shadow-sm">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el dossier..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            {filteredDeliverables.map((item) => {
              const isSelected = selectedSectionId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedSectionId(item.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
                  }`}
                >
                  <div>
                    <span
                      className={`font-bold block text-[11px] ${
                        isSelected ? 'text-indigo-700' : 'text-slate-500'
                      }`}
                    >
                      Entregable #{item.number}
                    </span>
                    <strong className="block text-slate-900 text-xs mt-0.5 leading-snug">
                      {item.title.replace(`Entregable ${item.number}. `, '')}
                    </strong>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                      isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Reader Sheet - Light Theme */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-slate-800">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              Entregable Oficial #{selectedDeliverable.number}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              {selectedDeliverable.title}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-700 font-semibold mt-1">
              {selectedDeliverable.subtitle}
            </p>
            <div className="text-xs text-slate-600 mt-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
              <strong>Síntesis del entregable:</strong> {selectedDeliverable.summary}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2">
            {renderSimpleMarkdown(selectedDeliverable.contentMarkdown)}
          </div>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>SISTEMA ROCAS • Versión Metodológica Oficial 1.0</span>
            <span className="text-indigo-600 font-semibold">
              Entregable {selectedDeliverable.number} de {DELIVERABLES_DATA.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
