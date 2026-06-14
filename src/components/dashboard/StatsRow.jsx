import React from 'react';
import { usePrepStore } from '../../context/PrepContext';
import { BookOpen, CheckCircle, Clock, HelpCircle } from 'lucide-react';

export const StatsRow = ({ stats }) => {
  const { state } = usePrepStore();
  const currentStreak = state.streak !== undefined ? state.streak : 5;
  const streakProgress = currentStreak === 0 ? 0 : (currentStreak % 7 === 0 ? 7 : currentStreak % 7);
  const strokeDashoffset = 2 * Math.PI * 20 * (1 - streakProgress / 7);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Total Cards */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm transition-all duration-150 ${
        state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
      }`}>
        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black">{stats.total}</div>
          <div className="text-xs font-semibold text-slate-400">Total Cards</div>
        </div>
      </div>

      {/* Solved Rate */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm transition-all duration-150 ${
        state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
      }`}>
        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black text-emerald-500">{stats.pct}%</div>
          <div className="text-xs font-semibold text-slate-400">
            {`Solved Rate (${stats.done} Done)`}
          </div>
        </div>
      </div>

      {/* In Progress */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm transition-all duration-150 ${
        state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
      }`}>
        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black text-amber-500">{stats.doing}</div>
          <div className="text-xs font-semibold text-slate-400">In Progress (Doing)</div>
        </div>
      </div>

      {/* Needs Review */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm transition-all duration-150 ${
        state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
      }`}>
        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black text-purple-500">{stats.review}</div>
          <div className="text-xs font-semibold text-slate-400">Needs Review</div>
        </div>
      </div>

      {/* Study Streak */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm transition-all duration-150 col-span-2 sm:col-span-1 relative group ${
        state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
      }`}>
        {/* Streak Tooltip Popover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-[10px] font-bold text-white bg-slate-900/90 dark:bg-slate-800/90 border border-slate-700/50 rounded-lg whitespace-normal min-w-[200px] text-center opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md flex flex-col gap-0.5">
          <span className="font-extrabold text-xs border-b border-white/10 pb-1 mb-1">Study Streak Info</span>
          <span>{`Progress: ${streakProgress}/7 days completed this week`}</span>
          <span className="text-[9px] text-slate-400 font-semibold mt-1">Keep studying daily to maintain your streak! Resets if you skip a day.</span>
        </div>
        <div className="relative flex items-center justify-center w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-rose-555 transition-all duration-300"
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-lg select-none">🔥</span>
        </div>
        <div>
          <div className="text-2xl font-black text-rose-500">
            {`${currentStreak} Days`}
          </div>
          <div className="text-xs font-semibold text-slate-400">Study Streak</div>
        </div>
      </div>
    </div>
  );
};
