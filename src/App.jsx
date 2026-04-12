import { useState } from 'react'
import './App.css'
import CanvasBoard from './components/CanvasBoard'
import Toolbar from './components/Toolbar'
function App() {
  const [mode, setMode] = useState('pen')

  return (
    <>
      <input type="color" name="color" id="color" />
      <Toolbar setMode={setMode}/>
      <CanvasBoard mode={mode}/>
    </>
  )
}

export default App
