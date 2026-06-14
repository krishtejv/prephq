import React from 'react';
import { usePrepStore } from '../../context/PrepContext';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Sparkles,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react';

export const NotebookToolbar = ({
  applyStyle,
  applyBlockFormat,
  insertHyperlink,
  insertCodeBlock,
  insertCalloutBlock,
  activeFormats = { bold: false, italic: false, underline: false },
  selectedImage = null,
}) => {
  const { state } = usePrepStore();

  // Prevent focus loss from editor on every toolbar interaction
  const handleMouseDown = (e) => e.preventDefault();

  return (
    <div
      className={`notebook-toolbar sticky top-0 z-10 flex flex-wrap items-center gap-1.5 px-6 py-2.5 border-b shadow-sm transition-colors duration-150 ${
        state.theme === 'dark'
          ? 'bg-[#25262B] border-slate-850'
          : 'bg-white border-[#e5e7eb]'
      }`}
    >
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('bold')}
        className={`p-1.5 rounded cursor-pointer transition-all ${
          activeFormats.bold
            ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
            : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Bold"
        aria-label="Bold text"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('italic')}
        className={`p-1.5 rounded cursor-pointer transition-all ${
          activeFormats.italic
            ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
            : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Italic"
        aria-label="Italic text"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('underline')}
        className={`p-1.5 rounded cursor-pointer transition-all ${
          activeFormats.underline
            ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
            : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Underline"
        aria-label="Underline text"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyBlockFormat('h1')}
        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        title="Heading 1"
        aria-label="Heading level 1"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyBlockFormat('h2')}
        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        title="Heading 2"
        aria-label="Heading level 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('insertUnorderedList')}
        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        title="Bullet List"
        aria-label="Insert bulleted list"
      >
        <List className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('insertOrderedList')}
        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        title="Numbered List"
        aria-label="Insert numbered list"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={insertHyperlink}
        className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        title="Insert Link"
        aria-label="Insert hyperlink"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />


      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('justifyLeft')}
        className={`p-1.5 rounded cursor-pointer transition-all ${
          activeFormats.alignLeft
            ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
            : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Align Left"
        aria-label="Align text left"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('justifyCenter')}
        className={`p-1.5 rounded cursor-pointer transition-all ${
          activeFormats.alignCenter
            ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
            : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Align Center"
        aria-label="Align text center"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('justifyRight')}
        className={`p-1.5 rounded cursor-pointer transition-all ${
          activeFormats.alignRight
            ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
            : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Align Right"
        aria-label="Align text right"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => applyStyle('justifyFull')}
        className={`p-1.5 rounded cursor-pointer transition-all ${
          activeFormats.alignJustify
            ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
            : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Justify"
        aria-label="Justify text"
      >
        <AlignJustify className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => insertCalloutBlock('note')}
        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer"
        title="Active Recall Callout Block"
        aria-label="Insert active recall callout block"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Recall Block</span>
      </button>

      <div className="relative group/code flex items-center">
        <button
          type="button"
          onMouseDown={handleMouseDown}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer"
          title="Insert syntax coding blocks"
          aria-label="Insert syntax coding blocks menu"
        >
          <Code className="w-3.5 h-3.5" />
          <span>Code Block</span>
        </button>

        <div className="absolute top-7 left-0 hidden group-hover/code:flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 w-32 animate-fade-in">
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onClick={() => insertCodeBlock('python')}
            className="px-3 py-1.5 text-[10px] text-left font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 w-full cursor-pointer"
            aria-label="Insert Python code template"
          >
            🐍 Python
          </button>
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onClick={() => insertCodeBlock('cpp')}
            className="px-3 py-1.5 text-[10px] text-left font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 w-full cursor-pointer"
            aria-label="Insert C++ code template"
          >
            💻 C++
          </button>
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onClick={() => insertCodeBlock('bash')}
            className="px-3 py-1.5 text-[10px] text-left font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 w-full cursor-pointer"
            aria-label="Insert Linux Bash template"
          >
            🐧 Linux/Bash
          </button>
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onClick={() => insertCodeBlock('sql')}
            className="px-3 py-1.5 text-[10px] text-left font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 w-full cursor-pointer"
            aria-label="Insert SQL query template"
          >
            🗄️ SQL
          </button>
        </div>
      </div>
    </div>
  );
};
export default NotebookToolbar;
