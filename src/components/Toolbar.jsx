import React from 'react'
import pen from "../assets/pen-icon.png"
import square from "../assets/square-icon.png"
import roundedSquare from "../assets/square-rounded-icon.png"
import circle from "../assets/circle-icon.png"
import styles from './Toolbar.module.css'
import line from '../assets/line-icon.png'

const Toolbar = ({setMode}) => {
  return (
    <section className={styles.toolbar}>
        
        <ul className='icon-list'>
             <li className={styles.icon} onClick={()=>setMode('select')}>
                Select
            </li>
            <li className={styles.icon} onClick={()=>setMode('pen')}>
                <img src={pen} alt="pen icon" />
            </li>
            <li className={styles.icon} onClick={()=>setMode('line')}>
                <img src={line} alt="line icon"/>
            </li>
            <li className={styles.icon} onClick={()=>setMode('rect')}>
                <img src={square} alt="square icon" />
            </li>
            <li className={styles.icon} onClick={()=>setMode('rect')}>
                <img src={roundedSquare} alt="Rounded Square Icon" />
            </li>
            <li className={styles.icon} onClick={()=>setMode('circle')}>
                <img src={circle} alt="Circle Icon" />
            </li>
            
        </ul>
    </section>
  )
}

export default Toolbar