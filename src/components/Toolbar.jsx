import React from 'react'
import styles from './Toolbar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMousePointer, faPenFancy, faSignature, faSlash, faSquare, faCircle, faFont } from '@fortawesome/free-solid-svg-icons'

const Toolbar = ({ onModeChange, mode }) => {
  const handleModeChange = (newMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  return (
    <section className={styles.toolbar} role="toolbar" aria-label="Drawing tools">
      <ul className={styles.toolbarList}>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'select' ? styles.active : ''}`}
            onClick={() => handleModeChange('select')}
            aria-label="Select tool"
            aria-pressed={mode === 'select'}
            title="Select Tool (V)"
          >
            <FontAwesomeIcon icon={faMousePointer} size="lg" />
            <span className={styles.hotkeyLabel}>Select (V)</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'freehand' ? styles.active : ''}`}
            onClick={() => handleModeChange('freehand')}
            aria-label="Freehand tool"
            aria-pressed={mode === 'freehand'}
            title="Freehand Tool (B)"
          >
            <FontAwesomeIcon icon={faPenFancy} size="lg" />
            <span className={styles.hotkeyLabel}>Freehand (B)</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'vectorPen' ? styles.active : ''}`}
            onClick={() => handleModeChange('vectorPen')}
            aria-label="Vector pen tool"
            aria-pressed={mode === 'vectorPen'}
            title="Vector Pen Tool (P)"
          >
            <FontAwesomeIcon icon={faSignature} size="lg" />
            <span className={styles.hotkeyLabel}>Vector Pen (P)</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'line' ? styles.active : ''}`}
            onClick={() => handleModeChange('line')}
            aria-label="Line tool"
            aria-pressed={mode === 'line'}
            title="Line Tool (L)"
          >
            <FontAwesomeIcon icon={faSlash} size="lg" />
            <span className={styles.hotkeyLabel}>Line (L)</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'rect' ? styles.active : ''}`}
            onClick={() => handleModeChange('rect')}
            aria-label="Rectangle tool"
            aria-pressed={mode === 'rect'}
            title="Rectangle Tool (R)"
          >
            <FontAwesomeIcon icon={faSquare} size="lg" />
            <span className={styles.hotkeyLabel}>Rectangle (R)</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'circle' ? styles.active : ''}`}
            onClick={() => handleModeChange('circle')}
            aria-label="Circle tool"
            aria-pressed={mode === 'circle'}
            title="Circle Tool (C)"
          >
            <FontAwesomeIcon icon={faCircle} size="lg" />
            <span className={styles.hotkeyLabel}>Circle (C)</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'text' ? styles.active : ''}`}
            onClick={() => handleModeChange('text')}
            aria-label="Text tool"
            aria-pressed={mode === 'text'}
            title="Text Tool (T)"
          >
            <FontAwesomeIcon icon={faFont} size="lg" />
            <span className={styles.hotkeyLabel}>Text (T)</span>
          </button>
        </li>
      </ul>
    </section>
  );
}

export default Toolbar