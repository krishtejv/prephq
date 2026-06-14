import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePrepStore } from '../context/PrepContext';
import { ConfirmModal } from './shared/ConfirmModal';
import {
  Calendar,
  CheckSquare,
  Plus,
  Trash2,
  Edit3,
  X,
  TrendingUp,
  FileCheck,
  ClipboardList
} from 'lucide-react';

export const TargetedPrepPlan = () => {
  const {
    state,
    addPrepWeek,
    deletePrepWeek,
    updatePrepWeek,
    addPrepTask,
    deletePrepTask,
    togglePrepTask
  } = usePrepStore();

  const prepPlan = state.prepPlan || [];

  // Overall Task Completion Percentage
  const progressMetrics = useMemo(() => {
    let totalTasks = 0;
    let checkedTasks = 0;

    prepPlan.forEach((week) => {
      (week.tasks || []).forEach((t) => {
        totalTasks++;
        if (t.checked) checkedTasks++;
      });
    });

    const percent = totalTasks > 0 ? Math.round((checkedTasks / totalTasks) * 100) : 0;
    return {
      total: totalTasks,
      done: checkedTasks,
      pct: percent
    };
  }, [prepPlan]);

  // Add Custom Week State
  const [showAddWeekForm, setShowAddWeekForm] = useState(false);
  const [newWeekTitle, setNewWeekTitle] = useState('');
  const [newWeekFocus, setNewWeekFocus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);

  // Edit Week State
  const [showEditWeekForm, setShowEditWeekForm] = useState(false);
  const [editingWeekIndex, setEditingWeekIndex] = useState(null);
  const [editWeekTitle, setEditWeekTitle] = useState('');
  const [editWeekFocus, setEditWeekFocus] = useState('');

  // Inline New Task states indexed by week index
  const [newTaskTexts, setNewTaskTexts] = useState({});

  const handleOpenEditModal = (idx, week) => {
    setEditingWeekIndex(idx);
    setEditWeekTitle(week.title);
    setEditWeekFocus(week.focus || '');
    setShowEditWeekForm(true);
  };

  const handleEditWeekSubmit = (e) => {
    e.preventDefault();
    if (!editWeekTitle.trim()) return;

    updatePrepWeek(editingWeekIndex, {
      title: editWeekTitle.trim(),
      focus: editWeekFocus.trim() || 'General study segment'
    });
    
    setShowEditWeekForm(false);
    setEditingWeekIndex(null);
  };

  const handleAddWeekPrompt = () => {
    const title = window.prompt("Enter custom week title:");
    if (!title) return;
    const focus = window.prompt("Enter focus area details:");
    
    const nextWeekNum = prepPlan.length + 1;
    const newWeek = {
      week: nextWeekNum,
      title: title.trim(),
      focus: focus?.trim() || 'General study segment',
      tasks: []
    };

    addPrepWeek(newWeek);
  };

  const handleAddTaskSubmit = (e, weekIdx) => {
    e.preventDefault();
    const taskText = newTaskTexts[weekIdx] || '';
    if (!taskText.trim()) return;

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text: taskText,
      checked: false
    };

    addPrepTask(weekIdx, newTask);
    setNewTaskTexts((prev) => ({
      ...prev,
      [weekIdx]: ''
    }));
  };

  const handleTaskTextChange = (weekIdx, val) => {
    setNewTaskTexts((prev) => ({
      ...prev,
      [weekIdx]: val
    }));
  };

  const handleDeleteClick = (idx, wk) => {
    const confirmed = window.confirm(`Delete Week ${wk.week} and all its tasks?`);
    if (confirmed) {
      deletePrepWeek(idx);
    }
  };

  return (
    <div className="space-y-6 p-6 transition-all duration-150">
      {/* Zone 1 — Page Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Targeted Prep Plan
            </h1>
            <p className="text-sm lg:text-base text-slate-500 mt-1">
              Track your study goals, weekly milestones, and high-performance prep syllabus.
            </p>
          </div>

          <button
            id="add-prep-week-btn"
            onClick={handleAddWeekPrompt}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow cursor-pointer transition-colors whitespace-nowrap self-center mt-1 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Week</span>
          </button>
        </div>

        {/* Progress Bar Display */}
        {progressMetrics.total !== 0 && (
          <div className="flex items-center gap-3 w-full">
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 flex-1 relative overflow-hidden min-w-[100px]">
              <div
                id="prep-plan-bar"
                className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${progressMetrics.pct}%` }}
              />
            </div>
            <div className="flex items-center gap-1">
              <span id="prep-plan-pct" className="text-sm font-extrabold text-indigo-500 leading-none whitespace-nowrap">
                {progressMetrics.pct}%
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold font-mono">
                ({progressMetrics.done}/{progressMetrics.total})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Week timeline cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prepPlan.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border col-span-2 ${
            state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
          }`}>
            <ClipboardList className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
            <h3 className="font-bold text-slate-500">No blueprint syllabus blocks found</h3>
            <p className="text-xs text-slate-400 mt-1">Click the button above to add custom weeks to your prep plan.</p>
          </div>
        ) : (
          prepPlan.map((wk, idx) => {
            const finishedTasks = wk.tasks?.filter((t) => t.checked).length || 0;
            const totalTasks = wk.tasks?.length || 0;
            const pct = totalTasks > 0 ? Math.round((finishedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={idx}
                className={`prep-week-card group rounded-2xl border p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
                  state.theme === 'dark'
                    ? 'bg-surface-dark border-border-dark'
                    : 'bg-white border-border-light'
                }`}
              >
                {/* Week Header */}
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <span className="week-pill text-[14px] font-extrabold text-indigo-500 uppercase tracking-widest leading-none">
                        Wk {wk.week}
                      </span>
                      <h3 className="font-extrabold text-base tracking-tight leading-snug mt-1">
                        {wk.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5 italic">
                        {wk.focus}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(idx, wk)}
                        className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Edit this week module"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(idx, wk)}
                        className="delete-week-btn p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete this week module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2 mt-4">
                    {(wk.tasks || []).map((t) => (
                      <div
                        key={t.id}
                        className="prep-task-row prep-task-checkbox flex items-center gap-2 group/task py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={t.checked}
                          onChange={(e) => togglePrepTask(idx, t.id, e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-500 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={`text-xs font-semibold select-none flex-1 leading-snug transition-all ${
                          t.checked ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {t.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => deletePrepTask(idx, t.id)}
                          className="delete-task-btn p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover/task:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline Task Creator */}
                <div className="mt-4 border-inherit">
                  <form
                    onSubmit={(e) => handleAddTaskSubmit(e, idx)}
                    className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 focus-within:border-indigo-500/50 transition-colors py-0.5"
                  >
                    <input
                      type="text"
                      className="new-prep-task-input flex-1 bg-transparent text-xs font-semibold outline-none py-1 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="+ Add key deliverable..."
                      value={newTaskTexts[idx] || ''}
                      onChange={(e) => handleTaskTextChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTaskSubmit(e, idx);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="add-prep-task-btn p-1 text-indigo-500 hover:text-indigo-650 transition-colors cursor-pointer flex items-center justify-center"
                      title="Add task"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                  {totalTasks === 0 ? (
                    <div className="text-[10px] font-bold text-slate-400/80 dark:text-slate-500/80 mt-3.5 italic text-center select-none">
                      No tasks added yet
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-3.5 select-none">
                      <span>PROGRESS: {pct}%</span>
                      <span>{finishedTasks}/{totalTasks} COMPLETED</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Add Custom Week Modal Dialog */}
      {showAddWeekForm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
            }`}
          >
            <button
              onClick={() => setShowAddWeekForm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-500/10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black tracking-tight mb-4">
              Add Syllabus Week Block
            </h3>

            <form onSubmit={handleAddWeekSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Week title / subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Concurrency design, IPC..."
                  value={newWeekTitle}
                  onChange={(e) => setNewWeekTitle(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Primary focus area
                </label>
                <input
                  type="text"
                  placeholder="E.g., OS internals, memory barriers..."
                  value={newWeekFocus}
                  onChange={(e) => setNewWeekFocus(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-inherit">
                <button
                  type="button"
                  onClick={() => setShowAddWeekForm(false)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  Create Week
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Week Modal Dialog */}
      {showEditWeekForm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative transition-all duration-155 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              onClick={() => setShowEditWeekForm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-500/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black tracking-tight mb-4 text-slate-800 dark:text-slate-100">
              Edit Syllabus Week {editingWeekIndex !== null ? editingWeekIndex + 1 : ''}
            </h3>

            <form onSubmit={handleEditWeekSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
                  Week title / subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Concurrency design, IPC..."
                  value={editWeekTitle}
                  onChange={(e) => setEditWeekTitle(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-200'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
                  Primary focus area
                </label>
                <input
                  type="text"
                  placeholder="E.g., OS internals, memory barriers..."
                  value={editWeekFocus}
                  onChange={(e) => setEditWeekFocus(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-200'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-800'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-inherit">
                <button
                  type="button"
                  onClick={() => setShowEditWeekForm(false)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors cursor-pointer"
                >
                  Save Changes
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
