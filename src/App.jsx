import { useState, useEffect, useCallback } from 'react'
import './App.css'
import CanvasBoard from './components/CanvasBoard'
import Toolbar from './components/Toolbar'
import ShapeControls from './components/ShapeControls'
import ShapeSidebar from './components/ShapeSidebar'
import useCanvas from './hooks/useCanvas'

function App() {
  const [mode, setMode] = useState('freehand')
  const canvasData = useCanvas(mode)

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    canvasData.clearSelection();
  }, [canvasData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      const keyToMode = {
        'v': 'select',
        'p': 'vectorPen',
        'b': 'freehand',
        'l': 'line',
        'r': 'rect',
        'c': 'circle',
        't': 'text',
      };

      if (keyToMode[key]) {
        e.preventDefault();
        handleModeChange(keyToMode[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleModeChange]);

  return (
    <div className="app">
      <div className="toolbar-container">
        <Toolbar onModeChange={handleModeChange} mode={mode} />
      </div>
      <div className="main-content">
        <ShapeSidebar
          shapes={canvasData.shapes}
          selectedShapeIndices={canvasData.selectedShapeIndices}
          onSelectShape={canvasData.selectShape}
          onRenameShape={canvasData.renameShape}
          onReorderShapes={canvasData.reorderShapes}
        />
        <CanvasBoard {...canvasData} mode={mode} />
        <ShapeControls
          selectedShape={canvasData.selectedShape}
          onShapeUpdate={canvasData.onShapeUpdate}
        />
      </div>
    </div>
  )
}

export default App
