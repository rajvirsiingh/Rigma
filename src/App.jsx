import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import CanvasBoard from './components/CanvasBoard'
import Toolbar from './components/Toolbar'
import ActionBar from './components/ActionBar'
import ShapeControls from './components/ShapeControls'
import ShapeSidebar from './components/ShapeSidebar'
import useCanvas from './hooks/useCanvas'
import { downloadAsPdf, downloadAsPng, downloadAsSvg } from './utils/exportUtils'

function App() {
  const [mode, setMode] = useState('freehand')
  const canvasData = useCanvas(mode)
  const svgElementRef = useRef(null)
  const hasLoadedInitialDrawingRef = useRef(false)
  const [saveState, setSaveState] = useState({ type: 'idle', message: '' })
  const [drawingName, setDrawingName] = useState('')
  const [savedDrawings, setSavedDrawings] = useState([])

  const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/drawings').trim()

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

  const fetchSavedDrawings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/names`)
      if (!response.ok) return
      const data = await response.json()
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
      setSavedDrawings(items)
    } catch {
      setSavedDrawings([])
    }
  }, [API_BASE_URL])

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await canvasData.addImageShape(file);
    } catch (error) {
      console.error("Image import failed", error);
    } finally {
      e.target.value = "";
    }
  };

  const getBoardSize = () => {
    const svg = svgElementRef.current;
    if (!svg) return { width: 1200, height: 800 };
    const width = Math.max(1, Math.round(svg.clientWidth || svg.viewBox?.baseVal?.width || 1200));
    const height = Math.max(1, Math.round(svg.clientHeight || svg.viewBox?.baseVal?.height || 800));
    return { width, height };
  };

  const handleExportSvg = () => {
    const { width, height } = getBoardSize();
    downloadAsSvg(canvasData.shapes, width, height);
  };

  const handleExportPng = async () => {
    const { width, height } = getBoardSize();
    await downloadAsPng(canvasData.shapes, width, height);
  };

  const handleExportPdf = async () => {
    const { width, height } = getBoardSize();
    await downloadAsPdf(canvasData.shapes, width, height);
  };

  const getErrorMessage = async (response, fallbackMessage) => {
    try {
      const data = await response.json()
      return data.message || fallbackMessage
    } catch {
      return fallbackMessage
    }
  }

  const handleSaveShapes = useCallback(async () => {
    const validName = drawingName.trim()
    if (!validName) {
      setSaveState({ type: 'error', message: 'Enter a file name first' })
      return
    }

    try {
      setSaveState({ type: 'info', message: 'Saving...' })
      const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: validName, shapes: canvasData.shapes }),
      })

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to save drawing')
        throw new Error(message)
      }

      const data = await response.json()
      const savedName = data.name || validName
      setSaveState({ type: 'success', message: `Saved "${savedName}"` })
      localStorage.setItem('drawingId', data._id)
      localStorage.setItem('drawingName', savedName)
      setDrawingName(savedName)
      fetchSavedDrawings()
    } catch (error) {
      console.error(error)
      setSaveState({ type: 'error', message: error.message || 'Save failed' })
    }
  }, [API_BASE_URL, canvasData.shapes, drawingName, fetchSavedDrawings])

  const handleSaveAsNew = async () => {
    const validName = drawingName.trim()
    if (!validName) {
      setSaveState({ type: 'error', message: 'Enter a file name first' })
      return
    }

    try {
      setSaveState({ type: 'info', message: 'Saving as new...' })
      let response = await fetch(`${API_BASE_URL}/save-as`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: validName, shapes: canvasData.shapes }),
      })

      if (response.status === 409) {
        const shouldReplace = window.confirm(
          `A drawing named "${validName}" already exists. Replace it?`
        )
        if (!shouldReplace) {
          setSaveState({ type: 'info', message: 'Save As cancelled' })
          return
        }

        response = await fetch(`${API_BASE_URL}/save-as`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: validName,
            shapes: canvasData.shapes,
            replaceExisting: true,
          }),
        })
      }

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to save drawing as new')
        throw new Error(message)
      }

      const data = await response.json()
      const savedName = data.name || validName
      setSaveState({ type: 'success', message: `Saved new "${savedName}"` })
      localStorage.setItem('drawingId', data._id)
      localStorage.setItem('drawingName', savedName)
      setDrawingName(savedName)
      fetchSavedDrawings()
    } catch (error) {
      console.error(error)
      setSaveState({ type: 'error', message: error.message || 'Save failed' })
    }
  }

  useEffect(() => {
    const handleSaveShortcut = (e) => {
      const key = e.key?.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && key === 's') {
        e.preventDefault()
        handleSaveShapes()
      }
    }

    window.addEventListener('keydown', handleSaveShortcut)
    return () => window.removeEventListener('keydown', handleSaveShortcut)
  }, [handleSaveShapes])

  const handleLoadShapes = useCallback(async (drawingId) => {
    try {
      setSaveState({ type: 'info', message: 'Loading...' })
      const endpoint = drawingId ? `${API_BASE_URL}/${drawingId}` : `${API_BASE_URL}/latest`
      const response = await fetch(endpoint)

      if (!response.ok) {
        if (response.status === 404) {
          canvasData.replaceShapes([])
          setSaveState({ type: 'info', message: 'No saved drawings yet' })
          return
        }
        const message = await getErrorMessage(response, 'Failed to load drawing')
        throw new Error(message)
      }

      const data = await response.json()
      canvasData.replaceShapes(data.shapes || [])
      setDrawingName(data.name || '')
      localStorage.setItem('drawingId', data._id)
      localStorage.setItem('drawingName', data.name || '')
      setSaveState({ type: 'success', message: `Loaded "${data.name || data._id}"` })
    } catch (error) {
      console.error(error)
      setSaveState({ type: 'error', message: error.message || 'Load failed' })
    }
  }, [API_BASE_URL, canvasData])

  const handleLoadByName = async () => {
    const validName = drawingName.trim()
    if (!validName) {
      setSaveState({ type: 'error', message: 'Enter a file name first' })
      return
    }

    try {
      setSaveState({ type: 'info', message: 'Loading...' })
      const response = await fetch(`${API_BASE_URL}/name/${encodeURIComponent(validName)}`)

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to load drawing')
        throw new Error(message)
      }

      const data = await response.json()
      canvasData.replaceShapes(data.shapes || [])
      const loadedName = data.name || validName
      setDrawingName(loadedName)
      localStorage.setItem('drawingId', data._id)
      localStorage.setItem('drawingName', loadedName)
      setSaveState({ type: 'success', message: `Loaded "${loadedName}"` })
    } catch (error) {
      console.error(error)
      setSaveState({ type: 'error', message: error.message || 'Load failed' })
    }
  }

  useEffect(() => {
    if (hasLoadedInitialDrawingRef.current) return
    hasLoadedInitialDrawingRef.current = true

    const savedId = localStorage.getItem('drawingId')
    const savedName = localStorage.getItem('drawingName') || ''
    setDrawingName(savedName)
    fetchSavedDrawings()
    handleLoadShapes(savedId)
  }, [fetchSavedDrawings, handleLoadShapes])

  return (
    <div className="app">
      <div className="toolbar-container">
        <Toolbar onModeChange={handleModeChange} mode={mode} />
        <ActionBar
          drawingName={drawingName}
          onDrawingNameChange={setDrawingName}
          onSave={handleSaveShapes}
          onSaveAsNew={handleSaveAsNew}
          savedDrawings={savedDrawings}
          onLoadByName={handleLoadByName}
          onLoadShapes={handleLoadShapes}
          onUndo={canvasData.undo}
          onRedo={canvasData.redo}
          canUndo={canvasData.canUndo}
          canRedo={canvasData.canRedo}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onExportPdf={handleExportPdf}
          onImageFileChange={handleImageFileChange}
          saveState={saveState}
        />
      </div>
      <div className="main-content">
        <ShapeSidebar
          shapes={canvasData.shapes}
          selectedShapeIndices={canvasData.selectedShapeIndices}
          onSelectShape={canvasData.selectShape}
          onRenameShape={canvasData.renameShape}
          onReorderShapes={canvasData.reorderShapes}
        />
        <CanvasBoard {...canvasData} mode={mode} onSvgReady={(svgEl) => { svgElementRef.current = svgEl; }} />
        <ShapeControls
          selectedShape={canvasData.selectedShape}
          onShapeUpdate={canvasData.onShapeUpdate}
        />
      </div>
    </div>
  )
}

export default App
