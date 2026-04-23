import React, { useState, useEffect } from 'react';
import styles from './ShapeControls.module.css';

const ShapeControls = ({ selectedShape, onShapeUpdate }) => {
  const [properties, setProperties] = useState({
    strokeColor: '#000000',
    fillColor: 'transparent',
    strokeWidth: 2,
    borderRadius: {
      tl: 0,
      tr: 0,
      br: 0,
      bl: 0,
    },
    width: 0,
    height: 0,
    radiusX: 0,
    radiusY: 0,
  });

  useEffect(() => {
    if (selectedShape) {
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
        setProperties({ ...baseProperties, width, height, radiusX: 0, radiusY: 0 });
      } else if (selectedShape.type === 'circle') {
        const radiusX = selectedShape.radiusX ?? Math.abs((selectedShape.edge?.x ?? selectedShape.center.x) - selectedShape.center.x);
        const radiusY = selectedShape.radiusY ?? Math.abs((selectedShape.edge?.y ?? selectedShape.center.y) - selectedShape.center.y);
        setProperties({ ...baseProperties, radiusX, radiusY, width: radiusX * 2, height: radiusY * 2 });
      } else {
        setProperties(baseProperties);
      }
    }
  }, [selectedShape]);

  const handlePropertyChange = (property, value) => {
    let updatedProperties;

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

    setProperties(updatedProperties);

    if (selectedShape && onShapeUpdate) {
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
      }

      onShapeUpdate(updatedShape);
    }
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