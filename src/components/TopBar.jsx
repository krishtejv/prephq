import React, { useState, useEffect } from 'react';
import { Menu, Search, CloudLightning, X } from 'lucide-react';
import { usePrepStore } from '../context/PrepContext';

export const TopBar = ({
  setIsMobileOpen,
  isSidebarCollapsed,
  setIsCommandPaletteOpen
}) => {
  const { state, logout, user, toggleTheme, setTab, saveState } = usePrepStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global Keyboard listener for '?' to open shortcuts modal
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // Trigger only if user is not currently inside an input/textarea/contenteditable
      const target = e.target;
      if (
        e.key === '?' &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.isContentEditable
      ) {
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 border-b transition-colors duration-150 ${
        state.theme === 'dark'
          ? 'bg-bg-dark border-border-dark text-slate-100'
          : 'bg-white border-border-light text-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Stuck Prep HQ Brand Logo & Title */}
        <div className="flex items-center gap-2 select-none">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <CloudLightning className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            Prep<span className="text-indigo-500">HQ</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 select-none">
        {/* Top Search Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-500/10 hover:bg-slate-500/10 transition-colors text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
          title="Open search command palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search (Ctrl K)</span>
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="p-1.5 rounded-lg border border-slate-500/10 hover:bg-slate-500/10 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer flex items-center justify-center w-8 h-8"
          title="Keyboard shortcuts guide (?)"
        >
          <span className="text-sm font-black font-mono">?</span>
        </button>

        {/* User Session / Settings Dropdown */}
        {user && (
          <div className="relative border-l pl-3 border-slate-500/10">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-2 min-w-0 focus:outline-none cursor-pointer hover:opacity-85 active:scale-95 transition-all"
              title="User settings"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black select-none shadow-sm flex-shrink-0">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col min-w-0 text-left">
                <span className="text-xs font-black truncate text-slate-700 dark:text-slate-200 leading-none">
                  {user.username}
                </span>
              </div>
            </button>

            {isSettingsOpen && (
              <>
                {/* Click-outside backdrop */}
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsSettingsOpen(false)} />
                
                {/* Settings Dropdown Card */}
                <div
                  className={`absolute right-0 mt-2.5 w-48 rounded-xl border p-1.5 shadow-xl z-50 text-left transition-all duration-150 ${
                    state.theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-200 shadow-slate-900/50'
                      : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
                  }`}
                >
                  <button
                    onClick={() => {
                      if (saveState === 'unsaved') {
                        const confirmDiscard = window.confirm("You have unsaved study note changes. Are you sure you want to navigate away?");
                        if (!confirmDiscard) return;
                      }
                      setTab('settings');
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg hover:bg-slate-500/10 cursor-pointer text-left transition-colors"
                  >
                    <span>Personal Center</span>
                    <span className="text-[10px] text-indigo-500 uppercase font-black">Open</span>
                  </button>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg hover:bg-slate-500/10 cursor-pointer text-left transition-colors"
                  >
                    <span>Interface theme</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black">{state.theme}</span>
                  </button>
                  <div className="border-t my-1 border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => {
                      logout();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer text-left transition-colors"
                  >
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark'
                ? 'bg-surface-dark border-border-dark text-slate-100'
                : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-500/10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 text-left">Keyboard shortcuts</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between text-xs border-b pb-2 border-slate-100 dark:border-slate-850">
                <span className="font-bold text-slate-500">Global search palette</span>
                <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[10px] font-black font-mono">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between text-xs border-b pb-2 border-slate-100 dark:border-slate-850">
                <span className="font-bold text-slate-500">Close modals / Search</span>
                <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[10px] font-black font-mono">ESC</kbd>
              </div>
              <div className="flex items-center justify-between text-xs border-b pb-2 border-slate-100 dark:border-slate-850">
                <span className="font-bold text-slate-500">Double click tree item</span>
                <span className="text-slate-450 dark:text-slate-500 text-[10px] font-black uppercase tracking-wide">Rename node</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Double click image (Read view)</span>
                <span className="text-slate-450 dark:text-slate-500 text-[10px] font-black uppercase tracking-wide">Resize image</span>
              </div>
            </div>
            
            {/* Modal Footer Standard */}
            <div className="flex justify-end mt-6 border-t pt-4 border-inherit">
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
