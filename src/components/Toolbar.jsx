import React from 'react'
import pen from "../assets/pen-icon.png"
import square from "../assets/square-icon.png"
import roundedSquare from "../assets/square-rounded-icon.png"
import circle from "../assets/circle-icon.png"
import styles from './Toolbar.module.css'
import line from '../assets/line-icon.png'

const Toolbar = ({onModeChange}) => {
  const handleModeChange = (newMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  return (
    <section className={styles.toolbar} role="toolbar" aria-label="Drawing tools">
      <ul className="icon-list">
        <li>
          <button
            type="button"
            className={styles.icon}
            onClick={() => handleModeChange('select')}
            aria-label="Select tool"
          >
            Select
          </button>
        </li>
        <li>
          <button
            type="button"
            className={styles.icon}
            onClick={() => handleModeChange('pen')}
            aria-label="Pen tool"
          >
            <img src={pen} alt="Pen tool" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={styles.icon}
            onClick={() => handleModeChange('line')}
            aria-label="Line tool"
          >
            <img src={line} alt="Line tool" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={styles.icon}
            onClick={() => handleModeChange('rect')}
            aria-label="Rectangle tool"
          >
            <img src={square} alt="Rectangle tool" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={styles.icon}
            onClick={() => handleModeChange('circle')}
            aria-label="Circle tool"
          >
            <img src={circle} alt="Circle tool" />
          </button>
        </li>
      </ul>
    </section>
  );
}

export default Toolbar