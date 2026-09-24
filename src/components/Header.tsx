import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Shield, User as UserIcon, ChevronDown, RotateCcw, Building2, Check, Trash2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, users, setCurrentUser, resetAllData, clearAllEvents } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  Registro de Eventos Diarios
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  Control Operativo
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Monitoreo de jornada laboral, métricas de rendimiento y trazabilidad
              </p>
            </div>
          </div>

          {/* Right Actions: Current User + Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Clear Events */}
            <button
              onClick={() => {
                if (window.confirm('¿Deseas vaciar todos los registros de tiempo muerto y dejar la aplicación sin registros?')) {
                  clearAllEvents();
                }
              }}
              title="Dejar app sin registros"
              className="p-2 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden lg:inline">Vaciar Registros</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* User Account / RBAC Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 font-medium text-xs border border-slate-600">
                  {currentUser.name[0]}
                  {currentUser.lastName[0]}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-100">
                      {currentUser.name} {currentUser.lastName}
                    </span>
                    {currentUser.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.2 rounded">
                        <Shield className="w-2.5 h-2.5" /> ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                        <UserIcon className="w-2.5 h-2.5" /> EMPLEADO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Legajo: <strong className="text-slate-300">{currentUser.legajo}</strong></span>
                    <span>·</span>
                    <span className="truncate max-w-[120px]">{currentUser.department}</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>

              {/* Dropdown Menu for RBAC Testing */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Simulador de Acceso (RBAC)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Cambia de perfil para probar los permisos de Administrador y de Empleado:
                      </p>
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-800/40">
                      {users.map((u) => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setCurrentUser(u);
                              setDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/80 transition-colors ${
                              isCurrent ? 'bg-blue-950/40' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium shrink-0 ${
                                  u.role === 'ADMIN'
                                    ? 'bg-amber-950 text-amber-200 border border-amber-800/60'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {u.name[0]}
                                {u.lastName[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-200 truncate">
                                  {u.name} {u.lastName}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {u.legajo} · {u.role === 'ADMIN' ? 'Admin' : 'Empleado'} ({u.department})
                                </p>
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
                      <span>💡 <strong>Tip de evaluación:</strong> El rol <em>Empleado</em> solo ve el registro personal; el rol <em>Admin</em> accede a Dashboard, Logs globales y Usuarios.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
