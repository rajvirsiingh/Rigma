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
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef(null)

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

  return (
    <div className="app">
      <div className="toolbar-container">
        <Toolbar onModeChange={handleModeChange} mode={mode} />
        <div className="action-bar">
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
