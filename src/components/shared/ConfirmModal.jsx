import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable modal for confirming destructive or critical actions.
 * 
 * @param {boolean} isOpen - Control modal visibility.
 * @param {function} onClose - Called when modal is dismissed.
 * @param {function} onConfirm - Called when user clicks confirm.
 * @param {string} title - Title of the modal.
 * @param {string} message - Description message.
 * @param {string} confirmText - Text on the confirm button.
 * @param {string} cancelText - Text on the cancel button.
 * @param {string} variant - 'danger' | 'warning' | 'info'
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger"
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/10 text-red-500',
          btnBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/50',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500',
          btnBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-indigo-500/10 text-indigo-500',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/50',
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ margin: 0 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 p-6 text-left align-middle shadow-2xl transition-all">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="mt-0.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 focus:outline-none transition-all"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl focus:outline-none focus:ring-2 transition-all ${styles.btnBg}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
