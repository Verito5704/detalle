import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, FileText, Users, Play, Clock, Sparkles } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useApp();
  const isAdmin = currentUser.role === 'ADMIN';

  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      adminOnly: true,
      description: 'Métricas de tiempo muerto y 8hs',
    },
    {
      id: 'logs' as const,
      label: 'Log de Registros',
      icon: FileText,
      adminOnly: true,
      description: 'Bitácora general y exportación',
    },
    {
      id: 'users' as const,
      label: 'Gestión de Usuarios',
      icon: Users,
      adminOnly: true,
      description: 'Control de accesos y roles',
    },
    {
      id: 'new-event' as const,
      label: 'Registrar Tiempo',
      icon: Play,
      adminOnly: false,
      isSpecial: true,
      description: 'Iniciar / Terminar tiempo muerto',
    },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <nav className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2.5" aria-label="Pestañas principales">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isRegister = tab.id === 'new-event';

              if (isRegister) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                      isActive
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40 shadow-indigo-600/25'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/90 border border-indigo-200'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'fill-white text-white' : 'text-indigo-600'}`} />
                    <span>{tab.label}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-black/10 text-current ml-0.5">
                      Acción
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 border border-slate-300 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
