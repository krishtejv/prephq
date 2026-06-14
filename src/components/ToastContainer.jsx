import React from 'react';
import { usePrepStore } from '../context/PrepContext';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = usePrepStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fade-in-up ${
            t.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : t.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {t.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {t.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          {t.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
          
          <div className="text-sm font-semibold flex-1 leading-snug">{t.message}</div>
        </div>
      ))}
    </div>
  );
};
