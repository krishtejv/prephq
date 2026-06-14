import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrepStore } from '../context/PrepContext';
import { ConfirmModal } from './shared/ConfirmModal';
import {
  Building2,
  Trash2,
  Edit3,
  Plus,
  X,
  PlusCircle,
  Trash,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

export const CompanyProfiles = ({ searchGlobal }) => {
  const { state, addCompany, updateCompany, deleteCompany, setActiveCompanyId } = usePrepStore();

  const [editingCompany, setEditingCompany] = useState(null); // Edit Modal
  const [showAddModal, setShowAddModal] = useState(false); // Add Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [activeLoopCompany, setActiveLoopCompany] = useState(null); // View Interview Loop Modal
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextCompany();
    } else if (isRightSwipe) {
      handlePrevCompany();
    }
  };

  // Open the loop modal automatically if activeCompanyId is selected via global search / command palette
  useEffect(() => {
    if (state.activeCompanyId) {
      const co = (state.companies || []).find((c) => c.id === state.activeCompanyId);
      if (co) {
        setActiveLoopCompany(co);
      }
    }
  }, [state.activeCompanyId, state.companies]);

  const handleCloseLoopModal = () => {
    setActiveLoopCompany(null);
    setActiveCompanyId(null);
  };

  // Filter companies list based on global search
  const filteredCompanies = useMemo(() => {
    const list = state.companies || [];
    const query = (searchGlobal || '').trim().toLowerCase();
    if (!query) return list;

    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query) ||
        c.topics?.some((t) => t.toLowerCase().includes(query))
    );
  }, [state.companies, searchGlobal]);

  // Modal detail navigation index and controls
  const currentIndex = useMemo(() => {
    if (!activeLoopCompany) return -1;
    return filteredCompanies.findIndex((c) => c.id === activeLoopCompany.id);
  }, [activeLoopCompany, filteredCompanies]);

  const handlePrevCompany = () => {
    if (currentIndex === -1 || filteredCompanies.length <= 1) return;
    const prevIdx = (currentIndex - 1 + filteredCompanies.length) % filteredCompanies.length;
    setActiveLoopCompany(filteredCompanies[prevIdx]);
    setActiveCompanyId(filteredCompanies[prevIdx].id);
  };

  const handleNextCompany = () => {
    if (currentIndex === -1 || filteredCompanies.length <= 1) return;
    const nextIdx = (currentIndex + 1) % filteredCompanies.length;
    setActiveLoopCompany(filteredCompanies[nextIdx]);
    setActiveCompanyId(filteredCompanies[nextIdx].id);
  };

  // Status Badge styles matching StatusPill
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Interviewing':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'In Progress':
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formTopicsText, setFormTopicsText] = useState(''); // Comma-separated strings
  const [formRounds, setFormRounds] = useState([]); // List of { num, title, desc }
  const [formStatus, setFormStatus] = useState('In Progress');

  // Custom Inline validation errors
  const [formErrors, setFormErrors] = useState({ name: '', type: '' });

  // Initialize add form
  const handleOpenAddModal = () => {
    setFormName('');
    setFormType('');
    setFormTopicsText('');
    setFormStatus('In Progress');
    setFormRounds([
      { num: 1, title: 'Round 1: Online Assessment (OA)', desc: 'Coding and algorithm screening test.' }
    ]);
    setFormErrors({ name: '', type: '' });
    setShowAddModal(true);
  };

  // Initialize edit form
  const handleOpenEditModal = (e, company) => {
    e.stopPropagation(); // Avoid opening detail loop modal
    setEditingCompany(company);
    setFormName(company.name);
    setFormType(company.type);
    setFormTopicsText(company.topics.join(', '));
    setFormStatus(company.status || 'In Progress');
    setFormRounds(JSON.parse(JSON.stringify(company.rounds || [])));
    setFormErrors({ name: '', type: '' });
  };

  // Add round to form state
  const handleAddRound = () => {
    setFormRounds((prev) => [
      ...prev,
      { num: prev.length + 1, title: `Round ${prev.length + 1}: Name`, desc: '' }
    ]);
  };

  // Remove round from form state
  const handleRemoveRound = (idx) => {
    const nextRounds = formRounds.filter((_, i) => i !== idx).map((r, i) => ({
      ...r,
      num: i + 1
    }));
    setFormRounds(nextRounds);
  };

  // Update round content
  const handleUpdateRound = (idx, field, value) => {
    const nextRounds = [...formRounds];
    nextRounds[idx][field] = value;
    setFormRounds(nextRounds);
  };

  // Form submit validation
  const validateForm = () => {
    const errors = { name: '', type: '' };
    let hasError = false;

    if (!formName.trim()) {
      errors.name = 'Company name is required';
      hasError = true;
    }
    if (!formType.trim()) {
      errors.type = 'Company type is required';
      hasError = true;
    }

    setFormErrors(errors);
    return !hasError;
  };

  // Submit company addition
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const topicsArr = formTopicsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newCo = {
      id: `company-${Date.now()}`,
      name: formName.trim(),
      type: formType.trim(),
      topics: topicsArr,
      rounds: formRounds,
      status: formStatus
    };

    addCompany(newCo);
    setShowAddModal(false);
  };

  // Submit company edit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateForm() || !editingCompany) return;

    const topicsArr = formTopicsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updated = {
      name: formName.trim(),
      type: formType.trim(),
      topics: topicsArr,
      rounds: formRounds,
      status: formStatus
    };

    updateCompany(editingCompany.id, updated);
    
    const matched = { ...editingCompany, ...updated };
    if (activeLoopCompany?.id === editingCompany.id) {
      setActiveLoopCompany(matched);
    }
    setEditingCompany(null);
  };

  // Submit company deletion trigger
  const handleDeleteConfirm = (e, company) => {
    e.stopPropagation(); // Avoid opening detail loop modal
    const confirmed = window.confirm(`Delete company profile "${company.name}"?`);
    if (confirmed) {
      deleteCompany(company.id);
      if (activeLoopCompany?.id === company.id) {
        setActiveLoopCompany(null);
        setActiveCompanyId(null);
      }
    }
  };

  return (
    <div className="space-y-6 p-6 transition-all duration-150">
      {/* Zone 1 — Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Company Profiles
          </h1>
          <p className="text-sm lg:text-base text-slate-500 mt-1">
            Analyze structures, interview sequences, and core focuses of target firms.
          </p>
        </div>
        <button
          id="add-company-btn"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow cursor-pointer transition-colors whitespace-nowrap self-center mt-1 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Profile</span>
        </button>
      </div>

      {/* Grid of Target Firm Cards */}
        {filteredCompanies.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
          }`}>
            <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
            <h3 className="font-bold text-slate-500 dark:text-slate-400">No profiles found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or add a new target profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCompanies.map((c) => {
              const displayedTopics = c.topics || [];
              const maxVisible = 3;
              const showMoreCount = displayedTopics.length - maxVisible;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveLoopCompany(c);
                  }}
                  className={`company-card relative group p-6 rounded-2xl border transition-all duration-155 cursor-pointer flex flex-col justify-between min-h-[170px] shadow-sm hover:shadow-md ${
                    state.theme === 'dark'
                      ? 'bg-surface-dark border-border-dark text-slate-100 hover:border-slate-800'
                      : 'bg-white border-border-light text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Hover Edit/Delete Controls */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(e, c)}
                      className="edit-co-btn p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Edit profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConfirm(e, c)}
                      className="delete-co-btn p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>                  {/* Top content */}
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight truncate pr-14 leading-snug" title={c.name}>
                      {c.name}
                    </h3>
                    <span className="company-type text-[10px] md:text-xs font-bold text-indigo-500 uppercase tracking-widest block mt-0.5 mb-4">
                      {c.type}
                    </span>

                    {/* Focus Topics Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {displayedTopics.slice(0, maxVisible).map((t, idx) => (
                        <span
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold border ${
                            state.theme === 'dark'
                              ? 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                      {showMoreCount > 0 && (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold border ${
                            state.theme === 'dark'
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                          }`}
                        >
                          +{showMoreCount} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-inherit mt-6 pt-4 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`w-24 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border select-none inline-flex items-center justify-center ${getStatusStyles(c.status || 'In Progress')}`}>
                        {c.status || 'In Progress'}
                      </span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        • {c.rounds?.length || 0} Rounds
                      </span>
                    </div>
                    <button
                      type="button"
                      className="view-prep-map-btn text-xs font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 tracking-wider flex items-center gap-1 transition-colors flex-shrink-0 bg-transparent border-none outline-none cursor-pointer"
                    >
                      View Interview Loop <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* View Interview Loop Modal Overlay */}
      {activeLoopCompany && createPortal(
        <div
          id="company-detail-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseLoopModal();
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
          style={{ margin: 0 }}
        >
          <div className="relative w-full max-w-2xl my-8">
            {/* Left Chevron Button */}
            {filteredCompanies.length > 1 && (
              <button
                type="button"
                onClick={handlePrevCompany}
                className="hidden md:flex absolute md:-left-16 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-lg cursor-pointer hover:scale-105 active:scale-95 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all z-50"
                title="Previous Target"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div
              className={`w-full rounded-2xl border shadow-2xl relative p-6 transition-all duration-150 transform scale-100 ${
                state.theme === 'dark'
                  ? 'bg-surface-dark border-border-dark text-slate-100'
                  : 'bg-white border-border-light text-slate-800'
              }`}
            >
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    handleOpenEditModal(e, activeLoopCompany);
                    handleCloseLoopModal();
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Edit profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  id="close-company-modal"
                  type="button"
                  onClick={handleCloseLoopModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-355 hover:bg-slate-500/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-left mb-5">
                <h2 className="text-2xl font-black tracking-tight leading-snug mb-1.5">
                  {activeLoopCompany.name}
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-2.5">
                  <span className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
                    {activeLoopCompany.type?.toUpperCase()}
                  </span>
                  <span className="hidden md:inline text-xs text-slate-400 dark:text-slate-500 font-extrabold select-none">•</span>
                  <span className={`w-24 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border select-none inline-flex items-center justify-center ${getStatusStyles(activeLoopCompany.status || 'In Progress')}`}>
                    {activeLoopCompany.status || 'In Progress'}
                  </span>
                </div>
              </div>

              {/* Focus Topics pills */}
              <div className="space-y-2 text-left mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 select-none">
                  Primary Interview Focuses
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeLoopCompany.topics && activeLoopCompany.topics.length > 0 ? (
                    activeLoopCompany.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          state.theme === 'dark'
                            ? 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic font-semibold">No focus topics listed.</p>
                  )}
                </div>
              </div>

              {/* Timeline of rounds */}
              <div className="space-y-4 text-left border-t border-inherit pt-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 select-none">
                  Structured Interview Rounds
                </h4>
                {activeLoopCompany.rounds && activeLoopCompany.rounds.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-6 pr-9 space-y-6">
                    {activeLoopCompany.rounds.map((round, idx) => (
                      <div key={idx} className="timeline-step relative">
                        {/* Timeline point */}
                        <div className="absolute -left-[31px] top-1.5 flex items-center justify-center w-[10px] h-[10px] rounded-full bg-indigo-600 dark:bg-indigo-400 border-4 border-white dark:border-surface-dark" />
                        <div>
                          <h5 className="text-base font-extrabold leading-tight mb-1.5 flex items-center gap-1.5">
                            <span className="text-indigo-600 dark:text-indigo-400">{round.num}</span>
                            {round.title}
                          </h5>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold text-justify">
                            {round.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic font-semibold pl-3">No interview rounds configured.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t pt-5 mt-6 border-inherit">
                <div>
                  {filteredCompanies.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrevCompany}
                        className="md:hidden p-1 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Previous Profile"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-slate-400 dark:text-slate-500 font-extrabold select-none">
                        {currentIndex + 1} of {filteredCompanies.length} Profiles
                      </span>
                      <button
                        type="button"
                        onClick={handleNextCompany}
                        className="md:hidden p-1 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Next Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Chevron Button */}
            {filteredCompanies.length > 1 && (
              <button
                type="button"
                onClick={handleNextCompany}
                className="hidden md:flex absolute md:-right-16 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-lg cursor-pointer hover:scale-105 active:scale-95 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all z-50"
                title="Next Target"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Add / Edit Modal Overlay */}
      {(showAddModal || editingCompany) && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" style={{ margin: 0 }}>
          <div
            id="company-crud-modal"
            className={`w-full max-w-lg rounded-2xl border p-6 my-8 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingCompany(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-355 hover:bg-slate-500/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 id="company-crud-modal-title" className="text-lg font-black tracking-tight mb-4">
              {editingCompany ? `Edit Target: ${editingCompany.name}` : 'Add Custom Company'}
            </h3>

            <form onSubmit={editingCompany ? handleEditSubmit : handleAddSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Company name
                </label>
                <input
                  id="company-crud-name"
                  type="text"
                  required
                  placeholder="E.g., Citadel Securities, Google..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-100'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Profile type
                  </label>
                  <input
                    id="company-crud-type"
                    type="text"
                    required
                    placeholder="E.g., Quantitative Trading..."
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                      state.theme === 'dark'
                        ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-100'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Application status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                      state.theme === 'dark'
                        ? 'bg-bg-dark border-border-dark focus:border-indigo-555 text-slate-305'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-555 text-slate-700'
                    }`}
                  >
                    <option value="Not Applied">Not Applied</option>
                    <option value="Applied">Applied</option>
                    <option value="Online Assessment">Online Assessment</option>
                    <option value="Technical Phone Screen">Technical Phone Screen</option>
                    <option value="Onsite Loop">Onsite Loop</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-450 block mb-1">
                  Primary interview focus topics (comma-separated)
                </label>
                <input
                  id="company-crud-topics"
                  type="text"
                  placeholder="E.g., low-latency systems, linear algebra..."
                  value={formTopicsText}
                  onChange={(e) => setFormTopicsText(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-555 text-slate-100'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-555 text-slate-800'
                  }`}
                />
              </div>

              {/* Loop stages list builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 block">
                    Interview loop pipeline stages ({formRounds.length})
                  </label>
                  <button
                    id="company-crud-add-round-btn"
                    type="button"
                    onClick={handleAddRound}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add round</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {formRounds.map((round, idx) => (
                    <div key={idx} className="company-crud-round-row flex gap-2 items-start bg-slate-500/5 p-3 rounded-xl border border-slate-500/10">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Round title (e.g. Phone Screen)"
                          value={round.title}
                          onChange={(e) => handleUpdateRound(idx, 'title', e.target.value)}
                          className={`round-title-input w-full text-xs font-bold bg-transparent outline-none border-b focus:border-indigo-500 pb-1 ${
                            state.theme === 'dark' ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'
                          }`}
                        />
                        <textarea
                          placeholder="Brief details or expectations..."
                          value={round.desc}
                          onChange={(e) => handleUpdateRound(idx, 'desc', e.target.value)}
                          className={`round-desc-input w-full text-[11px] font-semibold bg-transparent outline-none border-b focus:border-indigo-555 pb-1 resize-none h-10 ${
                            state.theme === 'dark' ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(idx)}
                        className="p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-inherit">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCompany(null);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="company-crud-modal-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
