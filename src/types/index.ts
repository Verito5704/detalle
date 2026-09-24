export type Role = 'ADMIN' | 'USUARIO';

export type EventType =
  | 'Incidencia Técnica'
  | 'Corte de Internet / VPN'
  | 'Falla de Hardware'
  | 'Pausa/Descanso'
  | 'Reunión'
  | 'Capacitación'
  | 'Espera de Asignación'
  | 'Otro'
  | 'Tarea Operativa'; // Retrocompatible

export type DowntimeReason =
  | 'Caída de Sistema / CRM / Plataforma'
  | 'Corte de Internet / Red / VPN'
  | 'Falla de Hardware / PC / Headset'
  | 'Corte de Energía Eléctrica'
  | 'Espera de Asignación / Cola Vacía'
  | 'Bloqueo de Credenciales / Accesos'
  | 'Pausa Activa / Descanso'
  | 'Reunión Extraordinaria / Feedback'
  | 'Capacitación Fuera de Operación'
  | 'Instrucción de Supervisión / Fuera de Flujo'
  | 'Lentitud Severa / Degradación'
  | 'Otro Motivo de Tiempo Muerto';

export interface EvidenceItem {
  id: string;
  name: string;
  type: 'image' | 'link' | 'document';
  url: string; // Base64 data URL or external link
  uploadedAt: string;
  size?: string;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  legajo: string;
  role: Role;
  department: string;
  active: boolean;
  avatarUrl?: string;
  shiftHours?: number; // default 8
}

export interface WorkEvent {
  id: string;
  userId: string;
  userName: string;
  legajo: string;
  startDateTime: string; // ISO string 'YYYY-MM-DDTHH:mm'
  endDateTime: string;   // ISO string 'YYYY-MM-DDTHH:mm'
  type: EventType;
  comments: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  createdAt: string;
  // Campos de Tiempo Muerto y Evidencia
  isDowntime?: boolean;
  downtimeReason?: DowntimeReason;
  ticketNumber?: string; // N° de Ticket IT / Incidente / Jira
  impactLevel?: 'TOTAL' | 'PARCIAL'; // Bloqueo Total vs Parcial
  supervisorNotified?: boolean;
  supervisorName?: string;
  evidences?: EvidenceItem[];
}

export interface FilterState {
  date: string; // 'YYYY-MM-DD' or ''
  dateFrom: string;
  dateTo: string;
  legajo: string;
  type: EventType | 'ALL';
  searchTerm: string;
  onlyDowntime?: boolean;
  onlyWithEvidence?: boolean;
}
