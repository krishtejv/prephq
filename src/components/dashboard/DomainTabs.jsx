import React from 'react';
import { usePrepStore } from '../../context/PrepContext';
import { Plus } from 'lucide-react';

export const DomainTabs = ({ activeDomains = [], handleToggleDomain, setSelectedCategoryFilter, onManageClick }) => {
  const { state } = usePrepStore();

  const totalDomainsCount = Object.keys(state.domains || {}).length;
  let totalCardsCount = 0;
  Object.values(state.domains || {}).forEach((dom) => {
    if (dom.categories) {
      Object.values(dom.categories).forEach((qList) => {
        totalCardsCount += qList.length;
      });
    }
  });
  const isOnboardingActive = totalDomainsCount === 0 || totalCardsCount === 0;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Knowledge Domains</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(state.domains || {}).map(([key, dom]) => {
          const isActive = activeDomains.includes(key);
          
          let totalCards = 0;
          if (dom.categories) {
            Object.values(dom.categories).forEach((qList) => {
              totalCards += qList.length;
            });
          }
          const reviewText = totalCards > 0 
            ? `Last reviewed: ${state.lastStudiedDate || 'Yesterday'}`
            : 'Last reviewed: Never';

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                handleToggleDomain(key);
                setSelectedCategoryFilter('All');
              }}
              className={`filter-capsule p-4 rounded-xl border text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 group relative ${
                isActive
                  ? 'bg-indigo-600 border-indigo-650 text-white shadow-md'
                  : state.theme === 'dark'
                  ? 'bg-surface-dark border-border-dark text-slate-300 hover:border-slate-700'
                  : 'bg-white border-border-light text-slate-700 hover:border-slate-300'
              }`}
            >
              {/* CSS Tooltip Popover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-[10px] font-bold text-white bg-slate-900/90 dark:bg-slate-800/90 border border-slate-700/50 rounded-lg whitespace-normal min-w-[150px] text-center opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md flex flex-col gap-0.5">
                <span className="font-extrabold text-xs border-b border-white/10 pb-1 mb-1">{dom.name}</span>
                <span>Cards: {totalCards}</span>
                <span className="text-[9px] text-slate-400">{reviewText}</span>
              </div>
              <div className="font-bold text-sm leading-tight mb-1 h-10 line-clamp-2" title={dom.name}>{dom.name}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`h-1.5 rounded-full flex-1 ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isActive ? 'bg-white' : 'bg-indigo-600'}`}
                    style={{ width: `${dom.progress || 0}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-white/90' : 'text-slate-450'}`}>
                  {dom.progress || 0}%
                </span>
              </div>
            </button>
          );
        })}

        {/* Manage Domains Card */}
        {totalDomainsCount > 0 && (
          <button
            type="button"
            onClick={onManageClick}
            className={`hidden md:flex p-4 rounded-xl border border-dashed flex-col items-center justify-center gap-1.5 transition-all duration-150 hover:-translate-y-0.5 text-center min-h-[82px] ${
              state.theme === 'dark'
                ? 'bg-slate-500/5 border-slate-700 text-slate-400 hover:border-slate-650 hover:bg-slate-500/10'
                : 'bg-slate-50 border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-xs">Manage Domains</span>
          </button>
        )}
      </div>
    </div>
  );
};
