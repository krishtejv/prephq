import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrepStore } from '../context/PrepContext';
import { Plus, X, BookOpenCheck, Trash2, Sparkles, FolderSync } from 'lucide-react';
import { StatsRow } from './dashboard/StatsRow';
import { DomainTabs } from './dashboard/DomainTabs';
import { QuestionCard } from './dashboard/QuestionCard';
import { ConfirmModal } from './shared/ConfirmModal';

export const LearningDashboard = ({ searchGlobal }) => {
  const {
    state,
    addCustomQuestion,
    setDomain,
    addCustomDomain,
    deleteCustomDomain,
    setActiveQuestionId
  } = usePrepStore();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [showManageDomains, setShowManageDomains] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [domainToDelete, setDomainToDelete] = useState(null);
  
  // Custom Question Form Dialog state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newAnswerText, setNewAnswerText] = useState('');
  const [newNotesText, setNewNotesText] = useState('');
  const [newStatus, setNewStatus] = useState('To Do');
  const [newTagsText, setNewTagsText] = useState('');
  const [formErrors, setFormErrors] = useState({
    title: '',
    domain: '',
    question: '',
    answer: ''
  });
  
  // Local state for active domains (multi-select)
  const [activeDomains, setActiveDomains] = useState(() => {
    return state.activeDomain ? [state.activeDomain] : [];
  });

  const [newDomain, setNewDomain] = useState(state.activeDomain || '');

  // Synchronize with global search/command palette selection
  useEffect(() => {
    if (state.activeDomain) {
      setActiveDomains([state.activeDomain]);
      setNewDomain(state.activeDomain);
    }
  }, [state.activeDomain]);

  // Mobile quick review state
  const [showQuickReview, setShowQuickReview] = useState(false);
  const [quickReviewCard, setQuickReviewCard] = useState(null);
  const [revealAnswer, setRevealAnswer] = useState(false);

  const allCards = useMemo(() => {
    const list = [];
    Object.entries(state.domains || {}).forEach(([dKey, dom]) => {
      Object.entries(dom.categories || {}).forEach(([catName, qList]) => {
        qList.forEach((q) => {
          list.push({ ...q, domainKey: dKey, categoryName: catName });
        });
      });
    });
    return list;
  }, [state.domains]);

  const handleStartQuickReview = () => {
    if (allCards.length === 0) return;
    const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
    setQuickReviewCard(randomCard);
    setRevealAnswer(false);
    setShowQuickReview(true);
  };

  // Global KPI Metrics across ALL domains
  const stats = useMemo(() => {
    let totalQuestions = 0;
    let completedQuestions = 0;
    let doingQuestions = 0;
    let reviewQuestions = 0;

    Object.values(state.domains || {}).forEach((dom) => {
      Object.values(dom.categories || {}).forEach((qList) => {
        qList.forEach((q) => {
          totalQuestions++;
          if (q.status === 'Done') completedQuestions++;
          else if (q.status === 'Doing') doingQuestions++;
          else if (q.status === 'Needs Review') reviewQuestions++;
        });
      });
    });

    const completionRate = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

    return {
      total: totalQuestions,
      done: completedQuestions,
      doing: doingQuestions,
      review: reviewQuestions,
      pct: completionRate
    };
  }, [state.domains]);

  // Helper label representing active selection
  const activeDomainsLabel = useMemo(() => {
    if (activeDomains.length === 1) {
      return state.domains[activeDomains[0]]?.name || '';
    }
    if (activeDomains.length === 0) {
      return 'All Domains';
    }
    return 'Multiple Domains';
  }, [activeDomains, state.domains]);

  // Consistent "Add Card" button label
  const addCardLabel = "Add Card";

  // Check if onboarding is active
  const isOnboardingActive = Object.keys(state.domains || {}).length === 0 || stats.total === 0;

  // Active domain keys determined by selection (empty means All Domains)
  const activeDomainKeys = useMemo(() => {
    if (activeDomains.length === 0) {
      return Object.keys(state.domains || {});
    }
    return activeDomains;
  }, [activeDomains, state.domains]);

  // Categories under active domains combined
  const categoriesList = useMemo(() => {
    const cats = new Set();
    activeDomainKeys.forEach((dKey) => {
      const dom = state.domains[dKey];
      if (dom && dom.categories) {
        Object.keys(dom.categories).forEach((cat) => {
          cats.add(cat);
        });
      }
    });
    return Array.from(cats);
  }, [activeDomainKeys, state.domains]);

  // Filtered categories and questions combined across all active domains
  const filteredQuestions = useMemo(() => {
    const output = {};
    const searchLower = searchGlobal?.toLowerCase() || '';

    activeDomainKeys.forEach((dKey) => {
      const dom = state.domains[dKey];
      if (!dom || !dom.categories) return;

      Object.entries(dom.categories).forEach(([catName, qList]) => {
        // Apply category filter
        if (selectedCategoryFilter !== 'All' && selectedCategoryFilter !== catName) return;

        // Apply search filter
        const matches = qList.filter(
          (q) =>
            q.title.toLowerCase().includes(searchLower) ||
            q.question.toLowerCase().includes(searchLower) ||
            q.answer.toLowerCase().includes(searchLower) ||
            catName.toLowerCase().includes(searchLower) ||
            (q.tags && q.tags.some(t => t.toLowerCase().includes(searchLower)))
        );

        if (matches.length > 0) {
          if (!output[catName]) {
            output[catName] = [];
          }
          matches.forEach((m) => {
            output[catName].push({ ...m, domainKey: dKey });
          });
        }
      });
    });

    return output;
  }, [activeDomainKeys, state.domains, selectedCategoryFilter, searchGlobal]);

  // Save the custom question
  const handleAddQuestionSubmit = (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!newTitle.trim()) {
      errors.title = 'Card title is required';
    }
    const domainToUse = newDomain;
    if (!domainToUse) {
      errors.domain = 'Knowledge domain is required';
    }
    if (!newQuestionText.trim()) {
      errors.question = 'Question prompt is required';
    }
    if (!newAnswerText.trim()) {
      errors.answer = 'Expected answer is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({ title: '', domain: '', question: '', answer: '' });

    const catToUse = newCategory.trim() || 'General';
    const tagsArr = newTagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newQ = {
      id: `${domainToUse.toLowerCase()}-q-${Date.now()}`,
      title: newTitle,
      status: newStatus,
      question: newQuestionText,
      answer: newAnswerText,
      notes: newNotesText,
      tags: tagsArr
    };

    addCustomQuestion(domainToUse, catToUse, newQ);
    setDomain(domainToUse);
    
    // Reset Form
    setNewTitle('');
    setNewCategory('');
    setNewQuestionText('');
    setNewAnswerText('');
    setNewNotesText('');
    setNewStatus('To Do');
    setNewTagsText('');
    setShowAddForm(false);
  };

  const handleOpenAddForm = () => {
    const categoryName = window.prompt("Enter active category track name:");
    if (!categoryName) return;
    const questionTitle = window.prompt("Enter short question title:");
    if (!questionTitle) return;

    const domainToUse = activeDomains[0] || Object.keys(state.domains || {})[0] || '';
    if (!domainToUse) return;

    const newQ = {
      id: `${domainToUse.toLowerCase()}-q-${Date.now()}`,
      title: questionTitle.trim(),
      status: 'To Do',
      question: 'Question prompt text',
      answer: 'Expected answer details',
      notes: '',
      tags: []
    };

    addCustomQuestion(domainToUse, categoryName.trim(), newQ);
    setDomain(domainToUse);
    setActiveQuestionId(newQ.id);
  };

  return (
    <div className="space-y-6 p-6 transition-all duration-150">
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Learning Dashboard</h1>
        <p className="text-sm lg:text-base text-slate-500 mt-1">Track and manage your study domains, flashcards, and prep metrics.</p>
      </div>

      {/* KPI Stats Grid */}
      <StatsRow stats={stats} />

      {/* Onboarding Banner for 0 Domains */}
      {Object.keys(state.domains || {}).length === 0 && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <div className="space-y-1">
              <h3 className="font-extrabold text-indigo-500 flex items-center gap-2">
                <span className="text-lg">✨</span> Build Your Knowledge Dashboard
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Start by adding your first Knowledge Domain, then create flashcards to begin your active recall loop.
              </p>
            </div>
            <button
              onClick={() => setShowManageDomains(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap animate-pulse"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manage Domains</span>
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Banner for 0 Cards */}
      {Object.keys(state.domains || {}).length > 0 && stats.total === 0 && (
        <div className="p-6 rounded-2xl border text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border-indigo-500/20">
          <div className="space-y-1">
            <h3 className="font-extrabold text-indigo-500 flex items-center gap-2">
              <span className="text-lg">💡</span> Add Your First Flashcard
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              Your study domains are set! Now, populate them with active recall cards. Flashcards can contain rich text answers, status tags, and specific notes to measure your memory loops.
            </p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap animate-pulse"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addCardLabel}</span>
          </button>
        </div>
      )}

      {/* Domain Navigation Tabs */}
      <DomainTabs
        activeDomains={activeDomains}
        handleToggleDomain={(key) => {
          if (activeDomains.includes(key)) {
            setActiveDomains(activeDomains.filter((k) => k !== key));
          } else {
            setActiveDomains([...activeDomains, key]);
          }
        }}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        onManageClick={() => setShowManageDomains(true)}
      />

      {/* Filter and Add Row */}
      {Object.keys(state.domains || {}).length > 0 ? (
        <div className="sticky top-0 z-20 flex flex-col gap-3 border-b pb-4 pt-4 border-inherit bg-bg-light dark:bg-bg-dark shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 select-none">
              Filters
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
            {/* Sub-category pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('All')}
                className={`filter-capsule px-3 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-150 ${
                  selectedCategoryFilter === 'All'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800'
                    : state.theme === 'dark'
                    ? 'bg-surface-dark hover:bg-slate-800 text-slate-400 border border-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                All Segments
              </button>
              {categoriesList.map((catName) => (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(catName)}
                  className={`filter-capsule px-3 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-150 ${
                    selectedCategoryFilter === catName
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800'
                      : state.theme === 'dark'
                      ? 'bg-surface-dark hover:bg-slate-800 text-slate-400 border border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {catName}
              </button>
              ))}
            </div>

            {/* Add Question Button */}
            {!isOnboardingActive && (
              <button
                type="button"
                id="add-question-btn"
                onClick={handleOpenAddForm}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-all duration-150 cursor-pointer self-end md:self-auto ml-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{addCardLabel}</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Categories and Question Lists */}
      <div className="space-y-6">
        {Object.keys(filteredQuestions).length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
          }`}>
            <BookOpenCheck className="w-12 h-12 mx-auto text-indigo-500 mb-3 opacity-80" />
            <h3 className="font-extrabold text-base tracking-tight text-slate-700 dark:text-slate-200">No active flashcards found</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              There are no study cards in this segment filter yet. Create custom flashcards directly to start your active recall loop!
            </p>
            {!isOnboardingActive && (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="hidden md:inline-flex mt-4 items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{addCardLabel}</span>
              </button>
            )}
          </div>
        ) : (
          Object.entries(filteredQuestions).map(([catName, qList]) => (
            <div key={catName} className="space-y-3">
              <h3 className="category-title text-sm font-extrabold uppercase tracking-widest text-indigo-500 pl-1">
                {catName}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {qList.map((q) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    catName={catName}
                    activeDomainKey={q.domainKey}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Question Modal Overlay */}
      {showAddForm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-500/10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black tracking-tight mb-4">
              Add Custom Study Flashcard
            </h3>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Knowledge domain
                  </label>
                  <select
                    value={newDomain}
                    onChange={(e) => {
                      setNewDomain(e.target.value);
                      if (formErrors.domain) setFormErrors(p => ({ ...p, domain: '' }));
                    }}
                    className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                      state.theme === 'dark'
                        ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-300'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-700'
                    }`}
                  >
                    <option value="" disabled>Select a domain</option>
                    {activeDomains.map(dKey => (
                      <option key={dKey} value={dKey}>{state.domains[dKey]?.name || dKey}</option>
                    ))}
                  </select>
                  {formErrors.domain && (
                    <p className="text-rose-500 text-xs font-semibold mt-1">{formErrors.domain}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Title summary
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Event loop latency, GC roots..."
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (formErrors.title) setFormErrors(p => ({ ...p, title: '' }));
                    }}
                    className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                      formErrors.title
                        ? 'border-rose-500 focus:border-rose-500'
                        : state.theme === 'dark'
                        ? 'bg-bg-dark border-border-dark focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="text-rose-500 text-xs font-semibold mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Category segment
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Fundamentals, Advanced..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                      state.theme === 'dark'
                        ? 'bg-bg-dark border-border-dark focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Status initial
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-555 text-slate-300'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-555 text-slate-700'
                  }`}
                >
                  <option value="To Do">To Do</option>
                  <option value="Doing">Doing</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="E.g. hard, revisit, citadel..."
                  value={newTagsText}
                  onChange={(e) => setNewTagsText(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-555'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Question prompt
                </label>
                <textarea
                  placeholder="Draft your question or active recall memory trigger here..."
                  value={newQuestionText}
                  onChange={(e) => {
                    setNewQuestionText(e.target.value);
                    if (formErrors.question) setFormErrors(p => ({ ...p, question: '' }));
                  }}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none min-h-[80px] ${
                    formErrors.question
                      ? 'border-rose-500 focus:border-rose-500'
                      : state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                />
                {formErrors.question && (
                  <p className="text-rose-500 text-xs font-semibold mt-1">{formErrors.question}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Expected answer / blueprint outline
                </label>
                <textarea
                  placeholder="Code blocks, bullet points, or core technical explanation..."
                  value={newAnswerText}
                  onChange={(e) => {
                    setNewAnswerText(e.target.value);
                    if (formErrors.answer) setFormErrors(p => ({ ...p, answer: '' }));
                  }}
                  className={`w-full text-sm font-mono rounded-xl border p-2.5 outline-none min-h-[120px] ${
                    formErrors.answer
                      ? 'border-rose-500 focus:border-rose-500'
                      : state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-555'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                />
                {formErrors.answer && (
                  <p className="text-rose-500 text-xs font-semibold mt-1">{formErrors.answer}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Notes / recall hotspots
                </label>
                <textarea
                  placeholder="Tricky details, latency impacts, optimization gotchas..."
                  value={newNotesText}
                  onChange={(e) => setNewNotesText(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none min-h-[60px] ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-inherit">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      
      {/* Manage Domains Modal Overlay */}
      {showManageDomains && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setShowManageDomains(false);
                setNewDomainName('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-500/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black tracking-tight mb-4">
              Manage Knowledge Domains
            </h3>

            {/* Create Domain Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDomainName.trim()) return;
                addCustomDomain(newDomainName.trim());
                setNewDomainName('');
              }}
              className="flex gap-2 mb-6"
            >
              <input
                type="text"
                required
                placeholder="E.g., Rust, Databases..."
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                className={`flex-1 text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                  state.theme === 'dark'
                    ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-100'
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-800'
                }`}
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Add</span>
              </button>
            </form>

            {/* List of Active Domains */}
            {Object.keys(state.domains || {}).length > 0 && (
              <>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
                  Active Domains
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {Object.entries(state.domains || {}).map(([dKey, dom]) => (
                    <div
                      key={dKey}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        state.theme === 'dark'
                          ? 'bg-bg-dark/40 border-border-dark text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="font-bold text-sm truncate">{dom.name}</span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide">
                          {Object.values(dom.categories || {}).reduce((acc, curr) => acc + curr.length, 0)} cards
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDomainToDelete(dKey)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                        title="Delete domain recursively"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
      {/* Domain deletion confirmation modal */}
      <ConfirmModal
        isOpen={!!domainToDelete}
        onClose={() => setDomainToDelete(null)}
        onConfirm={() => {
          if (domainToDelete) {
            deleteCustomDomain(domainToDelete);
            setDomainToDelete(null);
          }
        }}
        title="Delete Knowledge Domain"
        message={`Are you sure you want to permanently delete the "${state.domains[domainToDelete]?.name || ''}" domain? This will recursively delete all study flashcards associated with it.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Mobile Speed Dial FAB */}
      {Object.keys(state.domains || {}).length > 0 && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3 md:hidden">
          {/* Speed Dial Options Container */}
          {isSpeedDialOpen && (
            <div className="flex flex-col items-end gap-3 mb-2 animate-fade-in-up">
              {/* Option 1: Add Card */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-[10px] font-bold text-white bg-slate-900/80 dark:bg-slate-800/90 rounded-lg shadow-sm border border-slate-700/30 select-none">
                  Add Card
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAddForm();
                    setIsSpeedDialOpen(false);
                  }}
                  className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
                >
                  <Plus className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Option 2: Manage Domains */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-[10px] font-bold text-white bg-slate-900/80 dark:bg-slate-800/90 rounded-lg shadow-sm border border-slate-700/30 select-none">
                  Manage Domains
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowManageDomains(true);
                    setIsSpeedDialOpen(false);
                  }}
                  className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
                >
                  <FolderSync className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Option 3: Quick Review */}
              {allCards.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-[10px] font-bold text-white bg-slate-900/80 dark:bg-slate-800/90 rounded-lg shadow-sm border border-slate-700/30 select-none">
                    Quick Review
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartQuickReview();
                      setIsSpeedDialOpen(false);
                    }}
                    className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
                  >
                    <Sparkles className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main FAB Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            className={`p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-200 transform ${
              isSpeedDialOpen ? 'rotate-45' : 'scale-100 active:scale-95'
            }`}
            title="Workstation Action Menu"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Mobile Quick Review Modal Overlay */}
      {showQuickReview && quickReviewCard && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 text-left ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowQuickReview(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-500/10"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-md mb-3 inline-block">
              {quickReviewCard.categoryName} ({state.domains[quickReviewCard.domainKey]?.name || ''})
            </span>

            <h3 className="text-lg font-black tracking-tight mb-4 leading-snug">
              {quickReviewCard.title}
            </h3>

            {/* Question card container */}
            <div className={`p-4 rounded-xl border mb-6 ${
              state.theme === 'dark' ? 'bg-bg-dark border-border-dark' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-355 whitespace-pre-wrap leading-relaxed">
                {quickReviewCard.question}
              </p>
            </div>

            {/* Answer (conditionally revealed) */}
            {revealAnswer ? (
              <div className="space-y-4 animate-fade-in">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Expected Answer:</span>
                <div className={`p-4 rounded-xl border max-h-[200px] overflow-y-auto ${
                  state.theme === 'dark' ? 'bg-bg-dark border-border-dark text-slate-200' : 'bg-slate-100/50 border-slate-200 text-slate-700'
                }`}>
                  <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {quickReviewCard.answer}
                  </p>
                </div>
                {quickReviewCard.notes && (
                  <div className="text-[11px] text-slate-400 italic">
                    Note: {quickReviewCard.notes}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealAnswer(true)}
                className="w-full py-3 text-xs font-bold text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-colors cursor-pointer"
              >
                Reveal Answer
              </button>
            )}

            {/* Modal Footer Controls */}
            {revealAnswer && (
              <div className="flex gap-2 border-t pt-4 mt-6 border-inherit">
                <button
                  type="button"
                  onClick={handleStartQuickReview}
                  className="flex-1 py-2 text-xs font-bold text-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Next Card
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickReview(false)}
                  className="flex-1 py-2 text-xs font-bold text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  Got It!
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
