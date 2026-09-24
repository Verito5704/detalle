import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, WorkEvent, Role, EventType } from '../types';
import { INITIAL_USERS, getInitialEvents } from '../lib/seedData';
import { getCurrentDateTimeLocal } from '../lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface AppContextType {
  users: User[];
  currentUser: User;
  events: WorkEvent[];
  activeTab: 'dashboard' | 'logs' | 'users' | 'new-event';
  toasts: ToastMessage[];
  setActiveTab: (tab: 'dashboard' | 'logs' | 'users' | 'new-event') => void;
  setCurrentUser: (user: User) => void;
  addEvent: (eventData: Omit<WorkEvent, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateEvent: (id: string, updates: Partial<WorkEvent>) => void;
  deleteEvent: (id: string) => void;
  finishActiveEvent: (id: string) => void;
  addUser: (userData: Omit<User, 'id'>) => { success: boolean; message: string };
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;
  changeUserRole: (id: string, newRole: Role) => void;
  resetAllData: () => void;
  clearAllEvents: () => void;
  dismissToast: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

const STORAGE_KEY_USERS = 'rde_users_v4_veronica_only';
const STORAGE_KEY_EVENTS = 'rde_events_v3_empty';
const STORAGE_KEY_CURRENT_USER_ID = 'rde_current_user_id_v4';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      // Purge old keys with other users
      localStorage.removeItem('rde_users_v2');
      localStorage.removeItem('rde_users_v3');
      localStorage.removeItem('rde_current_user_id_v2');
      localStorage.removeItem('rde_current_user_id_v3');

      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        // Retain only Veronica Mattalia as requested
        const onlyVeronica = parsed.filter(
          (u) => u.email.toLowerCase().includes('veronica') || u.id === 'usr-1'
        );
        if (onlyVeronica.length > 0) {
          return onlyVeronica.map((u) => ({
            ...u,
            legajo: u.legajo?.trim() || '12142',
          }));
        }
      }
    } catch (e) {
      console.error('Error loading users from localStorage:', e);
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
      if (savedId) {
        const found = users.find((u) => u.id === savedId);
        if (found) {
          if ((found.id === 'usr-1' || found.email.toLowerCase().includes('veronica')) && found.legajo !== '12142') {
            return { ...found, legajo: '12142' };
          }
          return found;
        }
      }
    } catch (e) {
      console.error('Error loading current user from localStorage:', e);
    }
    const defaultUser = users[0] || INITIAL_USERS[0];
    if (defaultUser && (defaultUser.id === 'usr-1' || defaultUser.email.toLowerCase().includes('veronica')) && defaultUser.legajo !== '12142') {
      return { ...defaultUser, legajo: '12142' };
    }
    return defaultUser;
  });

  const [events, setEvents] = useState<WorkEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading events from localStorage:', e);
    }
    return getInitialEvents();
  });

  const [activeTab, setActiveTabState] = useState<'dashboard' | 'logs' | 'users' | 'new-event'>(
    currentUser.role === 'ADMIN' ? 'dashboard' : 'new-event'
  );

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist users
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  // Persist events
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  // Persist current user ID
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, currentUser.id);
  }, [currentUser]);

  // Adjust active tab if user role changes
  useEffect(() => {
    if (currentUser.role === 'USUARIO') {
      setActiveTabState('new-event');
    }
  }, [currentUser.role]);

  const showToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setActiveTab = (tab: 'dashboard' | 'logs' | 'users' | 'new-event') => {
    if (currentUser.role === 'USUARIO' && tab !== 'new-event') {
      showToast('error', 'Acceso denegado. Tu perfil de Empleado solo tiene acceso al registro de eventos.', 'Permiso restringido');
      return;
    }
    setActiveTabState(tab);
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    showToast('info', `Sesión activa como ${user.name} ${user.lastName} (${user.role === 'ADMIN' ? 'Administrador' : 'Empleado'})`, 'Perfil cambiado');
    if (user.role === 'USUARIO') {
      setActiveTabState('new-event');
    }
  };

  const addEvent = (eventData: Omit<WorkEvent, 'id' | 'createdAt'>) => {
    // Validation: if not IN_PROGRESS, endDateTime must be after startDateTime
    if (eventData.status !== 'IN_PROGRESS' && eventData.endDateTime) {
      const startMs = new Date(eventData.startDateTime).getTime();
      const endMs = new Date(eventData.endDateTime).getTime();
      if (endMs <= startMs) {
        showToast('error', 'La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.', 'Error de validación');
        return { success: false, message: 'La fecha y hora de fin debe ser posterior a la de inicio' };
      }
    }

    const newEvent: WorkEvent = {
      ...eventData,
      id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);
    showToast('success', `El evento de tipo "${eventData.type}" ha sido registrado correctamente en la bitácora operativa.`, 'Registro guardado');
    return { success: true, message: 'Evento guardado exitosamente' };
  };

  const updateEvent = (id: string, updates: Partial<WorkEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    showToast('success', 'El registro de evento se ha actualizado.', 'Modificación guardada');
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast('info', 'El evento ha sido eliminado del registro.', 'Registro eliminado');
  };

  const finishActiveEvent = (id: string) => {
    const currentLocal = getCurrentDateTimeLocal();
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            endDateTime: currentLocal,
            status: 'COMPLETED',
          };
        }
        return e;
      })
    );
    showToast('success', 'El evento en curso ha sido finalizado con la hora actual.', 'Evento finalizado');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    // Check if legajo already exists
    const exists = users.some((u) => u.legajo.trim().toLowerCase() === userData.legajo.trim().toLowerCase());
    if (exists) {
      showToast('error', `Ya existe un colaborador con el legajo ${userData.legajo}.`, 'Legajo duplicado');
      return { success: false, message: 'El legajo ya está en uso' };
    }

    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now(),
    };

    setUsers((prev) => [...prev, newUser]);
    showToast('success', `Se ha dado de alta al colaborador ${newUser.name} ${newUser.lastName} con rol ${newUser.role}.`, 'Usuario registrado');
    return { success: true, message: 'Usuario registrado exitosamente' };
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser.id === id) {
            setCurrentUserState(updated);
          }
          return updated;
        }
        return u;
      })
    );
    showToast('success', 'Los datos del usuario han sido actualizados.', 'Cambios guardados');
  };

  const deleteUser = (id: string) => {
    if (id === currentUser.id || id === 'usr-1') {
      showToast('error', 'No es posible eliminar tu propia cuenta de usuario.', 'Operación denegada');
      return;
    }
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast(
      'info',
      `Se ha eliminado el colaborador ${target ? target.name + ' ' + target.lastName : ''}.`,
      'Usuario eliminado'
    );
  };

  const toggleUserActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = !u.active;
          showToast(
            'info',
            `El usuario ${u.name} ${u.lastName} ahora está ${newStatus ? 'ACTIVO' : 'DESACTIVADO'}.`,
            'Estado actualizado'
          );
          return { ...u, active: newStatus };
        }
        return u;
      })
    );
  };

  const changeUserRole = (id: string, newRole: Role) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          showToast('success', `Rol de ${u.name} cambiado a ${newRole === 'ADMIN' ? 'Administrador' : 'Empleado'}.`, 'Permisos actualizados');
          const updated = { ...u, role: newRole };
          if (currentUser.id === id) {
            setCurrentUserState(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUserState(INITIAL_USERS[0]);
    setEvents([]);
    setActiveTabState('new-event');
    showToast('info', 'Se ha restablecido la aplicación con base de datos limpia y sin registros.', 'App restablecida');
  };

  const clearAllEvents = () => {
    setEvents([]);
    localStorage.removeItem(STORAGE_KEY_EVENTS);
    showToast('info', 'Se han eliminado todos los registros. La aplicación está sin eventos.', 'Registros borrados');
  };

  return (
    <AppContext.Provider
      value={{
        users,
        currentUser,
        events,
        activeTab,
        toasts,
        setActiveTab,
        setCurrentUser,
        addEvent,
        updateEvent,
        deleteEvent,
        finishActiveEvent,
        addUser,
        updateUser,
        deleteUser,
        toggleUserActive,
        changeUserRole,
        resetAllData,
        clearAllEvents,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
