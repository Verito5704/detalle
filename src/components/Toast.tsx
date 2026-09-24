import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
            t.type === 'success'
              ? 'bg-slate-900 border-emerald-500/40 text-slate-50'
              : t.type === 'error'
              ? 'bg-slate-900 border-rose-500/40 text-slate-50'
              : 'bg-slate-900 border-slate-700 text-slate-50'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
          </div>
          <div className="flex-1 min-w-0">
            {t.title && <h4 className="text-sm font-semibold text-white">{t.title}</h4>}
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
