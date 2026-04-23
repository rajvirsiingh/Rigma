import React from 'react'
import styles from './Toolbar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMousePointer, faPenFancy, faSlash, faSquare, faCircle } from '@fortawesome/free-solid-svg-icons'

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
          >
            <FontAwesomeIcon icon={faMousePointer} size="lg" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'pen' ? styles.active : ''}`}
            onClick={() => handleModeChange('pen')}
            aria-label="Pen tool"
            aria-pressed={mode === 'pen'}
          >
            <FontAwesomeIcon icon={faPenFancy} size="lg" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'line' ? styles.active : ''}`}
            onClick={() => handleModeChange('line')}
            aria-label="Line tool"
            aria-pressed={mode === 'line'}
          >
            <FontAwesomeIcon icon={faSlash} size="lg" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'rect' ? styles.active : ''}`}
            onClick={() => handleModeChange('rect')}
            aria-label="Rectangle tool"
            aria-pressed={mode === 'rect'}
          >
            <FontAwesomeIcon icon={faSquare} size="lg" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`${styles.toolbarButton} ${mode === 'circle' ? styles.active : ''}`}
            onClick={() => handleModeChange('circle')}
            aria-label="Circle tool"
            aria-pressed={mode === 'circle'}
          >
            <FontAwesomeIcon icon={faCircle} size="lg" />
          </button>
        </li>
      </ul>
    </section>
  );
}

export default Toolbar