import style from "./Canvas.module.css";
import ShapeRenderer from "./ShapeRenderer";
import { useState, useCallback } from "react";
import PreviewShapes from "./PreviewShapes";
import { useEffect } from "react";

const CanvasBoard = ({ mode }) => {
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
  
  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [step, setStep] = useState(0);

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

  const getCoords = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const updateShapeForDrag = (shape, dx, dy) => {
    if (shape.type === "rectangle") {
      return {
        ...shape,
        start: { x: shape.start.x + dx, y: shape.start.y + dy },
        end: { x: shape.end.x + dx, y: shape.end.y + dy },
      };
    }
    if (shape.type === "line") {
      return {
        ...shape,
        start: { x: shape.start.x + dx, y: shape.start.y + dy },
        end: { x: shape.end.x + dx, y: shape.end.y + dy },
      };
    }
    if (shape.type === "circle") {
      return {
        ...shape,
        center: { x: shape.center.x + dx, y: shape.center.y + dy },
        edge: { x: shape.edge.x + dx, y: shape.edge.y + dy },
      };
    }
    return shape;
  };

  const updateShapeForResize = (shape, x, y, resizeCorner) => {
    if (shape.type === "rectangle") {
      let { start, end } = shape;
      if (resizeCorner === 0) start = { x, y };
      else if (resizeCorner === 1) { start.y = y; end.x = x; }
      else if (resizeCorner === 2) { start.x = x; end.y = y; }
      else if (resizeCorner === 3) end = { x, y };
      return { ...shape, start, end };
    }
    if (shape.type === "line") {
      const start = resizeCorner === 0 ? { x, y } : shape.start;
      const end = resizeCorner === 1 ? { x, y } : shape.end;
      return { ...shape, start, end };
    }
    if (shape.type === "circle") {
      const center = shape.center;
      const edge = { x, y };
      return { ...shape, edge };
    }
    return shape;
  };

  const calculateHoverDimensions = (shape) => {
    if (shape.type === "rectangle") {
      const { start, end } = shape;
      return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y) - 10,
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      };
    }
    if (shape.type === "line") {
      const { start, end } = shape;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      return {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2 - 10,
        width: Math.round(length),
        height: null,
      };
    }
    if (shape.type === "circle") {
      const { center, edge } = shape;
      const dx = edge.x - center.x;
      const dy = edge.y - center.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      return {
        x: center.x,
        y: center.y - r - 10,
        width: Math.round(r * 2),
        height: Math.round(r * 2),
      };
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCoords(e);
    setIsDrawing(true);
    setDrawingState(prev => ({
      ...prev,
      [mode]: mode === "pen" ? { points: [{ x, y }] } : { start: { x, y }, current: { x, y } },
    }));
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
      saveToHistory([...shapes, { type: "pen", points: ds.pen.points }]);
      setDrawingState(prev => ({ ...prev, pen: { points: [] } }));
    } else if (mode === "rect" && ds.rect.start && ds.rect.current) {
      saveToHistory([...shapes, { type: "rectangle", start: ds.rect.start, end: ds.rect.current }]);
      setDrawingState(prev => ({ ...prev, rect: { start: null, current: null } }));
    } else if (mode === "line" && ds.line.start && ds.line.current) {
      saveToHistory([...shapes, { type: "line", start: ds.line.start, end: ds.line.current }]);
      setDrawingState(prev => ({ ...prev, line: { start: null, current: null } }));
    } else if (mode === "circle" && ds.circle.start && ds.circle.current) {
      saveToHistory([...shapes, { type: "circle", center: ds.circle.start, edge: ds.circle.current }]);
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
        }
      }

      // Only delete if a shape is selected
      if (selectedShapeIndex === null) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault(); // prevents browser going back (important)

        const newShapes = shapes.filter((_, i) => i !== selectedShapeIndex);
        setShapes(newShapes);
        saveToHistory(newShapes);
        setSelectedShapeIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedShapeIndex, shapes, undo, redo, saveToHistory]);

  return (
    <section className={style.canvasContainer}>
      <svg
        className={style.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {shapes.map((shape, i) => (
          <ShapeRenderer
            key={i}
            shape={shape}
            i={i}
            selectedShapeIndex={selectedShapeIndex}
            handleSelect={handleSelect}
            handleResizeStart={handleResizeStart}
          />
        ))}
        <PreviewShapes
          rectStart={drawingState.rect.start}
          rectCurrent={drawingState.rect.current}
          lineStart={drawingState.line.start}
          lineCurrent={drawingState.line.current}
          circleStart={drawingState.circle.start}
          circleCurrent={drawingState.circle.current}
          points={drawingState.pen.points}
        />

        {hoverDimensions && (
          <text x={hoverDimensions.x} y={hoverDimensions.y} fontSize="12">
            {hoverDimensions.height
              ? `${hoverDimensions.width} × ${hoverDimensions.height}px`
              : `${hoverDimensions.width}px`}
          </text>
        )}
      </svg>
    </section>
  );
};

export default CanvasBoard;