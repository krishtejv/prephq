import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePrepStore } from '../context/PrepContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ImageResizerOverlay } from './ImageResizerOverlay';
import { ConfirmModal } from './shared/ConfirmModal';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileText,
  Workflow,
  Sparkles,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Code,
  Image,
  Menu
} from 'lucide-react';

export const IndustryPatterns = ({ searchGlobal }) => {
  const { state, addPattern, updatePattern, deletePattern, reorderPattern, addToast } = usePrepStore();

  const [activePatternId, setActivePatternId] = useState(() => {
    return state.patterns?.[0]?.id || 'disruptor';
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form inputs for editing / adding
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const textareaRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Resizable Sidebar state (aligned with study notebook)
  const [treeWidth, setTreeWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // Double click inline renaming state
  const [renamingPatternId, setRenamingPatternId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isMobileTreeOpen, setIsMobileTreeOpen] = useState(false);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth >= 160 && newWidth <= 480) {
        setTreeWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Fetch active pattern
  const activePattern = useMemo(() => {
    if (activePatternId === '') return null;
    return (state.patterns || []).find((p) => p.id === activePatternId) || null;
  }, [state.patterns, activePatternId]);

  // Parse Markdown to HTML cleanly
  const renderedHtml = useMemo(() => {
    if (!activePattern?.content) return '';
    try {
      const parsed = marked.parse(activePattern.content);
      const doc = new DOMParser().parseFromString(parsed, 'text/html');
      doc.querySelectorAll('pre').forEach(pre => {
        pre.classList.add('code-block-display');
      });
      return DOMPurify.sanitize(doc.body.innerHTML);
    } catch (e) {
      return `<p class="text-rose-500">Error parsing Markdown: ${e.message}</p>`;
    }
  }, [activePattern]);

  useEffect(() => {
    setSelectedImage(null);
  }, [activePatternId]);

  const handleImageResize = (imgSrc, width, height) => {
    if (!activePattern?.content) return;
    
    const escapedSrc = imgSrc.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const htmlRegex = new RegExp(`<img([^>]*?)src=["']${escapedSrc}["']([^>]*?)>`, 'gi');
    const mdRegex = new RegExp(`!\\[(.*?)\\]\\(\\s*${escapedSrc}\\s*\\)`, 'g');
    
    let updatedContent = activePattern.content;
    
    if (htmlRegex.test(activePattern.content)) {
      updatedContent = activePattern.content.replace(htmlRegex, (match, before, after) => {
        const altMatch = match.match(/alt=["'](.*?)["']/i);
        const altText = altMatch ? altMatch[1] : 'Image';
        return `<img src="${imgSrc}" alt="${altText}" style="width: ${width}px; height: ${height}px;" />`;
      });
    } else if (mdRegex.test(activePattern.content)) {
      updatedContent = activePattern.content.replace(mdRegex, (match, altText) => {
        return `<img src="${imgSrc}" alt="${altText || 'Image'}" style="width: ${width}px; height: ${height}px;" />`;
      });
    }
    
    updatePattern(activePattern.id, {
      ...activePattern,
      content: updatedContent
    });
  };

  const handlePreviewClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setSelectedImage(e.target);
    } else if (!e.target.closest('.image-resizer-overlay')) {
      setSelectedImage(null);
    }
  };

  // Re-synchronize selectedImage DOM node when it detaches due to dangerouslySetInnerHTML re-renders
  useEffect(() => {
    if (selectedImage && !document.body.contains(selectedImage)) {
      const activeImages = document.querySelectorAll('.markdown-body img');
      const matchedImage = Array.from(activeImages).find(img => img.src === selectedImage.src);
      if (matchedImage) {
        setSelectedImage(matchedImage);
      } else {
        setSelectedImage(null);
      }
    }
  }, [selectedImage, renderedHtml]);

  const insertMarkdown = (syntaxBefore, syntaxAfter = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart !== undefined ? el.selectionStart : el.value.length;
    const end = el.selectionEnd !== undefined ? el.selectionEnd : el.value.length;
    const text = el.value;

    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    // Block elements newline safety guard
    let prefix = '';
    let processedSyntaxBefore = syntaxBefore;
    if (syntaxBefore.startsWith('\n') || syntaxBefore.startsWith('>') || syntaxBefore.startsWith('`') || syntaxBefore.startsWith('#') || syntaxBefore.startsWith('!')) {
      if (start > 0) {
        const lastChar1 = text.charAt(start - 1);
        const lastChar2 = start > 1 ? text.charAt(start - 2) : '';
        if (lastChar1 === '\n' && lastChar2 === '\n') {
          if (processedSyntaxBefore.startsWith('\n')) {
            processedSyntaxBefore = processedSyntaxBefore.substring(1);
          }
        } else if (lastChar1 === '\n') {
          if (!processedSyntaxBefore.startsWith('\n')) {
            prefix = '\n';
          }
        } else {
          if (processedSyntaxBefore.startsWith('\n')) {
            prefix = '\n';
          } else {
            prefix = '\n\n';
          }
        }
      } else {
        if (processedSyntaxBefore.startsWith('\n')) {
          processedSyntaxBefore = processedSyntaxBefore.substring(1);
        }
      }
    }

    const insertText = selectedText || (syntaxAfter ? 'Text' : '');
    const replacement = prefix + processedSyntaxBefore + insertText + syntaxAfter;
    const newBody = beforeText + replacement + afterText;

    setEditContent(newBody);

    // Re-focus and set selection
    setTimeout(() => {
      el.focus();
      const newCursorPos = start + prefix.length + processedSyntaxBefore.length + insertText.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result;
          if (base64) {
            insertMarkdown(`![Pasted Image](${base64})`);
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Active pattern selection was moved to top of component (removing duplicate block)

  // Search filtered list of patterns
  const filteredPatterns = useMemo(() => {
    const list = state.patterns || [];
    const searchLower = searchGlobal?.toLowerCase() || '';
    if (!searchLower) return list;

    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.subtitle.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
    );
  }, [state.patterns, searchGlobal]);

  // Start editing active pattern
  const startEdit = () => {
    if (!activePattern) return;
    setEditTitle(activePattern.title);
    setEditSubtitle(activePattern.subtitle);
    setEditContent(activePattern.content);
    setIsEditing(true);
  };

  // Save changes
  const saveChanges = () => {
    if (!activePattern) return;
    updatePattern(activePattern.id, {
      title: editTitle,
      subtitle: editSubtitle,
      content: editContent
    });
    setIsEditing(false);
    addToast("Saved blueprint modifications", "success");
  };

  // Add new blank pattern design block
  const handleAddNewPattern = () => {
    if (isEditing) {
      const confirmDiscard = window.confirm("You have unsaved changes on the current blueprint. Are you sure you want to discard them and create a new blueprint?");
      if (!confirmDiscard) return;
    }

    const title = window.prompt("Enter new blueprint title:");
    if (!title) return;

    const newId = `pattern-${Date.now()}`;
    const newPat = {
      id: newId,
      title: title.trim(),
      subtitle: 'Custom Low-Latency Slide Blueprint',
      content: ''
    };

    addPattern(newPat);
    setActivePatternId(newId);
    
    // Automatically open in edit mode
    setEditTitle(newPat.title);
    setEditSubtitle(newPat.subtitle);
    setEditContent(newPat.content);
    setIsEditing(true);
  };

  // Delete pattern
  const confirmDelete = () => {
    if (!activePattern) return;
    deletePattern(activePattern.id);
    setIsEditing(false);
    setActivePatternId('');
  };

  // Parse Markdown to HTML cleanly placeholder (moved to top of component)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] transition-all duration-150 overflow-hidden">
      <div className="hidden md:block px-6 pt-6 pb-4 bg-bg-light dark:bg-bg-dark flex-shrink-0">
        <h1 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Industry Patterns</h1>
        <p className="text-sm lg:text-base text-slate-500 mt-1">Explore and document system design patterns, distributed blueprints, and technical blueprints.</p>
      </div>

      <div 
        ref={containerRef}
        className="flex flex-col md:flex-row flex-1 overflow-hidden border-t border-inherit relative"
      >
        {/* Sidebar navigation list */}
        <aside
          style={{ width: isMobileTreeOpen ? undefined : treeWidth }}
          className={`fixed md:relative top-0 bottom-0 left-0 z-[52] md:z-auto transition-transform duration-300 transform md:transform-none flex flex-col flex-shrink-0 border-r transition-colors duration-150 ${
            isMobileTreeOpen ? 'translate-x-0 w-64 shadow-xl' : '-translate-x-full md:translate-x-0'
          } ${
            state.theme === 'dark'
              ? 'bg-bg-dark border-border-dark text-slate-300'
              : 'bg-white border-border-light text-slate-700'
          }`}
        >
        <div className="h-14 px-3 border-b border-inherit flex items-center justify-between gap-2 flex-shrink-0">
          <button
            id="add-pattern-btn"
            onClick={handleAddNewPattern}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Blueprint</span>
          </button>
          <button
            onClick={() => setIsMobileTreeOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-500 dark:text-slate-400 md:hidden cursor-pointer"
            title="Close blueprints list"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPatterns.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No pattern designs</p>
          ) : (
            filteredPatterns.map((p, idx) => {
              const isActive = activePatternId === p.id;
              return (
                <div
                  key={p.id}
                  className={`group/item w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-500'
                      : 'hover:bg-slate-500/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <button
                    onClick={() => {
                      if (isEditing) {
                        const confirmDiscard = window.confirm("You have unsaved changes on the current blueprint. Are you sure you want to discard them?");
                        if (!confirmDiscard) return;
                      }
                      setActivePatternId(p.id);
                      setIsEditing(false);
                      setIsMobileTreeOpen(false);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setRenamingPatternId(p.id);
                      setRenameTitle(p.title);
                    }}
                    className={`patterns-menu-item ${isActive ? 'active' : ''} flex-1 flex items-center gap-2.5 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer text-inherit outline-none pr-20 md:pr-2 md:group-hover/item:pr-20`}
                  >
                    <Workflow className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                    {renamingPatternId === p.id ? (
                      <input
                        type="text"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={() => {
                          if (renameTitle.trim() && renameTitle.trim() !== p.title) {
                            updatePattern(p.id, { ...p, title: renameTitle.trim() });
                            addToast("Blueprint renamed successfully", "success");
                          }
                          setRenamingPatternId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (renameTitle.trim() && renameTitle.trim() !== p.title) {
                              updatePattern(p.id, { ...p, title: renameTitle.trim() });
                              addToast("Blueprint renamed successfully", "success");
                            }
                            setRenamingPatternId(null);
                          } else if (e.key === 'Escape') {
                            setRenamingPatternId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="flex-1 px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-indigo-500 rounded outline-none font-normal"
                      />
                    ) : (
                      <span className="truncate leading-snug">{p.title}</span>
                    )}
                  </button>

                  <div className={`absolute right-2 flex items-center gap-0.5 ml-1.5 flex-shrink-0 bg-transparent pl-2 ${
                    renamingPatternId === p.id 
                      ? 'hidden' 
                      : 'flex md:opacity-0 md:group-hover/item:opacity-100 pointer-events-auto md:pointer-events-none md:group-hover/item:pointer-events-auto transition-opacity duration-150'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPattern(p.id, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-slate-500/10 text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Move blueprint up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPattern(p.id, 'down');
                      }}
                      disabled={idx === filteredPatterns.length - 1}
                      className="p-1 rounded hover:bg-slate-500/10 text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Move blueprint down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePatternId(p.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Delete blueprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* Mobile Backdrop Drawer Overlay */}
      {isMobileTreeOpen && (
        <div 
          className="fixed inset-0 z-[51] bg-black/40 backdrop-blur-sm md:hidden cursor-pointer"
          onClick={() => setIsMobileTreeOpen(false)}
        />
      )}

      {/* Resizing Handle */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 bottom-0 z-40 w-1 hover:w-1.5 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 transition-colors hidden md:block"
        style={{ left: `${treeWidth - 2}px` }}
      />

      {/* Main Content Pane */}
      <main id="patterns-doc-viewer" className="flex-1 flex flex-col overflow-hidden">
        {activePattern ? (
          <>
            {/* Context bar with action tabs */}
            <div
              className={`h-14 px-4 md:px-6 flex items-center justify-between border-b flex-shrink-0 transition-colors duration-150 ${
                state.theme === 'dark'
                  ? 'bg-surface-dark border-border-dark'
                  : 'bg-white border-border-light'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-widest select-none">
                <button
                  onClick={() => setIsMobileTreeOpen(!isMobileTreeOpen)}
                  className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-500 dark:text-slate-400 md:hidden cursor-pointer"
                  title="Toggle blueprints list"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Blueprint Node / {isEditing ? 'Editing' : 'Viewer'}</span>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="cancel-pat-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 cursor-pointer transition-colors duration-150"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={saveChanges}
                      className="save-pat-btn flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition-colors duration-150"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startEdit}
                      className={`edit-pat-btn flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border hover:bg-slate-500/5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer ${
                        state.theme === 'dark' ? 'border-border-dark' : 'border-border-light'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Blueprint</span>
                    </button>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Delete architectural blueprint "${activePattern.title}"?`);
                        if (confirmed) {
                          confirmDelete();
                        }
                      }}
                      className="delete-pat-btn flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-rose-500/30 hover:bg-rose-500/5 text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Document display scrolling pane */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isEditing ? (
                /* Edit Workspace Form */
                <div className="space-y-4 max-w-3xl h-full flex flex-col">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`pat-edit-title w-full text-base font-extrabold rounded-xl border p-3 outline-none ${
                        state.theme === 'dark'
                          ? 'bg-surface-dark border-border-dark focus:border-indigo-500'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      className={`pat-edit-subtitle w-full text-sm font-semibold rounded-xl border p-3 outline-none ${
                        state.theme === 'dark'
                          ? 'bg-surface-dark border-border-dark focus:border-indigo-500 text-slate-300'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-700'
                      }`}
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-h-[300px]">
                    <label className="text-xs font-bold text-slate-400 block mb-1">Markdown content</label>
                    
                    {/* Toolbar */}
                    <div
                      className={`flex items-center gap-1.5 px-4 py-2 border-t border-x rounded-t-xl flex-shrink-0 transition-colors duration-155 ${
                        state.theme === 'dark'
                          ? 'bg-surface-dark border-border-dark'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => insertMarkdown('**', '**')}
                        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => insertMarkdown('*', '*')}
                        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => insertMarkdown('# ')}
                        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400"
                        title="Heading 1"
                      >
                        <Heading1 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => insertMarkdown('## ')}
                        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400"
                        title="Heading 2"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => insertMarkdown('```cpp\n', '\n```')}
                        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400"
                        title="Code Block"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => insertMarkdown('![Image Description](', ')')}
                        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400"
                        title="Insert Image"
                      >
                        <Image className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onPaste={handlePaste}
                      className={`pat-edit-content w-full flex-1 text-sm font-mono rounded-b-xl border p-4 outline-none resize-none ${
                        state.theme === 'dark'
                          ? 'bg-surface-dark border-border-dark focus:border-indigo-500'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                /* Render Document pane */
                <div 
                  ref={previewContainerRef}
                  key="pattern-preview-pane"
                  onClick={handlePreviewClick}
                  className="relative h-full flex flex-col overflow-y-auto"
                >
                  <article className="prose dark:prose-invert max-w-3xl leading-relaxed relative pb-16">
                    <div className="border-b pb-4 border-inherit mb-6">
                      <h2 className="text-2xl font-black tracking-tight mb-1">{activePattern.title}</h2>
                      <p className="text-sm font-bold text-indigo-500 uppercase tracking-wide">
                        {activePattern.subtitle}
                      </p>
                    </div>

                    <div
                      className="markdown-body text-slate-600 dark:text-slate-300 space-y-4"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </article>

                  {/* High-Performance Image Resizer Overlay */}
                  {selectedImage && (
                    <ImageResizerOverlay
                      target={selectedImage}
                      container={previewContainerRef.current}
                      onResizeEnd={(newWidth, newHeight) => {
                        handleImageResize(selectedImage.src, newWidth, newHeight);
                      }}
                      onClose={() => setSelectedImage(null)}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <Layers className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
              <h3 className="font-bold text-slate-500">No blueprint active</h3>
              <p className="text-xs text-slate-400 mt-1">Select a blueprint from the sidebar list or create one!</p>
            </div>
          </div>
        )}
      </main>

      {/* Styled Markdown parser enhancements */}
      <style>{`
        .markdown-body h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #5B6AD0;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .markdown-body img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.25rem 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          display: block;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: 1px solid rgba(0, 0, 0, 0.03);
        }
        .markdown-body img:hover {
          box-shadow: 0 8px 30px rgba(91, 106, 208, 0.16);
          transform: translateY(-2px);
        }
        .dark .markdown-body img {
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
        }
        .dark .markdown-body img:hover {
          box-shadow: 0 8px 36px rgba(123, 140, 234, 0.24);
        }
        .markdown-body p {
          font-size: 0.875rem;
          margin-bottom: 1rem;
          line-height: 1.625;
        }
        .markdown-body ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .markdown-body li {
          margin-bottom: 0.35rem;
        }
        .markdown-body code {
          font-family: 'Fira Code', monospace;
          background: rgba(91, 106, 208, 0.08);
          padding: 0.15rem 0.3rem;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #5B6AD0;
        }
        .markdown-body pre {
          background: #1e1e24;
          padding: 1rem;
          border-radius: 12px;
          overflow-x: auto;
          margin-top: 1rem;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .markdown-body pre code {
          background: transparent;
          color: #a78bfa;
          font-size: 0.775rem;
          padding: 0;
        }
        .dark .markdown-body h3 {
          color: #8F9DF7;
        }
        .dark .markdown-body code {
          color: #8F9DF7;
        }
      `}</style>

      {/* Delete confirmation modal */}
      {activePattern && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Pattern Blueprint"
          message={`Are you sure you want to permanently delete the "${activePattern.title}" blueprint?`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
      </div>
    </div>
  );
};

