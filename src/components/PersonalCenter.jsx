import React, { useState, useEffect } from 'react';
import { usePrepStore } from '../context/PrepContext';
import {
  User,
  Lock,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  Activity,
  Check,
  RefreshCw,
  AlertTriangle,
  Key,
  FileText,
  Layers,
  Building2,
  Calendar,
  ChevronRight,
  Info,
  Globe,
  Settings,
  ShieldAlert,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export const PersonalCenter = () => {
  const { state, logout, user, toggleTheme, importBackup, addToast, triggerSave, saveState } = usePrepStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedPageId, setSelectedPageId] = useState('');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isConfirmNotEmpty = confirmPassword.trim().length > 0;
  const isNewNotEmpty = newPassword.trim().length > 0;
  const doPasswordsMatch = newPassword === confirmPassword;

  const getPasswordInputClass = () => {
    const base = "w-full bg-slate-500/5 border rounded-xl px-4 py-2.5 text-xs outline-none transition-all";
    if (isConfirmNotEmpty && isNewNotEmpty) {
      if (doPasswordsMatch) {
        return `${base} border-2 border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-emerald-600 dark:text-emerald-400`;
      } else {
        return `${base} border-2 border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 text-rose-600 dark:text-rose-400`;
      }
    }
    if (isConfirmNotEmpty && !isNewNotEmpty) {
      return `${base} border-2 border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 text-rose-600 dark:text-rose-400`;
    }
    return `${base} border-slate-500/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`;
  };

  // Accent Color state
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('prephq_accent_color') || 'indigo';
  });

  // Font Size state
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('prephq_font_size');
    if (saved === 'sm') return 13;
    if (saved === 'md') return 14;
    if (saved === 'lg') return 16;
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) ? 14 : parsed;
  });

  // Glassmorphism state
  const [glassmorphism, setGlassmorphism] = useState(() => {
    return localStorage.getItem('prephq_glassmorphism') !== 'false';
  });

  // Danger zone reset confirmation
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetConfirmed, setIsResetConfirmed] = useState(false);

  // Latency test state
  const [latency, setLatency] = useState(null);
  const [isTestingLatency, setIsTestingLatency] = useState(false);

  const API_URL = window.location.origin.includes('5173')
    ? 'http://localhost:5001'
    : window.location.origin;

  // Sync state modifications to body element classes
  useEffect(() => {
    const root = document.documentElement;
    
    // 1. Accent color class
    const colors = ['indigo', 'emerald', 'violet', 'rose', 'amber'];
    colors.forEach(c => root.classList.remove(`accent-${c}`));
    root.classList.add(`accent-${accentColor}`);
    localStorage.setItem('prephq_accent_color', accentColor);

    // 2. Font size style
    root.style.fontSize = `${fontSize}px`;
    localStorage.setItem('prephq_font_size', String(fontSize));

    // 3. Glassmorphism class
    if (glassmorphism) {
      root.classList.remove('no-glass');
    } else {
      root.classList.add('no-glass');
    }
    localStorage.setItem('prephq_glassmorphism', String(glassmorphism));
  }, [accentColor, fontSize, glassmorphism]);

  // Handle change password submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('prephq_jwt_token');
      const response = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      addToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Run ping request to check latency
  const testConnectionLatency = async () => {
    setIsTestingLatency(true);
    const start = performance.now();
    try {
      const token = localStorage.getItem('prephq_jwt_token');
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const end = performance.now();
        setLatency(Math.round(end - start));
      } else {
        setLatency('Error');
      }
    } catch {
      setLatency('Offline');
    } finally {
      setIsTestingLatency(false);
    }
  };

  // Workspace resets
  const handleWipeData = () => {
    if (resetConfirmText !== 'RESET') {
      addToast('Type "RESET" to confirm data wipe.', 'error');
      return;
    }
    
    // Clear state in PrepContext by reloading with defaults
    const token = localStorage.getItem('prephq_jwt_token');
    const emptyState = {
      theme: state.theme,
      activeTab: 'learning-dashboard',
      domains: {},
      neetcode: [],
      companies: [],
      patterns: [],
      prepPlan: [],
      notebookTree: []
    };
    importBackup(emptyState);
    triggerSave(); // Sync cleared state to backend
    setResetConfirmText('');
    addToast('Workspace data cleared successfully.', 'info');
  };

  // Helper to count note nodes recursively
  const countNoteNodes = (nodes) => {
    let count = 0;
    nodes.forEach(n => {
      count++;
      if (n.children && n.children.length > 0) {
        count += countNoteNodes(n.children);
      }
    });
    return count;
  };

  const getWorkspaceStats = () => {
    const notebookCount = countNoteNodes(state.notebookTree || []);
    const domainCount = Object.keys(state.domains || {}).length;
    const companyCount = (state.companies || []).length;
    const patternCount = (state.patterns || []).length;
    
    let totalQuestions = 0;
    Object.values(state.domains || {}).forEach(dom => {
      Object.values(dom.categories || {}).forEach(cat => {
        totalQuestions += cat.length;
      });
    });

    return {
      notebookCount,
      domainCount,
      companyCount,
      patternCount,
      totalQuestions,
      streak: state.streak || 0
    };
  };

  const stats = getWorkspaceStats();

  // --------------------------------------------------------------------------
  // Exporters Logic
  // --------------------------------------------------------------------------
  
  // HTML Single Page compiler
  const handleExportWholeSiteHTML = () => {
    const compileNotesHTML = (nodes, depth = 1) => {
      let html = '';
      nodes.forEach(node => {
        if (node.type === 'file') {
          html += `
            <div class="note-card" style="margin-left: ${(depth - 1) * 20}px">
              <h3 class="note-title" id="note-${node.id}">📝 ${node.title}</h3>
              <div class="note-body">${node.body || '<p class="empty">Empty page.</p>'}</div>
            </div>
          `;
        } else {
          html += `
            <div class="folder-card" style="margin-left: ${(depth - 1) * 20}px">
              <h3 class="folder-title" id="folder-${node.id}">📁 Folder: ${node.title}</h3>
              ${node.children && node.children.length > 0 ? compileNotesHTML(node.children, depth + 1) : '<p class="empty">Empty folder</p>'}
            </div>
          `;
        }
      });
      return html;
    };

    let domainsHTML = '';
    Object.entries(state.domains || {}).forEach(([key, dom]) => {
      domainsHTML += `
        <div class="domain-card">
          <h2>Domain: ${dom.name} (${dom.progress}% Progress)</h2>
          ${Object.entries(dom.categories || {}).map(([cat, qList]) => `
            <div class="category-block">
              <h4>Category: ${cat}</h4>
              <ul>
                ${qList.map(q => `
                  <li>
                    <strong>[${q.status || 'todo'}] ${q.title}</strong>
                    <p>${q.question || ''}</p>
                    ${q.answer ? `<pre><code>${q.answer}</code></pre>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `;
    });

    let companiesHTML = '';
    (state.companies || []).forEach(c => {
      companiesHTML += `
        <div class="company-card">
          <h2>${c.name} (${c.type})</h2>
          <p><strong>Topics:</strong> ${c.topics ? c.topics.join(', ') : 'None'}</p>
          <div class="timeline">
            ${c.rounds ? c.rounds.map(r => `
              <div class="timeline-round">
                <h5>${r.name} (${r.duration || '45m'})</h5>
                <p>${r.feedback || ''}</p>
              </div>
            `).join('') : ''}
          </div>
        </div>
      `;
    });

    let patternsHTML = '';
    (state.patterns || []).forEach(p => {
      patternsHTML += `
        <div class="pattern-card">
          <h2>${p.title}</h2>
          <p><em>${p.subtitle || ''}</em></p>
          <div class="pattern-content">${p.content || ''}</div>
        </div>
      `;
    });

    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PrepHQ Study Workspace Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 40px auto; padding: 0 20px; background: #fafafa; }
    h1 { color: #5B6AD0; border-bottom: 2px solid #5B6AD0; padding-bottom: 10px; }
    h2 { color: #444; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 30px; }
    h3 { color: #666; margin-top: 20px; }
    .note-card, .folder-card, .domain-card, .company-card, .pattern-card { background: white; border: 1px solid #e1e1e1; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .note-title { color: #5B6AD0; border-bottom: 1px dashed #e1e1e1; padding-bottom: 8px; }
    .folder-title { color: #7a7a7a; }
    .note-body, .pattern-content { font-size: 14px; color: #555; }
    pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; border: 1px solid #ddd; }
    code { font-family: monospace; background: #f4f4f4; padding: 2px 4px; border-radius: 4px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 15px; }
    .empty { color: #bbb; font-style: italic; }
    .category-block { margin-left: 15px; border-left: 2px solid #eee; padding-left: 15px; margin-bottom: 15px; }
    .timeline-round { border-left: 2px solid #5B6AD0; padding-left: 12px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>PrepHQ Study Workspace</h1>
  <p>Exported on: ${new Date().toLocaleString()}</p>
  
  <h2>1. Study Notebook Notes</h2>
  <div class="container">
    ${state.notebookTree && state.notebookTree.length > 0 ? compileNotesHTML(state.notebookTree) : '<p class="empty">No notebook pages found.</p>'}
  </div>

  <h2>2. Leetcode & Interview Domains</h2>
  <div class="container">
    ${domainsHTML || '<p class="empty">No knowledge domains found.</p>'}
  </div>

  <h2>3. Company Timelines</h2>
  <div class="container">
    ${companiesHTML || '<p class="empty">No company profiles found.</p>'}
  </div>

  <h2>4. System Design Patterns</h2>
  <div class="container">
    ${patternsHTML || '<p class="empty">No pattern blueprints found.</p>'}
  </div>
</body>
</html>`;

    triggerDownload(fullHTML, `prephq-workspace-${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
    addToast('Workspace compiled into static HTML reader!', 'success');
  };

  // Consolidated Markdown compiler
  const handleExportWholeSiteMarkdown = () => {
    const compileNotesMD = (nodes, depth = 2) => {
      let md = '';
      const hashes = '#'.repeat(depth);
      nodes.forEach(node => {
        if (node.type === 'file') {
          // Clean HTML helper strip tags
          const textBody = node.body
            ? node.body
                .replace(/<p>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]*>/g, '') // strip other elements
            : '';
          md += `${hashes} ${node.title}\n\n${textBody}\n\n---\n\n`;
        } else {
          md += `${hashes} Folder: ${node.title}\n\n`;
          if (node.children && node.children.length > 0) {
            md += compileNotesMD(node.children, depth + 1);
          }
        }
      });
      return md;
    };

    let md = `# PrepHQ Study Workspace Export\nExported on: ${new Date().toLocaleString()}\n\n`;
    
    md += `## 1. Study Notebook Outlines\n\n`;
    if (state.notebookTree && state.notebookTree.length > 0) {
      md += compileNotesMD(state.notebookTree);
    } else {
      md += `*No notebook pages.*\n\n`;
    }

    md += `## 2. Knowledge Domains\n\n`;
    Object.entries(state.domains || {}).forEach(([key, dom]) => {
      md += `### ${dom.name} (${dom.progress}% Completion)\n\n`;
      Object.entries(dom.categories || {}).forEach(([cat, qList]) => {
        md += `#### Category: ${cat}\n\n`;
        qList.forEach(q => {
          md += `##### [${q.status}] ${q.title}\n`;
          md += `* **Prompt:** ${q.question || 'N/A'}\n`;
          if (q.answer) {
            md += `* **Answer / Solution:**\n\`\`\`\n${q.answer}\n\`\`\`\n`;
          }
          md += `\n`;
        });
      });
    });

    md += `## 3. Company Focus Blueprints\n\n`;
    (state.companies || []).forEach(c => {
      md += `### ${c.name} (${c.type})\n`;
      md += `* **Topics:** ${c.topics ? c.topics.join(', ') : 'None'}\n\n`;
      if (c.rounds) {
        c.rounds.forEach(r => {
          md += `#### Round: ${r.name} (${r.duration || '45m'})\n`;
          md += `${r.feedback || ''}\n\n`;
        });
      }
    });

    md += `## 4. Architecture Patterns\n\n`;
    (state.patterns || []).forEach(p => {
      md += `### ${p.title}\n`;
      md += `*${p.subtitle || ''}*\n\n`;
      const cleanContent = p.content ? p.content.replace(/<[^>]*>/g, '') : '';
      md += `${cleanContent}\n\n---\n\n`;
    });

    triggerDownload(md, `prephq-workspace-${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown');
    addToast('Workspace compiled into unified Markdown file!', 'success');
  };

  // Download individual pages
  const handleExportIndividualNotebookPage = (node, format) => {
    if (format === 'md') {
      const cleanBody = node.body
        ? node.body.replace(/<p>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '')
        : '';
      const text = `# ${node.title}\n\n${cleanBody}`;
      triggerDownload(text, `${node.title.toLowerCase().replace(/\s+/g, '-')}.md`, 'text/markdown');
    } else {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${node.title}</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 700px; margin: 40px auto; padding: 20px; }
    h1 { color: #5B6AD0; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  </style>
</head>
<body>
  <h1>${node.title}</h1>
  <div>${node.body || '<p>Empty page.</p>'}</div>
</body>
</html>`;
      triggerDownload(html, `${node.title.toLowerCase().replace(/\s+/g, '-')}.html`, 'text/html');
    }
    addToast(`Exported: ${node.title}`, 'success');
  };

  // Helper trigger download blob
  const triggerDownload = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Restore JSON backup handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.domains || !parsed.notebookTree) {
          addToast('Invalid backup file. Required parameters missing.', 'error');
          return;
        }
        importBackup(parsed);
        addToast('Restored workspace data checkpoint successfully!', 'success');
        triggerSave(); // sync to server
      } catch (err) {
        addToast('Error reading JSON backup. File is corrupted.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Recursive flat notes mapper for list
  const getFlatNotebookNotesList = (nodes) => {
    let list = [];
    nodes.forEach(n => {
      if (n.type === 'file') {
        list.push(n);
      }
      if (n.children && n.children.length > 0) {
        list = [...list, ...getFlatNotebookNotesList(n.children)];
      }
    });
    return list;
  };
  const flatNotes = getFlatNotebookNotesList(state.notebookTree || []);

  return (
    <div className={`max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in transition-colors duration-150`}>
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-500/10">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Personal Center & Settings
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
            Configure appearance, manage workspace assets, and change account settings
          </p>
        </div>

        {/* Sync Status Banner */}
        <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-500/15 bg-slate-500/5 select-none">
          <span>Status: {saveState === 'saved' ? 'Synchronized' : saveState === 'saving' ? 'Syncing...' : 'Unsaved Changes'}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Sub-tabs Menu */}
        <nav className="w-full md:w-64 flex flex-col gap-1 flex-shrink-0">
          {[
            { id: 'profile', label: 'Profile & Account', icon: User },
            { id: 'style', label: 'Theme & Style', icon: Sliders },
            { id: 'data', label: 'Data & Export', icon: Download },
            { id: 'shortcuts', label: 'Shortcuts Cheatsheet', icon: HelpCircle },
            { id: 'diagnostics', label: 'Diagnostics & Server', icon: Globe }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15'
                    : 'text-slate-500 hover:bg-slate-500/5 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tab Content Panel */}
        <div className={`flex-1 w-full bg-white dark:bg-[#25262B] border border-slate-200 dark:border-[#2C2E33] rounded-2xl shadow-sm p-6 sm:p-8 min-h-[420px]`}>
          
          {/* TAB 1: Profile & Account */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Profile & Account
              </h3>
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-indigo-500 text-lg font-black select-none flex-shrink-0">
                  {user?.username?.slice(0, 2).toUpperCase() || 'HQ'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-none mb-1.5">{user?.username || 'Guest Scholar'}</h3>
                  <span className="text-[10px] font-bold text-slate-400 select-all font-mono bg-slate-500/5 border border-slate-500/10 rounded px-2 py-0.5 cursor-pointer" title="Double click to copy ID">ID: {user?.id || 'local'}</span>
                </div>
              </div>

              {/* Stats Card Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {[
                  { label: 'Domains', val: stats.domainCount },
                  { label: 'Notes', val: stats.notebookCount },
                  { label: 'Companies', val: stats.companyCount },
                  { label: 'Streak', val: `🔥 ${stats.streak}d` }
                ].map((stat, i) => {
                  return (
                    <div key={i} className="border border-slate-500/10 bg-slate-500/5 hover:bg-slate-500/10 hover:border-indigo-500/30 hover:shadow-sm rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-150">
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{stat.val}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{stat.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Password change form */}
              <div className="border-t border-slate-500/10 pt-6">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">
                  RESET PASSWORD
                </h4>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Current Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-500/5 border border-slate-500/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">New Password (8+ characters)</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={getPasswordInputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Confirm New Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={getPasswordInputClass()}
                    />
                  </div>
                  <button
                    disabled={isChangingPassword}
                    type="submit"
                    className="flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-650 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>{isChangingPassword ? 'Resetting...' : 'Reset'}</span>
                  </button>
                </form>
              </div>

              {/* Explicit Sign out */}
              <div className="border-t border-slate-500/10 pt-6">
                <button
                  onClick={logout}
                  className="px-5 py-2.5 font-bold text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all cursor-pointer border border-rose-500/20"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance & Theme Style */}
          {activeTab === 'style' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Theme & Style
              </h3>

              {/* Theme selectors */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Interface Theme</label>
                <div className="flex gap-3 max-w-sm">
                  {[
                    { id: 'light', label: 'Light' },
                    { id: 'dark', label: 'Dark' }
                  ].map((theme) => {
                    const isSel = (theme.id === 'dark' && state.theme === 'dark') || (theme.id === 'light' && state.theme !== 'dark');
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          if ((theme.id === 'dark' && state.theme === 'light') || (theme.id === 'light' && state.theme === 'dark')) {
                            toggleTheme();
                          }
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                          isSel
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 dark:bg-indigo-500/15 ring-2 ring-indigo-500/20'
                            : 'border-slate-500/10 text-slate-500 hover:bg-slate-500/5 hover:scale-[1.02]'
                        }`}
                      >
                        <span className="text-xs font-extrabold">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent color selectors */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'indigo', hex: '#5B6AD0' },
                    { id: 'emerald', hex: '#10B981' },
                    { id: 'violet', hex: '#8B5CF6' },
                    { id: 'rose', hex: '#F43F5E' },
                    { id: 'amber', hex: '#F59E0B' }
                  ].map((color) => {
                    const isSel = accentColor === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setAccentColor(color.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isSel
                            ? 'border-2 border-indigo-500 dark:border-indigo-400 scale-110 shadow-sm'
                            : 'border border-slate-500/15 hover:scale-105'
                        }`}
                        title={color.id}
                      >
                        <span className="w-6 h-6 rounded-full" style={{ backgroundColor: color.hex }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font size selectors */}
              <div className="max-w-sm">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Notes Typography
                </label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                    className="w-6 h-6 rounded-full border border-slate-500/15 hover:border-slate-500/30 flex items-center justify-center text-slate-500 hover:bg-slate-500/5 cursor-pointer font-bold select-none text-xs flex-shrink-0"
                  >
                    -
                  </button>
                  <div className="flex-1 flex items-center">
                    <input
                      type="range"
                      min="12"
                      max="18"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className={`w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer m-0 accent-${accentColor}-500`}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFontSize(prev => Math.min(18, prev + 1))}
                    className="w-6 h-6 rounded-full border border-slate-500/15 hover:border-slate-500/30 flex items-center justify-center text-slate-500 hover:bg-slate-500/5 cursor-pointer font-bold select-none text-xs flex-shrink-0"
                  >
                    +
                  </button>
                </div>
                
                {/* Padded label container mapping to range slider track width exactly in rem units */}
                <div className="relative pl-9 pr-9 mt-1.5 h-4">
                  <div className="relative w-full h-full">
                    <span 
                      className="absolute text-[10px] font-black text-indigo-500 -translate-x-1/2 transition-all duration-100 ease-out"
                      style={{ left: `${((fontSize - 12) / 6) * 100}%` }}
                    >
                      {fontSize}px
                    </span>
                  </div>
                </div>
              </div>

              {/* Glassmorphism settings */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Glassmorphism</label>
                <div className="flex gap-3 max-w-sm">
                  {[
                    { id: 'on', label: 'On', val: true },
                    { id: 'off', label: 'Off', val: false }
                  ].map((effect) => {
                    const isSel = glassmorphism === effect.val;
                    return (
                      <button
                        key={effect.id}
                        onClick={() => setGlassmorphism(effect.val)}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                          isSel
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 dark:bg-indigo-500/15 ring-2 ring-indigo-500/20'
                            : 'border-slate-500/10 text-slate-500 hover:bg-slate-500/5 hover:scale-[1.02]'
                        }`}
                      >
                        <span className="text-xs font-extrabold">{effect.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Data & Export (Unified) */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Data & Export
              </h3>

              {/* Workspace Backup */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Workspace Backup</label>
                <div className="flex gap-3 max-w-sm">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `prephq-backup-${new Date().toISOString().slice(0, 10)}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      addToast('JSON backup file created!', 'success');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-indigo-500 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-650 hover:text-white hover:scale-[1.02] transition-all duration-150 cursor-pointer text-xs font-extrabold text-center"
                  >
                    Backup
                  </button>

                  <label className="flex-1 py-3 px-4 rounded-xl border border-indigo-500 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-650 hover:text-white hover:scale-[1.02] transition-all duration-150 cursor-pointer text-xs font-extrabold text-center">
                    Restore
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Master Exporter */}
              <div className="border-t border-slate-500/10 pt-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Master Exporter</label>
                <div className="flex gap-3 max-w-sm">
                  <button
                    onClick={handleExportWholeSiteHTML}
                    className="flex-1 py-3 px-4 rounded-xl border border-indigo-500 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-650 hover:text-white hover:scale-[1.02] transition-all duration-150 cursor-pointer text-xs font-extrabold text-center"
                  >
                    Export HTML
                  </button>

                  <button
                    onClick={handleExportWholeSiteMarkdown}
                    className="flex-1 py-3 px-4 rounded-xl border border-indigo-500 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-650 hover:text-white hover:scale-[1.02] transition-all duration-150 cursor-pointer text-xs font-extrabold text-center"
                  >
                    Export Markdown
                  </button>
                </div>
              </div>

              {/* Page Exporter */}
              <div className="border-t border-slate-500/10 pt-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Page Exporter</label>
                
                {flatNotes.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 italic">No notes found.</p>
                ) : (
                  <div className="space-y-3 max-w-sm">
                    <select
                      value={selectedPageId}
                      onChange={(e) => setSelectedPageId(e.target.value)}
                      className="w-full bg-slate-500/5 border border-slate-500/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs outline-none transition-all text-slate-800 dark:text-slate-100 font-medium dark:bg-[#1A1B1E] cursor-pointer"
                    >
                      <option value="" className="text-slate-400 dark:bg-[#25262B]">Select a page to export...</option>
                      {flatNotes.map((note) => (
                        <option key={note.id} value={note.id} className="text-slate-800 dark:text-slate-200 dark:bg-[#25262B]">
                          {note.title}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-3">
                      <button
                        disabled={!selectedPageId}
                        onClick={() => {
                          const note = flatNotes.find(n => n.id === selectedPageId);
                          if (note) handleExportIndividualNotebookPage(note, 'md');
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all duration-150 cursor-pointer text-xs font-extrabold ${
                          selectedPageId
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-650 hover:text-white hover:scale-[1.02]'
                            : 'border-slate-500/10 text-slate-400 bg-transparent opacity-50 cursor-not-allowed'
                        }`}
                      >
                        Export MD
                      </button>

                      <button
                        disabled={!selectedPageId}
                        onClick={() => {
                          const note = flatNotes.find(n => n.id === selectedPageId);
                          if (note) handleExportIndividualNotebookPage(note, 'html');
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all duration-150 cursor-pointer text-xs font-extrabold ${
                          selectedPageId
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-650 hover:text-white hover:scale-[1.02]'
                            : 'border-slate-500/10 text-slate-400 bg-transparent opacity-50 cursor-not-allowed'
                        }`}
                      >
                        Export HTML
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Workstation */}
              <div className="border-t border-slate-500/10 pt-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-2">
                  Reset Workspace
                </label>
                <p className="text-[10px] text-slate-400 font-semibold mb-4 leading-normal max-w-sm">
                  Permanently wipe all domains, companies, notebooks, and state. This action is irreversible.
                </p>
                <div className="flex gap-3 max-w-sm items-center">
                  <input
                    type="text"
                    placeholder="Type RESET to confirm"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="flex-1 bg-slate-500/5 border border-slate-500/10 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs outline-none transition-all text-rose-600 dark:text-rose-450 font-bold"
                  />
                  <button
                    disabled={resetConfirmText !== 'RESET'}
                    onClick={handleWipeData}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-750 text-white shadow-md transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
                  >
                    Reset Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Keyboard Shortcuts Cheatsheet */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Shortcuts Cheatsheet
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 leading-normal">
                Optimize your navigation speed across the workstation workspace.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { desc: 'Global Command Palette Search', keys: ['Ctrl', 'K'] },
                  { desc: 'Keyboard Shortcuts Cheatsheet Guide', keys: ['?'] },
                  { desc: 'Close open Modals / Triggers', keys: ['ESC'] },
                  { desc: 'Double click note node in Sidebar list', keys: ['Rename Page'] },
                  { desc: 'Double click image overlay (Notebook view)', keys: ['Resize Canvas'] }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs py-2 border-b border-slate-500/10 last:border-b-0">
                    <span className="font-bold text-slate-500 dark:text-slate-400">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((k, i) => (
                        <kbd key={i} className="px-2 py-1 rounded bg-slate-500/10 border border-slate-500/15 text-[10px] font-black font-mono select-none dark:text-slate-350">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: System & Security Diagnostics */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Diagnostics & Server
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Verify connectivity settings and analyze synchronization parameters with the database.
              </p>

              <div className="space-y-4 pt-2">
                {/* Connection Ping Tool */}
                <div className="p-4 rounded-xl border border-slate-500/10 bg-slate-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sync API Link</span>
                    <span className="text-xs font-black truncate text-slate-700 dark:text-slate-300">{API_URL}</span>
                  </div>
                  <button
                    disabled={isTestingLatency}
                    onClick={testConnectionLatency}
                    className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-500 font-bold text-xs transition-colors cursor-pointer select-none"
                  >
                    <span>{isTestingLatency ? 'Testing...' : 'Test Latency'}</span>
                  </button>
                </div>

                {/* Technical data table */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-500/10">
                    <span className="font-bold text-slate-500">API Connection Ping</span>
                    <span className="font-black text-slate-700 dark:text-slate-350">{latency === null ? 'Untested' : typeof latency === 'number' ? `${latency} ms` : latency}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-500/10">
                    <span className="font-bold text-slate-500">Synchronizer Protocol</span>
                    <span className="font-black text-slate-700 dark:text-slate-350">HTTP POST / JSON Sync</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-500/10">
                    <span className="font-bold text-slate-500">Offline Recovery Mode</span>
                    <span className="font-black text-slate-700 dark:text-slate-350">Local Storage Sync Lock</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-500/10">
                    <span className="font-bold text-slate-500">Notes Outlines Database Count</span>
                    <span className="font-black text-slate-700 dark:text-slate-350">{stats.notebookCount} nodes</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-bold text-slate-500">Security Credentials Protocol</span>
                    <span className="font-black text-slate-700 dark:text-slate-350">Bearer JWT Signature</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
