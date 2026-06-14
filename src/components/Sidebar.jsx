import React from 'react';
import { usePrepStore } from '../context/PrepContext';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Layers,
  BookOpen,
  Sun,
  Moon,
  CloudLightning,
  Loader2,
  CheckCircle2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const Sidebar = ({
  isMobileOpen,
  setIsMobileOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed
}) => {
  const { state, saveState, setTab, toggleTheme, triggerSave } = usePrepStore();

  const navItems = [
    { id: "learning-dashboard", label: "Learning Dashboard", icon: LayoutDashboard },
    { id: "company-profiles", label: "Company Profiles", icon: Building2 },
    { id: "targeted-prep", label: "Targeted Prep Plan", icon: Calendar },
    { id: "industry-patterns", label: "Industry Patterns", icon: Layers },
    { id: "study-notebook", label: "Study Notebook", icon: BookOpen }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 lg:top-16 bottom-0 left-0 z-40 hidden lg:flex flex-col border-r transition-all duration-300 ${
          isSidebarCollapsed ? 'w-64 lg:w-16' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : 'max-lg:-translate-x-full'
        } ${
          state.theme === 'dark'
            ? 'bg-bg-dark border-border-dark text-slate-300'
            : 'bg-white border-border-light text-slate-700'
        }`}
      >
        {/* Toggle Button in the Vertical Middle (desktop only) */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-50 hidden lg:block">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-7 h-7 rounded-full border shadow-md transition-all duration-200 hover:scale-110 flex items-center justify-center cursor-pointer ${
              state.theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-350 hover:text-white hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-indigo-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Mobile Header (mobile only) */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-inherit lg:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <CloudLightning className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight select-none">
              Prep<span className="text-indigo-500">HQ</span>
            </span>
          </div>

          <button
            className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400"
            onClick={() => setIsMobileOpen(false)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className={`flex-1 overflow-y-auto px-3 py-3 lg:pt-6 space-y-1.5`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = state.activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                data-tab={item.id}
                onClick={() => {
                  if (saveState === 'unsaved') {
                    const confirmDiscard = window.confirm("You have unsaved study note changes. Are you sure you want to navigate away?");
                    if (!confirmDiscard) return;
                  }
                  setTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`nav-tab w-full flex items-center rounded-xl text-sm font-semibold transition-all group duration-150 ${
                  isSidebarCollapsed
                    ? 'lg:justify-center lg:px-0 lg:py-3 px-3 py-2.5 gap-3'
                    : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-500 active'
                    : 'hover:bg-slate-500/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={item.label}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 flex-shrink-0 ${
                    isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className={isSidebarCollapsed ? 'lg:hidden truncate' : 'truncate'}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (hidden when collapsed on desktop) */}
        <div className={`p-4 border-t border-inherit flex items-center justify-between gap-2 flex-shrink-0 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          {/* Save Status Indicator */}
          <div
            onClick={triggerSave}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all duration-150 border select-none ${
              saveState === 'saved'
                ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-400'
                : saveState === 'saving'
                ? 'bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25 text-blue-800 dark:text-blue-400'
                : 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25 text-amber-800 dark:text-amber-400'
            }`}
            title="Click to force save workspace state"
          >
            {saveState === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved</span>
              </>
            )}
            {saveState === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Saving...</span>
              </>
            )}
            {saveState === 'unsaved' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved</span>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
              state.theme === 'dark'
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title="Toggle light/dark layout theme"
          >
            {state.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};

