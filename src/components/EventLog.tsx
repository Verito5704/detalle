import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EventType, WorkEvent } from '../types';
import {
  EVENT_TYPES,
  EVENT_TYPE_COLORS,
  formatDateTime,
  formatMinutes,
  formatDuration,
  calculateDurationMinutes,
  calculateDurationSeconds,
  exportEventsToCSV,
} from '../lib/utils';
import { DowntimeReportModal } from './DowntimeReportModal';
import {
  Search,
  Download,
  Filter,
  Calendar,
  Tag,
  User as UserIcon,
  Trash2,
  Clock,
  FileSpreadsheet,
  X,
  Play,
  Square,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Paperclip,
  ExternalLink,
} from 'lucide-react';

export const EventLog: React.FC = () => {
  const { events, users, deleteEvent, finishActiveEvent } = useApp();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLegajo, setSelectedLegajo] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onlyDowntime, setOnlyDowntime] = useState(false);
  const [onlyEvidence, setOnlyEvidence] = useState(false);

  // Selected event for modal preview or report
  const [inspectEvent, setInspectEvent] = useState<WorkEvent | null>(null);
  const [reportEvent, setReportEvent] = useState<WorkEvent | null>(null);

  // Filter logic
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Free text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = e.userName.toLowerCase().includes(query);
        const matchesLegajo = e.legajo.toLowerCase().includes(query);
        const matchesComments = (e.comments || '').toLowerCase().includes(query);
        const matchesType = e.type.toLowerCase().includes(query);
        const matchesTicket = (e.ticketNumber || '').toLowerCase().includes(query);
        const matchesReason = (e.downtimeReason || '').toLowerCase().includes(query);
        if (!matchesName && !matchesLegajo && !matchesComments && !matchesType && !matchesTicket && !matchesReason) {
          return false;
        }
      }

      // Legajo filter
      if (selectedLegajo && e.legajo !== selectedLegajo) {
        return false;
      }

      // Event type filter
      if (selectedType !== 'ALL' && e.type !== selectedType) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const eventDate = e.startDateTime.slice(0, 10);
        if (eventDate < startDate) return false;
      }
      if (endDate) {
        const eventDate = e.startDateTime.slice(0, 10);
        if (eventDate > endDate) return false;
      }

      // Downtime only
      if (onlyDowntime) {
        const isDT = e.isDowntime || e.type === 'Incidencia Técnica';
        if (!isDT) return false;
      }

      // Evidence only
      if (onlyEvidence) {
        if (!e.evidences || e.evidences.length === 0) return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedLegajo, selectedType, startDate, endDate, onlyDowntime, onlyEvidence]);

  // Total duration of filtered events
  const totalFilteredSeconds = useMemo(() => {
    return filteredEvents.reduce((acc, ev) => {
      return acc + calculateDurationSeconds(ev.startDateTime, ev.endDateTime, ev.status);
    }, 0);
  }, [filteredEvents]);

  // Total downtime seconds in filtered set
  const totalDowntimeSeconds = useMemo(() => {
    return filteredEvents
      .filter((e) => e.isDowntime || e.type === 'Incidencia Técnica')
      .reduce((acc, ev) => acc + calculateDurationSeconds(ev.startDateTime, ev.endDateTime, ev.status), 0);
  }, [filteredEvents]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLegajo('');
    setSelectedType('ALL');
    setStartDate('');
    setEndDate('');
    setOnlyDowntime(false);
    setOnlyEvidence(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedLegajo || selectedType !== 'ALL' || startDate || endDate || onlyDowntime || onlyEvidence
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Log General de Registros Operativos & Evidencias
            </h1>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Vista Exclusiva Administrador
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditoría completa de actividades, desvíos, tiempo muerto e incidencias con capturas de evidencia adjuntas.
          </p>
        </div>

        {/* Export to CSV Action */}
        <button
          onClick={() => exportEventsToCSV(filteredEvents)}
          disabled={filteredEvents.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          title="Exportar listado a formato CSV compatible con Excel"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV ({filteredEvents.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filtros de Búsqueda y Segmentación</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Buscar texto libre o Ticket IT
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Nombre, legajo, ticket o motivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Legajo / Employee Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Colaborador (Legajo)
            </label>
            <div className="relative">
              <UserIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <select
                value={selectedLegajo}
                onChange={(e) => setSelectedLegajo(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
              >
                <option value="">Todos los colaboradores</option>
                {users.map((u) => (
                  <option key={u.id} value={u.legajo}>
                    {u.name} {u.lastName} ({u.legajo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tipo de Evento
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
              >
                <option value="ALL">Todos los tipos</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter Range */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Rango de Fechas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Fecha desde"
                className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Fecha hasta"
                className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Quick Filter Pills: Downtime & Evidence */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Filtros rápidos de auditoría:</span>
          <button
            type="button"
            onClick={() => setOnlyDowntime(!onlyDowntime)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              onlyDowntime
                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 Solo Tiempo Muerto / Contingencias</span>
          </button>
          <button
            type="button"
            onClick={() => setOnlyEvidence(!onlyEvidence)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              onlyEvidence
                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>📷 Con Evidencias Adjuntas</span>
          </button>
        </div>

        {/* Active Filters Summary */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Mostrando <strong>{filteredEvents.length}</strong> de <strong>{events.length}</strong> eventos registrados
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
              Tiempo total: <strong>{formatDuration(totalFilteredSeconds)}</strong>
            </span>
            <span className="font-mono bg-rose-50 border border-rose-200 px-2.5 py-1 rounded text-rose-800 font-semibold">
              Tiempo Muerto: <strong>{formatDuration(totalDowntimeSeconds)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Empleado & Legajo</th>
                <th className="py-3.5 px-4">Tipo & Clasificación</th>
                <th className="py-3.5 px-4">Inicio / Fin</th>
                <th className="py-3.5 px-4">Duración</th>
                <th className="py-3.5 px-4">Evidencias & Respaldo</th>
                <th className="py-3.5 px-4">Comentarios & Motivo</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="text-sm font-bold text-slate-700">Sin registros de tiempo muerto</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {events.length === 0
                        ? 'La aplicación se encuentra limpia sin registros previos. Puedes comenzar a registrar eventos desde el módulo "Registrar Tiempo".'
                        : 'No se encontraron eventos que coincidan con los filtros seleccionados.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const durationSecs = calculateDurationSeconds(ev.startDateTime, ev.endDateTime, ev.status);
                  const durationLabel = formatDuration(durationSecs);
                  const color = EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS['Otro'];
                  const isNow = ev.status === 'IN_PROGRESS';
                  const isDT = ev.isDowntime || ev.type === 'Incidencia Técnica';

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Empleado & Legajo */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{ev.userName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{ev.legajo}</div>
                      </td>

                      {/* Tipo & Clasificación */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border ${color.lightBg} ${color.text} ${color.border}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                            {ev.type}
                          </span>
                          {isDT && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.2 rounded">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                TIEMPO MUERTO
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Inicio / Fin */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700">
                        <div>{formatDateTime(ev.startDateTime, true)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isNow ? (
                            <span className="text-emerald-600 font-sans font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              En Curso
                            </span>
                          ) : (
                            formatDateTime(ev.endDateTime, true)
                          )}
                        </div>
                      </td>

                      {/* Duración */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-slate-900">
                        {durationLabel}
                      </td>

                      {/* Evidencias & Respaldo */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {ev.evidences && ev.evidences.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {ev.evidences.map((evi) => (
                                <img
                                  key={evi.id}
                                  src={evi.url}
                                  alt={evi.name}
                                  title={evi.name}
                                  className="w-7 h-7 object-cover rounded border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => setReportEvent(ev)}
                                />
                              ))}
                              <span className="text-[11px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                {ev.evidences.length} capturas
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Sin evidencias</span>
                          )}

                          {ev.ticketNumber && (
                            <div className="text-[11px] font-mono text-slate-600">
                              Ticket: <strong className="text-slate-800">{ev.ticketNumber}</strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Comentarios & Motivo */}
                      <td className="py-3.5 px-4 max-w-xs text-slate-600">
                        {ev.downtimeReason && (
                          <span className="block text-[11px] font-semibold text-rose-800 truncate mb-0.5">
                            {ev.downtimeReason}
                          </span>
                        )}
                        <p className="truncate" title={ev.comments}>
                          {ev.comments || '-'}
                        </p>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setReportEvent(ev)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver Acta Oficial de Descargo y Evidencias"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => setInspectEvent(ev)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Ver detalle del registro"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('¿Confirmas que deseas eliminar este registro de evento?')) {
                                deleteEvent(ev.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detalle de Evento */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Detalle del Registro</h3>
              </div>
              <button
                onClick={() => setInspectEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Empleado</span>
                  <strong className="text-slate-800 text-sm">{inspectEvent.userName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Legajo</span>
                  <strong className="text-slate-800 font-mono text-sm">{inspectEvent.legajo}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Tipo de Evento</span>
                  <span
                    className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full font-medium border ${
                      EVENT_TYPE_COLORS[inspectEvent.type]?.lightBg
                    } ${EVENT_TYPE_COLORS[inspectEvent.type]?.text} ${
                      EVENT_TYPE_COLORS[inspectEvent.type]?.border
                    }`}
                  >
                    {inspectEvent.type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Duración</span>
                  <strong className="text-slate-800 font-mono text-sm mt-1 block">
                    {formatMinutes(
                      calculateDurationMinutes(
                        inspectEvent.startDateTime,
                        inspectEvent.endDateTime,
                        inspectEvent.status
                      )
                    )}
                  </strong>
                </div>
              </div>

              {inspectEvent.downtimeReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="font-bold text-rose-900 text-[11px]">
                    🚨 Motivo de Tiempo Muerto: {inspectEvent.downtimeReason}
                  </div>
                  {inspectEvent.ticketNumber && (
                    <div className="text-[11px] text-rose-800 font-mono">
                      N° Ticket IT: {inspectEvent.ticketNumber}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Inicio:</span>
                  <span className="font-mono text-slate-800">{formatDateTime(inspectEvent.startDateTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fin:</span>
                  <span className="font-mono text-slate-800">
                    {inspectEvent.status === 'IN_PROGRESS' ? 'En Curso' : formatDateTime(inspectEvent.endDateTime)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block font-semibold mb-1">Comentarios y Observaciones:</span>
                <p className="bg-slate-50 p-3 rounded-xl text-slate-700 leading-relaxed border border-slate-100">
                  {inspectEvent.comments || 'Sin comentarios adicionales.'}
                </p>
              </div>

              {inspectEvent.evidences && inspectEvent.evidences.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-slate-500 block font-semibold">
                    Evidencias Adjuntas ({inspectEvent.evidences.length}):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {inspectEvent.evidences.map((evi) => (
                      <div
                        key={evi.id}
                        className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-2"
                      >
                        <img src={evi.url} alt={evi.name} className="w-10 h-10 object-cover rounded" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800 truncate">{evi.name}</p>
                          <p className="text-[10px] text-slate-400">{evi.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => {
                  setInspectEvent(null);
                  setReportEvent(inspectEvent);
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generar Acta Oficial</span>
              </button>
              <button
                onClick={() => setInspectEvent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Report Modal */}
      {reportEvent && (
        <DowntimeReportModal event={reportEvent} onClose={() => setReportEvent(null)} />
      )}
    </div>
  );
};
