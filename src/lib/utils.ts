import { EventType, WorkEvent, User, DowntimeReason } from '../types';

export const EVENT_TYPES: EventType[] = [
  'Incidencia Técnica',
  'Corte de Internet / VPN',
  'Falla de Hardware',
  'Pausa/Descanso',
  'Reunión',
  'Capacitación',
  'Espera de Asignación',
  'Otro',
];

export const DOWNTIME_REASONS: DowntimeReason[] = [
  'Caída de Sistema / CRM / Plataforma',
  'Corte de Internet / Red / VPN',
  'Falla de Hardware / PC / Headset',
  'Corte de Energía Eléctrica',
  'Espera de Asignación / Cola Vacía',
  'Bloqueo de Credenciales / Accesos',
  'Pausa Activa / Descanso',
  'Reunión Extraordinaria / Feedback',
  'Capacitación Fuera de Operación',
  'Instrucción de Supervisión / Fuera de Flujo',
  'Lentitud Severa / Degradación',
  'Otro Motivo de Tiempo Muerto',
];

export const EVENT_TYPE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string; lightBg: string; hex: string }
> = {
  'Incidencia Técnica': {
    bg: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
    lightBg: 'bg-rose-50 dark:bg-rose-950/40',
    hex: '#f43f5e',
  },
  'Corte de Internet / VPN': {
    bg: 'bg-amber-600',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/40',
    hex: '#d97706',
  },
  'Falla de Hardware': {
    bg: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-950/40',
    hex: '#f97316',
  },
  'Pausa/Descanso': {
    bg: 'bg-yellow-500',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
    lightBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    hex: '#eab308',
  },
  'Reunión': {
    bg: 'bg-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    hex: '#6366f1',
  },
  'Capacitación': {
    bg: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
    lightBg: 'bg-sky-50 dark:bg-sky-950/40',
    hex: '#0284c7',
  },
  'Espera de Asignación': {
    bg: 'bg-teal-500',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
    lightBg: 'bg-teal-50 dark:bg-teal-950/40',
    hex: '#14b8a6',
  },
  'Otro': {
    bg: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    lightBg: 'bg-purple-50 dark:bg-purple-950/40',
    hex: '#a855f7',
  },
  // Retrocompatible
  'Tarea Operativa': {
    bg: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    hex: '#10b981',
  },
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna fecha y hora local con segundos incluidos para precisión exacta
 * Formato: YYYY-MM-DDTHH:mm:ss
 */
export function getCurrentDateTimeLocal(includeSeconds = true): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return includeSeconds
    ? `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    : `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateTime(isoOrLocal: string, showSeconds = true): string {
  if (!isoOrLocal) return '-';
  const d = new Date(isoOrLocal);
  if (isNaN(d.getTime())) return isoOrLocal;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: false,
  }).format(d);
}

export function formatTime(isoOrLocal: string, showSeconds = true): string {
  if (!isoOrLocal) return '-';
  const d = new Date(isoOrLocal);
  if (isNaN(d.getTime())) return isoOrLocal;
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: false,
  }).format(d);
}

