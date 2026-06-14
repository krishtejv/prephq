import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_NOTEBOOK_TREE, DEFAULT_STATE } from './defaultData';
import { findNoteRecursive, deleteNoteRecursive } from '../utils/treeUtils';
import logger from '../utils/logger';

const PrepContext = createContext(null);

// Pure module-level utility — no component/context dependency.
// Exported so NotebookTree can call it with siblings obtained from getSiblings().
export function getNextUntitledName(siblings) {
  const names = siblings.map(s => s.title.toLowerCase().trim());
  if (!names.includes('untitled')) return 'Untitled';
  let i = 1;
  while (names.includes(`untitled ${i}`)) i++;
  return `Untitled ${i}`;
}

export const PrepProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('prephq_jwt_token'));
  const [isInitialSyncCompleted, setIsInitialSyncCompleted] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('prephq_auth_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const [state, setState] = useState(() => {
    // Option C: No app data in localStorage — always start from defaults.
    // All data (domains, notebook, companies, patterns) loads from the backend after login.
    // Only `prephq_theme` is kept in localStorage as a tiny UX preference.
    const initial = JSON.parse(JSON.stringify(DEFAULT_STATE));
    initial.notebookTree = JSON.parse(JSON.stringify(DEFAULT_NOTEBOOK_TREE));
    const savedTheme = localStorage.getItem('prephq_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      initial.theme = savedTheme;
    }
    return initial;
  });

  const [saveState, setSaveState] = useState("saved"); // saved, saving, unsaved

  const [dirtySlices, setDirtySlices] = useState({
    streak: false,
    prepPlan: false,
    domains: false,
    neetcode: false,
    companies: false,
    patterns: false,
    notebookTree: false
  });

  const markSliceDirty = (sliceName) => {
    setDirtySlices(prev => ({ ...prev, [sliceName]: true }));
    setSaveState("unsaved");
  };

  const API_URL = window.location.origin.includes('5173')
    ? 'http://localhost:5001'
    : window.location.origin;

  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Sync / load state from backend on token change
  useEffect(() => {
    if (!token) {
      setIsInitialSyncCompleted(true);
      return;
    }
    
    const fetchBackendState = async () => {
      try {
        setSaveState("saving");
        // 1. Fetch study configs
        const resState = await fetch(`${API_URL}/api/user/state`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // If token is rejected (expired or secret changed), clear it and force re-login
        if (resState.status === 401 || resState.status === 403) {
          logger.warn('[Sync load] Token rejected by server — clearing stale session.', { status: resState.status });
          localStorage.removeItem('prephq_jwt_token');
          localStorage.removeItem('prephq_auth_user');
          setToken(null);
          setUser(null);
          setIsInitialSyncCompleted(true);
          addToast('Session expired. Please log in again.', 'error');
          return;
        }

        if (!resState.ok) throw new Error('Failed to load state');
        const stateData = await resState.json();

        // 2. Fetch notebook tree
        const resTree = await fetch(`${API_URL}/api/notebook/tree`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resTree.ok) throw new Error('Failed to load tree');
        const treeData = await resTree.json();

        setState(prev => ({
          ...prev,
          streak: stateData.streak,
          lastStudiedDate: stateData.lastStudiedDate,
          prepPlan: stateData.prepPlan,
          domains: stateData.domains,
          neetcode: stateData.neetcode,
          companies: stateData.companies,
          patterns: stateData.patterns,
          notebookTree: treeData.notebookTree
        }));
        
        setSaveState("saved");
      } catch (err) {
        logger.error('[Sync load] Failed to fetch backend state', { err });
        addToast('Could not reach backend. Working offline — your changes will sync when reconnected.', 'error');
        setSaveState("saved"); // No user changes pending — nothing to sync back
      } finally {
        setIsInitialSyncCompleted(true);
      }
    };

    fetchBackendState();
  }, [token]);

  // Synchronise state changes to backend.
  // ONLY fires when saveState === "unsaved", which is set exclusively by user-triggered
  // mutator actions (addDomain, updateQuestion, etc.). The initial backend fetch always
  // cycles through "saving" → "saved" and never sets "unsaved", so it can never
  // accidentally trigger a write-back.
  useEffect(() => {
    if (!token || saveState !== "unsaved") {
      return;
    }

    const timer = setTimeout(async () => {
      const slicesToSync = { ...dirtySlices };

      // Reset dirty slices locally in React state
      setDirtySlices({
        streak: false,
        prepPlan: false,
        domains: false,
        neetcode: false,
        companies: false,
        patterns: false,
        notebookTree: false
      });

      try {
        setSaveState("saving");
        
        const promises = [];

        if (slicesToSync.streak) {
          promises.push(fetch(`${API_URL}/api/user/state/streak`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              streak: state.streak,
              lastStudiedDate: state.lastStudiedDate
            })
          }));
        }

        if (slicesToSync.prepPlan) {
          promises.push(fetch(`${API_URL}/api/user/state/prep-plan`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prepPlan: state.prepPlan })
          }));
        }

        if (slicesToSync.domains) {
          promises.push(fetch(`${API_URL}/api/user/state/domains`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ domains: state.domains })
          }));
        }

        if (slicesToSync.neetcode) {
          promises.push(fetch(`${API_URL}/api/user/state/neetcode`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ neetcode: state.neetcode })
          }));
        }

        if (slicesToSync.companies) {
          promises.push(fetch(`${API_URL}/api/user/state/companies`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ companies: state.companies })
          }));
        }

        if (slicesToSync.patterns) {
          promises.push(fetch(`${API_URL}/api/user/state/patterns`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ patterns: state.patterns })
          }));
        }

        if (slicesToSync.notebookTree) {
          promises.push(fetch(`${API_URL}/api/notebook/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notebookTree: state.notebookTree })
          }));
        }

        const results = await Promise.all(promises);
        const failedResponse = results.find(r => !r.ok);
        if (failedResponse) {
          throw new Error(`Sync call failed with status: ${failedResponse.status}`);
        }

        setSaveState("saved");
      } catch (err) {
        logger.error('[Background Sync] Failed to sync state to backend', { err });
        // Restore dirty slices on failure so they will be retried
        setDirtySlices(prev => {
          const restored = { ...prev };
          Object.keys(slicesToSync).forEach(k => {
            if (slicesToSync[k]) restored[k] = true;
          });
          return restored;
        });
        setSaveState("unsaved");
      }
    }, 1000); // 1-second debounce to prevent spamming write cycles

    return () => clearTimeout(timer);
  }, [state, token, saveState, dirtySlices]);

  const updateStateQuietly = (newState) => {
    setState(newState);
  };

  const triggerSave = async () => {
    setSaveState("saving");
    if (!token) {
      setSaveState("saved");
      addToast("Sign in to sync your data to the backend.", "info");
      return;
    }

    try {
      // Direct force-save API push
      await fetch(`${API_URL}/api/user/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          streak: state.streak,
          lastStudiedDate: state.lastStudiedDate,
          prepPlan: state.prepPlan,
          domains: state.domains,
          neetcode: state.neetcode,
          companies: state.companies,
          patterns: state.patterns
        })
      });

      await fetch(`${API_URL}/api/notebook/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notebookTree: state.notebookTree
        })
      });

      setSaveState("saved");
      addToast("All data successfully synchronized to backend server!", "success");
    } catch (e) {
      setSaveState("unsaved");
      addToast("Failed to save changes. Verify backend connection.", "error");
    }
  };

  const login = (jwtToken, authUser, isNewUser = false) => {
    // Reset to clean DEFAULT_STATE for the incoming user.
    // Backend fetch (triggered by token change) will populate their real data.
    const cleanState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    cleanState.notebookTree = JSON.parse(JSON.stringify(DEFAULT_NOTEBOOK_TREE));
    const savedTheme = localStorage.getItem('prephq_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      cleanState.theme = savedTheme;
    }
    setState(cleanState);

    setIsInitialSyncCompleted(false);
    setToken(jwtToken);
    setUser(authUser);
    addToast(
      isNewUser
        ? `Welcome, ${authUser.username}! Your profile is ready.`
        : `Welcome back, ${authUser.username}!`,
      "success"
    );
  };

  const logout = async () => {
    // Notify the server of logout (for audit logging) before clearing client state
    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {
        // Best-effort — proceed with local logout even if server is unreachable
      }
    }
    // Clear ALL persisted state from localStorage — auth tokens AND app state cache.
    // This prevents stale domains/notebooks/companies from a previous user from
    // leaking into the next login session (cross-user contamination).
    localStorage.removeItem('prephq_jwt_token');
    localStorage.removeItem('prephq_auth_user');
    // No prephq_state_store to remove — Option C: app data never touches localStorage

    setIsInitialSyncCompleted(false);
    setToken(null);
    setUser(null);
    
    // Reset to clean defaults
    const initial = JSON.parse(JSON.stringify(DEFAULT_STATE));
    initial.notebookTree = JSON.parse(JSON.stringify(DEFAULT_NOTEBOOK_TREE));
    setState(initial);
    
    addToast("Logged out successfully.", "info");
  };

  // ------------------------------------------------------------------------
  // Mutator Actions
  // ------------------------------------------------------------------------
  const setTab = (tabName) => {
    setState(prev => ({ ...prev, activeTab: tabName }));
  };

  const setDomain = (domainName) => {
    setState(prev => ({ ...prev, activeDomain: domainName }));
  };

  const addCustomDomain = (domainName) => {
    markSliceDirty("domains");
    setState(prev => {
      const nextDomains = JSON.parse(JSON.stringify(prev.domains || {}));
      if (nextDomains[domainName]) return prev;
      nextDomains[domainName] = {
        name: domainName,
        progress: 0,
        categories: {}
      };
      return { ...prev, domains: nextDomains, activeDomain: domainName };
    });
    addToast(`Added knowledge domain: ${domainName}`, "success");
  };

  const deleteCustomDomain = (domainKey) => {
    markSliceDirty("domains");
    setState(prev => {
      const nextDomains = JSON.parse(JSON.stringify(prev.domains || {}));
      delete nextDomains[domainKey];
      const remainingKeys = Object.keys(nextDomains);
      const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : "";
      return { ...prev, domains: nextDomains, activeDomain: nextActive };
    });
    addToast(`Removed knowledge domain: ${domainKey}`, "info");
  };

  const toggleTheme = () => {
    const nextTheme = state.theme === "light" ? "dark" : "light";
    // Only theme preference is persisted to localStorage (tiny UX pref, not user data)
    localStorage.setItem('prephq_theme', nextTheme);
    setState(prev => ({ ...prev, theme: nextTheme }));
  };

  const setActivePatternId = (id) => {
    setState(prev => ({ ...prev, activePatternId: id }));
  };

  const setActiveQuestionId = (id) => {
    setState(prev => ({ ...prev, activeQuestionId: id }));
  };

  const setActiveCompanyId = (id) => {
    setState(prev => ({ ...prev, activeCompanyId: id }));
  };

  const recalculateProgress = (domains, neetcode) => {
    const nextDomains = { ...domains };
    
    // 1. Recalculate normal domains
    Object.keys(nextDomains).forEach(dKey => {
      if (dKey === "LeetCode") return;
      const dom = nextDomains[dKey];
      let totalQs = 0;
      let weight = 0;
      Object.values(dom.categories || {}).forEach(list => {
        list.forEach(q => {
          totalQs++;
          if (q.status === "Done" || q.status === "solved") weight += 1.0;
          else if (q.status === "Needs Review" || q.status === "review") weight += 0.7;
          else if (q.status === "Doing" || q.status === "doing") weight += 0.3;
        });
      });
      dom.progress = totalQs > 0 ? Math.round((weight / totalQs) * 100) : 0;
    });

    // 2. Recalculate LeetCode
    if (nextDomains["LeetCode"] && neetcode) {
      let weight = 0;
      const totalQs = neetcode.length;
      neetcode.forEach(p => {
        if (p.status === "Done" || p.status === "solved") weight += 1.0;
        else if (p.status === "Needs Review" || p.status === "review") weight += 0.7;
        else if (p.status === "Doing" || p.status === "doing") weight += 0.3;
      });
      nextDomains["LeetCode"].progress = totalQs > 0 ? Math.round((weight / totalQs) * 100) : 0;
    }

    return nextDomains;
  };

  // Learning Dashboard
  const updateQuestion = (domainKey, categoryKey, questionId, updates) => {
    markSliceDirty("domains");
    setState(prev => {
      const nextDomains = JSON.parse(JSON.stringify(prev.domains));
      const list = nextDomains[domainKey]?.categories[categoryKey];
      if (!list) return prev;

      const idx = list.findIndex(q => q.id === questionId);
      if (idx === -1) return prev;

      list[idx] = { ...list[idx], ...updates };
      const updatedDomains = recalculateProgress(nextDomains, prev.neetcode);

      return {
        ...prev,
        domains: updatedDomains
      };
    });
  };

  const addCustomQuestion = (domainKey, categoryKey, newQ) => {
    markSliceDirty("domains");
    setState(prev => {
      const nextDomains = JSON.parse(JSON.stringify(prev.domains || {}));
      if (!nextDomains[domainKey]) {
        nextDomains[domainKey] = { name: domainKey, progress: 0, categories: {} };
      }

      if (!nextDomains[domainKey].categories[categoryKey]) {
        nextDomains[domainKey].categories[categoryKey] = [];
      }

      nextDomains[domainKey].categories[categoryKey].push(newQ);
      const updatedDomains = recalculateProgress(nextDomains, prev.neetcode);

      return {
        ...prev,
        domains: updatedDomains
      };
    });
    addToast(`Added question: ${newQ.title}`, "success");
  };

  const deleteQuestion = (domainKey, categoryKey, questionId) => {
    markSliceDirty("domains");
    setState(prev => {
      const nextDomains = JSON.parse(JSON.stringify(prev.domains));
      const list = nextDomains[domainKey]?.categories[categoryKey];
      if (!list) return prev;

      nextDomains[domainKey].categories[categoryKey] = list.filter(q => q.id !== questionId);
      if (nextDomains[domainKey].categories[categoryKey].length === 0) {
        delete nextDomains[domainKey].categories[categoryKey];
      }

      const updatedDomains = recalculateProgress(nextDomains, prev.neetcode);
      return {
        ...prev,
        domains: updatedDomains
      };
    });
    addToast("Question deleted", "info");
  };

  // Companies
  const addCompany = (newCo) => {
    markSliceDirty("companies");
    setState(prev => ({
      ...prev,
      companies: [...(prev.companies || []), newCo]
    }));
    addToast(`Added profile for ${newCo.name}`, "success");
  };

  const updateCompany = (compId, updates) => {
    markSliceDirty("companies");
    setState(prev => {
      const nextCos = (prev.companies || []).map(c => c.id === compId ? { ...c, ...updates } : c);
      return { ...prev, companies: nextCos };
    });
    addToast("Company profile updated", "success");
  };

  const deleteCompany = (compId) => {
    markSliceDirty("companies");
    setState(prev => ({
      ...prev,
      companies: (prev.companies || []).filter(c => c.id !== compId)
    }));
    addToast("Company profile removed", "info");
  };

  // Industry Patterns
  const addPattern = (newPat) => {
    markSliceDirty("patterns");
    setState(prev => ({
      ...prev,
      patterns: [...(prev.patterns || []), newPat]
    }));
    addToast(`Created pattern design block: ${newPat.title}`, "success");
  };

  const updatePattern = (patId, updates) => {
    markSliceDirty("patterns");
    setState(prev => {
      const nextPats = (prev.patterns || []).map(p => p.id === patId ? { ...p, ...updates } : p);
      return { ...prev, patterns: nextPats };
    });
  };

  const deletePattern = (patId) => {
    markSliceDirty("patterns");
    setState(prev => ({
      ...prev,
      patterns: (prev.patterns || []).filter(p => p.id !== patId)
    }));
    addToast("Pattern blueprint deleted", "info");
  };

  const reorderPattern = (patId, direction) => {
    markSliceDirty("patterns");
    setState(prev => {
      const nextPats = [...(prev.patterns || [])];
      const index = nextPats.findIndex(p => p.id === patId);
      if (index === -1) return prev;
      
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= nextPats.length) return prev;
      
      const temp = nextPats[index];
      nextPats[index] = nextPats[targetIndex];
      nextPats[targetIndex] = temp;
      
      return { ...prev, patterns: nextPats };
    });
  };

  // Prep Plan
  const addPrepWeek = (newWeek) => {
    markSliceDirty("prepPlan");
    setState(prev => ({
      ...prev,
      prepPlan: [...(prev.prepPlan || []), newWeek]
    }));
    addToast(`Added customized Week ${newWeek.week}`, "success");
  };

  const deletePrepWeek = (weekIndex) => {
    markSliceDirty("prepPlan");
    setState(prev => {
      const nextPlan = [...(prev.prepPlan || [])];
      nextPlan.splice(weekIndex, 1);
      // Re-index remaining weeks
      nextPlan.forEach((wk, idx) => {
        wk.week = idx + 1;
      });
      return { ...prev, prepPlan: nextPlan };
    });
    addToast("Syllabus block deleted", "info");
  };

  const addPrepTask = (weekIndex, newTask) => {
    markSliceDirty("prepPlan");
    setState(prev => {
      const nextPlan = JSON.parse(JSON.stringify(prev.prepPlan || []));
      if (!nextPlan[weekIndex]) return prev;
      if (!nextPlan[weekIndex].tasks) nextPlan[weekIndex].tasks = [];
      nextPlan[weekIndex].tasks.push(newTask);
      return { ...prev, prepPlan: nextPlan };
    });
  };

  const deletePrepTask = (weekIndex, taskId) => {
    markSliceDirty("prepPlan");
    setState(prev => {
      const nextPlan = JSON.parse(JSON.stringify(prev.prepPlan || []));
      if (!nextPlan[weekIndex]) return prev;
      nextPlan[weekIndex].tasks = nextPlan[weekIndex].tasks.filter(t => t.id !== taskId);
      return { ...prev, prepPlan: nextPlan };
    });
  };

  const togglePrepTask = (weekIndex, taskId, checked) => {
    markSliceDirty("prepPlan");
    setState(prev => {
      const nextPlan = JSON.parse(JSON.stringify(prev.prepPlan || []));
      if (!nextPlan[weekIndex]) return prev;
      const task = nextPlan[weekIndex].tasks?.find(t => t.id === taskId);
      if (task) {
        task.checked = checked;
      }
      return { ...prev, prepPlan: nextPlan };
    });
  };

  const updatePrepWeek = (weekIndex, updates) => {
    markSliceDirty("prepPlan");
    setState(prev => {
      const nextPlan = JSON.parse(JSON.stringify(prev.prepPlan || []));
      if (!nextPlan[weekIndex]) return prev;
      nextPlan[weekIndex] = {
        ...nextPlan[weekIndex],
        ...updates
      };
      return { ...prev, prepPlan: nextPlan };
    });
    addToast(`Updated Week ${weekIndex + 1} syllabus details`, "success");
  };

  // LeetCode addon Problems
  const updateNeetcodeProblem = (problemId, updates) => {
    markSliceDirty("neetcode");
    markSliceDirty("domains");
    setState(prev => {
      const nextNc = (prev.neetcode || []).map(p => p.id === problemId ? { ...p, ...updates } : p);
      const updatedDomains = recalculateProgress(prev.domains, nextNc);
      return {
        ...prev,
        neetcode: nextNc,
        domains: updatedDomains
      };
    });
  };

  // ------------------------------------------------------------------------
  // Obsidian Style Notebook Tree Controls
  // ------------------------------------------------------------------------
  const selectNote = (noteId) => {
    setState(prev => ({ ...prev, activeNoteId: noteId }));
  };

  const updateNoteContent = (noteId, title, body, pageTitle) => {
    markSliceDirty("notebookTree");
    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));
      const note = findNoteRecursive(nextTree, noteId);
      if (note) {
        note.title = title;
        note.body = body;
        if (pageTitle !== undefined) {
          note.pageTitle = pageTitle;
        }
      }
      return { ...prev, notebookTree: nextTree };
    });
  };

  const updateNoteStatus = (noteId, status) => {
    markSliceDirty("notebookTree");
    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));
      const note = findNoteRecursive(nextTree, noteId);
      if (note) {
        note.status = status;
      }
      return { ...prev, notebookTree: nextTree };
    });
  };

  const toggleNodeCollapse = (noteId) => {
    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));
      const note = findNoteRecursive(nextTree, noteId);
      if (note) {
        note.collapsed = !note.collapsed;
      }
      return { ...prev, notebookTree: nextTree };
    });
  };

  // Synchronous getter — reads current state.notebookTree at call time.
  // Used by NotebookTree to resolve siblings BEFORE calling createNoteNode.
  const getSiblings = (parentId) => {
    if (!parentId) return state.notebookTree || [];
    const parent = findNoteRecursive(state.notebookTree, parentId);
    return parent?.children ?? [];
  };

  // createNoteNode — accepts a pre-computed title. No name resolution inside setState.
  const createNoteNode = (parentId, title = 'Untitled', type = 'file') => {
    markSliceDirty("notebookTree");
    const nodeId = `nb-node-${Date.now()}`;

    const newNode = {
      id: nodeId,
      title: title,
      pageTitle: title,
      status: "todo",
      collapsed: type === 'folder',
      body: type === 'folder' ? "" : `<p>Start writing your notes here...</p>`,
      type: type,
      children: []
    };

    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));

      if (parentId) {
        const parentNode = findNoteRecursive(nextTree, parentId);
        if (parentNode) {
          parentNode.children.push(newNode);
          parentNode.collapsed = false;
        } else {
          // Fallback: parentId not found, push to root
          nextTree.push(newNode);
        }
      } else {
        nextTree.push(newNode);
      }

      return {
        ...prev,
        notebookTree: nextTree,
        activeNoteId: newNode.id
      };
    });

    addToast(type === 'folder' ? "Created new folder block" : "Created new markdown page block", "success");
    // Return synchronously — nodeId and title are known before setState
    return { id: nodeId, title: title };
  };

  const toggleCollapseAllNoteNodes = () => {
    markSliceDirty("notebookTree");
    
    // Check if any folder is expanded
    let hasExpandedFolder = false;
    const checkExpandedRecursive = (nodes) => {
      for (let node of nodes) {
        if (node.type === 'folder' || (node.children && node.children.length > 0)) {
          if (!node.collapsed) {
            hasExpandedFolder = true;
            return;
          }
        }
        if (node.children && node.children.length > 0) {
          checkExpandedRecursive(node.children);
          if (hasExpandedFolder) return;
        }
      }
    };
    checkExpandedRecursive(state.notebookTree || []);

    const setCollapseRecursive = (nodes, shouldCollapse) => {
      nodes.forEach(node => {
        if (node.type === 'folder' || (node.children && node.children.length > 0)) {
          node.collapsed = shouldCollapse;
        }
        if (node.children) {
          setCollapseRecursive(node.children, shouldCollapse);
        }
      });
    };

    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));
      // If there is any expanded folder, collapse all (true). Otherwise, expand all (false).
      setCollapseRecursive(nextTree, hasExpandedFolder);
      return { ...prev, notebookTree: nextTree };
    });
  };

  const deleteNoteNode = (noteId) => {
    markSliceDirty("notebookTree");
    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));
      deleteNoteRecursive(nextTree, noteId);
      const nextActiveId = prev.activeNoteId === noteId ? null : prev.activeNoteId;
      return {
        ...prev,
        notebookTree: nextTree,
        activeNoteId: nextActiveId
      };
    });
    addToast("Page deleted recursively", "info");
  };

  const renameNoteNode = (noteId, newTitle) => {
    markSliceDirty("notebookTree");
    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));
      const note = findNoteRecursive(nextTree, noteId);
      if (note) {
        note.title = newTitle;
      }
      return { ...prev, notebookTree: nextTree };
    });
    addToast("Page renamed", "success");
  };

  const reorderNoteNode = (noteId, direction) => {
    markSliceDirty("notebookTree");
    setState(prev => {
      const nextTree = JSON.parse(JSON.stringify(prev.notebookTree));
      
      const findAndSwap = (list) => {
        const idx = list.findIndex(n => n.id === noteId);
        if (idx !== -1) {
          const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (targetIdx >= 0 && targetIdx < list.length) {
            const temp = list[idx];
            list[idx] = list[targetIdx];
            list[targetIdx] = temp;
            return true;
          }
          return false;
        }
        for (let node of list) {
          if (node.children && node.children.length > 0) {
            const swapped = findAndSwap(node.children);
            if (swapped) return true;
          }
        }
        return false;
      };
      
      findAndSwap(nextTree);
      return { ...prev, notebookTree: nextTree };
    });
    addToast("Reordered page node", "info");
  };

  // Sync / Import backup
  const importBackup = (newData) => {
    if (!newData.domains || !newData.notebookTree) {
      addToast("Invalid backup JSON format!", "error");
      return;
    }
    setDirtySlices({
      streak: true,
      prepPlan: true,
      domains: true,
      neetcode: true,
      companies: true,
      patterns: true,
      notebookTree: true
    });
    setSaveState("unsaved");
    setState(newData);
    addToast("Restore checkpoint successful!", "success");
  };

  return (
    <PrepContext.Provider
      value={{
        state,
        saveState,
        toasts,
        token,
        user,
        isInitialSyncCompleted,
        login,
        logout,
        addToast,
        triggerSave,
        setTab,
        setDomain,
        addCustomDomain,
        deleteCustomDomain,
        toggleTheme,
        updateQuestion,
        addCustomQuestion,
        deleteQuestion,
        addCompany,
        updateCompany,
        deleteCompany,
        addPattern,
        updatePattern,
        deletePattern,
        reorderPattern,
        addPrepWeek,
        deletePrepWeek,
        updatePrepWeek,
        addPrepTask,
        deletePrepTask,
        togglePrepTask,
        updateNeetcodeProblem,
        selectNote,
        updateNoteContent,
        updateNoteStatus,
        toggleNodeCollapse,
        toggleCollapseAllNoteNodes,
        getSiblings,
        createNoteNode,
        deleteNoteNode,
        renameNoteNode,
        reorderNoteNode,
        importBackup,
        setActivePatternId,
        setActiveQuestionId,
        setActiveCompanyId
      }}
    >
      {children}
    </PrepContext.Provider>
  );
};

export const usePrepStore = () => {
  const context = useContext(PrepContext);
  if (!context) {
    throw new Error("usePrepStore must be used within a PrepProvider");
  }
  return context;
};
