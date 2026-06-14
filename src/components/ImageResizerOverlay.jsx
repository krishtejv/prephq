import React, { useState, useEffect, useRef } from 'react';

/**
 * ImageResizerOverlay
 * Renders a dashed indigo bounding box and 8 draggable handles exactly on top of an image.
 * Resizes the image via direct style manipulation for 60fps responsiveness.
 */
export const ImageResizerOverlay = ({ target, container, onResizeEnd, onClose, docZoom = 100 }) => {
  const [style, setStyle] = useState({});
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const overlayRef = useRef(null);

  // Measure and align overlay precisely on top of the image.
  // getBoundingClientRect correctly accounts for CSS transforms (docZoom scaling).
  const updatePosition = () => {
    if (!target || !container) return;

    const rect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Convert viewport-relative coords to container scroll-space absolute coords
    const top = rect.top - containerRect.top + container.scrollTop;
    const left = rect.left - containerRect.left + container.scrollLeft;

    setStyle({
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });

    setDimensions({
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  };

  useEffect(() => {
    updatePosition();

    window.addEventListener('resize', updatePosition);
    // Re-add scroll listener: getBoundingClientRect changes as user scrolls
    container.addEventListener('scroll', updatePosition);

    const resizeObserver = new ResizeObserver(() => updatePosition());
    resizeObserver.observe(target);

    const mutationObserver = new MutationObserver(() => updatePosition());
    mutationObserver.observe(target, { attributes: true, attributeFilter: ['style'] });

    return () => {
      window.removeEventListener('resize', updatePosition);
      container.removeEventListener('scroll', updatePosition);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [target, container]);

  // Handle clicking outside the resizer boundary and Escape key hits
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(e.target) &&
        e.target !== target &&
        !e.target.closest('.image-resizer-overlay') &&
        !e.target.closest('.notebook-toolbar') &&
        !e.target.closest('.notebook-header') &&
        !e.target.closest('button') &&
        !e.target.closest('[role="button"]')
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [target, onClose]);

  const handleMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = target.offsetWidth;
    const startHeight = target.offsetHeight;
    const aspectRatio = startWidth / startHeight;
    const containerRect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent) => {
      let deltaX = moveEvent.clientX - startX;
      let deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // 1. Corners (Locked aspect ratio scaling)
      if (direction === 'br') {
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === 'bl') {
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === 'tr') {
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === 'tl') {
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
      }
      // 2. Edges (Free-form stretching)
      else if (direction === 'r') {
        newWidth = startWidth + deltaX;
      } else if (direction === 'l') {
        newWidth = startWidth - deltaX;
      } else if (direction === 'b') {
        newHeight = startHeight + deltaY;
      } else if (direction === 't') {
        newHeight = startHeight - deltaY;
      }

      // Enforce bounds (Min 40px, Max parent width)
      newWidth = Math.max(40, Math.min(newWidth, containerRect.width - 40));
      newHeight = Math.max(40, newHeight);

      // Directly resize the image in the DOM for flawless 60fps drag feel
      target.style.width = `${newWidth}px`;
      target.style.height = `${newHeight}px`;

      // Trigger overlay realignment in real-time
      updatePosition();
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Commit the final width & height to update Markdown text
      onResizeEnd(target.offsetWidth, target.offsetHeight);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handlePositions = {
    tl: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    tr: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    bl: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    br: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
    t: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
    b: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
    l: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
    r: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
  };

  return (
    <div
      ref={overlayRef}
      style={{ ...style, boxSizing: 'border-box' }}
      className="pointer-events-none z-40 border-2 border-dashed border-indigo-500 dark:border-indigo-400 select-none image-resizer-overlay"
    >
      {/* Premium live tooltip showing current size */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg whitespace-nowrap z-50">
        {dimensions.width} × {dimensions.height} px
      </div>

      {/* Render the 8 handle grips */}
      {Object.entries(handlePositions).map(([dir, classes]) => (
        <div
          key={dir}
          onMouseDown={(e) => handleMouseDown(e, dir)}
          className={`absolute w-3 h-3 bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-indigo-400 rounded-sm pointer-events-auto shadow hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors duration-100 ${classes}`}
        />
      ))}
    </div>
  );
};
