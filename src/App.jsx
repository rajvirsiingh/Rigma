import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import CanvasBoard from './components/CanvasBoard'
import Toolbar from './components/Toolbar'
import ShapeControls from './components/ShapeControls'
import ShapeSidebar from './components/ShapeSidebar'
import useCanvas from './hooks/useCanvas'
import { downloadAsPdf, downloadAsPng, downloadAsSvg } from './utils/exportUtils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

function App() {
  const [mode, setMode] = useState('freehand')
  const canvasData = useCanvas(mode)
  const imageInputRef = useRef(null)
  const svgElementRef = useRef(null)
  const hasLoadedInitialDrawingRef = useRef(false)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef(null)
  const [saveState, setSaveState] = useState({ type: 'idle', message: '' })
  const [drawingName, setDrawingName] = useState('')

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!downloadMenuRef.current?.contains(e.target)) {
        setDownloadMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImportImageClick = () => {
    imageInputRef.current?.click();
  };

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
    setDownloadMenuOpen(false);
  };

  const handleExportPng = async () => {
    const { width, height } = getBoardSize();
    await downloadAsPng(canvasData.shapes, width, height);
    setDownloadMenuOpen(false);
  };

  const handleExportPdf = async () => {
    const { width, height } = getBoardSize();
    await downloadAsPdf(canvasData.shapes, width, height);
    setDownloadMenuOpen(false);
  };

  const getErrorMessage = async (response, fallbackMessage) => {
    try {
      const data = await response.json()
      return data.message || fallbackMessage
    } catch (_error) {
      return fallbackMessage
    }
  }

  const handleSaveShapes = async () => {
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
      setSaveState({ type: 'success', message: `Saved "${data.name}"` })
      localStorage.setItem('drawingId', data._id)
      localStorage.setItem('drawingName', data.name)
    } catch (error) {
      console.error(error)
      setSaveState({ type: 'error', message: error.message || 'Save failed' })
    }
  }

  const handleSaveAsNew = async () => {
    const validName = drawingName.trim()
    if (!validName) {
      setSaveState({ type: 'error', message: 'Enter a file name first' })
      return
    }

    try {
      setSaveState({ type: 'info', message: 'Saving as new...' })
      const response = await fetch(`${API_BASE_URL}/save-as`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: validName, shapes: canvasData.shapes }),
      })

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to save drawing as new')
        throw new Error(message)
      }

      const data = await response.json()
      setSaveState({ type: 'success', message: `Saved new "${data.name}"` })
      localStorage.setItem('drawingId', data._id)
      localStorage.setItem('drawingName', data.name)
    } catch (error) {
      console.error(error)
      setSaveState({ type: 'error', message: error.message || 'Save failed' })
    }
  }

  const handleLoadShapes = async (drawingId) => {
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
  }

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
      setDrawingName(data.name || validName)
      localStorage.setItem('drawingId', data._id)
      localStorage.setItem('drawingName', data.name || validName)
      setSaveState({ type: 'success', message: `Loaded "${data.name}"` })
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
    handleLoadShapes(savedId)
  }, [])

  return (
    <div className="app">
      <div className="toolbar-container">
        <Toolbar onModeChange={handleModeChange} mode={mode} />
        <div className="action-bar">
          <input
            type="text"
            className="file-name-input"
            placeholder="File name"
            value={drawingName}
            onChange={(e) => setDrawingName(e.target.value)}
          />
          <button type="button" className="action-button" onClick={handleSaveShapes}>Save</button>
          <button type="button" className="action-button" onClick={handleSaveAsNew}>Save As New</button>
          <button type="button" className="action-button" onClick={handleLoadByName}>Load</button>
          <button type="button" className="action-button" onClick={canvasData.undo} disabled={!canvasData.canUndo}>Undo</button>
          <button type="button" className="action-button" onClick={canvasData.redo} disabled={!canvasData.canRedo}>Redo</button>
          <button type="button" className="action-button" onClick={handleImportImageClick}>Import Image</button>
          <div className="download-menu-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="action-button icon-button"
              onClick={() => setDownloadMenuOpen((prev) => !prev)}
              aria-label="Download options"
              title="Download options"
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>
            {downloadMenuOpen && (
              <div className="download-menu">
                <button type="button" className="download-option" onClick={handleExportPng}>Download PNG</button>
                <button type="button" className="download-option" onClick={handleExportSvg}>Download SVG</button>
                <button type="button" className="download-option" onClick={handleExportPdf}>Download PDF</button>
              </div>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageFileChange}
          />
          {saveState.message && (
            <span className={`status-message status-${saveState.type}`}>{saveState.message}</span>
          )}
        </div>
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
