import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Gets the SVG icon for a callout type.
 * @param {string} type - The callout type (e.g. note, tip, important, warning, caution).
 * @returns {string} The SVG icon string.
 */
export const getCalloutIconSvg = (type) => {
  switch (type) {
    case 'note':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    case 'tip':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M9 21h6M9 17h6M12 2v3M5 12h3M16 12h3M12 22a5 5 0 0 1-5-5h10a5 5 0 0 1-5 5z"/></svg>';
    case 'important':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    case 'warning':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    case 'caution':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    default:
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
};

/**
 * Builds HTML for a callout block.
 * @param {string} type - The callout type.
 * @param {string} contentHtml - The inner HTML of the callout body.
 * @returns {string} The full callout HTML.
 */
export const buildCalloutHtml = (type, contentHtml) => {
  const typeUpper = type.toUpperCase();
  const iconSvg = getCalloutIconSvg(type);
  return `
    <div class="rendered-callout callout-${type}" contenteditable="true" style="margin: 1.25rem 0;">
      <div class="callout-header" contenteditable="false" style="user-select: none;">
        <span class="callout-icon">${iconSvg}</span>
        <span class="callout-title">${typeUpper}</span>
      </div>
      <div class="callout-body">
        ${contentHtml}
      </div>
    </div>
  `;
};

/**
 * Strips leading H1 that matches the note title to avoid duplicate title rendering.
 * @param {string} html - The HTML string.
 * @param {string} title - The title of the note.
 * @returns {string} The stripped HTML.
 */
export const stripLeadingH1 = (html, title) => {
  if (!html || !title) return html || '';
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(`^\\s*<h1[^>]*>\\s*${escapedTitle}\\s*<\/h1>`, 'i'),
    ''
  ).trim();
};

/**
 * Converts Markdown content to HTML, handling custom callout blocks.
 * @param {string} markdown - The raw markdown content.
 * @returns {string} The parsed HTML string.
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  const hasCallouts = /(!\[NOTE\]|!\[TIP\]|!\[IMPORTANT\]|!\[WARNING\]|!\[CAUTION\]|\[!NOTE\]|\[!TIP\]|\[!IMPORTANT\]|\[!WARNING\]|\[!CAUTION\])/i.test(markdown);

  // Auto-migrate Markdown to HTML inside contentEditable
  const isHtml = !hasCallouts && markdown.trim().startsWith('<') && (
    markdown.includes('</p>') || 
    markdown.includes('</h1>') || 
    markdown.includes('</h2>') || 
    markdown.includes('</div>') ||
    markdown.includes('</ul>') ||
    markdown.includes('</ol>') ||
    markdown.includes('</pre>')
  );

  if (isHtml) return DOMPurify.sanitize(markdown);

  let converted = markdown;

  // Convert HTML line breaks and entities to plain text markdown for callout/markdown parsing
  converted = converted
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>\s*<div>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<p>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

  // Convert > [!NOTE] blockquote syntax to callout HTML before markdown parsing
  // Support other alerts too (like TIP, IMPORTANT, WARNING, CAUTION)
  const alertTypes = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'];
  alertTypes.forEach(type => {
    const regex = new RegExp(`> \\[!${type}\\]\\s*\\n((?:> [^\\n]*\\n?)*)`, 'gi');
    converted = converted.replace(regex, (match, lines) => {
      const innerMarkdown = lines.replace(/^> /gm, '').trim();
      const innerHtml = DOMPurify.sanitize(marked.parse(innerMarkdown));
      const iconSvg = getCalloutIconSvg(type.toLowerCase());
      return `<div class="rendered-callout callout-${type.toLowerCase()}" contenteditable="true" style="margin: 1.25rem 0;">
<div class="callout-header" contenteditable="false" style="user-select: none;">
<span class="callout-icon">${iconSvg}</span>
<span class="callout-title">${type}</span>
</div>
<div class="callout-body">
${innerHtml}
</div>
</div>\n`;
    });
  });

  try {
    return DOMPurify.sanitize(marked.parse(converted));
  } catch (e) {
    return converted;
  }
};
