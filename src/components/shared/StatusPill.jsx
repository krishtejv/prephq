import React from 'react';

/**
 * Reusable StatusPill component to render standardized flashcard / task status badges.
 *
 * @param {string} status - 'Done' | 'Doing' | 'Needs Review' | 'To Do'
 */
export const StatusPill = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Doing':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Needs Review':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'To Do':
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span
      className={`status-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border select-none inline-flex items-center justify-center ${getStyles()}`}
    >
      {status}
    </span>
  );
};
