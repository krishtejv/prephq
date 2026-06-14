import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePrepStore } from '../context/PrepContext';
import { BookOpen, Folder, FilePlus, Menu } from 'lucide-react';
import { NotebookTree } from './notebook/NotebookTree';
import { NotebookHeader } from './notebook/NotebookHeader';
import { NotebookToolbar } from './notebook/NotebookToolbar';
import { NotebookEditor } from './notebook/NotebookEditor';
import { findNoteRecursive } from '../utils/treeUtils';
import { markdownToHtml, stripLeadingH1, buildCalloutHtml } from '../utils/htmlUtils';

export const StudyNotebook = ({ searchGlobal }) => {
  const {
    state,
    selectNote,
    updateNoteContent,
    updateNoteStatus,
    addToast
  } = usePrepStore();

  const [viewMode, setViewMode] = useState('edit'); // Default to Edit View
  const [docZoom, setDocZoom] = useState(100); // Document zoom level %

  const ZOOM_STEPS = [75, 90, 100, 110, 125, 150];
  const zoomIn = () => setDocZoom(prev => {
    const next = ZOOM_STEPS.find(z => z > prev);
    return next || prev;
  });
  const zoomOut = () => setDocZoom(prev => {
    const next = [...ZOOM_STEPS].reverse().find(z => z < prev);
    return next !== undefined ? next : prev;
  });

  const editorRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  // Ref keeps selectedImage in sync for use in event handlers (avoids stale closure over state)
  const selectedImageRef = useRef(null);

  const [isMobileTreeOpen, setIsMobileTreeOpen] = useState(false);

  // Resizable Sidebar Tree state
  const [treeWidth, setTreeWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

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

  // Toolbar active format state (for highlighting active buttons)
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false,
    alignLeft: false, alignCenter: false, alignRight: false, alignJustify: false
  });

  const updateActiveFormats = () => {
    try {
      // Bug B fix: When an image is selected, derive alignment from its wrapper div
      // instead of using queryCommandState (which only works for text alignment)
      const img = selectedImageRef.current;
      if (img) {
        const wrapper = img.closest('.image-align-wrapper');
        const align = wrapper?.dataset?.align || 'none';
        setActiveFormats(prev => ({
          ...prev,
          alignLeft: align === 'left',
          alignCenter: align === 'center',
          alignRight: align === 'right',
          alignJustify: false,
        }));
        return;
      }
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
      });
    } catch (e) {}
  };

  // Listen for cursor moves to update active format states
  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, []);

  const activeNote = useMemo(() => {
    if (!state.activeNoteId) return null;
    return findNoteRecursive(state.notebookTree, state.activeNoteId);
  }, [state.notebookTree, state.activeNoteId]);

  // Folders should not load the editor — only file/page nodes get an editable doc
  const isActiveFolder = useMemo(() => {
    return activeNote?.type === 'folder';
  }, [activeNote]);

  // Local state copy for high-speed typing performance (to prevent typing lag)
  const [localTitle, setLocalTitle] = useState('');
  const [localPageTitle, setLocalPageTitle] = useState('');
  const [localBody, setLocalBody] = useState('');
  const [localStatus, setLocalStatus] = useState('');

  // Bug A/C fix: Wrap image in a block-level div for alignment instead of using float.
  // Float allows text to wrap beside the image — wrapper-div prevents this entirely.
  const wrapImageForAlignment = (img, align) => {
    let wrapper = img.closest('.image-align-wrapper');
    if (!wrapper) {
      // Create wrapper and replace the image with it
      wrapper = document.createElement('div');
      wrapper.className = 'image-align-wrapper';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      // Ensure there's a paragraph after the wrapper for cursor landing
      if (!wrapper.nextSibling || wrapper.nextSibling.nodeName === 'IMG') {
        const spacer = document.createElement('p');
        spacer.innerHTML = '<br>';
        wrapper.parentNode.insertBefore(spacer, wrapper.nextSibling);
      }
    }
    // Remove any old float/margin from the image itself
    img.style.float = '';
    img.style.margin = '0';
    img.style.display = 'block';
    // Apply alignment via wrapper text-align
    wrapper.dataset.align = align;
    if (align === 'left') {
      wrapper.style.textAlign = 'left';
    } else if (align === 'right') {
      wrapper.style.textAlign = 'right';
    } else {
      // center or justify
      wrapper.style.textAlign = 'center';
      img.style.margin = '0 auto';
    }
  };

  // WYSIWYG Formatting Actions
  const applyStyle = (command, value = null) => {
    // Image alignment: when an image is selected, apply wrapper-div alignment
    // Use ref (not state) to avoid reading stale state on async click events
    const imageTarget = selectedImageRef.current;
    if (imageTarget && ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].includes(command)) {
      const alignMap = {
        justifyLeft: 'left',
        justifyCenter: 'center',
        justifyRight: 'right',
        justifyFull: 'center',
      };
      wrapImageForAlignment(imageTarget, alignMap[command]);
      // Update alignment button states immediately
      const align = alignMap[command];
      setActiveFormats(prev => ({
        ...prev,
        alignLeft: align === 'left',
        alignCenter: align === 'center',
        alignRight: align === 'right',
        alignJustify: false,
      }));
      handleInput();
      return;
    }
    document.execCommand(command, false, value);
    handleInput();
  };

  const applyBlockFormat = (tag) => {
    document.execCommand('formatBlock', false, `<${tag}>`);
    handleInput();
  };

  const insertCodeBlock = (lang = 'python') => {
    const defaultText = lang === 'python'
      ? '# Python Optimization Blueprint\ndef optimize():\n    pass'
      : lang === 'cpp'
      ? '// C++ High-Performance Routine\nvoid optimize() {\n    \n}'
      : lang === 'sql'
      ? '-- SQL Query\nSELECT *\nFROM table_name\nWHERE condition = true\nORDER BY id DESC\nLIMIT 10;'
      : '# Bash Terminal Log\necho "Running checks..."';

    const html = `
      <pre class="code-block" data-lang="${lang}" style="background: #0d1117; color: #e6edf3; padding: 1rem; border-radius: 10px; font-family: 'Fira Code', monospace; font-size: 0.8rem; margin: 1.25rem 0; overflow-x: auto; white-space: pre; position: relative;"><code>${defaultText}</code></pre>
      <p><br></p>
    `;

    // Smart escape: if cursor is inside an existing <pre> code block,
    // move selection to immediately after the block before inserting.
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const anchorNode = selection.anchorNode;
      const existingPre = anchorNode?.parentElement?.closest('pre');
      if (existingPre && editorRef.current?.contains(existingPre)) {
        // Place caret in a new paragraph right after the pre block
        const range = document.createRange();
        // If there's already a sibling paragraph after the pre, use it;
        // otherwise insert one so we have a clean landing spot.
        let afterNode = existingPre.nextSibling;
        if (!afterNode || afterNode.nodeName === 'PRE') {
          const spacer = document.createElement('p');
          spacer.innerHTML = '<br>';
          existingPre.parentNode.insertBefore(spacer, existingPre.nextSibling);
          afterNode = spacer;
        }
        range.setStart(afterNode, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    document.execCommand('insertHTML', false, html);
    handleInput();
  };

  const insertCalloutBlock = (type = 'note') => {
    const defaultBody = '<p><strong>Active Recall Trigger</strong>: Type details...</p>';
    const calloutHtml = buildCalloutHtml(type, defaultBody);
    const html = `${calloutHtml}<p><br></p>`;
    
    const selection = window.getSelection();
    if (selection.rangeCount && editorRef.current) {
      const range = selection.getRangeAt(0);
      
      // Find the nearest block parent inside the editor
      let node = range.startContainer;
      while (
        node && 
        node !== editorRef.current && 
        !['P', 'DIV', 'LI', 'PRE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)
      ) {
        node = node.parentNode;
      }
      
      if (node && node !== editorRef.current) {
        // We are inside a block element. Let's insert the callout right after it!
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newBlock = tempDiv.firstElementChild;
        const spacingP = tempDiv.lastElementChild;
        
        if (node.nextSibling) {
          node.parentNode.insertBefore(spacingP, node.nextSibling);
          node.parentNode.insertBefore(newBlock, spacingP);
        } else {
          node.parentNode.appendChild(newBlock);
          node.parentNode.appendChild(spacingP);
        }
        
        // Position cursor inside the spacing paragraph
        const newRange = document.createRange();
        newRange.setStartAfter(newBlock);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        handleInput();
      } else {
        document.execCommand('insertHTML', false, html);
        handleInput();
      }
    } else {
      document.execCommand('insertHTML', false, html);
      handleInput();
    }
  };

  const insertHyperlink = () => {
    const url = prompt("Enter hyperlink URL (e.g. https://google.com):");
    if (!url) return;
    const cleanUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    document.execCommand('createLink', false, cleanUrl);
    
    const selection = window.getSelection();
    if (selection.rangeCount) {
      let node = selection.anchorNode;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      if (node && node.tagName === 'A') {
        node.className = "text-indigo-500 dark:text-indigo-400 underline font-black hover:text-indigo-600 cursor-pointer";
        node.target = "_blank";
      }
    }
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      setLocalBody(editorRef.current.innerHTML);
    }
  };

  const handleImageResize = (imgSrc, width, height) => {
    if (editorRef.current) {
      setLocalBody(editorRef.current.innerHTML);
      addToast("Image resized successfully!", "success");
    }
  };

  // Bug H fix: Centralise clearing selected image — updates state, ref, and removes CSS class
  const clearSelectedImage = () => {
    if (selectedImageRef.current) {
      selectedImageRef.current.classList.remove('image-selected');
    }
    selectedImageRef.current = null;
    setSelectedImage(null);
    // Reset alignment button states when deselecting image
    setActiveFormats(prev => ({
      ...prev,
      alignLeft: false, alignCenter: false, alignRight: false, alignJustify: false,
    }));
  };

  const handlePreviewClick = (e) => {
    // Only handle clicks strictly inside the preview container
    if (!previewContainerRef.current?.contains(e.target)) return;
    if (e.target.tagName === 'IMG') {
      // Bug F fix: Add class to suppress hover transform while selected
      if (selectedImageRef.current && selectedImageRef.current !== e.target) {
        selectedImageRef.current.classList.remove('image-selected');
      }
      e.target.classList.add('image-selected');
      selectedImageRef.current = e.target;
      setSelectedImage(e.target);
      // Update alignment button states to reflect current image alignment
      updateActiveFormats();
    } else if (!e.target.closest('.image-resizer-overlay')) {
      clearSelectedImage();
    }
  };

  const focusEditorAtEnd = () => {
    if (editorRef.current && viewMode === 'edit') {
      editorRef.current.focus();
      
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Bug 2: Sanitize pasted HTML — strip dangerous elements/attributes but keep safe formatting
  const sanitizePastedHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // Remove dangerous elements
    tmp.querySelectorAll('script,style,link,meta,iframe,object,embed,form,input,button').forEach(el => el.remove());
    // Strip all attributes except href/target on <a>
    const cleanAttrs = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      Array.from(node.attributes).forEach(attr => {
        if (node.tagName === 'A' && (attr.name === 'href' || attr.name === 'target')) return;
        node.removeAttribute(attr.name);
      });
      node.childNodes.forEach(cleanAttrs);
    };
    tmp.childNodes.forEach(cleanAttrs);
    return tmp.innerHTML;
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result;
            if (base64) {
              const selection = window.getSelection();
              if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();

                // Wrap in alignment container so the image is block-level from the start
                const wrapper = document.createElement('div');
                wrapper.className = 'image-align-wrapper';
                wrapper.dataset.align = 'left';
                wrapper.style.textAlign = 'left';

                const img = document.createElement('img');
                img.src = base64;
                img.alt = "Pasted Image";
                img.className = "rounded-xl shadow-lg border border-slate-500/10 cursor-pointer";
                img.style.maxWidth = "100%";
                img.style.height = "auto";
                img.style.display = 'block';
                wrapper.appendChild(img);

                // Bug D fix: Insert a paragraph after the image so cursor lands below it
                const spacer = document.createElement('p');
                spacer.innerHTML = '<br>';

                range.insertNode(spacer);
                range.insertNode(wrapper);

                // Bug D fix: Place cursor inside the spacer paragraph (after the image)
                const newRange = document.createRange();
                newRange.setStart(spacer, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);

                handleInput();
                addToast("Image pasted — cursor placed below image.", "success");
              }
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }

    e.preventDefault();

    // Bug 2: Try sanitized HTML paste first to preserve bold, links, headings etc.
    const htmlContent = e.clipboardData?.getData('text/html');
    if (htmlContent && htmlContent.trim()) {
      const sanitized = sanitizePastedHtml(htmlContent);
      if (sanitized) {
        document.execCommand('insertHTML', false, sanitized);
        handleInput();
        return;
      }
    }

    // Fallback: plain text paste
    const text = e.clipboardData?.getData('text/plain') || '';
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  // Re-synchronize selectedImage DOM node when it detaches due to dangerouslySetInnerHTML re-renders
  useEffect(() => {
    if (selectedImage && !document.body.contains(selectedImage)) {
      const activeImages = document.querySelectorAll('.markdown-body img');
      const matchedImage = Array.from(activeImages).find(img => img.src === selectedImage.src);
      if (matchedImage) {
        matchedImage.classList.add('image-selected');
        selectedImageRef.current = matchedImage;
        setSelectedImage(matchedImage);
      } else {
        clearSelectedImage();
      }
    }
  }, [selectedImage, localBody, viewMode]);

  useEffect(() => {
    clearSelectedImage();
    if (activeNote) {
      setLocalTitle(activeNote.title);
      setLocalPageTitle(activeNote.pageTitle ?? activeNote.title);
      setLocalStatus(activeNote.status);
      
      let bodyContent = activeNote.body || '';
      
      // Auto-migrate Markdown to HTML using htmlUtils
      bodyContent = markdownToHtml(bodyContent);
      
      // Strip leading H1 if it exactly matches the page title (prevents duplicate rendering)
      bodyContent = stripLeadingH1(bodyContent, activeNote.pageTitle ?? activeNote.title);
      
      // Self-healing filter
      if (
        bodyContent.includes('Main Workstation Panel') || 
        bodyContent.includes('notebook-preview-pane') ||
        bodyContent.includes('canvas-scroll-area') ||
        bodyContent.includes('editor-paper')
      ) {
        bodyContent = '<h2>Restored Note</h2><p>Content reset to prevent nesting loops.</p>';
      }
      
      setLocalBody(bodyContent);
      
      if (editorRef.current && editorRef.current.innerHTML !== bodyContent) {
        editorRef.current.innerHTML = bodyContent || '<p><br></p>';
      }
    } else {
      setLocalTitle('');
      setLocalPageTitle('');
      setLocalStatus('');
      setLocalBody('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [state.activeNoteId]);

  // Auto-select first notebook page on blank visit or invalid activeNoteId
  useEffect(() => {
    if (!activeNote && state.notebookTree && state.notebookTree.length > 0) {
      selectNote(state.notebookTree[0].id);
    }
  }, [activeNote, state.notebookTree, selectNote]);

  // Mobile tree auto-open is disabled to keep tree drawer closed until explicitly toggled

  // Sync localTitle from tree when the active note is renamed externally (sidebar rename)
  useEffect(() => {
    if (activeNote && activeNote.title !== localTitle) {
      setLocalTitle(activeNote.title);
    }
  }, [activeNote?.title]);

  // Compile markdown to HTML when switching to preview (Read View) mode
  useEffect(() => {
    if (viewMode === 'preview' && editorRef.current) {
      const compiled = markdownToHtml(localBody);
      if (editorRef.current.innerHTML !== compiled) {
        editorRef.current.innerHTML = compiled || '<p><br></p>';
      }
    }
  }, [viewMode]);

  // Sync back to store after short debounce — skip for folders (no doc body)
  useEffect(() => {
    if (!state.activeNoteId || !activeNote || isActiveFolder) return;
    const timer = setTimeout(() => {
      if (localTitle !== activeNote.title || localBody !== activeNote.body || localPageTitle !== (activeNote.pageTitle ?? activeNote.title)) {
        updateNoteContent(state.activeNoteId, localTitle, localBody, localPageTitle);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localTitle, localBody, localPageTitle]);

  // Bug 9+10: Table of Contents — includes H1/H2/H3 with slugged IDs
  const tocList = useMemo(() => {
    if (!localBody) return [];
    try {
      const list = [];
      const slugMap = {};
      const parser = new DOMParser();
      const doc = parser.parseFromString(localBody, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3');
      headings.forEach((h) => {
        const text = h.textContent.trim();
        let slug = `heading-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50)}`;
        // Deduplicate slugs
        if (slugMap[slug]) { slugMap[slug]++; slug = `${slug}-${slugMap[slug]}`; }
        else slugMap[slug] = 1;
        list.push({
          level: h.tagName === 'H1' ? 1 : h.tagName === 'H2' ? 2 : 3,
          text,
          id: slug
        });
      });
      return list;
    } catch (e) {
      return [];
    }
  }, [localBody]);

  // Bug 9: Inject heading IDs into DOM after body content changes
  useEffect(() => {
    if (!editorRef.current) return;
    const slugMap = {};
    editorRef.current.querySelectorAll('h1, h2, h3').forEach(h => {
      const text = h.textContent.trim();
      let slug = `heading-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50)}`;
      if (slugMap[slug]) { slugMap[slug]++; slug = `${slug}-${slugMap[slug]}`; }
      else slugMap[slug] = 1;
      h.id = slug;
    });
  }, [localBody]);

  // Bug 9: Scroll to heading when TOC item is clicked
  const onTocItemClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] transition-all duration-150 overflow-hidden">
      <div className="hidden md:block px-6 pt-6 pb-4 bg-bg-light dark:bg-bg-dark flex-shrink-0 border-b border-inherit lg:border-b-0">
        <h1 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Study Notebook</h1>
        <p className="text-sm lg:text-base text-slate-500 mt-1">Write structured markdown notes, build active recall segments, and optimize blueprints.</p>
      </div>

      <div 
        id="nb-shell"
        ref={containerRef}
        className="flex flex-1 overflow-hidden border-t border-inherit relative"
      >
        <div
          className={`nb-sidebar fixed md:relative top-0 bottom-0 left-0 z-[52] md:z-auto transition-transform duration-0 md:duration-300 transform md:transform-none bg-white dark:bg-bg-dark flex flex-col border-r border-inherit flex-shrink-0 ${isMobileTreeOpen ? 'translate-x-0 w-64 shadow-xl' : '-translate-x-full md:translate-x-0'}`}
          style={{ width: isMobileTreeOpen ? undefined : treeWidth }}
        >
          <NotebookTree 
            searchGlobal={searchGlobal} 
            style={{ width: '100%', height: '100%' }}
            onCloseMobile={() => setIsMobileTreeOpen(false)}
          />
        </div>

        {/* Mobile Backdrop Drawer Overlay */}
        {isMobileTreeOpen && (
          <div 
            id="nb-sidebar-backdrop"
            className="fixed inset-0 z-[51] bg-black/40 backdrop-blur-sm md:hidden cursor-pointer"
            onClick={() => setIsMobileTreeOpen(false)}
          />
        )}

      {/* 2. Main Workstation Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-light dark:bg-bg-dark">
        {activeNote && !isActiveFolder ? (
          <>
            {/* View Mode controls bar */}
            <NotebookHeader
              activeNote={activeNote}
              localTitle={localTitle}
              localStatus={localStatus}
              setLocalStatus={setLocalStatus}
              viewMode={viewMode}
              setViewMode={setViewMode}
              docZoom={docZoom}
              setDocZoom={setDocZoom}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              onToggleSidebar={() => setIsMobileTreeOpen(!isMobileTreeOpen)}
            />

            {/* Unified WYSIWYG Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Editor Formatting Toolbar (visible only in edit mode) */}
              {viewMode === 'edit' && (
                <NotebookToolbar
                  applyStyle={applyStyle}
                  applyBlockFormat={applyBlockFormat}
                  insertHyperlink={insertHyperlink}
                  insertCodeBlock={insertCodeBlock}
                  insertCalloutBlock={insertCalloutBlock}
                  activeFormats={activeFormats}
                  selectedImage={selectedImage}
                />
              )}

              {/* Editor Writing Canvas */}
              <NotebookEditor
                ref={editorRef}
                viewMode={viewMode}
                docZoom={docZoom}
                localTitle={localPageTitle}
                localBody={localBody}
                setLocalTitle={setLocalPageTitle}
                handleInput={handleInput}
                handlePaste={handlePaste}
                focusEditorAtEnd={focusEditorAtEnd}
                handlePreviewClick={handlePreviewClick}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                clearSelectedImage={clearSelectedImage}
                handleImageResize={handleImageResize}
                tocList={tocList}
                onTocItemClick={onTocItemClick}
                previewContainerRef={previewContainerRef}
              />
            </div>
          </>
        ) : activeNote && isActiveFolder ? (
          /* Folder selected — show overview, no editor */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile-only header bar with sidebar toggle */}
            <div className={`md:hidden flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-slate-200'
            }`}>
              <button
                id="nb-sidebar-toggle-btn"
                onClick={() => setIsMobileTreeOpen(!isMobileTreeOpen)}
                className="p-1.5 rounded-lg border border-slate-500/10 hover:bg-slate-500/10 text-slate-455 hover:text-slate-655 cursor-pointer"
                title="Toggle notebook notes list"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-500 truncate">{activeNote.title}</span>
            </div>
            {/* Folder overview body */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
              <div className="p-4 rounded-2xl bg-indigo-500/8 dark:bg-indigo-500/10 mb-4">
                <Folder className="w-12 h-12 text-indigo-400 dark:text-indigo-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">{activeNote.title}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                {activeNote.children && activeNote.children.length > 0
                  ? `This folder contains ${activeNote.children.length} item${activeNote.children.length !== 1 ? 's' : ''}. Select a page inside to start editing.`
                  : 'This folder is empty. Right-click it in the sidebar to add a sub-page or sub-folder.'}
              </p>
              {activeNote.children && activeNote.children.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-sm">
                  {activeNote.children.filter(c => c.type === 'file' || c.type !== 'folder').map(child => (
                    <button
                      key={child.id}
                      onClick={() => selectNote(child.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <FilePlus className="w-3 h-3" />
                      {child.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile-only header bar with sidebar toggle */}
            <div className={`md:hidden flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0 ${
              state.theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-slate-200'
            }`}>
              <button
                id="nb-sidebar-toggle-btn"
                onClick={() => setIsMobileTreeOpen(!isMobileTreeOpen)}
                className="p-1.5 rounded-lg border border-slate-500/10 hover:bg-slate-500/10 text-slate-455 hover:text-slate-655 cursor-pointer"
                title="Toggle notebook notes list"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-400">Study Notebook</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
                <h3 className="font-bold text-slate-500">No page loaded</h3>
                <p className="text-xs text-slate-400 mt-1">Select a notes block from the side tree or add a top level page!</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Resizing Handle */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 bottom-0 z-40 w-1 hover:w-1.5 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 transition-colors"
        style={{ left: `${treeWidth - 2}px` }}
      />
      </div>
    </div>
  );
};