export function formatDate(isoOrLocal: string): string {
  if (!isoOrLocal) return '-';
  const d = new Date(isoOrLocal);
  if (isNaN(d.getTime())) return isoOrLocal;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Calcula la duración exacta en segundos (incluso para eventos menores a 1 minuto)
 */
export function calculateDurationSeconds(start: string, end: string, status?: string): number {
  if (!start) return 0;
  const startDate = new Date(start).getTime();
  const endDate = status === 'IN_PROGRESS' || !end ? Date.now() : new Date(end).getTime();
  if (isNaN(startDate) || isNaN(endDate)) return 0;
  const diffMs = Math.max(0, endDate - startDate);
  return Math.floor(diffMs / 1000);
}

/**
 * Calcula la duración en minutos (con soporte para decimales para no truncar a cero)
 */
export function calculateDurationMinutes(start: string, end: string, status?: string): number {
  const seconds = calculateDurationSeconds(start, end, status);
  if (seconds === 0) return 0;
  // Si dura menos de 60 segundos, devuelve la fracción exacta en décimas de minuto
  return Math.max(0.1, Math.round((seconds / 60) * 10) / 10);
}

/**
 * Formato comprensible en minutos y segundos
 * Ejemplos: "45 seg", "1 min 15 seg", "8h 12m 30s"
 */
export function formatDuration(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  if (secs === 0) return '0 seg';

  if (secs < 60) {
    return `${secs} seg`;
  }

  const hours = Math.floor(secs / 3600);
  const remainingSecs = secs % 3600;
  const minutes = Math.floor(remainingSecs / 60);
  const finalSecs = remainingSecs % 60;

  if (hours === 0) {
    return finalSecs > 0 ? `${minutes} min ${finalSecs} seg` : `${minutes} min`;
  }

  if (finalSecs > 0) {
    return `${hours}h ${minutes}m ${finalSecs}s`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Wrapper de compatibilidad que convierte minutos a formato legible de minutos y segundos
 */
export function formatMinutes(totalMinutes: number): string {
  const totalSeconds = Math.round(totalMinutes * 60);
  return formatDuration(totalSeconds);
}

/**
 * Jornada estándar de 8 horas = 480 minutos = 28.800 segundos
 */
export const STANDARD_WORKDAY_MINUTES = 480;
export const STANDARD_WORKDAY_SECONDS = 28800;

export function calculateUserDailyUsage(
  events: WorkEvent[],
  userId: string,
  targetDate: string // 'YYYY-MM-DD'
): {
  totalSeconds: number;
  totalMinutes: number;
  percentage: number; // % of 8hs (28800 sec)
  netOperativeSeconds: number;
  netOperativeMinutes: number;
  netOperativePercentage: number;
  eventsCount: number;
  activeNow: boolean;
  downtimeMinutes: number;
  downtimeSeconds: number;
  downtimeCount: number;
} {
  const userDayEvents = events.filter((e) => {
    if (e.userId !== userId) return false;
    const eventDate = e.startDateTime.slice(0, 10);
    return eventDate === targetDate;
  });

  let totalSeconds = 0;
  let activeNow = false;

  for (const ev of userDayEvents) {
    if (ev.status === 'IN_PROGRESS') {
      activeNow = true;
    }
    const secs = calculateDurationSeconds(ev.startDateTime, ev.endDateTime, ev.status);
    totalSeconds += secs;
  }

  const totalMinutes = Math.round((totalSeconds / 60) * 10) / 10;
  let percentage = Math.min(100, Math.round((totalSeconds / STANDARD_WORKDAY_SECONDS) * 100 * 10) / 10);
  if (totalSeconds > 0 && percentage === 0) {
    percentage = 0.1; // Para que tiempos de segundos siempre computen visualmente
  }

  const netOperativeSeconds = Math.max(0, STANDARD_WORKDAY_SECONDS - totalSeconds);
  const netOperativeMinutes = Math.round((netOperativeSeconds / 60) * 10) / 10;
  const netOperativePercentage = Math.max(0, Math.round((100 - percentage) * 10) / 10);

  return {
    totalSeconds,
    totalMinutes,
    percentage,
    netOperativeSeconds,
    netOperativeMinutes,
    netOperativePercentage,
    eventsCount: userDayEvents.length,
    activeNow,
    downtimeMinutes: totalMinutes,
    downtimeSeconds: totalSeconds,
    downtimeCount: userDayEvents.length,
  };
}

export function exportEventsToCSV(events: WorkEvent[]): void {
  const headers = [
    'ID Evento',
    'Legajo',
    'Empleado',
    'Tipo de Evento',
    'Motivo Detallado',
    'N° Ticket IT / Incidente',
    'Nivel Afectación',
    'Supervisor Notificado',
    'Inicio',
    'Fin',
    'Duración (segundos)',
    'Duración (minutos y segundos)',
    '% de Jornada (8hs = 28.800 seg)',
    'Estado',
    'Evidencias Adjuntas',
    'Comentarios y Justificación',
  ];

  const rows = events.map((e) => {
    const secs = calculateDurationSeconds(e.startDateTime, e.endDateTime, e.status);
    const durationFmt = formatDuration(secs);
    let pctOfShift = Math.round((secs / STANDARD_WORKDAY_SECONDS) * 100 * 10) / 10;
    if (secs > 0 && pctOfShift === 0) pctOfShift = 0.1;

    const safeComments = (e.comments || '').replace(/"/g, '""').replace(/\n/g, ' ');
    const reason = e.downtimeReason || e.type;
    const ticket = e.ticketNumber || '-';
    const impact = e.impactLevel || 'TOTAL';
    const sup = e.supervisorNotified ? `SÍ (${e.supervisorName || 'Informado'})` : 'NO';
    const evCount = e.evidences ? e.evidences.length : 0;

    return [
      `"${e.id}"`,
      `"${e.legajo}"`,
      `"${e.userName}"`,
      `"${e.type}"`,
      `"${reason}"`,
      `"${ticket}"`,
      `"${impact}"`,
      `"${sup}"`,
      `"${formatDateTime(e.startDateTime, true)}"`,
      e.status === 'IN_PROGRESS' ? '"En Curso"' : `"${formatDateTime(e.endDateTime, true)}"`,
      secs,
      `"${durationFmt}"`,
      `"${pctOfShift}%"`,
      `"${e.status === 'IN_PROGRESS' ? 'En Curso' : 'Completado'}"`,
      evCount,
      `"${safeComments}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `registro_tiempos_muertos_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
