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
import { getVectorSegmentHit } from "../utils/vectorPath";

const VECTOR_HIT_RADIUS = 8;

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const getVectorControlHit = (shape, point) => {
  if (!shape || shape.type !== "vectorPen") return null;
  for (let i = 0; i < shape.points.length; i += 1) {
    const anchor = shape.points[i];
    if (distance(anchor, point) <= VECTOR_HIT_RADIUS) {
      return { pointIndex: i, handle: "anchor" };
    }
    if (anchor.inHandle && distance(anchor.inHandle, point) <= VECTOR_HIT_RADIUS) {
      return { pointIndex: i, handle: "inHandle" };
    }
    if (anchor.outHandle && distance(anchor.outHandle, point) <= VECTOR_HIT_RADIUS) {
      return { pointIndex: i, handle: "outHandle" };
    }
  }
  return null;
};

const useCanvas = (mode) => {
  const [hoverDimensions, setHoverDimensions] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Consolidated drawing state
  const [drawingState, setDrawingState] = useState({
    freehand: { points: [] },
    vectorPen: { points: [], closed: false, draggingPointIndex: null },
    rect: { start: null, current: null },
    line: { start: null, current: null },
    circle: { start: null, current: null },
    text: { start: null, current: null },
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
  const [editingTextIndex, setEditingTextIndex] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [vectorEditDrag, setVectorEditDrag] = useState(null);
  const [activeVectorPoint, setActiveVectorPoint] = useState(null);

  const getDefaultShapeName = (type, currentShapes) => {
    const prefix = type === 'rectangle'
      ? 'rectangle'
      : type === 'circle'
      ? 'circle'
      : type === 'line'
      ? 'line'
      : type === 'text'
      ? 'text'
      : type === 'image'
      ? 'image'
      : type === 'vectorPen'
      ? 'vectorPath'
      : 'freehand';
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

    if (mode === "vectorPen") {
      const activeVectorShapeIndex = selectedShapeIndices.length === 1 ? selectedShapeIndices[0] : null;
      const activeVectorShape = activeVectorShapeIndex !== null ? shapes[activeVectorShapeIndex] : null;
      const controlHit = getVectorControlHit(activeVectorShape, { x, y });

      if (controlHit) {
        setActiveVectorPoint({ shapeIndex: activeVectorShapeIndex, pointIndex: controlHit.pointIndex });
        setVectorEditDrag({
          shapeIndex: activeVectorShapeIndex,
          pointIndex: controlHit.pointIndex,
          handle: controlHit.handle,
          lastPosition: { x, y },
        });
        return;
      }

      if (activeVectorShape) {
        const segmentHit = getVectorSegmentHit(activeVectorShape, { x, y }, Math.max((activeVectorShape.strokeWidth || 2) / 2, VECTOR_HIT_RADIUS));
        if (segmentHit && !segmentHit.isClosing) {
          const insertedPoint = { x: segmentHit.point.x, y: segmentHit.point.y, inHandle: null, outHandle: null };
          setShapes((prevShapes) =>
            prevShapes.map((shape, index) => {
              if (index !== activeVectorShapeIndex || shape.type !== "vectorPen") return shape;
              const nextPoints = [...shape.points];
              nextPoints.splice(segmentHit.segmentIndex + 1, 0, insertedPoint);
              return { ...shape, points: nextPoints };
            })
          );
          setVectorEditDrag({
            shapeIndex: activeVectorShapeIndex,
            pointIndex: segmentHit.segmentIndex + 1,
            handle: "anchor",
            lastPosition: { x, y },
          });
          setActiveVectorPoint({ shapeIndex: activeVectorShapeIndex, pointIndex: segmentHit.segmentIndex + 1 });
          return;
        }
      }

      const hitShapeIndex = getShapeAtPoint(shapes, x, y);
      if (hitShapeIndex !== null && shapes[hitShapeIndex]?.type === "vectorPen") {
        setSelectedShapeIndices([hitShapeIndex]);
        setActiveVectorPoint({ shapeIndex: hitShapeIndex, pointIndex: 0 });
        return;
      }

      const points = [...drawingState.vectorPen.points];
      if (points.length >= 3 && distance(points[0], { x, y }) <= VECTOR_HIT_RADIUS) {
        const newShape = {
          type: "vectorPen",
          name: getDefaultShapeName("vectorPen", shapes),
          points,
          closed: true,
          strokeColor: "#000000",
          fillColor: "transparent",
          strokeWidth: 2,
        };
        saveToHistory([...shapes, newShape]);
        setDrawingState((prev) => ({ ...prev, vectorPen: { points: [], closed: false, draggingPointIndex: null } }));
        return;
      }

      setIsDrawing(true);
      const nextPoints = [...points, { x, y, inHandle: null, outHandle: null }];
      setDrawingState((prev) => ({
        ...prev,
        vectorPen: {
          points: nextPoints,
          closed: false,
          draggingPointIndex: nextPoints.length - 1,
        },
      }));
      setActiveVectorPoint(null);
      return;
    }

    setIsDrawing(true);
    setDrawingState(prev => ({
      ...prev,
      [mode]: mode === "freehand" ? { points: [{ x, y }] } : { start: { x, y }, current: { x, y } },
    }));
  };

  const handleCanvasMouseDownCapture = (e) => {
    if (mode !== "select") return;
    if (e.target.dataset?.vectorControl === "true") return;
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

  const handleVectorPointMouseDown = useCallback((e, shapeIndex, pointIndex, handle = "anchor") => {
    if (mode !== "select" && mode !== "vectorPen") return;
    e.stopPropagation();
    const shape = shapes[shapeIndex];
    if (!shape || shape.type !== "vectorPen") return;

    setSelectedShapeIndices([shapeIndex]);
    setActiveVectorPoint({ shapeIndex, pointIndex });
    const { x, y } = getCoords(e);
    setVectorEditDrag({
      shapeIndex,
      pointIndex,
      handle,
      lastPosition: { x, y },
    });
  }, [mode, shapes]);

  const handleVectorPointDoubleClick = useCallback((e, shapeIndex, pointIndex) => {
    if (mode !== "select" && mode !== "vectorPen") return;
    e.stopPropagation();
    const updatedShapes = shapes.map((shape, index) => {
      if (index !== shapeIndex || shape.type !== "vectorPen") return shape;
      const points = shape.points.map((point) => ({ ...point }));
      const target = points[pointIndex];
      if (!target) return shape;

      const hasHandles = Boolean(target.inHandle || target.outHandle);
      if (hasHandles) {
        points[pointIndex] = { ...target, inHandle: null, outHandle: null };
      } else {
        const offset = 35;
        points[pointIndex] = {
          ...target,
          inHandle: { x: target.x - offset, y: target.y },
          outHandle: { x: target.x + offset, y: target.y },
        };
      }
      return { ...shape, points };
    });
    setActiveVectorPoint({ shapeIndex, pointIndex });
    saveToHistory(updatedShapes);
  }, [mode, saveToHistory, shapes]);

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
            ? updateShapeForResize(shape, x, y, resizeCorner, shiftPressed)
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

    if (vectorEditDrag) {
      setShapes((prevShapes) =>
        prevShapes.map((shape, index) => {
          if (index !== vectorEditDrag.shapeIndex || shape.type !== "vectorPen") return shape;
          const nextPoints = shape.points.map((point) => ({ ...point }));
          const targetPoint = nextPoints[vectorEditDrag.pointIndex];
          const dx = x - vectorEditDrag.lastPosition.x;
          const dy = y - vectorEditDrag.lastPosition.y;

          if (vectorEditDrag.handle === "anchor") {
            targetPoint.x = x;
            targetPoint.y = y;
            if (targetPoint.inHandle) {
              targetPoint.inHandle = { x: targetPoint.inHandle.x + dx, y: targetPoint.inHandle.y + dy };
            }
            if (targetPoint.outHandle) {
              targetPoint.outHandle = { x: targetPoint.outHandle.x + dx, y: targetPoint.outHandle.y + dy };
            }
          } else {
            targetPoint[vectorEditDrag.handle] = { x, y };
            if (!altPressed) {
              const oppositeKey = vectorEditDrag.handle === "inHandle" ? "outHandle" : "inHandle";
              targetPoint[oppositeKey] = {
                x: (2 * targetPoint.x) - x,
                y: (2 * targetPoint.y) - y,
              };
            }
          }

          return { ...shape, points: nextPoints };
        })
      );
      setVectorEditDrag((prev) => (prev ? { ...prev, lastPosition: { x, y } } : prev));
      return;
    }

    if (!isDrawing) return;

    setDrawingState(prev => {
      const newState = { ...prev };
      if (mode === "freehand") {
        newState.freehand.points = [...newState.freehand.points, { x, y }];
      } else if (mode === "vectorPen") {
        const dragIndex = newState.vectorPen.draggingPointIndex;
        if (dragIndex !== null && newState.vectorPen.points[dragIndex]) {
          const anchor = newState.vectorPen.points[dragIndex];
          if (altPressed) {
            newState.vectorPen.points[dragIndex] = {
              ...anchor,
              inHandle: { x, y },
              outHandle: anchor.outHandle || null,
            };
          } else {
            const inHandle = { x, y };
            const outHandle = { x: anchor.x * 2 - x, y: anchor.y * 2 - y };
            newState.vectorPen.points[dragIndex] = { ...anchor, inHandle, outHandle };
          }
        }
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

    if (vectorEditDrag) {
      saveToHistory(shapes);
      setVectorEditDrag(null);
      return;
    }

    const ds = drawingState;
    if (mode === "freehand" && ds.freehand.points.length) {
      const newShape = {
        type: "freehand",
        name: getDefaultShapeName('freehand', shapes),
        points: ds.freehand.points,
        strokeColor: '#000000',
        fillColor: 'transparent',
        strokeWidth: 2,
      };
      saveToHistory([...shapes, newShape]);
      setDrawingState(prev => ({ ...prev, freehand: { points: [] } }));
    } else if (mode === "vectorPen") {
      setDrawingState(prev => ({
        ...prev,
        vectorPen: { ...prev.vectorPen, draggingPointIndex: null },
      }));
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
    } else if (mode === "text" && ds.text.start) {
      const start = ds.text.start;
      const newShape = {
        type: "text",
        name: getDefaultShapeName('text', shapes),
        text: 'Text',
        x: start.x,
        y: start.y,
        fontSize: 24,
        fontFamily: 'Arial',
        textAlign: 'left',
        rotation: 0,
        fillColor: '#000000',
        strokeColor: 'transparent',
      };
      const newShapes = [...shapes, newShape];
      saveToHistory(newShapes);
      setSelectedShapeIndices([newShapes.length - 1]);
      setEditingTextIndex(newShapes.length - 1);
      setEditingTextValue(newShape.text);
      setDrawingState(prev => ({ ...prev, text: { start: null, current: null } }));
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
    if (shapes[i]?.type === "vectorPen") {
      setActiveVectorPoint({ shapeIndex: i, pointIndex: 0 });
    } else {
      setActiveVectorPoint(null);
    }
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

  const handleTextEdit = useCallback((index) => {
    const shape = shapes[index];
    if (!shape || shape.type !== 'text') return;
    setSelectedShapeIndices([index]);
    setEditingTextIndex(index);
    setEditingTextValue(shape.text || '');
  }, [shapes]);

  const updateTextDraft = useCallback((value) => {
    setEditingTextValue(value);
  }, []);

  const finishTextEdit = useCallback(() => {
    if (editingTextIndex === null) return;
    const updatedShapes = shapes.map((item, i) =>
      i === editingTextIndex ? { ...item, text: editingTextValue } : item
    );
    setShapes(updatedShapes);
    saveToHistory(updatedShapes);
    setEditingTextIndex(null);
    setEditingTextValue("");
  }, [editingTextIndex, editingTextValue, shapes, saveToHistory]);

  const cancelTextEdit = useCallback(() => {
    setEditingTextIndex(null);
    setEditingTextValue("");
  }, []);

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
    const selectedIndex = Array.isArray(indexOrIndices)
      ? (indexOrIndices.length ? indexOrIndices[0] : null)
      : indexOrIndices;
    if (selectedIndex !== null && shapes[selectedIndex]?.type === "vectorPen") {
      setActiveVectorPoint({ shapeIndex: selectedIndex, pointIndex: 0 });
    } else {
      setActiveVectorPoint(null);
    }
  }, [shapes]);

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

      if (mode === "vectorPen" && e.key === "Enter" && drawingState.vectorPen.points.length > 1) {
        e.preventDefault();
        const newShape = {
          type: "vectorPen",
          name: getDefaultShapeName("vectorPen", shapes),
          points: drawingState.vectorPen.points,
          closed: drawingState.vectorPen.closed,
          strokeColor: "#000000",
          fillColor: "transparent",
          strokeWidth: 2,
        };
        saveToHistory([...shapes, newShape]);
        setDrawingState((prev) => ({ ...prev, vectorPen: { points: [], closed: false, draggingPointIndex: null } }));
        return;
      }
      if (mode === "vectorPen" && e.key === "Escape" && drawingState.vectorPen.points.length) {
        e.preventDefault();
        setDrawingState((prev) => ({ ...prev, vectorPen: { points: [], closed: false, draggingPointIndex: null } }));
        return;
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
  }, [selectedShapeIndices, shapes, undo, redo, saveToHistory, moveShapeBackward, moveShapeForward, mode, drawingState.vectorPen]);

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
    setActiveVectorPoint(null);
  }, []);

  const addImageShape = useCallback((file) => {
    if (!file) return Promise.resolve();

    const readAsDataUrl = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return readAsDataUrl.then((dataUrl) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 420;
        const maxHeight = 320;
        const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
        const width = Math.max(20, Math.round(img.naturalWidth * scale));
        const height = Math.max(20, Math.round(img.naturalHeight * scale));
        const newShape = {
          id: `image-${Date.now()}-${Math.round(Math.random() * 100000)}`,
          type: "image",
          name: getDefaultShapeName("image", shapes),
          x: 80,
          y: 80,
          width,
          height,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          aspectRatio: img.naturalWidth / Math.max(img.naturalHeight, 1),
          crop: { x: 0, y: 0, width: 1, height: 1 },
          href: dataUrl,
        };
        const newShapes = [...shapes, newShape];
        saveToHistory(newShapes);
        setSelectedShapeIndices([newShapes.length - 1]);
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    }));
  }, [saveToHistory, shapes]);

  const replaceShapes = useCallback((nextShapes) => {
    const safeShapes = Array.isArray(nextShapes) ? nextShapes : [];
    setShapes(safeShapes);
    setHistory([safeShapes]);
    setStep(0);
    setSelectedShapeIndices([]);
    setActiveVectorPoint(null);
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
    handleTextEdit,
    editingTextIndex,
    editingTextValue,
    updateTextDraft,
    finishTextEdit,
    cancelTextEdit,
    onShapeUpdate,
    clearSelection,
    selectShape,
    renameShape,
    moveShapeForward,
    moveShapeBackward,
    reorderShapes,
    undo,
    redo,
    canUndo: step > 0,
    canRedo: step < history.length - 1,
    replaceShapes,
    altPressed,
    shiftPressed,
    hoveredShapeIndex,
    setHoveredShapeIndex,
    selectionBox,
    activeVectorPoint,
    handleVectorPointMouseDown,
    handleVectorPointDoubleClick,
    addImageShape,
  };
};

export default useCanvas;