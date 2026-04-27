import React, { useMemo } from 'react';
import styles from './ShapeControls.module.css';

const ShapeControls = ({ selectedShape, onShapeUpdate }) => {
  const properties = useMemo(() => {
    if (!selectedShape) return null;

    const baseProperties = {
      strokeColor: selectedShape.strokeColor || '#000000',
      fillColor: selectedShape.fillColor && selectedShape.fillColor !== 'transparent' && selectedShape.fillColor !== 'none' ? selectedShape.fillColor : '#ffffff',
      strokeWidth: selectedShape.strokeWidth || 2,
      borderRadius: selectedShape.borderRadius || {
        tl: 0,
        tr: 0,
        br: 0,
        bl: 0,
      },
    };

    if (selectedShape.type === 'rectangle') {
      const width = Math.abs(selectedShape.end.x - selectedShape.start.x);
      const height = Math.abs(selectedShape.end.y - selectedShape.start.y);
      return { ...baseProperties, width, height, radiusX: 0, radiusY: 0 };
    } else if (selectedShape.type === 'circle') {
      const radiusX = selectedShape.radiusX ?? Math.abs((selectedShape.edge?.x ?? selectedShape.center.x) - selectedShape.center.x);
      const radiusY = selectedShape.radiusY ?? Math.abs((selectedShape.edge?.y ?? selectedShape.center.y) - selectedShape.center.y);
      return { ...baseProperties, radiusX, radiusY, width: radiusX * 2, height: radiusY * 2 };
    } else if (selectedShape.type === 'text') {
      return {
        ...baseProperties,
        text: selectedShape.text || '',
        fontSize: selectedShape.fontSize || 24,
        fontFamily: selectedShape.fontFamily || 'Arial',
        textAlign: selectedShape.textAlign || 'left',
        rotation: selectedShape.rotation || 0,
        fillColor: selectedShape.fillColor || '#000000',
      };
    } else if (selectedShape.type === 'image') {
      const crop = selectedShape.crop || { x: 0, y: 0, width: 1, height: 1 };
      return {
        ...baseProperties,
        width: selectedShape.width || 0,
        height: selectedShape.height || 0,
        cropX: Math.round(crop.x * 100),
        cropY: Math.round(crop.y * 100),
        cropWidth: Math.round(crop.width * 100),
        cropHeight: Math.round(crop.height * 100),
      };
    } else {
      return baseProperties;
    }
  }, [selectedShape]);

  const handlePropertyChange = (property, value) => {
    if (!selectedShape || !onShapeUpdate) return;

    let updatedProperties = { ...properties };

    if (property.startsWith('borderRadius.')) {
      const key = property.split('.')[1];
      updatedProperties = {
        ...properties,
        borderRadius: {
          ...properties.borderRadius,
          [key]: value,
        },
      };
    } else if (property === 'width' || property === 'height') {
      updatedProperties = { ...properties, [property]: value };
    } else if (property === 'radiusX') {
      updatedProperties = { ...properties, radiusX: value, width: value * 2 };
    } else if (property === 'radiusY') {
      updatedProperties = { ...properties, radiusY: value, height: value * 2 };
    } else {
      updatedProperties = { ...properties, [property]: value };
    }

    let updatedShape = { ...selectedShape, ...updatedProperties };

    if (selectedShape.type === 'rectangle' && (property === 'width' || property === 'height')) {
      const { start, end } = selectedShape;
      const left = Math.min(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const right = Math.max(start.x, end.x);
      const bottom = Math.max(start.y, end.y);

      let newStart = { ...start };
      let newEnd = { ...end };

      if (property === 'width') {
        const newRight = left + value;
        if (start.x === right) newStart.x = newRight; else newEnd.x = newRight;
      } else if (property === 'height') {
        const newBottom = top + value;
        if (start.y === bottom) newStart.y = newBottom; else newEnd.y = newBottom;
      }

      updatedShape = { ...updatedShape, start: newStart, end: newEnd };
    } else if (selectedShape.type === 'circle' && (property === 'radiusX' || property === 'radiusY')) {
      updatedShape = {
        ...updatedShape,
        [property]: value,
      };
    } else if (selectedShape.type === 'text' && ['text', 'fontSize', 'fontFamily', 'textAlign', 'rotation', 'fillColor'].includes(property)) {
      updatedShape = {
        ...updatedShape,
        [property]: value,
      };
    } else if (selectedShape.type === "image" && (property === "width" || property === "height")) {
      updatedShape = {
        ...updatedShape,
        [property]: Math.max(1, value),
      };
    } else if (selectedShape.type === "image" && ["cropX", "cropY", "cropWidth", "cropHeight"].includes(property)) {
      const nextCrop = {
        x: Math.max(0, Math.min(99, property === "cropX" ? value : properties.cropX)) / 100,
        y: Math.max(0, Math.min(99, property === "cropY" ? value : properties.cropY)) / 100,
        width: Math.max(1, Math.min(100, property === "cropWidth" ? value : properties.cropWidth)) / 100,
        height: Math.max(1, Math.min(100, property === "cropHeight" ? value : properties.cropHeight)) / 100,
      };
      nextCrop.width = Math.min(nextCrop.width, 1 - nextCrop.x);
      nextCrop.height = Math.min(nextCrop.height, 1 - nextCrop.y);
      updatedShape = {
        ...updatedShape,
        crop: nextCrop,
      };
    }

    onShapeUpdate(updatedShape);
  };

  if (!selectedShape) {
    return (
      <div className={styles.controls}>
        <h3>Shape Properties</h3>
        <p>Select a shape to edit its properties</p>
      </div>
    );
  }

  return (
    <div className={styles.controls}>
      <h3>Shape Properties</h3>
      {selectedShape.type !== "image" && (
        <>
          <div className={styles.propertyGroup}>
            <label>
              Stroke Color:
              <input
                type="color"
                value={properties.strokeColor}
                onChange={(e) => handlePropertyChange('strokeColor', e.target.value)}
              />
            </label>
          </div>

          <div className={styles.propertyGroup}>
            <label>
              Fill Color:
              <input
                type="color"
                value={properties.fillColor}
                onChange={(e) => handlePropertyChange('fillColor', e.target.value)}
              />
            </label>
          </div>
        </>
      )}

      {selectedShape.type === 'text' ? (
        <>
          <div className={styles.propertyGroup}>
            <label>
              Text:
              <input
                type="text"
                value={properties.text}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
              />
            </label>
          </div>

          <div className={styles.propertyGroup}>
            <label>
              Font Size:
              <input
                type="number"
                min="6"
                value={properties.fontSize}
                onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 6)}
              />
            </label>
          </div>

          <div className={styles.propertyGroup}>
            <label>
              Font Family:
              <select
                value={properties.fontFamily}
                onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>
          </div>

          <div className={styles.propertyGroup}>
            <label>
              Alignment:
              <select
                value={properties.textAlign}
                onChange={(e) => handlePropertyChange('textAlign', e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>

          <div className={styles.propertyGroup}>
            <label>
              Rotation:
              <input
                type="number"
                value={properties.rotation}
                onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value) || 0)}
              />
            </label>
          </div>
        </>
      ) : selectedShape.type === "image" ? (
        <>
          <div className={styles.propertyGroup}>
            <label>
              Width:
              <input
                type="number"
                min="1"
                value={properties.width}
                onChange={(e) => handlePropertyChange('width', parseInt(e.target.value, 10) || 1)}
              />
            </label>
          </div>
          <div className={styles.propertyGroup}>
            <label>
              Height:
              <input
                type="number"
                min="1"
                value={properties.height}
                onChange={(e) => handlePropertyChange('height', parseInt(e.target.value, 10) || 1)}
              />
            </label>
          </div>
          <div className={styles.propertyGroup}>
            <h4>Crop</h4>
            <label>
              Left:
              <input
                type="range"
                min="0"
                max="99"
                value={properties.cropX}
                onChange={(e) => handlePropertyChange('cropX', parseInt(e.target.value, 10) || 0)}
              />
              <span>{properties.cropX}%</span>
            </label>
            <label>
              Top:
              <input
                type="range"
                min="0"
                max="99"
                value={properties.cropY}
                onChange={(e) => handlePropertyChange('cropY', parseInt(e.target.value, 10) || 0)}
              />
              <span>{properties.cropY}%</span>
            </label>
            <label>
              Width:
              <input
                type="range"
                min="1"
                max="100"
                value={properties.cropWidth}
                onChange={(e) => handlePropertyChange('cropWidth', parseInt(e.target.value, 10) || 1)}
              />
              <span>{properties.cropWidth}%</span>
            </label>
            <label>
              Height:
              <input
                type="range"
                min="1"
                max="100"
                value={properties.cropHeight}
                onChange={(e) => handlePropertyChange('cropHeight', parseInt(e.target.value, 10) || 1)}
              />
              <span>{properties.cropHeight}%</span>
            </label>
            <button
              type="button"
              onClick={() => onShapeUpdate({ ...selectedShape, crop: { x: 0, y: 0, width: 1, height: 1 } })}
            >
              Reset Crop
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.propertyGroup}>
            <label>
              Stroke Width:
              <input
                type="range"
                min="0"
                max="20"
                value={properties.strokeWidth}
                onChange={(e) => handlePropertyChange('strokeWidth', parseInt(e.target.value))}
              />
              <span>{properties.strokeWidth}px</span>
            </label>
          </div>
        </>
      )}

      {selectedShape.type === 'rectangle' && (
        <>
          <div className={styles.propertyGroup}>
            <label>
              Width:
              <input
                type="number"
                min="0"
                value={properties.width}
                onChange={(e) => handlePropertyChange('width', parseInt(e.target.value) || 0)}
              />
            </label>
          </div>

          <div className={styles.propertyGroup}>
            <label>
              Height:
              <input
                type="number"
                min="0"
                value={properties.height}
                onChange={(e) => handlePropertyChange('height', parseInt(e.target.value) || 0)}
              />
            </label>
          </div>
        </>
      )}

      {selectedShape.type === 'circle' && (
        <>
          <div className={styles.propertyGroup}>
            <label>
              Radius X:
              <input
                type="number"
                min="0"
                value={properties.radiusX}
                onChange={(e) => handlePropertyChange('radiusX', parseInt(e.target.value) || 0)}
              />
            </label>
          </div>

          <div className={styles.propertyGroup}>
            <label>
              Radius Y:
              <input
                type="number"
                min="0"
                value={properties.radiusY}
                onChange={(e) => handlePropertyChange('radiusY', parseInt(e.target.value) || 0)}
              />
            </label>
          </div>
        </>
      )}

      {selectedShape.type === 'rectangle' && (
        <div className={styles.propertyGroup}>
          <h4>Corner Radius</h4>
          {['tl', 'tr', 'br', 'bl'].map((corner) => {
            const label = {
              tl: 'Top Left',
              tr: 'Top Right',
              br: 'Bottom Right',
              bl: 'Bottom Left',
            }[corner];

            return (
              <label key={corner} style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                {label}:
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={properties.borderRadius[corner]}
                    onChange={(e) => handlePropertyChange(`borderRadius.${corner}`, parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={properties.borderRadius[corner]}
                    onChange={(e) => handlePropertyChange(`borderRadius.${corner}`, parseInt(e.target.value))}
                    style={{ width: '64px' }}
                  />
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className={styles.propertyGroup}>
        <p><strong>Shape Type:</strong> {selectedShape.type}</p>
      </div>
    </div>
  );
};

export default ShapeControls;