import React, { useState } from 'react';
import { usePrepStore } from '../../context/PrepContext';
import { Edit, Eye, ZoomIn, ZoomOut, ChevronDown, Menu } from 'lucide-react';

export const NotebookHeader = ({
  activeNote,
  localTitle,
  localStatus,
  setLocalStatus,
  viewMode,
  setViewMode,
  docZoom,
  setDocZoom,
  zoomIn,
  zoomOut,
  onToggleSidebar
}) => {
  const { state, updateNoteStatus } = usePrepStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!activeNote) return null;

  const statusOptions = [
    { value: 'todo', label: 'TODO', textColor: 'text-rose-500 dark:text-rose-400', dotColor: 'bg-rose-500' },
    { value: 'review', label: 'REVIEW', textColor: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
    { value: 'solved', label: 'SOLVED', textColor: 'text-emerald-600 dark:text-emerald-450', dotColor: 'bg-emerald-500' }
  ];

  const currentOption = statusOptions.find(opt => opt.value === localStatus) || statusOptions[0];

  const handleSelectStatus = (statusValue) => {
    setLocalStatus(statusValue);
    updateNoteStatus(activeNote.id, statusValue);
    setIsDropdownOpen(false);
  };

  return (
    <div
      className={`notebook-header h-14 px-6 flex items-center justify-between border-b flex-shrink-0 transition-colors duration-150 ${
        state.theme === 'dark'
          ? 'bg-surface-dark border-border-dark'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Note metadata / status */}
      <div className="flex items-center gap-2 relative">
        {/* Toggle Tree Sidebar button (mobile only) */}
        <button
          id="nb-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg border border-slate-500/10 hover:bg-slate-500/10 text-slate-450 hover:text-slate-650 cursor-pointer"
          title="Toggle notebook notes list"
        >
          <Menu className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-2 text-[10px] font-black uppercase rounded-xl px-3 py-1.5 border transition-all duration-150 cursor-pointer shadow-sm ${
            state.theme === 'dark'
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          } ${currentOption.textColor}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentOption.dotColor}`} />
          <span>{currentOption.label}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isDropdownOpen && (
          <>
            {/* Click-outside overlay */}
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDropdownOpen(false)} />
            
            {/* Dropdown float card */}
            <div
              className={`absolute top-full left-0 mt-1.5 z-50 w-32 rounded-xl border p-1 shadow-lg transition-all duration-150 ${
                state.theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-200 shadow-slate-900/50'
                  : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
              }`}
            >
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelectStatus(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase rounded-lg hover:bg-slate-500/10 transition-colors cursor-pointer text-left ${opt.textColor}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor}`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <span className="hidden sm:inline-block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[120px] md:max-w-xs align-middle">
          {localTitle}
        </span>
      </div>

      {/* Right controls: Zoom + Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* Zoom Controls */}
        <div className={`hidden md:flex items-center gap-0.5 rounded-lg border px-1 py-0.5 select-none ${
          state.theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={zoomOut}
            disabled={docZoom <= 75}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDocZoom(100)}
            className="px-2 text-[10px] font-black tabular-nums text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors min-w-[36px] text-center"
            title="Reset zoom"
          >
            {docZoom}%
          </button>
          <button
            onClick={zoomIn}
            disabled={docZoom >= 150}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Segmented Capsule Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 select-none">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all duration-150 ${
              viewMode === 'edit'
                ? 'bg-white dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Doc</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all duration-150 ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
