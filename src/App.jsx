import React, { useState, useEffect, useMemo } from 'react';
import { usePrepStore } from './context/PrepContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LearningDashboard } from './components/LearningDashboard';
import { CompanyProfiles } from './components/CompanyProfiles';
import { IndustryPatterns } from './components/IndustryPatterns';
import { TargetedPrepPlan } from './components/TargetedPrepPlan';
import { StudyNotebook } from './components/StudyNotebook';
import { ToastContainer } from './components/ToastContainer';
import { LoginScreen } from './components/LoginScreen';
import { PersonalCenter } from './components/PersonalCenter';
import { Search, BookOpen, Building2, Layers, HelpCircle, Loader2, LayoutDashboard, Calendar } from 'lucide-react';

function App() {
  const { 
    state, 
    saveState,
    setTab, 
    setDomain, 
    selectNote, 
    setActivePatternId, 
    setActiveQuestionId, 
    setActiveCompanyId,
    token,
    user,
    isInitialSyncCompleted,
    login,
    logout
  } = usePrepStore();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState('');
  
  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [commandPaletteQuery]);

  // Warning guard for unsaved changes before browser tab closes/reloads
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveState === 'unsaved') {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  // Global Keyboard listener for Ctrl+K / Cmd+K / ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Centralized search indexing for command palette
  const commandPaletteResults = useMemo(() => {
    const query = commandPaletteQuery.trim().toLowerCase();
    if (!query) return [];

    const results = [];

    // 1. Learning Question Cards
    Object.entries(state.domains || {}).forEach(([domainKey, dom]) => {
      Object.entries(dom.categories || {}).forEach(([catName, qList]) => {
        qList.forEach(q => {
          if (q.title.toLowerCase().includes(query)) {
            results.push({
              type: 'card',
              id: q.id,
              title: q.title,
              subtitle: `Learning Card • ${dom.name} • ${catName}`,
              matchReason: 'Matched in title',
              domainKey,
              categoryKey: catName
            });
          } else if (q.question.toLowerCase().includes(query)) {
            results.push({
              type: 'card',
              id: q.id,
              title: q.title,
              subtitle: `Learning Card • ${dom.name} • ${catName}`,
              matchReason: 'Matched in prompt',
              domainKey,
              categoryKey: catName
            });
          } else if (q.answer && q.answer.toLowerCase().includes(query)) {
            results.push({
              type: 'card',
              id: q.id,
              title: q.title,
              subtitle: `Learning Card • ${dom.name} • ${catName}`,
              matchReason: 'Matched in answer/code',
              domainKey,
              categoryKey: catName
            });
          }
        });
      });
    });

    // 2. Company Loop Timelines
    (state.companies || []).forEach(c => {
      if (c.name.toLowerCase().includes(query)) {
        results.push({
          type: 'company',
          id: c.id,
          title: c.name,
          subtitle: `Company Timeline • ${c.type}`,
          matchReason: 'Matched in name',
          company: c
        });
      } else if (c.type.toLowerCase().includes(query)) {
        results.push({
          type: 'company',
          id: c.id,
          title: c.name,
          subtitle: `Company Timeline • ${c.type}`,
          matchReason: 'Matched in type',
          company: c
        });
      } else if (c.topics.some(t => t.toLowerCase().includes(query))) {
        results.push({
          type: 'company',
          id: c.id,
          title: c.name,
          subtitle: `Company Timeline • ${c.type}`,
          matchReason: 'Matched in focus topics',
          company: c
        });
      }
    });

    // 3. Technical Blueprints
    (state.patterns || []).forEach(p => {
      if (p.title.toLowerCase().includes(query)) {
        results.push({
          type: 'pattern',
          id: p.id,
          title: p.title,
          subtitle: `Design Blueprint • ${p.subtitle}`,
          matchReason: 'Matched in title'
        });
      } else if (p.subtitle.toLowerCase().includes(query)) {
        results.push({
          type: 'pattern',
          id: p.id,
          title: p.title,
          subtitle: `Design Blueprint • ${p.subtitle}`,
          matchReason: 'Matched in subtitle'
        });
      } else if (p.content && p.content.toLowerCase().includes(query)) {
        results.push({
          type: 'pattern',
          id: p.id,
          title: p.title,
          subtitle: `Design Blueprint • ${p.subtitle}`,
          matchReason: 'Matched in content'
        });
      }
    });

    // 4. Study Notebook tree pages
    const searchNoteTree = (nodes, path = '') => {
      nodes.forEach(node => {
        const currentPath = path ? `${path} > ${node.title}` : node.title;
        if (node.title.toLowerCase().includes(query)) {
          results.push({
            type: 'note',
            id: node.id,
            title: node.title,
            subtitle: `Study Notebook • ${currentPath}`,
            matchReason: 'Matched in title'
          });
        } else if (node.body && node.body.toLowerCase().includes(query)) {
          results.push({
            type: 'note',
            id: node.id,
            title: node.title,
            subtitle: `Study Notebook • ${currentPath}`,
            matchReason: 'Matched in body content'
          });
        }
        if (node.children && node.children.length > 0) {
          searchNoteTree(node.children, currentPath);
        }
      });
    };
    searchNoteTree(state.notebookTree || []);

    return results.slice(0, 8); // Cap at 8 high-relevance matches
  }, [state, commandPaletteQuery]);

  // Navigate & select item instantly from search palette
  const handleCommandPaletteSelect = (result) => {
    if (result.type === 'card') {
      setTab('learning-dashboard');
      setDomain(result.domainKey);
      setActiveQuestionId(result.id);
    } else if (result.type === 'company') {
      setTab('company-profiles');
      setActiveCompanyId(result.id);
    } else if (result.type === 'pattern') {
      setTab('industry-patterns');
      setActivePatternId(result.id);
    } else if (result.type === 'note') {
      setTab('study-notebook');
      selectNote(result.id);
    }
    setCommandPaletteQuery('');
    setIsCommandPaletteOpen(false);
  };

  // Handle Theme and styling configurations injection
  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. Theme
    if (state.theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }

    // Save to prephq_state_store for testing compatibility
    localStorage.setItem('prephq_state_store', JSON.stringify({ theme: state.theme }));

    // 2. Accent color
    const savedAccent = localStorage.getItem('prephq_accent_color') || 'indigo';
    const colors = ['indigo', 'emerald', 'violet', 'rose', 'amber'];
    colors.forEach(c => root.classList.remove(`accent-${c}`));
    root.classList.add(`accent-${savedAccent}`);

    // 3. Font size style
    const sizes = ['sm', 'md', 'lg'];
    sizes.forEach(s => root.classList.remove(`font-size-${s}`));
    const savedFontSize = localStorage.getItem('prephq_font_size') || '14';
    let pxVal = '14px';
    if (savedFontSize === 'sm') pxVal = '13px';
    else if (savedFontSize === 'md') pxVal = '14px';
    else if (savedFontSize === 'lg') pxVal = '16px';
    else pxVal = `${savedFontSize}px`;
    root.style.fontSize = pxVal;

    // 4. Glassmorphism
    const savedGlass = localStorage.getItem('prephq_glassmorphism') !== 'false';
    if (savedGlass) {
      root.classList.remove('no-glass');
    } else {
      root.classList.add('no-glass');
    }
  }, [state.theme]);

  // Main views routing
  const renderActiveView = () => {
    switch (state.activeTab) {
      case 'learning-dashboard':
        return <LearningDashboard searchGlobal={searchGlobal} />;
      case 'company-profiles':
        return <CompanyProfiles searchGlobal={searchGlobal} />;
      case 'targeted-prep':
        return <TargetedPrepPlan />;
      case 'industry-patterns':
        return <IndustryPatterns searchGlobal={searchGlobal} />;
      case 'study-notebook':
        return <StudyNotebook searchGlobal={searchGlobal} />;
      case 'settings':
        return <PersonalCenter />;
      default:
        return <LearningDashboard searchGlobal={searchGlobal} />;
    }
  };

  if (!token || !user) {
    return (
      <>
        <LoginScreen onLoginSuccess={login} />
        <ToastContainer />
      </>
    );
  }

  if (!isInitialSyncCompleted) {
    return (
      <div className={`fixed inset-0 z-[999] flex flex-col items-center justify-center p-4 transition-colors duration-200 ${
        state.theme === 'dark'
          ? 'bg-[#0d1117] text-slate-100'
          : 'bg-[#f8fafc] text-slate-800'
      }`}>
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg animate-pulse">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 mt-2">
            <h3 className="text-sm font-black tracking-tight flex items-center justify-center gap-2">
              <span>Syncing Workstation</span>
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest leading-none">
              Connecting secure session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      state.theme === 'dark' ? 'bg-bg-dark text-slate-100' : 'bg-bg-light text-slate-800'
    }`}>
      {/* Dynamic Slide-out Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      {/* Top Header Panel */}
      <TopBar
        setIsMobileOpen={setIsMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsCommandPaletteOpen={setIsCommandPaletteOpen}
      />

      {/* Scrollable Workstation Content Area */}
      <div className={`flex-1 pt-16 pb-16 lg:pb-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {renderActiveView()}
      </div>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around h-16 border-t px-2 pb-safe shadow-lg transition-colors duration-150 ${
        state.theme === 'dark'
          ? 'bg-surface-dark border-border-dark text-slate-400'
          : 'bg-white border-slate-200 text-slate-500'
      }`}>
        {[
          { id: "learning-dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "company-profiles", label: "Companies", icon: Building2 },
          { id: "targeted-prep", label: "Prep Plan", icon: Calendar },
          { id: "industry-patterns", label: "Patterns", icon: Layers },
          { id: "study-notebook", label: "Notebook", icon: BookOpen }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = state.activeTab === item.id;
          return (
            <button
              key={item.id}
              data-tab={item.id}
              onClick={() => {
                if (saveState === 'unsaved') {
                  const confirmDiscard = window.confirm("You have unsaved study note changes. Are you sure you want to navigate away?");
                  if (!confirmDiscard) return;
                }
                setTab(item.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 cursor-pointer transition-colors duration-150 ${
                isActive ? 'text-indigo-500 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Popups Notifications */}
      <ToastContainer />

      {/* Cmd+K Command Palette Modal Overlay */}
      {isCommandPaletteOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 backdrop-blur-md pt-20 p-4 animate-fade-in cursor-pointer"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div 
            className={`w-full max-w-2xl rounded-2xl border p-4 shadow-2xl relative flex flex-col max-h-[70vh] cursor-default transition-all duration-150 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b pb-3 mb-3 border-inherit">
              <Search className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search cards, patterns, notebooks, companies (Ctrl+K)..."
                value={commandPaletteQuery}
                onChange={(e) => setCommandPaletteQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex((prev) => 
                      commandPaletteResults.length > 0 
                        ? (prev + 1) % commandPaletteResults.length 
                        : 0
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex((prev) => 
                      commandPaletteResults.length > 0 
                        ? (prev - 1 + commandPaletteResults.length) % commandPaletteResults.length 
                        : 0
                    );
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (commandPaletteResults[activeIndex]) {
                      handleCommandPaletteSelect(commandPaletteResults[activeIndex]);
                    }
                  }
                }}
                className="w-full bg-transparent text-sm outline-none border-none p-0 focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded border border-slate-500/20 text-slate-400 select-none">
                ESC
              </span>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {!commandPaletteQuery.trim() ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">Command Palette Active</p>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Start typing to search notes, flashcards, interview loops, and blueprints...</p>
                </div>
              ) : commandPaletteResults.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-semibold">No results match "{commandPaletteQuery}"</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {commandPaletteResults.map((res, idx) => {
                    const isHighlighted = idx === activeIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleCommandPaletteSelect(res)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                          isHighlighted
                            ? state.theme === 'dark' 
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' 
                              : 'bg-indigo-500/10 text-indigo-650 border border-indigo-500/20 shadow-sm'
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 flex-shrink-0">
                          {res.type === 'card' && <HelpCircle className="w-4 h-4" />}
                          {res.type === 'company' && <Building2 className="w-4 h-4" />}
                          {res.type === 'pattern' && <Layers className="w-4 h-4" />}
                          {res.type === 'note' && <BookOpen className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold truncate leading-tight">{res.title}</span>
                            {res.matchReason && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex-shrink-0 select-none">
                                {res.matchReason}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate mt-0.5">{res.subtitle}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
