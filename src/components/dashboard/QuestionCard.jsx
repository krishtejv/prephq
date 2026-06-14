import React, { useState, useEffect } from 'react';
import { usePrepStore } from '../../context/PrepContext';
import { ChevronDown, ChevronUp, Edit, Save, Trash2, X } from 'lucide-react';
import { ConfirmModal } from '../shared/ConfirmModal';
import { StatusPill } from '../shared/StatusPill';

export const QuestionCard = ({ q, catName, activeDomainKey }) => {
  const { state, updateQuestion, deleteQuestion, setActiveQuestionId } = usePrepStore();
  const domainName = state.domains?.[activeDomainKey]?.name;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit local states
  const [editTitle, setEditTitle] = useState('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editAnswerText, setEditAnswerText] = useState('');
  const [editNotesText, setEditNotesText] = useState('');
  const [editStatus, setEditStatus] = useState('To Do');
  const [editTagsText, setEditTagsText] = useState('');

  // Expand when active globally or toggle locally
  const isCardExpanded = isExpanded || state.activeQuestionId === q.id;

  const handleToggleExpand = () => {
    if (isEditing) return;
    if (state.activeQuestionId === q.id) {
      setActiveQuestionId(null);
      setIsExpanded(false);
    } else {
      setIsExpanded(!isExpanded);
      if (state.activeQuestionId) setActiveQuestionId(null);
    }
  };

  // Sync state if active globally
  useEffect(() => {
    if (state.activeQuestionId === q.id) {
      setIsExpanded(true);
    }
  }, [state.activeQuestionId, q.id]);

  // Sync form states with question updates
  useEffect(() => {
    setEditStatus(q.status || 'To Do');
    setEditTagsText(q.tags ? q.tags.join(', ') : '');
    setEditNotesText(q.notes || '');
  }, [q]);

  const handleSaveQuickEdit = () => {
    const tagsArr = editTagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    updateQuestion(activeDomainKey, catName, q.id, {
      ...q,
      status: editStatus,
      tags: tagsArr,
      notes: editNotesText
    });
    setIsExpanded(false);
    setActiveQuestionId(null);
  };

  const handleDeleteQuestion = () => {
    const confirmed = window.confirm("Delete this question record?");
    if (confirmed) {
      deleteQuestion(activeDomainKey, catName, q.id);
      setIsExpanded(false);
      setActiveQuestionId(null);
    }
  };

  return (
    <div
      className={`question-item border rounded-2xl shadow-sm transition-all duration-200 ${
        state.theme === 'dark'
          ? 'bg-surface-dark border-border-dark'
          : 'bg-white border-border-light'
      }`}
    >
      {/* Card Header Panel */}
      <div
        className="question-row-summary flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={handleToggleExpand}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3">
            <StatusPill status={q.status} />
            {domainName && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 select-none">
                {domainName}
              </span>
            )}
            <h4 className="question-title-text text-sm font-bold tracking-tight truncate">{q.title}</h4>
          </div>
          {q.tags && q.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {q.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400 select-none"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="text-slate-400 hover:text-slate-600">
          {isCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Card Expand Details Panel */}
      {isCardExpanded && (
        <div className="question-detail-form border-t border-inherit p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">Question Prompt</div>
            <p className="text-sm font-medium leading-relaxed">{q.question}</p>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">Expected Answer & Outlines</div>
            <div className={`p-4 rounded-xl font-mono text-xs whitespace-pre-wrap ${
              state.theme === 'dark' ? 'bg-bg-dark text-emerald-400' : 'bg-slate-50 text-indigo-900 border border-slate-200'
            }`}>
              {q.answer}
            </div>
          </div>

          {/* Quick Edit inline section */}
          <div className="border-t pt-4 border-inherit space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="q-status-select w-full text-xs font-semibold rounded-xl border p-2.5 outline-none bg-transparent border-slate-200 dark:border-slate-800"
                >
                  <option value="To Do">To Do</option>
                  <option value="Doing">Doing</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTagsText}
                  onChange={(e) => setEditTagsText(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border p-2.5 outline-none bg-transparent border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Study Notes</label>
              <textarea
                value={editNotesText}
                onChange={(e) => setEditNotesText(e.target.value)}
                placeholder="Recall hotspots, key learnings..."
                className="q-notes-input w-full text-xs font-medium rounded-xl border p-2.5 outline-none bg-transparent border-slate-200 dark:border-slate-800 min-h-[60px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDeleteQuestion}
                className="delete-q-btn flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border hover:bg-rose-500/10 text-rose-500 transition-colors border-rose-500/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEdit}
                className="save-form-btn flex items-center gap-1 px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
