import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePrepStore, getNextUntitledName } from '../../context/PrepContext';
import { findParentNoteRecursive } from '../../utils/treeUtils';
import { ConfirmModal } from '../shared/ConfirmModal';
import { createPortal } from 'react-dom';
import {
  Folder,
  FileText,
  Plus,
  Trash,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FilePlus,
  FolderPlus,
  ChevronsUp,
  ChevronsDown,
  X,
  MoreVertical,
  Edit2
} from 'lucide-react';

const findNoteRecursive = (list, id) => {
  if (!list) return null;
  for (let node of list) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNoteRecursive(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const NotebookTree = ({ searchGlobal, style, className = "", onCloseMobile }) => {
  const {
    state,
    selectNote,
    toggleNodeCollapse,
    toggleCollapseAllNoteNodes,
    deleteNoteNode,
    reorderNoteNode,
    getSiblings,
    createNoteNode,
    updateNoteContent
  } = usePrepStore();

  const [nbSearchQuery, setNbSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [renamingNodeId, setRenamingNodeId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');

  // E2E Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addParentId, setAddParentId] = useState(null);
  const [addName, setAddName] = useState('');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState(null);
  const [renameInputVal, setRenameInputVal] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteNodeId, setDeleteNodeId] = useState(null);

  const handleAddModalSubmit = (e) => {
    e.preventDefault();
    if (!addName.trim()) return;
    createNoteNode(addParentId, addName.trim(), 'file');
    setShowAddModal(false);
    setAddName('');
  };

  const handleRenameModalSubmit = (e) => {
    e.preventDefault();
    if (!renameInputVal.trim()) return;
    const node = findNoteRecursive(state.notebookTree, renameNodeId);
    if (node) {
      updateNoteContent(renameNodeId, renameInputVal.trim(), node.body);
    }
    setShowRenameModal(false);
    setRenameInputVal('');
  };

  const handleDeleteModalSubmit = (e) => {
    e.preventDefault();
    deleteNoteNode(deleteNodeId);
    setShowDeleteModal(false);
  };

  // Dropdown / Context Menu states
  const [menuNodeId, setMenuNodeId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Close context menu on global click or container scroll
  useEffect(() => {
    const handleCloseMenu = (e) => {
      if (e && e.target && e.target.closest('.nb-node-menu-btn')) {
        return;
      }
      setMenuNodeId(null);
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, []);

  const activeMenuNode = useMemo(() => {
    if (!menuNodeId) return null;
    return findNoteRecursive(state.notebookTree, menuNodeId);
  }, [state.notebookTree, menuNodeId]);

  // Dynamically compute if any folder in the tree is currently expanded
  const hasExpandedFolder = useMemo(() => {
    let hasExpanded = false;
    const checkExpandedRecursive = (nodes) => {
      for (let node of nodes) {
        const isFolder = node.type === 'folder' || (node.children && node.children.length > 0);
        if (isFolder && !node.collapsed) {
          hasExpanded = true;
          return;
        }
        if (node.children && node.children.length > 0) {
          checkExpandedRecursive(node.children);
          if (hasExpanded) return;
        }
      }
    };
    checkExpandedRecursive(state.notebookTree || []);
    return hasExpanded;
  }, [state.notebookTree]);

  // Stable ref for the rename input — NOT an inline ref callback
  const renameInputRef = useRef(null);

  // Auto-focus and select ONLY when renamingNodeId changes (rename mode starts),
  // NOT on every keystroke re-render
  useEffect(() => {
    if (renamingNodeId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNodeId]);

  const handleCreateNode = (type) => {
    const activeNode = state.activeNoteId ? findNoteRecursive(state.notebookTree, state.activeNoteId) : null;
    
    // Toolbar intent: always create as a sibling of the active node (same parent folder)
    // to allow creating root nodes and prevent unwanted nesting.
    let parentId = null;
    if (activeNode) {
      const parentNode = findParentNoteRecursive(state.notebookTree, activeNode.id);
      if (parentNode) {
        parentId = parentNode.id;
      }
    }
    
    // 1. Read siblings synchronously from current state
    const siblings = getSiblings(parentId);
    // 2. Compute unique name synchronously BEFORE setState
    const computedName = getNextUntitledName(siblings);
    // 3. Pass computed name directly — createNoteNode uses it as-is
    const newNode = createNoteNode(parentId, computedName, type);
    
    if (newNode) {
      setRenamingNodeId(newNode.id);
      setRenameTitle(newNode.title);
    }
  };

  // Recursive Tree Filtering
  const isMatchRecursive = (node, searchLower) => {
    const bodyText = node.body ? node.body.replace(/<[^>]*>/g, ' ') : '';
    if (node.title.toLowerCase().includes(searchLower) || bodyText.toLowerCase().includes(searchLower)) {
      return true;
    }
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => isMatchRecursive(child, searchLower));
    }
    return false;
  };

  const filterTreeRecursive = (list, searchLower) => {
    if (!searchLower) return list;
    return list
      .filter((node) => isMatchRecursive(node, searchLower))
      .map((node) => ({
        ...node,
        children: node.children ? filterTreeRecursive(node.children, searchLower) : []
      }));
  };

  const filteredTree = useMemo(() => {
    const query = (nbSearchQuery || searchGlobal || '').toLowerCase();
    return filterTreeRecursive(state.notebookTree || [], query);
  }, [state.notebookTree, nbSearchQuery, searchGlobal]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    const isNoteActive = state.activeNoteId === node.id;
    const isFolder = node.type === 'folder' || (node.type !== 'file' && (depth === 0 || (node.children && node.children.length > 0)));
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = (nbSearchQuery || searchGlobal) ? false : node.collapsed;

    const handleRenameSubmit = () => {
      if (renameTitle.trim() && renameTitle.trim() !== node.title) {
        updateNoteContent(node.id, renameTitle.trim(), node.body);
      }
      setRenamingNodeId(null);
    };

    return (
      <div key={node.id}>
        {/* Row element */}
        <div
          className={`nb-tree-row group flex items-center relative cursor-pointer transition-all rounded-xl pr-10 md:pr-2.5 md:group-hover:pr-10 ${
            isNoteActive
              ? 'bg-indigo-500/10 text-indigo-500 font-bold'
              : 'hover:bg-slate-500/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
          style={{
            paddingLeft: `${12 + depth * 16}px`,
            paddingTop: '6px',
            paddingBottom: '6px',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
          onClick={() => {
            selectNote(node.id);
            if (onCloseMobile) onCloseMobile();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const menuWidth = 192;
            const menuHeight = 220;
            let x = e.clientX;
            let y = e.clientY;
            if (x + menuWidth > window.innerWidth) {
              x = window.innerWidth - menuWidth - 8;
            }
            if (y + menuHeight > window.innerHeight) {
              y = window.innerHeight - menuHeight - 8;
            }
            if (x < 8) x = 8;
            if (y < 8) y = 8;
            
            setMenuNodeId(node.id);
            setMenuPosition({ x, y });
          }}
        >
          {/* Positional Decorative Guide Lines */}
          {Array.from({ length: depth }).map((_, idx) => (
            <div
              key={idx}
              className="absolute top-[-2px] bottom-[-2px] border-l border-slate-200/80 dark:border-slate-800/60"
              style={{ left: `${21 + idx * 16}px`, width: '1px' }}
            />
          ))}

          <div
            className="flex items-center gap-1.5 min-w-0 flex-1 relative z-10"
            style={{ overflow: 'hidden' }}
          >
            {/* Collapse toggle arrow */}
            {isFolder ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeCollapse(node.id);
                }}
                className="p-0.5 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-[18px] flex-shrink-0" />
            )}

            {/* Folder / File Icon (Single folder icon for all states) */}
            {isFolder ? (
              <Folder className="w-4 h-4 text-indigo-500/80 flex-shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}

            {/* Status dot — pages only, not folders */}
            {node.status && !isFolder && (
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  node.status === 'solved'
                    ? 'bg-emerald-500'
                    : node.status === 'review'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                title={`Status: ${node.status.toUpperCase()}`}
              />
            )}

            {renamingNodeId === node.id ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  } else if (e.key === 'Escape') {
                    setRenamingNodeId(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-indigo-500 rounded outline-none font-normal"
                style={{
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  flex: 1
                }}
              />
            ) : (
              <span
                className="truncate text-xs leading-none"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenamingNodeId(node.id);
                  setRenameTitle(node.title);
                }}
              >
                {node.title}
              </span>
            )}
          </div>

          {/* Action pills: replaced with a single 3-dot vertical button */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`absolute right-2 flex items-center gap-0.5 flex-shrink-0 bg-transparent pl-2 z-10 ${
              renamingNodeId === node.id 
                ? 'hidden' 
                : 'flex md:opacity-0 md:group-hover:opacity-100 pointer-events-auto transition-opacity duration-150'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuNodeId(node.id);
                setMenuPosition({
                  x: rect.right - 192,
                  y: rect.bottom + 4
                });
              }}
              className="nb-node-menu-btn p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-500/10 cursor-pointer animate-fade-in"
              title="Options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Child notes sub-tree */}
        {isFolder && !isCollapsed && hasChildren && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      style={style}
      className={`flex flex-col flex-shrink-0 border-r transition-colors duration-150 ${className} ${
        state.theme === 'dark'
          ? 'bg-bg-dark border-border-dark text-slate-300'
          : 'bg-white border-border-light text-slate-700'
      }`}
    >
      {/* Actions panel (centered 3-icon strip) */}
      <div className="h-14 px-3 border-b border-inherit flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex-1 flex items-center justify-center gap-4">
          <button
            onClick={() => handleCreateNode('file')}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-500/5 text-slate-650 dark:text-slate-350 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all cursor-pointer"
            title="New File"
            aria-label="New File"
          >
            <FilePlus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={() => handleCreateNode('folder')}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-500/5 text-slate-650 dark:text-slate-350 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all cursor-pointer"
            title="New Folder"
            aria-label="New Folder"
          >
            <FolderPlus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={toggleCollapseAllNoteNodes}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-500/5 text-slate-650 dark:text-slate-350 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all cursor-pointer"
            title={hasExpandedFolder ? "Collapse All" : "Expand All"}
            aria-label={hasExpandedFolder ? "Collapse All" : "Expand All"}
          >
            {hasExpandedFolder ? (
              <ChevronsUp className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ChevronsDown className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-500 dark:text-slate-400 md:hidden cursor-pointer"
            title="Close list"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tree Search Box */}
      <div className="p-2.5 flex-shrink-0 relative">
        <input
          type="text"
          placeholder="Search notebook notes..."
          value={nbSearchQuery}
          onChange={(e) => setNbSearchQuery(e.target.value)}
          className={`w-full text-xs font-semibold rounded-xl border pl-3 pr-8 py-2 outline-none transition-colors duration-150 ${
            state.theme === 'dark'
              ? 'bg-surface-dark border-border-dark focus:border-indigo-500'
              : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
          }`}
        />
        {nbSearchQuery && (
          <button
            onClick={() => setNbSearchQuery('')}
            className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer transition-colors"
            title="Clear search"
          >
            <Plus className="w-3.5 h-3.5 rotate-45" />
          </button>
        )}
      </div>

      {/* Hierarchical rendering list */}
      <nav
        className="flex-1 overflow-y-auto px-2 pb-4"
        style={{ overflowX: 'hidden', width: '100%' }}
      >
        {filteredTree.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Notebook tree empty</p>
        ) : (
          filteredTree.map((node) => renderTreeNode(node, 0))
        )}
      </nav>

      {/* Floating Dropdown / Context Menu */}
      {activeMenuNode && createPortal(
        <div
          className="fixed z-[9999] w-48 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xl py-1 px-1 focus:outline-none flex flex-col gap-0.5"
          style={{
            top: `${menuPosition.y}px`,
            left: `${menuPosition.x}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeMenuNode.type === 'folder' && (
            <>
              <button
                onClick={() => {
                  setAddParentId(activeMenuNode.id);
                  setAddName('');
                  setShowAddModal(true);
                  setMenuNodeId(null);
                }}
                className="nb-node-add-child-btn w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors text-left font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Add sub-page</span>
              </button>
              <button
                onClick={() => {
                  const siblings = getSiblings(activeMenuNode.id);
                  const computedName = getNextUntitledName(siblings);
                  const newNode = createNoteNode(activeMenuNode.id, computedName, 'folder');
                  if (newNode) {
                    setRenamingNodeId(newNode.id);
                    setRenameTitle(newNode.title);
                  }
                  setMenuNodeId(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors text-left font-medium cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Add sub-folder</span>
              </button>
              <div className="h-[1px] bg-slate-100 dark:bg-slate-800/60 my-0.5" />
            </>
          )}

          <button
            onClick={() => {
              setRenameNodeId(activeMenuNode.id);
              setRenameInputVal(activeMenuNode.title);
              setShowRenameModal(true);
              setMenuNodeId(null);
            }}
            className="nb-node-rename-btn w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors text-left font-medium cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-450 dark:text-slate-400" />
            <span>Rename</span>
          </button>

          <button
            onClick={() => {
              reorderNoteNode(activeMenuNode.id, 'up');
              setMenuNodeId(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors text-left font-medium cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5 text-slate-450 dark:text-slate-400" />
            <span>Move up</span>
          </button>

          <button
            onClick={() => {
              reorderNoteNode(activeMenuNode.id, 'down');
              setMenuNodeId(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors text-left font-medium cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-450 dark:text-slate-400" />
            <span>Move down</span>
          </button>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/60 my-0.5" />

          <button
            onClick={() => {
              setDeleteNodeId(activeMenuNode.id);
              setShowDeleteModal(true);
              setMenuNodeId(null);
            }}
            className="nb-node-delete-btn w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors text-left font-semibold cursor-pointer"
          >
            <Trash className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteNoteNode(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Delete Notebook Item"
        message="Are you sure you want to permanently delete this note? This will recursively delete all nested sub-pages and folders."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Add Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            id="nb-add-modal"
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-500/10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4">Add Notebook Page</h3>
            <form onSubmit={handleAddModalSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Page Title</label>
                <input
                  id="nb-add-name"
                  type="text"
                  required
                  placeholder="Enter page title..."
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-100'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 border-t pt-4 border-inherit">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="nb-add-modal-submit"
                  type="submit"
                  className="px-5 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  Add Page
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Rename Modal */}
      {showRenameModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            id="nb-rename-modal"
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              onClick={() => setShowRenameModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-500/10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4">Rename Notebook Page</h3>
            <form onSubmit={handleRenameModalSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">New Title</label>
                <input
                  id="nb-rename-input"
                  type="text"
                  required
                  placeholder="Enter new title..."
                  value={renameInputVal}
                  onChange={(e) => setRenameInputVal(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-xl border p-2.5 outline-none ${
                    state.theme === 'dark'
                      ? 'bg-bg-dark border-border-dark focus:border-indigo-500 text-slate-100'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 border-t pt-4 border-inherit">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 text-sm font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="nb-rename-modal-submit"
                  type="submit"
                  className="px-5 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" style={{ margin: 0 }}>
          <div
            id="nb-delete-modal"
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative transition-all duration-150 transform scale-100 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark text-slate-100' : 'bg-white border-border-light text-slate-800'
            }`}
          >
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-500/10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 text-slate-800 dark:text-slate-100">Delete Notebook Item</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6 text-left leading-relaxed">
              Are you sure you want to permanently delete this note? This will recursively delete all nested sub-pages and folders.
            </p>
            <div className="flex justify-end gap-2 border-t pt-4 border-inherit">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                id="nb-delete-modal-submit"
                onClick={handleDeleteModalSubmit}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
};
