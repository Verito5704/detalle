import React, { useState } from 'react';
import { WorkEvent } from '../types';
import {
  formatDateTime,
  formatMinutes,
  formatDuration,
  calculateDurationMinutes,
  calculateDurationSeconds,
  STANDARD_WORKDAY_SECONDS,
} from '../lib/utils';
import {
  FileText,
  Printer,
  Copy,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Image as ImageIcon,
  Building,
  User,
  Calendar,
  Clock,
  Download,
} from 'lucide-react';

interface DowntimeReportModalProps {
  event: WorkEvent;
  onClose: () => void;
}

export const DowntimeReportModal: React.FC<DowntimeReportModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const durationSecs = calculateDurationSeconds(event.startDateTime, event.endDateTime, event.status);
  const durationText = formatDuration(durationSecs);

  const handleCopySummary = () => {
    const text = `
========================================
COMPROBANTE DE TIEMPO MUERTO Y EVIDENCIA
========================================
Colaborador: ${event.userName} (Legajo: ${event.legajo})
Fecha/Hora Inicio: ${formatDateTime(event.startDateTime, true)}
Fecha/Hora Fin: ${event.status === 'IN_PROGRESS' ? 'En curso' : formatDateTime(event.endDateTime, true)}
Duración Total: ${durationText} (${durationSecs} segundos)
Motivo: ${event.downtimeReason || event.type}
N° Ticket IT / Incidencia: ${event.ticketNumber || 'N/A'}
Nivel de Afectación: ${event.impactLevel || 'TOTAL'}
Supervisor Notificado: ${event.supervisorNotified ? `SÍ (${event.supervisorName || 'Informado'})` : 'NO'}
Evidencias Adjuntas: ${event.evidences ? event.evidences.length : 0} archivo(s)
Detalle / Justificación:
"${event.comments}"
========================================
Generado en: Sistema de Registro de Eventos Diarios
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Acta de Evidencia de Tiempo Muerto & Desvío
              </h3>
              <p className="text-[11px] text-slate-400">
                Documento de descargo para auditoría, Workforce Management y Operaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Imprimir / Guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Copiar texto resumen"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 printable-report">
          {/* Official Letterhead */}
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                  INFORME DE CONTINGENCIA
                </span>
                <span className="text-[10px] font-mono bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200">
                  TIEMPO MUERTO NO PROGRAMADO
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Justificación de Desvío Operativo & Afectación
              </h2>
            </div>
            <div className="text-left sm:text-right text-[11px] text-slate-400 font-mono">
              <p>ID Registro: {event.id}</p>
              <p>Fecha Emisión: {formatDateTime(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Employee & Event Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Colaborador</span>
              <strong className="text-slate-900 font-medium">{event.userName}</strong>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Legajo</span>
              <strong className="text-slate-900 font-mono">{event.legajo}</strong>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Duración Afectada</span>
              <strong className="text-rose-700 font-mono text-sm">{durationText}</strong>
              <span className="text-[10px] text-slate-400 block font-mono">({durationSecs} segundos)</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Afectación</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                {event.impactLevel || 'Bloqueo Total'}
              </span>
            </div>
          </div>

          {/* Time & Outage Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Horarios del Incidente</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 font-mono">
                <span className="text-slate-500">Inicio de afectación:</span>
                <strong className="text-slate-800">{formatDateTime(event.startDateTime, true)}</strong>
              </div>
              <div className="flex justify-between py-1 font-mono">
                <span className="text-slate-500">Restablecimiento:</span>
                <strong className="text-slate-800">
                  {event.status === 'IN_PROGRESS' ? 'En Curso (Sin cierre)' : formatDateTime(event.endDateTime, true)}
                </strong>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gestión y Notificación</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Ticket IT / Incidente:</span>
                <strong className="font-mono text-blue-700">{event.ticketNumber || 'Sin N° de ticket'}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Supervisor informado:</span>
                <strong className="text-slate-800">
                  {event.supervisorNotified
                    ? `SÍ (${event.supervisorName || 'Informado'})`
                    : 'No registrado'}
                </strong>
              </div>
            </div>
          </div>

          {/* Downtime Reason Banner */}
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <strong className="text-rose-900 font-semibold">
                Causa Raíz / Motivo de Tiempo Muerto:
              </strong>
              <span className="text-rose-800 font-medium">
                {event.downtimeReason || event.type}
              </span>
            </div>
          </div>

          {/* Observations and Explanation */}
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-700 block">
              Detalle Operativo & Justificación del Colaborador:
            </label>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-sans">
              {event.comments || 'Sin comentarios registrados.'}
            </div>
          </div>

          {/* Evidence Attachments Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Evidencias Gráficas & Capturas Respaldatorias ({event.evidences ? event.evidences.length : 0})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Respaldo visual para justificar desvíos de adherencia
              </span>
            </div>

            {(!event.evidences || event.evidences.length === 0) ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-xs">
                No se adjuntaron capturas de pantalla a este evento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.evidences.map((evi) => (
                  <div
                    key={evi.id}
                    className="group border border-slate-200 rounded-xl p-2.5 bg-slate-50 hover:bg-white transition-all space-y-2"
                  >
                    <div
                      onClick={() => setEnlargedImage(evi.url)}
                      className="relative h-40 bg-slate-900 rounded-lg overflow-hidden cursor-zoom-in border border-slate-200 flex items-center justify-center"
                    >
                      <img
                        src={evi.url}
                        alt={evi.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <span>Clic para ampliar</span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2 text-[11px]">
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate" title={evi.name}>
                          {evi.name}
                        </p>
                        {evi.note && (
                          <p className="text-slate-500 text-[10px] mt-0.5 line-clamp-2">
                            {evi.note}
                          </p>
                        )}
                      </div>
                      {evi.size && (
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {evi.size}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signature / Validation Block */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
            <div className="border-t border-slate-300 pt-2">
              <p className="font-medium text-slate-700">{event.userName}</p>
              <p className="text-[10px] text-slate-400">Firma Colaborador (Legajo: {event.legajo})</p>
            </div>
            <div className="border-t border-slate-300 pt-2">
              <p className="font-medium text-slate-700">
                {event.supervisorName || 'Supervisor / Referente de Turno'}
              </p>
              <p className="text-[10px] text-slate-400">Visado y Validación de Desvío</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            {copied ? '✓ Resumen copiado al portapapeles' : 'Documento oficial con validez interna'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar para Teams / Correo'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* High-Res Image Enlargement Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 p-1 flex items-center gap-1 text-xs cursor-pointer"
            >
              <X className="w-5 h-5" /> <span>Cerrar (Esc)</span>
            </button>
            <img
              src={enlargedImage}
              alt="Evidencia Ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
