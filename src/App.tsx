import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { EventLog } from './components/EventLog';
import { UserManagement } from './components/UserManagement';
import { EventForm } from './components/EventForm';
import { ToastContainer } from './components/Toast';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, currentUser } = useApp();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Tabs Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && currentUser.role === 'ADMIN' && <Dashboard />}
        {activeTab === 'logs' && currentUser.role === 'ADMIN' && <EventLog />}
        {activeTab === 'users' && currentUser.role === 'ADMIN' && <UserManagement />}
        {activeTab === 'new-event' && <EventForm />}

        {/* Fallback safety guard for unauthorized tab access */}
        {activeTab !== 'new-event' && currentUser.role === 'USUARIO' && (
          <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
            <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">Acceso Restringido</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              El rol <strong>Empleado</strong> únicamente tiene autorización para registrar eventos y visualizar su propia bitácora diaria.
            </p>
          </div>
        )}
      </main>

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">Registro de Eventos Diarios</span>
            <span>—</span>
            <span>Gestión Operativa de Jornadas Laborales</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Cálculo estándar: Jornada 8 hs (480 min) · Control de Acceso RBAC Activo
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
