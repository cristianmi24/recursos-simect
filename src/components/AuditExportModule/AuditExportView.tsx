import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Clock,
  User,
  FileJson,
  FileSpreadsheet,
  AlertOctagon,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const AuditExportView: React.FC = () => {
  const {
    auditLogs,
    isPseudonymized,
    setIsPseudonymized,
    exportProjectJson,
    importProjectJson,
    resetToSampleData,
    currentResearcher,
    codedFragments
  } = useProject();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const csvCell = (value: unknown) => {
    const content = String(value ?? '');
    const safeContent = /^[\u0000-\u0020]*[=+\-@]/.test(content) ? `'${content}` : content;
    return `"${safeContent.replace(/"/g, '""')}"`;
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch =
      log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.researcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const handleDownloadJson = () => {
    const jsonStr = exportProjectJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SISTEMA_ROCAS_STI_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsvFragments = () => {
    const headers = [
      'ID_Fragmento',
      'Codigo_Sesion',
      'Instrumento',
      'Indicador_Pregunta',
      'Seudonimo_Estudiante',
      'Cita_Textual_Evidencia',
      'Codigos_Asignados',
      'Dimensiones_Transversales',
      'Justificacion',
      'Estado_Revision',
      'Investigador',
      'Fecha'
    ];

    const rows = codedFragments.map((f) => [
      f.id,
      f.sessionCode,
      f.instrumentType,
      f.questionId,
      isPseudonymized ? f.participantPseudonym || 'EST-XX' : '[OCULTO]',
      f.excerptText,
      f.categoryIds.join(';'),
      (f.transversalDimensionIds || []).join(';'),
      f.justification,
      f.status,
      f.researcherName,
      f.dateCoded
    ].map(csvCell));

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ROCAS_FRAGMENTOS_CODIFICADOS_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 850 * 1024) {
      setImportStatus('El archivo supera el tamaño máximo permitido de 850 KB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importProjectJson(content);
      if (success) {
        setImportStatus('Se importaron las matrices analíticas; formularios y bitácora permanecen intactos.');
      } else {
        setImportStatus('❌ Error: El archivo no tiene el formato JSON válido del Sistema ROCAS.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Seguridad de Datos y Auditoría</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Trazabilidad Metodológica, Seudonimización y Exportación</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Eventos de auditoría atribuidos por el servidor y sin edición desde la aplicación. La bitácora apoya la trazabilidad, pero no sustituye copias de seguridad ni una revisión del texto exportado. Exportación para interoperabilidad con
              software CAQDAS (ATLAS.ti, MAXQDA, NVivo).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Descargar copia de seguridad completa del proyecto en JSON"
            >
              <FileJson className="w-4 h-4" />
              <span>Exportar JSON Completo</span>
            </button>

            <button
              onClick={handleDownloadCsvFragments}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Descargar matriz de fragmentos en formato CSV para CAQDAS o Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV CAQDAS</span>
            </button>
          </div>
        </div>

        {/* Pseudonymization & Security Banner */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Protocolo de Seudonimización Ética (Menores de Edad)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Captura únicamente seudónimos; no registres nombres reales. Revisa también el texto libre, que puede identificar a una persona por su contenido.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPseudonymized(!isPseudonymized)}
              aria-pressed={isPseudonymized}
              title={isPseudonymized ? 'Ocultar seudónimos en el CSV' : 'Mostrar seudónimos en el CSV'}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 text-xs transition-colors ${
                isPseudonymized
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
                {isPseudonymized ? 'Seudónimos visibles' : 'Seudónimos ocultos'}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
                <div className="text-slate-900 font-bold mb-1">Restaurar Matrices Analíticas</div>
              <p className="text-slate-600 text-[11px]">
                  Importe categorías, fragmentos y triangulaciones. Por seguridad, las sesiones y la bitácora no se restauran desde archivos.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer text-xs font-semibold transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Importar JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('¿Reiniciar las matrices analíticas a la estructura de muestra? Las sesiones y la bitácora de auditoría se conservarán.')) {
                    resetToSampleData();
                  }
                }}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors shadow-2xs"
                title="Reiniciar a datos de muestra"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {importStatus && (
          <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 text-center font-bold">
            {importStatus}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en la bitácora de auditoría..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none font-medium"
            >
              <option value="ALL">Todas las acciones</option>
              <option value="create_session">Creación de sesión</option>
              <option value="update_session">Actualización de sesión</option>
              <option value="delete_session">Retiro de sesión</option>
              <option value="create_code">Codificación de fragmento</option>
              <option value="review_code">Revisión de codificación</option>
              <option value="create_category">Creación de categoría</option>
              <option value="update_category">Modificación de categoría</option>
              <option value="triangulate">Triangulación</option>
              <option value="export_data">Exportación de datos</option>
            </select>
          </div>

          <div className="text-slate-500 text-[11px]">
            Total registros auditados: <strong>{filteredLogs.length}</strong> eventos
          </div>
        </div>

        {/* Log Entries List */}
        <div className="divide-y divide-slate-100 text-xs">
          {filteredLogs.map((log) => {
            const actionBadgeColor =
              log.action === 'create_session' || log.action === 'create_code'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : log.action === 'review_code' || log.action === 'triangulate'
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : log.action === 'update_category'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${actionBadgeColor}`}
                    >
                      {log.action}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Entidad: {log.entityType} ({log.entityId})
                    </span>
                  </div>
                  <p className="text-slate-900 text-xs leading-relaxed font-semibold">
                    {log.summary}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between text-[11px] text-slate-500 shrink-0">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3 h-3 text-slate-400" />
                    <strong className="text-slate-800">{log.researcher}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </span>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-10 text-center text-slate-400 italic">
              No hay eventos de auditoría para los filtros seleccionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
