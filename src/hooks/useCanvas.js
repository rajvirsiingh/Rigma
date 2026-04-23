import { useState, useCallback } from "react";
import { useEffect } from "react";
import {
  getCoords,
  updateShapeForDrag,
  updateShapeForResize,
  calculateHoverDimensions,
  getShapeAtPoint,
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

  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState(null);
  const [altPressed, setAltPressed] = useState(false);
  const [hoveredShapeIndex, setHoveredShapeIndex] = useState(null);
  
  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [step, setStep] = useState(0);

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
    if (e.target.tagName === 'circle') return; // Ignore resize handles
    const { x, y } = getCoords(e);
    const hitShapeIndex = getShapeAtPoint(shapes, x, y);

    if (hitShapeIndex !== null) {
      e.stopPropagation();
      setSelectedShapeIndex(hitShapeIndex);
      setIsDragging(true);
      setIsResizing(false);
      setResizeCorner(null);
      setDragStart({ x, y });
    } else {
      clearSelection();
      setIsDragging(false);
      setIsResizing(false);
      setHoverDimensions(null);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCoords(e);

    if (mode === "select" && (isDragging || isResizing) && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      setShapes(prev =>
        prev.map((shape, i) =>
          i !== selectedShapeIndex
            ? shape
            : isResizing
            ? updateShapeForResize(shape, x, y, resizeCorner)
            : updateShapeForDrag(shape, dx, dy)
        )
      );
      if (isResizing) {
        const updatedShape = shapes[selectedShapeIndex];
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
      const dx = x - start.x;
      const dy = y - start.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      setHoverDimensions({
        x: start.x,
        y: start.y - r - 10,
        width: Math.round(r * 2),
        height: Math.round(r * 2),
      });
    }
  };

  const handleMouseUp = () => {
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
      const newShape = {
        type: "circle",
        name: getDefaultShapeName('circle', shapes),
        center: ds.circle.start,
        edge: ds.circle.current,
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
    setSelectedShapeIndex(i);
    setIsDragging(true);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleResizeStart = (e, i, corner) => {
    if (mode !== "select") return;
    e.stopPropagation();
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    setSelectedShapeIndex(i);
    setIsResizing(true);
    setResizeCorner(corner);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const selectShape = useCallback((index) => {
    setSelectedShapeIndex(index);
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

  const moveShape = useCallback((index, direction) => {
    if (index === null || index < 0 || index >= shapes.length) return;
    const newShapes = [...shapes];
    const [movedShape] = newShapes.splice(index, 1);
    const targetIndex = Math.max(
      0,
      Math.min(newShapes.length, index + (direction === 'forward' ? 1 : -1))
    );
    newShapes.splice(targetIndex, 0, movedShape);
    setSelectedShapeIndex(targetIndex);
    saveToHistory(newShapes);
  }, [shapes, saveToHistory]);

  const moveShapeForward = useCallback((index) => moveShape(index, 'forward'), [moveShape]);
  const moveShapeBackward = useCallback((index) => moveShape(index, 'backward'), [moveShape]);

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
          moveShapeBackward(selectedShapeIndex);
          return;
        } else if (e.key === '}' || (e.key === ']' && e.shiftKey)) {
          e.preventDefault();
          moveShapeForward(selectedShapeIndex);
          return;
        }
      }

      if (e.key === 'Alt') {
        setAltPressed(true);
      }

      if (selectedShapeIndex !== null) {
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
            i === selectedShapeIndex ? updateShapeForDrag(shape, dx, dy) : shape
          );
          setShapes(newShapes);
          saveToHistory(newShapes);
          return;
        }
      }

      if (selectedShapeIndex === null) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const newShapes = shapes.filter((_, i) => i !== selectedShapeIndex);
        setShapes(newShapes);
        saveToHistory(newShapes);
        setSelectedShapeIndex(null);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Alt') {
        setAltPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedShapeIndex, shapes, undo, redo, saveToHistory, moveShapeBackward, moveShapeForward]);

  const onShapeUpdate = useCallback((updatedShape) => {
    const updatedShapes = shapes.reduce((result, shape, i) => {
      if (i !== selectedShapeIndex) {
        result.push(shape);
      } else if (!isEmptyShape(updatedShape)) {
        result.push(updatedShape);
      }
      return result;
    }, []);

    setShapes(updatedShapes);
    saveToHistory(updatedShapes);
    if (isEmptyShape(updatedShape)) {
      setSelectedShapeIndex(null);
    }
  }, [shapes, selectedShapeIndex, saveToHistory]);

  const clearSelection = useCallback(() => {
    setSelectedShapeIndex(null);
  }, []);

  return {
    shapes,
    hoverDimensions,
    selectedShapeIndex,
    selectedShape: selectedShapeIndex !== null ? shapes[selectedShapeIndex] : null,
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
    altPressed,
    hoveredShapeIndex,
    setHoveredShapeIndex,
  };
};

export default useCanvas;