import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EventType, User, WorkEvent } from '../types';
import {
  EVENT_TYPES,
  DOWNTIME_REASONS,
  EVENT_TYPE_COLORS,
  getTodayDateString,
  calculateDurationMinutes,
  calculateDurationSeconds,
  formatMinutes,
  formatDuration,
  STANDARD_WORKDAY_MINUTES,
  STANDARD_WORKDAY_SECONDS,
  formatDate,
  formatDateTime,
  formatTime,
} from '../lib/utils';
import { DowntimeReportModal } from './DowntimeReportModal';
import {
  Activity,
  Play,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Info,
  ShieldAlert,
  Paperclip,
  FileText,
  Flame,
  ArrowUpRight,
  User as UserIcon,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { events, users, setActiveTab } = useApp();

  // Selected date filter (default today)
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [reportModalEvent, setReportModalEvent] = useState<WorkEvent | null>(null);

  // Active users only
  const activeUsers = users.filter((u) => u.active);

  // Day's downtime events
  const dayEvents = events.filter((e) => {
    const eDate = e.startDateTime.slice(0, 10);
    return eDate === selectedDate;
  });

  // KPI 1: Total eventos registrados hoy
  const totalDowntimeEventsCount = dayEvents.length;

  // KPI 2: Eventos activos en curso hoy
  const activeEvents = dayEvents.filter((e) => e.status === 'IN_PROGRESS');
  const activeEventsCount = activeEvents.length;

  // KPI 3: Sum of downtime seconds across team today
  let totalTeamDowntimeSeconds = 0;
  let totalEvidencesCount = 0;
  const downtimeReasonsMap: { [reason: string]: number } = {};

  const userMetricsMap: {
    [userId: string]: {
      user: User;
      downtimeSeconds: number;
      percentage: number;
      netOperativeSeconds: number;
      netOperativePercentage: number;
      eventsCount: number;
      activeNow: boolean;
      events: typeof dayEvents;
    };
  } = {};

  for (const u of activeUsers) {
    userMetricsMap[u.id] = {
      user: u,
      downtimeSeconds: 0,
      percentage: 0,
      netOperativeSeconds: STANDARD_WORKDAY_SECONDS,
      netOperativePercentage: 100,
      eventsCount: 0,
      activeNow: false,
      events: [],
    };
  }

  for (const ev of dayEvents) {
    const secs = calculateDurationSeconds(ev.startDateTime, ev.endDateTime, ev.status);
    totalTeamDowntimeSeconds += secs;

    const reasonKey = ev.downtimeReason || ev.type;
    downtimeReasonsMap[reasonKey] = (downtimeReasonsMap[reasonKey] || 0) + secs;

    if (ev.evidences) {
      totalEvidencesCount += ev.evidences.length;
    }

    if (userMetricsMap[ev.userId]) {
      userMetricsMap[ev.userId].downtimeSeconds += secs;
      userMetricsMap[ev.userId].eventsCount += 1;
      userMetricsMap[ev.userId].events.push(ev);
      if (ev.status === 'IN_PROGRESS') {
        userMetricsMap[ev.userId].activeNow = true;
      }
    }
  }

  // Calculate percentages for each user
  const userMetricsList = Object.values(userMetricsMap).map((item) => {
    let pct = Math.min(100, Math.round((item.downtimeSeconds / STANDARD_WORKDAY_SECONDS) * 100 * 10) / 10);
    if (item.downtimeSeconds > 0 && pct === 0) pct = 0.1;
    const netSecs = Math.max(0, STANDARD_WORKDAY_SECONDS - item.downtimeSeconds);
    const netPct = Math.max(0, Math.round((100 - pct) * 10) / 10);
    return {
      ...item,
      percentage: pct,
      netOperativeSeconds: netSecs,
      netOperativePercentage: netPct,
    };
  });

  // Team Workday Capacity (8h = 28.800s per employee)
  const totalTeamCapacitySeconds = activeUsers.length * STANDARD_WORKDAY_SECONDS;
  let teamDowntimePercentage =
    totalTeamCapacitySeconds > 0
      ? Math.round((totalTeamDowntimeSeconds / totalTeamCapacitySeconds) * 100 * 10) / 10
      : 0;
  if (totalTeamDowntimeSeconds > 0 && teamDowntimePercentage === 0) teamDowntimePercentage = 0.1;
  const teamOperativeSeconds = Math.max(0, totalTeamCapacitySeconds - totalTeamDowntimeSeconds);
  const teamOperativePercentage = Math.max(0, Math.round((100 - teamDowntimePercentage) * 10) / 10);

  // Distribution of downtime by Type
  const typeSecondsMap: Record<string, number> = {};
  for (const t of EVENT_TYPES) {
    typeSecondsMap[t] = 0;
  }

  for (const ev of dayEvents) {
    const secs = calculateDurationSeconds(ev.startDateTime, ev.endDateTime, ev.status);
    if (typeSecondsMap[ev.type] !== undefined) {
      typeSecondsMap[ev.type] += secs;
    } else {
      typeSecondsMap['Otro'] = (typeSecondsMap['Otro'] || 0) + secs;
    }
  }

  // Donut chart calculations
  const totalSecondsForChart = Math.max(1, totalTeamDowntimeSeconds);
  let accumulatedAngle = 0;
  const donutSlices = EVENT_TYPES.map((type) => {
    const secs = typeSecondsMap[type] || 0;
    const pct = totalTeamDowntimeSeconds > 0 ? (secs / totalTeamDowntimeSeconds) * 100 : 0;
    const angle = (secs / totalSecondsForChart) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      type,
      seconds: secs,
      percentage: Math.round(pct * 10) / 10,
      startAngle,
      angle,
      colorHex: (EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS['Otro']).hex,
    };
  }).filter((slice) => slice.seconds > 0);

  const createDonutPath = (
    centerX: number,
    centerY: number,
    radius: number,
    innerRadius: number,
    startAngleDeg: number,
    angleDeg: number
  ) => {
    if (angleDeg >= 360) {
      return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 0 ${
        centerX + radius
      } ${centerY} A ${radius} ${radius} 0 1 0 ${centerX - radius} ${centerY} M ${
        centerX - innerRadius
      } ${centerY} A ${innerRadius} ${innerRadius} 0 1 1 ${
        centerX + innerRadius
      } ${centerY} A ${innerRadius} ${innerRadius} 0 1 1 ${
        centerX - innerRadius
      } ${centerY} Z`;
    }

    const startRad = ((startAngleDeg - 90) * Math.PI) / 180.0;
    const endRad = ((startAngleDeg + angleDeg - 90) * Math.PI) / 180.0;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);

    const largeArc = angleDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Monitoreo de Horas Fuera de Operación</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard de Tiempos Muertos y Disponibilidad
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cálculo contra base de <strong>8 horas laborales (480 minutos)</strong> por empleado para contrastar desvíos e indisponibilidad.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <span className="text-xs font-semibold text-slate-600">Fecha de Análisis:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Clean Zero Records State Banner */}
      {dayEvents.length === 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold text-indigo-950">Aplicación limpia sin registros en esta fecha:</span>{' '}
              <span className="text-indigo-800">
                El equipo cuenta con el 100% de disponibilidad horaria operativa ({formatDuration(totalTeamCapacitySeconds)}).
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('new-event')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            Ir a Registrar Tiempo
          </button>
        </div>
      )}

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Tiempo Muerto del Equipo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tiempo Muerto Total Hoy
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatDuration(totalTeamDowntimeSeconds)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suma de desvíos e incidencias registradas
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, teamDowntimePercentage)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Porcentaje de Jornada en Tiempo Muerto */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              % Tiempo Muerto del Equipo
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 tracking-tight">
              {teamDowntimePercentage}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              de la jornada (8h)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fórmula: (Tiempo Muerto / 28.800s) × 100
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, teamDowntimePercentage)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Tiempo Operativo Neto Resultante */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tiempo Operativo Neto
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">
              {teamOperativePercentage}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              efectivo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {formatDuration(teamOperativeSeconds)} disponibles para producción
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, teamOperativePercentage)}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Eventos y Activos En Curso */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Eventos Registrados
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totalDowntimeEventsCount}
            </span>
            {activeEventsCount > 0 ? (
              <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                ● {activeEventsCount} en curso
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                finalizados
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalEvidencesCount} evidencias gráficas adjuntas
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* TEAM WORKDAY COMPARISON BAR (480 minutos) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Contraste General de la Jornada Laboral (Base: 8 Horas / 480 Minutos)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Relación directa entre las horas netas disponibles para la operación y los tiempos muertos registrados.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            Capacidad del Equipo: {formatDuration(totalTeamCapacitySeconds)}
          </div>
        </div>

        <div className="w-full h-8 rounded-xl bg-slate-100 overflow-hidden flex shadow-inner border border-slate-200 p-0.5">
          <div
            style={{ width: `${Math.min(100, teamDowntimePercentage)}%` }}
            className="h-full bg-rose-500 rounded-l-lg transition-all duration-500 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden px-1"
            title={`Tiempo Muerto: ${formatDuration(totalTeamDowntimeSeconds)} (${teamDowntimePercentage}%)`}
          >
            {teamDowntimePercentage > 8 && `${teamDowntimePercentage}%`}
          </div>
          <div
            style={{ width: `${Math.max(0, 100 - teamDowntimePercentage)}%` }}
            className="h-full bg-emerald-500 rounded-r-lg transition-all duration-500 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden px-1"
            title={`Tiempo Operativo Neto: ${formatDuration(teamOperativeSeconds)} (${teamOperativePercentage}%)`}
          >
            {teamOperativePercentage > 15 && `Operativo: ${teamOperativePercentage}% (${formatDuration(teamOperativeSeconds)})`}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 mt-2 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>Tiempos Muertos e Incidencias: <strong>{formatDuration(totalTeamDowntimeSeconds)}</strong> ({teamDowntimePercentage}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Tiempo Operativo Neto: <strong>{formatDuration(teamOperativeSeconds)}</strong> ({teamOperativePercentage}%)</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW: DISTRIBUTION & REASONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donut Chart: Distribución por Tipo de Tiempo Muerto */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <span>Distribución por Tipo de Tiempo Muerto</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Proporción de tiempo consumido por cada categoría de indisponibilidad.
            </p>

            {totalTeamDowntimeSeconds === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  No se registraron tiempos muertos para la fecha seleccionada.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                {/* SVG Donut */}
                <div className="relative w-44 h-44 shrink-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {donutSlices.map((slice, idx) => {
                      const path = createDonutPath(100, 100, 90, 56, slice.startAngle, slice.angle);
                      return (
                        <path
                          key={idx}
                          d={path}
                          fill={slice.colorHex}
                          className="hover:opacity-85 transition-opacity cursor-pointer"
                        >
                          <title>{`${slice.type}: ${formatDuration(slice.seconds)} (${slice.percentage}%)`}</title>
                        </path>
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900">
                      {formatDuration(totalTeamDowntimeSeconds)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Total Muerto
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 w-full max-w-xs">
                  {donutSlices.map((slice, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: slice.colorHex }}
                        />
                        <span className="text-slate-700 font-medium truncate">{slice.type}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-900 font-bold">{formatDuration(slice.seconds)}</span>
                        <span className="text-slate-400 text-[11px]">({slice.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motivos Específicos / Causas Raíz Más Frecuentes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Causas Raíz de Tiempo Muerto</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Minutos y segundos perdidos ordenados por motivo de contingencia o problema.
            </p>

            {Object.keys(downtimeReasonsMap).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  No hay incidentes reportados en esta fecha.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(downtimeReasonsMap)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([reason, secs], idx) => {
                    const pctOfTotal = Math.round((secs / totalSecondsForChart) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate pr-2">
                            {reason}
                          </span>
                          <span className="font-bold text-rose-600 shrink-0">
                            {formatDuration(secs)} ({pctOfTotal}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${pctOfTotal}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE VISUAL DE LAS 8 HORAS POR EMPLEADO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Timeline de la Jornada Laboral (08:00 a 16:00 / 8 Horas)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualización cronológica de bloques de tiempo muerto (rojo/color) vs tiempo operativo disponible (verde). Haz clic en un bloque para ver el acta o comprobante.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Operativo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Tiempo Muerto
            </span>
          </div>
        </div>

        {/* Timeline Header (Hour Marks from 08:00 to 16:00) */}
        <div className="relative w-full h-6 border-b border-slate-200 mb-3 text-[10px] text-slate-400 font-mono hidden sm:flex justify-between px-2">
          <span>08:00</span>
          <span>09:00</span>
          <span>10:00</span>
          <span>11:00</span>
          <span>12:00</span>
          <span>13:00</span>
          <span>14:00</span>
          <span>15:00</span>
          <span>16:00</span>
        </div>

        {/* Timeline Bars by User */}
        <div className="space-y-4">
          {userMetricsList.map(({ user, downtimeSeconds, percentage, netOperativeSeconds, netOperativePercentage, events: uEvents }) => {
            const shiftStartMinutes = 8 * 60; // 08:00 = 480 min
            const shiftDuration = 8 * 60;    // 480 min

            return (
              <div key={user.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{user.name} {user.lastName}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {user.legajo}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">• {user.department}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-600">
                      {percentage}% tiempo muerto ({formatDuration(downtimeSeconds)})
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-emerald-600">
                      {netOperativePercentage}% operativo ({formatDuration(netOperativeSeconds)})
                    </span>
                  </div>
                </div>

                {/* Timeline Bar Container */}
                <div className="relative w-full h-7 rounded-lg bg-emerald-500 overflow-hidden shadow-2xs">
                  {/* Overlay downtime event blocks */}
                  {uEvents.map((ev) => {
                    const startD = new Date(ev.startDateTime);
                    const endD = ev.status === 'IN_PROGRESS' || !ev.endDateTime ? new Date() : new Date(ev.endDateTime);

                    const startMins = startD.getHours() * 60 + startD.getMinutes();
                    const endMins = endD.getHours() * 60 + endD.getMinutes();

                    // Relative to 08:00
                    const relStart = Math.max(0, Math.min(shiftDuration, startMins - shiftStartMinutes));
                    const relEnd = Math.max(0, Math.min(shiftDuration, endMins - shiftStartMinutes));
                    const blockDuration = Math.max(10, relEnd - relStart);

                    const leftPct = (relStart / shiftDuration) * 100;
                    const widthPct = Math.min(100 - leftPct, (blockDuration / shiftDuration) * 100);

                    const colors = EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS['Otro'];

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setReportModalEvent(ev)}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(2, widthPct)}%`,
                        }}
                        className={`absolute top-0 bottom-0 ${colors.bg} hover:brightness-110 border-r border-white/40 transition-all cursor-pointer flex items-center justify-center text-[10px] text-white font-bold px-1 overflow-hidden group shadow-xs`}
                        title={`${ev.type} (${formatTime(ev.startDateTime)} - ${ev.status === 'IN_PROGRESS' ? 'En curso' : formatTime(ev.endDateTime)}): ${ev.comments || ev.downtimeReason || ''} - Clic para ver comprobante`}
                      >
                        <span className="truncate group-hover:underline">
                          {ev.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEAM BREAKDOWN TABLE (Porcentaje de Uso Diario / 8hs) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Rendimiento y Tiempo Muerto por Colaborador</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cálculo individual de porcentaje de tiempo muerto de la jornada de 8 horas (480 minutos) y horas operativas netas resultantes.
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {activeUsers.length} colaboradores activos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3.5 px-6">Empleado / Legajo</th>
                <th className="py-3.5 px-6">Departamento</th>
                <th className="py-3.5 px-6 text-center">Eventos Hoy</th>
                <th className="py-3.5 px-6 text-right">Tiempo Muerto (min/seg)</th>
                <th className="py-3.5 px-6 text-right">% Tiempo Muerto (8h)</th>
                <th className="py-3.5 px-6 text-right">Tiempo Operativo Neto</th>
                <th className="py-3.5 px-6 text-center">Estado Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {userMetricsList.map(({ user, downtimeSeconds, percentage, netOperativeSeconds, netOperativePercentage, eventsCount, activeNow }) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {user.name[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{user.name} {user.lastName}</div>
                        <div className="text-[11px] font-mono text-slate-400">Legajo: {user.legajo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {user.department}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                      {eventsCount}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                    {formatDuration(downtimeSeconds)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`font-mono font-black text-sm ${percentage > 25 ? 'text-rose-600' : percentage > 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {percentage}%
                      </span>
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="text-emerald-700 font-bold">
                      {formatDuration(netOperativeSeconds)} ({netOperativePercentage}%)
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {activeNow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        En Tiempo Muerto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        En Operación
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalEvent && (
        <DowntimeReportModal
          event={reportModalEvent}
          onClose={() => setReportModalEvent(null)}
        />
      )}
    </div>
  );
};
