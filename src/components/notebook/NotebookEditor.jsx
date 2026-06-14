import React from 'react';
import { usePrepStore } from '../../context/PrepContext';
import { ImageResizerOverlay } from '../ImageResizerOverlay';
import { markdownToHtml } from '../../utils/htmlUtils';

export const NotebookEditor = React.forwardRef(({
  viewMode,
  docZoom,
  localTitle,
  localBody,
  setLocalTitle,
  handleInput,
  handlePaste,
  focusEditorAtEnd,
  handlePreviewClick,
  selectedImage,
  setSelectedImage,
  clearSelectedImage,
  handleImageResize,
  tocList,
  onTocItemClick,
  previewContainerRef
}, ref) => {
  const { state } = usePrepStore();

  // Bug 6: Place caret at exact mouse click point, fallback to end of doc
  const effectiveViewMode = viewMode;

  const placeCursorAtPoint = (x, y) => {
    if (!ref.current || effectiveViewMode !== 'edit') return;
    ref.current.focus();
    let range = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    if (range && ref.current.contains(range.startContainer)) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      focusEditorAtEnd();
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Column: Editor Pane (Always visible, id="nb-editor-pane") */}
      <div
        id="nb-editor-pane"
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Unified Writing Canvas */}
        <div
          ref={previewContainerRef}
          key="notebook-preview-pane"
          className={`flex-1 overflow-y-auto p-2 md:p-8 relative transition-colors duration-150 canvas-scroll-area ${
            state.theme === 'dark' ? 'bg-[#121315]' : 'bg-[#f3f4f6]'
          }`}
          onClick={(e) => {
            // Bug 6: use caretRangeFromPoint so click goes to nearest character
            if (e.target === e.currentTarget || e.target.classList.contains('canvas-scroll-area')) {
              placeCursorAtPoint(e.clientX, e.clientY);
            }
            handlePreviewClick(e);
          }}
        >
          {/* Centered Document Paper Container */}
          <div
            className={`editor-paper mx-auto my-4 md:my-8 mb-16 p-5 sm:p-8 md:px-16 md:py-12 rounded border transition-all duration-150 min-h-[calc(100vh-160px)] relative select-text text-left ${
              state.theme === 'dark'
                ? 'bg-[#25262B] border-slate-800 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                : 'bg-white border-slate-200/80 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
            }`}
            style={{
              paddingBottom: '80px',
              maxWidth: '860px',
              transformOrigin: 'top center',
              transform: docZoom !== 100 ? `scale(${docZoom / 100})` : undefined,
              marginBottom: docZoom !== 100 ? `${(docZoom / 100 - 1) * -50}px` : undefined,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget || e.target.classList.contains('editor-paper')) {
                placeCursorAtPoint(e.clientX, e.clientY);
              }
            }}
          >
            {/* Integrated Notion-style Large Title Header */}
            {effectiveViewMode === 'edit' ? (
              <input
                id="nb-note-title"
                type="text"
                placeholder="Untitled Page"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                // Bug 4: Tab in title moves focus into the body editor
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    ref.current?.focus();
                  }
                }}
                className={`w-full text-[32px] font-bold tracking-tight outline-none border-b pb-3 mb-6 bg-transparent transition-colors duration-150 ${
                  state.theme === 'dark'
                    ? 'text-white border-slate-850 focus:border-indigo-500/30'
                    : 'text-[#111827] border-[#f0f0f0] focus:border-indigo-500/20'
                }`}
              />
            ) : (
              <h1 className={`text-[32px] font-bold tracking-tight border-b pb-3 mb-6 transition-colors duration-150 ${
                state.theme === 'dark' ? 'text-white border-slate-850' : 'text-[#111827] border-[#f0f0f0]'
              }`}>
                {localTitle || "Untitled Page"}
              </h1>
            )}

            {/* Clean block-level visual editing area */}
            <div
              ref={ref}
              id="nb-note-body"
              contentEditable={effectiveViewMode === 'edit'}
              suppressContentEditableWarning
              onInput={handleInput}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                // Bug 3: Delete/Backspace removes selected image
                if ((e.key === 'Backspace' || e.key === 'Delete') && selectedImage) {
                  e.preventDefault();
                  // Also remove the wrapper div if the image is inside one
                  const wrapper = selectedImage.closest('.image-align-wrapper');
                  if (wrapper) wrapper.remove();
                  else selectedImage.remove();
                  clearSelectedImage();
                  handleInput();
                  return;
                }

                // Bug 7: Enter inside code block inserts \n text node, not a <div>
                if (e.key === 'Enter') {
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) {
                    const anchorNode = selection.anchorNode;
                    const inCodeBlock = anchorNode?.parentElement?.closest('pre.code-block');
                    if (inCodeBlock) {
                      e.preventDefault();
                      const range = selection.getRangeAt(0);
                      range.deleteContents();
                      const nl = document.createTextNode('\n');
                      range.insertNode(nl);
                      range.setStartAfter(nl);
                      range.setEndAfter(nl);
                      selection.removeAllRanges();
                      selection.addRange(range);
                      handleInput();
                      return;
                    }

                    // Bug E fix: Detect cursor adjacent to image-align-wrapper.
                    // Default Enter creates a <div> which confuses cursor nav around block images.
                    // Instead, always insert a clean <p><br></p> spacer.
                    const range = selection.getRangeAt(0);
                    let node = range.startContainer;
                    // Walk up to find nearest block-level ancestor inside editor
                    while (node && node !== ref.current && node.nodeType !== Node.ELEMENT_NODE) {
                      node = node.parentNode;
                    }
                    // Check if any immediate sibling is an image wrapper
                    const nextSibling = node?.nextSibling;
                    const prevSibling = node?.previousSibling;
                    const isNearImageWrapper = (
                      nextSibling?.classList?.contains('image-align-wrapper') ||
                      prevSibling?.classList?.contains('image-align-wrapper') ||
                      node?.classList?.contains('image-align-wrapper')
                    );
                    if (isNearImageWrapper && node && node !== ref.current) {
                      e.preventDefault();
                      const newP = document.createElement('p');
                      newP.innerHTML = '<br>';
                      // Insert after the current block node
                      if (node.nextSibling) {
                        node.parentNode.insertBefore(newP, node.nextSibling);
                      } else {
                        node.parentNode.appendChild(newP);
                      }
                      const newRange = document.createRange();
                      newRange.setStart(newP, 0);
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                      handleInput();
                      return;
                    }
                  }
                }

                // Tab: 4 spaces in code blocks, 2 elsewhere
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return;
                  const anchorNode = selection.anchorNode;
                  const isInCodeBlock = anchorNode && anchorNode.parentElement?.closest('pre');
                  const indent = isInCodeBlock ? '    ' : '  ';
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  const textNode = document.createTextNode(indent);
                  range.insertNode(textNode);
                  range.setStartAfter(textNode);
                  range.setEndAfter(textNode);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  handleInput();
                  return;
                }

                // Bug 5: Undo/Redo — re-sync localBody after browser handles it
                if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
                  setTimeout(() => handleInput(), 0);
                }
              }}
              className="markdown-body outline-none prose dark:prose-invert w-full leading-relaxed select-text min-h-[500px]"
            />
          </div>

          {/* Google Doc-Style Drag Resizer Overlay — Bug 11: pass docZoom for accurate positioning */}
          {selectedImage && (
            <ImageResizerOverlay
              target={selectedImage}
              container={previewContainerRef.current}
              docZoom={docZoom}
              onResizeEnd={(newWidth, newHeight) => {
                handleImageResize(selectedImage.src, newWidth, newHeight);
              }}
              onClose={clearSelectedImage}
            />
          )}
        </div>
      </div>

      {/* C. ON-PAGE TABLE OF CONTENTS OUTLINE */}
      {viewMode !== 'edit' && (
        <aside
          className={`hidden lg:flex w-48 flex-col flex-shrink-0 border-l transition-colors duration-150 p-4 space-y-3 ${
            state.theme === 'dark'
              ? 'bg-bg-dark border-border-dark text-slate-300'
              : 'bg-white border-border-light text-slate-700'
          }`}
        >
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            On This Page
          </h4>
          <nav className="overflow-y-auto flex-1 space-y-1">
            {tocList.length === 0 ? (
              <p className="text-[11px] font-bold text-slate-400 italic">No outline headers</p>
            ) : (
              tocList.map((toc, idx) => (
                <div
                  key={idx}
                  // Bug 9: clicking a TOC item scrolls to the heading
                  onClick={() => onTocItemClick?.(toc.id)}
                  className={`text-xs font-semibold leading-tight py-1 truncate hover:text-indigo-500 cursor-pointer transition-colors ${
                    toc.level === 1
                      ? 'text-slate-500'
                      : toc.level === 2
                      ? 'pl-3 text-slate-400'
                      : 'pl-6 text-slate-400 font-normal'  // Bug 10: H3 indented further
                  }`}
                >
                  {toc.text}
                </div>
              ))
            )}
          </nav>
        </aside>
      )}
    </div>
  );
});

NotebookEditor.displayName = 'NotebookEditor';
