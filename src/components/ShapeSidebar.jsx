import React from 'react';
import styles from './ShapeSidebar.module.css';

const ShapeSidebar = ({
  shapes,
  selectedShapeIndex,
  onSelectShape,
  onRenameShape,
  onMoveForward,
  onMoveBackward,
}) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h3>Shapes</h3>
        <p>Drag order and rename shapes here.</p>
      </div>

      <div className={styles.list}>
        {shapes.map((shape, index) => (
          <div
            key={shape.id ?? `${shape.type}-${index}`}
            className={`${styles.item} ${selectedShapeIndex === index ? styles.active : ''}`}
            onClick={() => onSelectShape(index)}
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

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBackward(index);
                }}
                disabled={index === 0}
              >
                ←
              </button>
              <button
                type="button"
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveForward(index);
                }}
                disabled={index === shapes.length - 1}
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ShapeSidebar;
