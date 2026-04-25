import { useState, useCallback } from "react";
import { useEffect } from "react";
import {
  getCoords,
  updateShapeForDrag,
  updateShapeForResize,
  calculateHoverDimensions,
  getShapeAtPoint,
  getBounds,
} from "../utils/canvasUtils";

const useCanvas = (mode) => {
  const [hoverDimensions, setHoverDimensions] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Consolidated drawing state
  const [drawingState, setDrawingState] = useState({
    pen: { points: [] },
    rect: { start: null, current: null },
    line: { start: null, current: null },
    circle: { start: null, current: null },
  });

  const [selectedShapeIndices, setSelectedShapeIndices] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState(null);
  const [altPressed, setAltPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [hoveredShapeIndex, setHoveredShapeIndex] = useState(null);
  
  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [step, setStep] = useState(0);

  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const getDefaultShapeName = (type, currentShapes) => {
    const prefix = type === 'rectangle' ? 'rectangle' : type === 'circle' ? 'circle' : type === 'line' ? 'line' : 'pen';
    const count = currentShapes.filter((shape) => shape.type === type).length + 1;
    return `${prefix}${count}`;
  };

  const isEmptyShape = (shape) => {
    const emptyFill = !shape.fillColor || shape.fillColor === 'transparent' || shape.fillColor === 'none';
    const zeroStroke = !shape.strokeWidth || shape.strokeWidth === 0;
    return emptyFill && zeroStroke;
  };

  const saveToHistory = useCallback((newShapes) => {
    const updatedHistory = history.slice(0, step + 1);
    setHistory([...updatedHistory, newShapes]);
    setStep(step + 1);
    setShapes(newShapes);
  }, [history, step]);

  const undo = useCallback(() => {
    if (step > 0) {
      const newStep = step - 1;
      setStep(newStep);
      setShapes(history[newStep]);
    }
  }, [step, history]);

  const redo = useCallback(() => {
    if (step < history.length - 1) {
      const newStep = step + 1;
      setStep(newStep);
      setShapes(history[newStep]);
    }
  }, [step, history]);

  const handleMouseDown = (e) => {
    if (isSelecting) return;
    if (mode === "select") return;
    const { x, y } = getCoords(e);
    setIsDrawing(true);
    setDrawingState(prev => ({
      ...prev,
      [mode]: mode === "pen" ? { points: [{ x, y }] } : { start: { x, y }, current: { x, y } },
    }));
  };

  const handleCanvasMouseDownCapture = (e) => {
    if (mode !== "select") return;
    if (e.target.tagName?.toLowerCase() === 'circle') return; // Ignore resize handles
    const { x, y } = getCoords(e);
    const hitShapeIndex = getShapeAtPoint(shapes, x, y);

    if (hitShapeIndex !== null) {
      e.stopPropagation();
      setSelectedShapeIndices([hitShapeIndex]);
      setIsDragging(true);
      setIsResizing(false);
      setResizeCorner(null);
      setDragStart({ x, y });
    } else {
      // Start selection box
      setIsSelecting(true);
      setSelectionBox({ start: { x, y }, end: { x, y } });
      setIsDragging(false);
      setIsResizing(false);
      setHoverDimensions(null);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCoords(e);

    if (isSelecting) {
      setSelectionBox(prev => ({ ...prev, end: { x, y } }));
      return;
    }

    if (mode === "select" && (isDragging || isResizing) && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      setShapes(prev =>
        prev.map((shape, i) =>
          !selectedShapeIndices.includes(i)
            ? shape
            : isResizing
            ? updateShapeForResize(shape, x, y, resizeCorner)
            : updateShapeForDrag(shape, dx, dy)
        )
      );
      if (isResizing) {
        const updatedShape = shapes[selectedShapeIndices[0]];
        if (updatedShape) setHoverDimensions(calculateHoverDimensions(updatedShape));
      }
      setDragStart({ x, y });
      return;
    }

    if (!isDrawing) return;

    setDrawingState(prev => {
      const newState = { ...prev };
      if (mode === "pen") {
        newState.pen.points = [...newState.pen.points, { x, y }];
      } else {
        newState[mode].current = { x, y };
      }
      return newState;
    });

    // Update hover dimensions for drawing
    if (mode === "line" && drawingState.line.start) {
      const start = drawingState.line.start;
      const dx = x - start.x;
      const dy = y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      setHoverDimensions({
        x: (start.x + x) / 2,
        y: (start.y + y) / 2 - 10,
        width: Math.round(length),
        height: null,
      });
    } else if (mode === "rect" && drawingState.rect.start) {
      const start = drawingState.rect.start;
      setHoverDimensions({
        x: Math.min(start.x, x),
        y: Math.min(start.y, y) - 10,
        width: Math.abs(x - start.x),
        height: Math.abs(y - start.y),
      });
    } else if (mode === "circle" && drawingState.circle.start) {
      const start = drawingState.circle.start;
      let currentX = x;
      let currentY = y;
      if (shiftPressed) {
        const dx = x - start.x;
        const dy = y - start.y;
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        currentX = start.x + Math.sign(dx || 1) * size;
        currentY = start.y + Math.sign(dy || 1) * size;
      }
      const width = Math.abs(currentX - start.x);
      const height = Math.abs(currentY - start.y);
      setHoverDimensions({
        x: Math.min(start.x, currentX),
        y: Math.min(start.y, currentY) - 10,
        width: Math.round(width),
        height: Math.round(height),
      });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      const startX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const startY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const endX = Math.max(selectionBox.start.x, selectionBox.end.x);
      const endY = Math.max(selectionBox.start.y, selectionBox.end.y);
      const selected = [];
      shapes.forEach((shape, index) => {
        const bounds = getBounds(shape);
        if (bounds.left < endX && bounds.right > startX && bounds.top < endY && bounds.bottom > startY) {
          selected.push(index);
        }
      });
      selectShape(selected);
      setSelectionBox(null);
      return;
    }

    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setHoverDimensions(null);

    const ds = drawingState;
    if (mode === "pen" && ds.pen.points.length) {
      const newShape = {
        type: "pen",
        name: getDefaultShapeName('pen', shapes),
        points: ds.pen.points,
        strokeColor: '#000000',
        fillColor: 'transparent',
        strokeWidth: 2,
      };
      saveToHistory([...shapes, newShape]);
      setDrawingState(prev => ({ ...prev, pen: { points: [] } }));
    } else if (mode === "rect" && ds.rect.start && ds.rect.current) {
      const newShape = {
        type: "rectangle",
        name: getDefaultShapeName('rectangle', shapes),
        start: ds.rect.start,
        end: ds.rect.current,
        strokeColor: '#000000',
        fillColor: '#d3d3d3',
        strokeWidth: 0,
        borderRadius: { tl: 0, tr: 0, br: 0, bl: 0 },
      };
      saveToHistory([...shapes, newShape]);
      setDrawingState(prev => ({ ...prev, rect: { start: null, current: null } }));
    } else if (mode === "line" && ds.line.start && ds.line.current) {
      const newShape = {
        type: "line",
        name: getDefaultShapeName('line', shapes),
        start: ds.line.start,
        end: ds.line.current,
        strokeColor: '#000000',
        fillColor: 'transparent',
        strokeWidth: 2,
      };
      saveToHistory([...shapes, newShape]);
      setDrawingState(prev => ({ ...prev, line: { start: null, current: null } }));
    } else if (mode === "circle" && ds.circle.start && ds.circle.current) {
      const start = ds.circle.start;
      let currentX = ds.circle.current.x;
      let currentY = ds.circle.current.y;
      if (shiftPressed) {
        const dx = currentX - start.x;
        const dy = currentY - start.y;
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        currentX = start.x + Math.sign(dx || 1) * size;
        currentY = start.y + Math.sign(dy || 1) * size;
      }
      const left = Math.min(start.x, currentX);
      const top = Math.min(start.y, currentY);
      const width = Math.abs(currentX - start.x);
      const height = Math.abs(currentY - start.y);
      const newShape = {
        type: "circle",
        name: getDefaultShapeName('circle', shapes),
        center: { x: left + width / 2, y: top + height / 2 },
        radiusX: width / 2,
        radiusY: height / 2,
        strokeColor: '#000000',
        fillColor: '#d3d3d3',
        strokeWidth: 0,
      };
      saveToHistory([...shapes, newShape]);
      setDrawingState(prev => ({ ...prev, circle: { start: null, current: null } }));
    }

    if (mode === "select" && (isDragging || isResizing)) {
      saveToHistory(shapes);
    }
  };

  const handleSelect = (e, i) => {
    if (mode !== "select") return;
    e.stopPropagation();
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    setSelectedShapeIndices([i]);
    setIsDragging(true);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleResizeStart = (e, i, corner) => {
    if (mode !== "select") return;
    e.stopPropagation();
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    setSelectedShapeIndices([i]);
    setIsResizing(true);
    setResizeCorner(corner);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const selectShape = useCallback((indexOrIndices, multi = false) => {
    if (Array.isArray(indexOrIndices)) {
      setSelectedShapeIndices(indexOrIndices);
    } else {
      if (multi) {
        setSelectedShapeIndices(prev => prev.includes(indexOrIndices) ? prev.filter(i => i !== indexOrIndices) : [...prev, indexOrIndices]);
      } else {
        setSelectedShapeIndices([indexOrIndices]);
      }
    }
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const renameShape = useCallback((index, name) => {
    const updatedShapes = shapes.map((shape, i) =>
      i === index ? { ...shape, name } : shape
    );
    setShapes(updatedShapes);
    saveToHistory(updatedShapes);
  }, [shapes, saveToHistory]);

  const moveShape = useCallback((direction) => {
    if (selectedShapeIndices.length === 0) return;
    const newShapes = [...shapes];
    const indices = [...selectedShapeIndices].sort((a,b) => a-b);
    if (direction === 'forward') {
      for (let i = indices.length - 1; i >= 0; i--) {
        const idx = indices[i];
        if (idx < shapes.length - 1) {
          [newShapes[idx], newShapes[idx + 1]] = [newShapes[idx + 1], newShapes[idx]];
          indices[i] = idx + 1;
        }
      }
    } else {
      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        if (idx > 0) {
          [newShapes[idx], newShapes[idx - 1]] = [newShapes[idx - 1], newShapes[idx]];
          indices[i] = idx - 1;
        }
      }
    }
    setShapes(newShapes);
    saveToHistory(newShapes);
    setSelectedShapeIndices(indices);
  }, [shapes, selectedShapeIndices, saveToHistory]);

  const moveShapeForward = useCallback(() => moveShape('forward'), [moveShape]);
  const moveShapeBackward = useCallback(() => moveShape('backward'), [moveShape]);

  const reorderShapes = useCallback((fromIndex, toIndex) => {
    const newShapes = [...shapes];
    const [moved] = newShapes.splice(fromIndex, 1);
    newShapes.splice(toIndex, 0, moved);
    setShapes(newShapes);
    saveToHistory(newShapes);
    setSelectedShapeIndices(prev => prev.map(i => {
      if (i === fromIndex) return toIndex;
      if (i > fromIndex && i <= toIndex) return i - 1;
      if (i < fromIndex && i >= toIndex) return i + 1;
      return i;
    }));
  }, [shapes, saveToHistory]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
          return;
        } else if (e.key === '{' || (e.key === '[' && e.shiftKey)) {
          e.preventDefault();
          moveShapeBackward();
          return;
        } else if (e.key === '}' || (e.key === ']' && e.shiftKey)) {
          e.preventDefault();
          moveShapeForward();
          return;
        }
      }

      if (e.key === 'Alt') {
        setAltPressed(true);
      }
      if (e.key === 'Shift') {
        setShiftPressed(true);
      }

      if (selectedShapeIndices.length > 0) {
        const moveAmount = 5;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') {
          dy = -moveAmount;
        } else if (e.key === 'ArrowDown') {
          dy = moveAmount;
        } else if (e.key === 'ArrowLeft') {
          dx = -moveAmount;
        } else if (e.key === 'ArrowRight') {
          dx = moveAmount;
        }
        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          const newShapes = shapes.map((shape, i) =>
            selectedShapeIndices.includes(i) ? updateShapeForDrag(shape, dx, dy) : shape
          );
          setShapes(newShapes);
          saveToHistory(newShapes);
          return;
        }
      }

      if (selectedShapeIndices.length === 0) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const newShapes = shapes.filter((_, i) => !selectedShapeIndices.includes(i));
        setShapes(newShapes);
        saveToHistory(newShapes);
        setSelectedShapeIndices([]);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Alt') {
        setAltPressed(false);
      }
      if (e.key === 'Shift') {
        setShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedShapeIndices, shapes, undo, redo, saveToHistory, moveShapeBackward, moveShapeForward]);

  const onShapeUpdate = useCallback((updatedShape) => {
    const updatedShapes = shapes.reduce((result, shape, i) => {
      if (!selectedShapeIndices.includes(i)) {
        result.push(shape);
      } else if (!isEmptyShape(updatedShape)) {
        result.push(updatedShape);
      }
      return result;
    }, []);

    setShapes(updatedShapes);
    saveToHistory(updatedShapes);
    if (isEmptyShape(updatedShape)) {
      setSelectedShapeIndices([]);
    }
  }, [shapes, selectedShapeIndices, saveToHistory]);

  const clearSelection = useCallback(() => {
    setSelectedShapeIndices([]);
  }, []);

  return {
    shapes,
    hoverDimensions,
    selectedShapeIndices,
    selectedShape: selectedShapeIndices.length > 0 ? shapes[selectedShapeIndices[0]] : null,
    drawingState,
    handleCanvasMouseDownCapture,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSelect,
    handleResizeStart,
    onShapeUpdate,
    clearSelection,
    selectShape,
    renameShape,
    moveShapeForward,
    moveShapeBackward,
    reorderShapes,
    altPressed,
    shiftPressed,
    hoveredShapeIndex,
    setHoveredShapeIndex,
    selectionBox,
  };
};

export default useCanvas;