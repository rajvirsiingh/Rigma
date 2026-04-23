import { useState } from 'react'
import './App.css'
import CanvasBoard from './components/CanvasBoard'
import Toolbar from './components/Toolbar'
import ShapeControls from './components/ShapeControls'
import ShapeSidebar from './components/ShapeSidebar'
import useCanvas from './hooks/useCanvas'

function App() {
  const [mode, setMode] = useState('pen')
  const canvasData = useCanvas(mode)

  const handleModeChange = (newMode) => {
    setMode(newMode);
    canvasData.clearSelection();
  };

  return (
    <div className="app">
      <div className="toolbar-container">
        <Toolbar onModeChange={handleModeChange} mode={mode} />
      </div>
      <div className="main-content">
        <ShapeSidebar
          shapes={canvasData.shapes}
          selectedShapeIndex={canvasData.selectedShapeIndex}
          onSelectShape={canvasData.selectShape}
          onRenameShape={canvasData.renameShape}
          onMoveForward={canvasData.moveShapeForward}
          onMoveBackward={canvasData.moveShapeBackward}
        />
        <CanvasBoard {...canvasData} />
        <ShapeControls
          selectedShape={canvasData.selectedShape}
          onShapeUpdate={canvasData.onShapeUpdate}
        />
      </div>
    </div>
  )
}

export default App
