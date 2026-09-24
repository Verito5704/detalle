import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { EventType, WorkEvent, DowntimeReason, EvidenceItem } from '../types';
import {
  EVENT_TYPES,
  DOWNTIME_REASONS,
  EVENT_TYPE_COLORS,
  getCurrentDateTimeLocal,
  formatDateTime,
  formatTime,
  formatMinutes,
  formatDuration,
  calculateDurationMinutes,
  calculateDurationSeconds,
  calculateUserDailyUsage,
  getTodayDateString,
  STANDARD_WORKDAY_MINUTES,
  STANDARD_WORKDAY_SECONDS,
} from '../lib/utils';
import {
  fileToBase64,
  formatFileSize,
  SAMPLE_EVIDENCE_CRM_ERROR,
  SAMPLE_EVIDENCE_NETWORK_OUTAGE,
} from '../lib/evidenceHelpers';
import { DowntimeReportModal } from './DowntimeReportModal';
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  Calendar,
  Tag,
  MessageSquare,
  User as UserIcon,
  Edit2,
  FileImage,
  Trash2,
  FileText,
  Paperclip,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Timer,
  ShieldCheck,
} from 'lucide-react';

export const EventForm: React.FC = () => {
  const { currentUser, addEvent, events, updateEvent, updateUser, deleteEvent, showToast } = useApp();

  // Find if current user currently has an active downtime event in progress
  const activeEvent = events.find(
    (e) => e.userId === currentUser.id && e.status === 'IN_PROGRESS'
  );

  // Identity fields
  const [userName, setUserName] = useState(`${currentUser.name} ${currentUser.lastName}`);
  const [legajo, setLegajo] = useState(currentUser.legajo);
  const [isIdentityEditable, setIsIdentityEditable] = useState(false);

  // Downtime configuration fields
  const [eventType, setEventType] = useState<EventType>('Incidencia Técnica');
  const [downtimeReason, setDowntimeReason] = useState<DowntimeReason>(
    'Caída de Sistema / CRM / Plataforma'
  );
  const [comments, setComments] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [impactLevel, setImpactLevel] = useState<'TOTAL' | 'PARCIAL'>('TOTAL');
  const [supervisorNotified, setSupervisorNotified] = useState(true);
  const [supervisorName, setSupervisorName] = useState('Verónica Mattalia');
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);

  // Manual fallback mode state
  const [showManualMode, setShowManualMode] = useState(false);
  const [manualStart, setManualStart] = useState(() => getCurrentDateTimeLocal());
  const [manualEnd, setManualEnd] = useState('');

  // Live timer tick for active event
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Modal for report view
  const [reportEvent, setReportEvent] = useState<WorkEvent | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync identity when current user changes in context
  useEffect(() => {
    if (!isIdentityEditable) {
      setUserName(`${currentUser.name} ${currentUser.lastName}`);
      setLegajo(currentUser.legajo);
    }
  }, [currentUser.id, currentUser.legajo, currentUser.name, currentUser.lastName, isIdentityEditable]);

  // Save updated identity to user profile permanently
  const handleSaveIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedLegajo = legajo.trim() || currentUser.legajo;
    const trimmedName = userName.trim() || `${currentUser.name} ${currentUser.lastName}`;

    const parts = trimmedName.split(' ');
    const newName = parts[0] || currentUser.name;
    const newLastName = parts.slice(1).join(' ') || currentUser.lastName;

    updateUser(currentUser.id, {
      legajo: trimmedLegajo,
      name: newName,
      lastName: newLastName,
    });

    setIsIdentityEditable(false);
    showToast('success', `Legajo guardado correctamente: ${trimmedLegajo}`, 'Datos actualizados');
  };

  // Sync inputs with active event if present
  useEffect(() => {
    if (activeEvent) {
      setEventType(activeEvent.type);
      if (activeEvent.downtimeReason) {
        setDowntimeReason(activeEvent.downtimeReason);
      }
      if (activeEvent.comments) {
        setComments(activeEvent.comments);
      }
      if (activeEvent.ticketNumber) {
        setTicketNumber(activeEvent.ticketNumber);
      }
      if (activeEvent.impactLevel) {
        setImpactLevel(activeEvent.impactLevel);
      }
      if (activeEvent.evidences) {
        setEvidences(activeEvent.evidences);
      }
    }
  }, [activeEvent?.id]);

  // Chronometer timer effect
  useEffect(() => {
    if (!activeEvent) {
      setSecondsElapsed(0);
      return;
    }

    const calcElapsed = () => {
      const startMs = new Date(activeEvent.startDateTime).getTime();
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setSecondsElapsed(diffSecs);
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeEvent?.startDateTime]);

  // Default manual end time (30 min after start)
  useEffect(() => {
    if (!manualEnd && manualStart) {
      try {
        const start = new Date(manualStart);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + 30 * 60 * 1000);
          const y = end.getFullYear();
          const m = String(end.getMonth() + 1).padStart(2, '0');
          const d = String(end.getDate()).padStart(2, '0');
          const h = String(end.getHours()).padStart(2, '0');
          const min = String(end.getMinutes()).padStart(2, '0');
          setManualEnd(`${y}-${m}-${d}T${h}:${min}`);
        }
      } catch {
        // ignore
      }
    }
  }, [manualStart, manualEnd]);

  // Global paste handler to capture Ctrl+V screenshots directly
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            try {
              const base64 = await fileToBase64(file);
              const newEvidence: EvidenceItem = {
                id: 'evi-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                name: `Captura_Portapapeles_${new Date().toLocaleTimeString('es-AR').replace(/:/g, '')}.png`,
                type: 'image',
                url: base64,
                uploadedAt: new Date().toISOString(),
                size: formatFileSize(file.size),
                note: 'Captura pegada directamente con Ctrl+V',
              };
              setEvidences((prev) => [...prev, newEvidence]);
              showToast('success', 'Captura de pantalla adjuntada como evidencia del tiempo muerto.', 'Evidencia lista');
            } catch (err) {
              console.error('Error pasting image:', err);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showToast]);

  // Format chronometer seconds (HH:MM:SS)
  const formatTimerString = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ACTION: START DOWNTIME (Iniciar Tiempo Muerto)
  const handleStartDowntime = () => {
    const nowIso = getCurrentDateTimeLocal(true);
    const effectiveLegajo = legajo.trim() || currentUser.legajo;

    if (effectiveLegajo !== currentUser.legajo) {
      updateUser(currentUser.id, { legajo: effectiveLegajo });
    }

    const result = addEvent({
      userId: currentUser.id,
      userName: userName.trim() || `${currentUser.name} ${currentUser.lastName}`,
      legajo: effectiveLegajo,
      type: eventType,
      comments: comments.trim() || `Tiempo muerto: ${eventType}`,
      startDateTime: nowIso,
      endDateTime: '',
      status: 'IN_PROGRESS',
      isDowntime: true,
      downtimeReason: downtimeReason || 'Otro Motivo de Tiempo Muerto',
      ticketNumber: ticketNumber.trim() || undefined,
      impactLevel,
      supervisorNotified,
      supervisorName: supervisorNotified ? supervisorName : undefined,
      evidences: evidences.length > 0 ? evidences : undefined,
    });

    if (result.success) {
      showToast(
        'info',
        `Tiempo muerto INICIADO a las ${formatTime(nowIso, true)}. Cronómetro activo en segundos.`,
        'Tiempo en curso'
      );
    }
  };

  // ACTION: FINISH DOWNTIME (Terminar Tiempo Muerto)
  const handleFinishDowntime = () => {
    if (!activeEvent) return;

    const endIso = getCurrentDateTimeLocal(true);
    const durationSecs = calculateDurationSeconds(activeEvent.startDateTime, endIso);
    const durationText = formatDuration(durationSecs);
    let pctOfDay = Math.round((durationSecs / STANDARD_WORKDAY_SECONDS) * 100 * 10) / 10;
    if (durationSecs > 0 && pctOfDay === 0) pctOfDay = 0.1;

    updateEvent(activeEvent.id, {
      endDateTime: endIso,
      status: 'COMPLETED',
      comments: comments.trim() || activeEvent.comments,
      type: eventType,
      downtimeReason,
      ticketNumber: ticketNumber.trim() || undefined,
      evidences: evidences.length > 0 ? evidences : undefined,
    });

    showToast(
      'success',
      `Tiempo muerto finalizado: ${durationText} registrados (${formatTime(activeEvent.startDateTime, true)} a ${formatTime(endIso, true)}). Representa el ${pctOfDay}% de tu jornada.`,
      'Registro completado'
    );

    setComments('');
    setTicketNumber('');
    setEvidences([]);
  };

  // ACTION: MANUAL SUBMIT
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualStart || !manualEnd) {
      showToast('error', 'Por favor completa fecha y hora de inicio y fin.', 'Campos requeridos');
      return;
    }

    const startMs = new Date(manualStart).getTime();
    const endMs = new Date(manualEnd).getTime();

    if (endMs <= startMs) {
      showToast('error', 'La fecha y hora de fin debe ser posterior a la de inicio.', 'Validación de horario');
      return;
    }

    const durationSecs = Math.max(1, Math.round((endMs - startMs) / 1000));
    let pctOfDay = Math.round((durationSecs / STANDARD_WORKDAY_SECONDS) * 100 * 10) / 10;
    if (durationSecs > 0 && pctOfDay === 0) pctOfDay = 0.1;

    const result = addEvent({
      userId: currentUser.id,
      userName: userName.trim() || `${currentUser.name} ${currentUser.lastName}`,
      legajo: legajo.trim() || currentUser.legajo,
      type: eventType,
      comments: comments.trim() || `Tiempo muerto: ${eventType}`,
      startDateTime: manualStart,
      endDateTime: manualEnd,
      status: 'COMPLETED',
      isDowntime: true,
      downtimeReason: downtimeReason || 'Otro Motivo de Tiempo Muerto',
      ticketNumber: ticketNumber.trim() || undefined,
      impactLevel,
      supervisorNotified,
      supervisorName: supervisorNotified ? supervisorName : undefined,
      evidences: evidences.length > 0 ? evidences : undefined,
    });

    if (result.success) {
      showToast(
        'success',
        `Tiempo muerto cargado: ${formatDuration(durationSecs)} (${pctOfDay}% de jornada).`,
        'Carga manual guardada'
      );
      setComments('');
      setTicketNumber('');
      setEvidences([]);
      setShowManualMode(false);
    }
  };

  // Add sample evidence for testing
  const handleAddSampleEvidence = (sampleType: 'crm' | 'network') => {
    const isCrm = sampleType === 'crm';
    const newEvidence: EvidenceItem = {
      id: 'evi-' + Date.now(),
      name: isCrm ? 'Captura_Error_CRM_503.png' : 'Captura_Corte_VPN_Ping.png',
      type: 'image',
      url: isCrm ? SAMPLE_EVIDENCE_CRM_ERROR : SAMPLE_EVIDENCE_NETWORK_OUTAGE,
      uploadedAt: new Date().toISOString(),
      size: isCrm ? '185 KB' : '142 KB',
      note: isCrm
        ? 'Evidencia de bloqueo HTTP 503 en CRM.'
        : 'Evidencia de pérdida de paquetes de red.',
    };
    setEvidences((prev) => [...prev, newEvidence]);
    showToast('success', `Se adjuntó la evidencia "${newEvidence.name}".`, 'Evidencia añadida');
  };

  // Handle local file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        const newEvidence: EvidenceItem = {
          id: 'evi-' + Date.now() + '-' + i,
          name: file.name,
          type: file.type.includes('image') ? 'image' : 'document',
          url: base64,
          uploadedAt: new Date().toISOString(),
          size: formatFileSize(file.size),
        };
        setEvidences((prev) => [...prev, newEvidence]);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('success', 'Archivo(s) de evidencia cargados.', 'Listo');
  };

  const removeEvidence = (id: string) => {
    setEvidences((prev) => prev.filter((item) => item.id !== id));
  };

  // Today's metrics for current user
  const todayStr = getTodayDateString();
  const userDailyUsage = calculateUserDailyUsage(events, currentUser.id, todayStr);
  const userTodayEvents = events
    .filter((e) => e.userId === currentUser.id && e.startDateTime.slice(0, 10) === todayStr)
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Module Title: Clean, Simple, Soothing Indigo Tone */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-indigo-50/50 p-5 rounded-2xl border border-indigo-100/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-semibold mb-1.5">
            <Timer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Módulo de Registro Simple</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Registrar Tiempo Muerto
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Toca el botón al comenzar y al terminar para registrar el desvío contra tus <strong>8 horas laborales</strong>.
          </p>
        </div>

        {/* Quick Compact Badge */}
        <div className="bg-white px-4 py-2.5 rounded-xl border border-indigo-100 shadow-2xs flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tiempo Muerto Hoy
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {formatDuration(userDailyUsage.totalSeconds)} <span className="text-xs font-normal text-slate-400">({userDailyUsage.percentage}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {userDailyUsage.percentage}%
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* User Identity Pill Bar */}
        <div className="bg-slate-50/90 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
              {currentUser.name[0]}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">{currentUser.name} {currentUser.lastName}</span>
              <span className="text-slate-400">•</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                <span>Legajo: {currentUser.legajo}</span>
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-500 hidden sm:inline">Jornada: 8h (480 min)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isIdentityEditable) {
                handleSaveIdentity();
              } else {
                setUserName(`${currentUser.name} ${currentUser.lastName}`);
                setLegajo(currentUser.legajo);
                setIsIdentityEditable(true);
              }
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            {isIdentityEditable ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guardar Legajo</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cambiar Legajo</span>
              </>
            )}
          </button>
        </div>

        {/* Identity Editable Fields */}
        {isIdentityEditable && (
          <form onSubmit={handleSaveIdentity} className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col sm:flex-row items-end gap-3 text-xs animate-in fade-in">
            <div className="flex-1 w-full">
              <label className="block font-semibold text-slate-700 mb-1">Nombre y Apellido</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block font-semibold text-slate-700 mb-1">
                Número de Legajo <span className="text-indigo-600 font-bold">(ej: 12142)</span>
              </label>
              <input
                type="text"
                value={legajo}
                onChange={(e) => setLegajo(e.target.value)}
                placeholder="12142"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Guardar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLegajo(currentUser.legajo);
                  setUserName(`${currentUser.name} ${currentUser.lastName}`);
                  setIsIdentityEditable(false);
                }}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="p-6 sm:p-7 space-y-6">
          {/* Active Event Banner (If running) */}
          {activeEvent && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Tiempo Muerto en Curso
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    Iniciado a las {formatTime(activeEvent.startDateTime)} — {activeEvent.type}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-800 font-medium">Cronómetro en vivo:</div>
                <div className="text-2xl font-black font-mono text-emerald-900 tracking-wider">
                  {formatTimerString(secondsElapsed)}
                </div>
              </div>
            </div>
          )}

          {/* 1. Tipo de Tiempo Muerto */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Tipo de Evento / Motivo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EVENT_TYPES.map((type) => {
                const isSelected = eventType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEventType(type)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-950 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 bg-white'
                    }`}
                  >
                    <span className="truncate">{type}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivo Detallado y Ticket */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Motivo Detallado
              </label>
              <select
                value={downtimeReason}
                onChange={(e) => setDowntimeReason(e.target.value as DowntimeReason)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {DOWNTIME_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">
                N° Ticket de Incidente (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: INC-88210"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 2. Comments */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Comentarios / Observaciones</span>
              <span className="text-[11px] font-normal text-slate-400">
                (Opcional antes de iniciar o mientras transcurre)
              </span>
            </label>
            <textarea
              rows={2}
              placeholder="Detalle de la situación (ej: corte de luz en el piso, sistema caído tras error 503)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-slate-800"
            />
          </div>

          {/* Simple Evidence Attachment Bar */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-slate-700">
                <FileImage className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold">Evidencias gráficas</span>
                <span className="text-slate-400 font-normal">
                  (puedes pegar capturas con <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl + V</kbd>)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-indigo-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Adjuntar archivo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => handleAddSampleEvidence('crm')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 text-[11px] hover:bg-slate-100"
                >
                  + Captura CRM
                </button>
              </div>
            </div>

            {/* Evidence items list */}
            {evidences.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                {evidences.map((evi) => (
                  <div
                    key={evi.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img
                        src={evi.url}
                        alt={evi.name}
                        className="w-7 h-7 rounded object-cover border border-slate-200 shrink-0"
                      />
                      <span className="truncate font-medium text-slate-700">{evi.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(evi.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* THE MAIN ACTION BUTTON (Clean, Soothing, High-Clarity) */}
          <div className="pt-1">
            {!activeEvent ? (
              /* STATE 1: INICIAR TIEMPO MUERTO (Clean Indigo Action) */
              <button
                type="button"
                onClick={handleStartDowntime}
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base sm:text-lg shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </div>
                <span>INICIAR TIEMPO MUERTO</span>
              </button>
            ) : (
              /* STATE 2: TERMINAR TIEMPO MUERTO (Clean Emerald Action) */
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleFinishDowntime}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base sm:text-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Square className="w-4 h-4 fill-white text-white" />
                  </div>
                  <span>TERMINAR TIEMPO MUERTO</span>
                  <span className="text-xs font-mono font-medium bg-emerald-700/90 px-2.5 py-0.5 rounded-full ml-1">
                    {formatTimerString(secondsElapsed)}
                  </span>
                </button>
                <p className="text-center text-[11px] text-slate-500">
                  Al terminar se guardará la hora de inicio ({formatTime(activeEvent.startDateTime)}) y la hora de fin actual.
                </p>
              </div>
            )}
          </div>

          {/* MANUAL ENTRY TOGGLE */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowManualMode(!showManualMode)}
              className="text-xs text-slate-500 hover:text-indigo-600 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>¿Necesitas registrar un tiempo muerto pasado? Carga manual</span>
              {showManualMode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* MANUAL FORM ACCORDION */}
          {showManualMode && (
            <form onSubmit={handleManualSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cargar Horario Manual de Inicio y Fin</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Inicio *</label>
                  <input
                    type="datetime-local"
                    step="1"
                    value={manualStart}
                    onChange={(e) => setManualStart(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Fin *</label>
                  <input
                    type="datetime-local"
                    step="1"
                    value={manualEnd}
                    onChange={(e) => setManualEnd(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Guardar Tiempo Pasado
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* TODAY'S SUMMARY & HISTORY (Clean, Simple) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Tus Tiempos Muertos de Hoy ({todayStr})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Eventos que justifican desvíos frente a tu jornada de 8 horas.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {userTodayEvents.length} {userTodayEvents.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* 8-Hour Visual Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700">Jornada Laboral (8 horas = 480 min)</span>
            <span className="text-indigo-700 font-mono">
              {userDailyUsage.percentage}% tiempo muerto
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${Math.min(100, userDailyUsage.percentage)}%` }}
              className="bg-amber-500 transition-all duration-500"
            />
            <div
              style={{ width: `${Math.max(0, 100 - userDailyUsage.percentage)}%` }}
              className="bg-emerald-500 transition-all duration-500"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Tiempo Muerto: <strong>{formatDuration(userDailyUsage.totalSeconds)}</strong> ({userDailyUsage.percentage}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Operativo Disponible: <strong>{formatDuration(userDailyUsage.netOperativeSeconds)}</strong> ({userDailyUsage.netOperativePercentage}%)</span>
            </div>
          </div>
        </div>

        {/* Event List or Empty State */}
        {userTodayEvents.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 text-slate-500">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-slate-700">
              No tienes tiempos muertos registrados hoy
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tu jornada operativa se mantiene al 100% de disponibilidad.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {userTodayEvents.map((ev) => {
              const secs = calculateDurationSeconds(ev.startDateTime, ev.endDateTime, ev.status);
              const durationFmt = formatDuration(secs);
              let pct = Math.round((secs / STANDARD_WORKDAY_SECONDS) * 100 * 10) / 10;
              if (secs > 0 && pct === 0) pct = 0.1;
              const isRunning = ev.status === 'IN_PROGRESS';

              return (
                <div key={ev.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{ev.type}</span>
                        {isRunning && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            En curso
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-700 font-bold">
                          {durationFmt}
                        </span>
                        <span className="text-slate-400 text-[11px]">({pct}% de 8h)</span>
                      </div>
                      <div className="text-slate-500 text-[11px] truncate mt-0.5">
                        {formatTime(ev.startDateTime, true)} → {isRunning ? 'Ahora' : formatTime(ev.endDateTime, true)}
                        {ev.comments ? ` — ${ev.comments}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReportEvent(ev)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
                    >
                      Comprobante
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Deseas eliminar este registro de tiempo muerto?')) {
                          deleteEvent(ev.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportEvent && (
        <DowntimeReportModal event={reportEvent} onClose={() => setReportEvent(null)} />
      )}
    </div>
  );
};
