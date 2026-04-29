import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

const buildPolylinePath = (points = []) => {
  if (!points.length) return ''
  const [first, ...rest] = points
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(' ')}`
}

const buildVectorPath = (points = [], closed = false) => {
  if (!points.length) return ''
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const current = points[i]
    if (prev.outHandle || current.inHandle) {
      const cp1 = prev.outHandle || prev
      const cp2 = current.inHandle || current
      d += ` C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${current.x} ${current.y}`
    } else {
      d += ` L ${current.x} ${current.y}`
    }
  }

  if (closed && points.length > 2) {
    const last = points[points.length - 1]
    const first = points[0]
    if (last.outHandle || first.inHandle) {
      const cp1 = last.outHandle || last
      const cp2 = first.inHandle || first
      d += ` C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${first.x} ${first.y}`
    } else {
      d += ` L ${first.x} ${first.y}`
    }
    d += ' Z'
  }

  return d
}

const ThumbnailPreview = ({ shapes }) => (
  <svg className="drawing-thumbnail" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">
    {shapes.map((shape, index) => {
      if (shape.type === 'line') {
        return <line key={index} x1={shape.start?.x || 0} y1={shape.start?.y || 0} x2={shape.end?.x || 0} y2={shape.end?.y || 0} stroke={shape.strokeColor || '#000'} strokeWidth={shape.strokeWidth || 2} />
      }
      if (shape.type === 'rectangle') {
        const x = Math.min(shape.start?.x || 0, shape.end?.x || 0)
        const y = Math.min(shape.start?.y || 0, shape.end?.y || 0)
        const width = Math.abs((shape.end?.x || 0) - (shape.start?.x || 0))
        const height = Math.abs((shape.end?.y || 0) - (shape.start?.y || 0))
        return <rect key={index} x={x} y={y} width={width} height={height} fill={shape.fillColor || 'transparent'} stroke={shape.strokeColor || '#000'} strokeWidth={shape.strokeWidth || 1} />
      }
      if (shape.type === 'circle') {
        return <ellipse key={index} cx={shape.center?.x || 0} cy={shape.center?.y || 0} rx={shape.radiusX || 0} ry={shape.radiusY || 0} fill={shape.fillColor || 'transparent'} stroke={shape.strokeColor || '#000'} strokeWidth={shape.strokeWidth || 1} />
      }
      if (shape.type === 'text') {
        return <text key={index} x={shape.x || 0} y={shape.y || 0} fill={shape.fillColor || '#000'} fontSize={Math.max(12, shape.fontSize || 20)} fontFamily={shape.fontFamily || 'Arial'}>{shape.text || 'Text'}</text>
      }
      if (shape.type === 'image') {
        return <image key={index} href={shape.href} x={shape.x || 0} y={shape.y || 0} width={shape.width || 60} height={shape.height || 60} />
      }
      if (shape.type === 'vectorPen') {
        return <path key={index} d={buildVectorPath(shape.points, shape.closed)} fill={shape.closed ? (shape.fillColor || 'transparent') : 'none'} stroke={shape.strokeColor || '#000'} strokeWidth={shape.strokeWidth || 2} />
      }
      if (shape.type === 'freehand') {
        return <path key={index} d={buildPolylinePath(shape.points)} fill="none" stroke={shape.strokeColor || '#000'} strokeWidth={shape.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" />
      }
      return null
    })}
  </svg>
)

const ActionBar = ({
  drawingName,
  onDrawingNameChange,
  onSave,
  onSaveAsNew,
  savedDrawings,
  onLoadByName,
  onLoadShapes,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onImageFileChange,
  saveState,
}) => {
  const imageInputRef = useRef(null)
  const downloadMenuRef = useRef(null)
  const loadMenuRef = useRef(null)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [loadMenuOpen, setLoadMenuOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!downloadMenuRef.current?.contains(e.target)) {
        setDownloadMenuOpen(false)
      }
      if (!loadMenuRef.current?.contains(e.target)) {
        setLoadMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="action-bar">
      <input
        type="text"
        className="file-name-input"
        placeholder="File name"
        value={drawingName}
        onChange={(e) => onDrawingNameChange(e.target.value)}
      />
      <button type="button" className="action-button" onClick={onSave}>Save</button>
      <button type="button" className="action-button" onClick={onSaveAsNew}>Save As New</button>
      <div className="load-menu-wrapper" ref={loadMenuRef}>
        <button type="button" className="action-button" onClick={() => setLoadMenuOpen((prev) => !prev)}>
          Load Drawing
        </button>
        {loadMenuOpen && (
          <div className="load-menu">
            <button type="button" className="load-option-basic" onClick={() => { onLoadByName(); setLoadMenuOpen(false) }}>
              Load by typed name
            </button>
            {savedDrawings.length === 0 && <div className="load-empty">No saved drawings yet</div>}
            {savedDrawings.map((drawing) => (
              <button
                type="button"
                key={drawing._id}
                className="load-option-card"
                onClick={() => { onLoadShapes(drawing._id); setLoadMenuOpen(false) }}
              >
                <ThumbnailPreview shapes={drawing.thumbnailShapes || []} />
                <span className="load-option-name">{drawing.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="action-button" onClick={onUndo} disabled={!canUndo}>Undo</button>
      <button type="button" className="action-button" onClick={onRedo} disabled={!canRedo}>Redo</button>
      <button type="button" className="action-button" onClick={() => imageInputRef.current?.click()}>Import Image</button>
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
            <button type="button" className="download-option" onClick={() => { onExportPng(); setDownloadMenuOpen(false) }}>Download PNG</button>
            <button type="button" className="download-option" onClick={() => { onExportSvg(); setDownloadMenuOpen(false) }}>Download SVG</button>
            <button type="button" className="download-option" onClick={() => { onExportPdf(); setDownloadMenuOpen(false) }}>Download PDF</button>
          </div>
        )}
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onImageFileChange}
      />
      {saveState.message && <span className={`status-message status-${saveState.type}`}>{saveState.message}</span>}
    </div>
  )
}

export default ActionBar
