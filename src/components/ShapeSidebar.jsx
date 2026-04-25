import React, { useState, useRef } from 'react';
import styles from './ShapeSidebar.module.css';

const ShapeSidebar = ({
  shapes,
  selectedShapeIndices,
  onSelectShape,
  onRenameShape,
  onReorderShapes,
}) => {
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [wasDragging, setWasDragging] = useState(false);
  const listRef = useRef();

  const handleListMouseDown = (e) => {
    if (e.target !== e.currentTarget) return; // not on list
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsSelecting(true);
    setSelectionBox({ start: {x, y}, end: {x, y} });
  };

  const handleListMouseMove = (e) => {
    if (!isSelecting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelectionBox(prev => ({ ...prev, end: {x, y} }));
  };

  const handleListMouseUp = (e) => {
    if (!isSelecting) return;
    setIsSelecting(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = Math.min(selectionBox.start.x, selectionBox.end.x);
    const startY = Math.min(selectionBox.start.y, selectionBox.end.y);
    const endX = Math.max(selectionBox.start.x, selectionBox.end.x);
    const endY = Math.max(selectionBox.start.y, selectionBox.end.y);
    const dragDistance = Math.abs(selectionBox.end.x - selectionBox.start.x) + Math.abs(selectionBox.end.y - selectionBox.start.y);
    const selected = [];
    shapes.forEach((_, index) => {
      const item = listRef.current.children[index];
      const itemRect = item.getBoundingClientRect();
      const itemX = itemRect.left - rect.left;
      const itemY = itemRect.top - rect.top;
      const itemW = itemRect.width;
      const itemH = itemRect.height;
      if (itemX < endX && itemX + itemW > startX && itemY < endY && itemY + itemH > startY) {
        selected.push(index);
      }
    });
    if (dragDistance < 10) {
      // It's a click, handled by onClick
    } else {
      // Drag selection
      onSelectShape(selected, true);
    }
    setWasDragging(dragDistance >= 10);
    setSelectionBox(null);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h3>Shapes</h3>
        <p>Drag to reorder and select shapes here.</p>
      </div>

      <div
        className={styles.list}
        ref={listRef}
        onMouseDown={handleListMouseDown}
        onMouseMove={handleListMouseMove}
        onMouseUp={handleListMouseUp}
        style={{ position: 'relative' }}
      >
        {shapes.map((shape, index) => (
          <div
            key={shape.id ?? `${shape.type}-${index}`}
            className={`${styles.item} ${selectedShapeIndices.includes(index) ? styles.active : ''}`}
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
              if (fromIndex !== index) {
                onReorderShapes(fromIndex, index);
              }
            }}
            onClick={(e) => { if (!wasDragging) onSelectShape(index, e.shiftKey || e.ctrlKey || e.metaKey); setWasDragging(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectShape(index, false);
              }
            }}
          >
            <div className={styles.nameRow}>
              <input
                className={styles.nameInput}
                value={shape.name || ''}
                onChange={(e) => onRenameShape(index, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={styles.typeLabel}>{shape.type}</span>
            </div>
          </div>
        ))}
        {selectionBox && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(selectionBox.start.x, selectionBox.end.x),
              top: Math.min(selectionBox.start.y, selectionBox.end.y),
              width: Math.abs(selectionBox.end.x - selectionBox.start.x),
              height: Math.abs(selectionBox.end.y - selectionBox.start.y),
              backgroundColor: 'rgba(0,0,255,0.2)',
              border: '1px solid blue',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </aside>
  );
};

export default ShapeSidebar;
