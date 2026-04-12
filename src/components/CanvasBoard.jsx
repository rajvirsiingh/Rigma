import style from "./Canvas.module.css";
import ShapeRenderer from "./ShapeRenderer";
import { useState } from "react";
import PreviewShapes from "./PreviewShapes";
const CanvasBoard = ({ mode }) => {
  const [hoverDimensions, setHoverDimensions] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState([]);
  const [points, setPoints] = useState([]);

  const [rectStart, setRectStart] = useState(null);
  const [rectCurrent, setRectCurrent] = useState(null);

  const [lineStart, setLineStart] = useState(null);
  const [lineCurrent, setLineCurrent] = useState(null);

  const [circleStart, setCircleStart] = useState(null);
  const [circleCurrent, setCircleCurrent] = useState(null);

  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState(null);

  const getCoords = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCoords(e);
    setIsDrawing(true);

    if (mode === "pen") setPoints([{ x, y }]);
    if (mode === "line") {
      setLineStart({ x, y });
      setLineCurrent({ x, y });
    }
    if (mode === "rect") {
      setRectStart({ x, y });
      setRectCurrent({ x, y });
    }
    if (mode === "circle") {
      setCircleStart({ x, y });
      setCircleCurrent({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCoords(e);

    // 🔥 RESIZE / DRAG
    if (mode === "select" && (isDragging || isResizing) && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      setShapes((prev) =>
        prev.map((shape, i) => {
          if (i !== selectedShapeIndex) return shape;

          // 🔲 RECTANGLE RESIZE
          if (isResizing && shape.type === "rectangle") {
            let newStart = { ...shape.start };
            let newEnd = { ...shape.end };

            if (resizeCorner === 0) newStart = { x, y };
            if (resizeCorner === 1) {
              newStart.y = y;
              newEnd.x = x;
            }
            if (resizeCorner === 2) {
              newStart.x = x;
              newEnd.y = y;
            }
            if (resizeCorner === 3) newEnd = { x, y };

            setHoverDimensions({
              x: Math.min(newStart.x, newEnd.x),
              y: Math.min(newStart.y, newEnd.y) - 10,
              width: Math.abs(newEnd.x - newStart.x),
              height: Math.abs(newEnd.y - newStart.y),
            });

            return { ...shape, start: newStart, end: newEnd };
          }

          // 📏 LINE RESIZE
          if (isResizing && shape.type === "line") {
            let newStart = { ...shape.start };
            let newEnd = { ...shape.end };

            if (resizeCorner === 0) newStart = { x, y };
            if (resizeCorner === 1) newEnd = { x, y };

            const dx = newEnd.x - newStart.x;
            const dy = newEnd.y - newStart.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            setHoverDimensions({
              x: (newStart.x + newEnd.x) / 2,
              y: (newStart.y + newEnd.y) / 2 - 10,
              width: Math.round(length),
              height: null,
            });

            return { ...shape, start: newStart, end: newEnd };
          }

          // ⚪ CIRCLE RESIZE
          if (isResizing && shape.type === "circle") {
            const newEdge = { x, y };

            const dx = newEdge.x - shape.center.x;
            const dy = newEdge.y - shape.center.y;
            const r = Math.sqrt(dx * dx + dy * dy);

            setHoverDimensions({
              x: shape.center.x,
              y: shape.center.y - r - 10,
              width: Math.round(r * 2),
              height: Math.round(r * 2),
            });

            return { ...shape, edge: newEdge };
          }

          // 🟡 DRAG
          if (!isResizing) {
            if (shape.type === "rectangle")
              return {
                ...shape,
                start: { x: shape.start.x + dx, y: shape.start.y + dy },
                end: { x: shape.end.x + dx, y: shape.end.y + dy },
              };

            if (shape.type === "line")
              return {
                ...shape,
                start: { x: shape.start.x + dx, y: shape.start.y + dy },
                end: { x: shape.end.x + dx, y: shape.end.y + dy },
              };

            if (shape.type === "circle")
              return {
                ...shape,
                center: { x: shape.center.x + dx, y: shape.center.y + dy },
                edge: { x: shape.edge.x + dx, y: shape.edge.y + dy },
              };
          }

          return shape;
        })
      );

      setDragStart({ x, y });
      return;
    }

    if (!isDrawing) return;

    if (mode === "pen") setPoints((p) => [...p, { x, y }]);

    if (mode === "line" && lineStart) {
      setLineCurrent({ x, y });

      const dx = x - lineStart.x;
      const dy = y - lineStart.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      setHoverDimensions({
        x: (lineStart.x + x) / 2,
        y: (lineStart.y + y) / 2 - 10,
        width: Math.round(length),
        height: null,
      });
    }

    if (mode === "rect" && rectStart) {
      setRectCurrent({ x, y });

      setHoverDimensions({
        x: Math.min(rectStart.x, x),
        y: Math.min(rectStart.y, y) - 10,
        width: Math.abs(x - rectStart.x),
        height: Math.abs(y - rectStart.y),
      });
    }

    if (mode === "circle" && circleStart) {
      setCircleCurrent({ x, y });

      const dx = x - circleStart.x;
      const dy = y - circleStart.y;
      const r = Math.sqrt(dx * dx + dy * dy);

      setHoverDimensions({
        x: circleStart.x,
        y: circleStart.y - r - 10,
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

    if (mode === "pen" && points.length) {
      setShapes((p) => [...p, { type: "pen", points }]);
      setPoints([]);
    }

    if (mode === "rect" && rectStart && rectCurrent) {
      setShapes((p) => [...p, { type: "rectangle", start: rectStart, end: rectCurrent }]);
      setRectStart(null);
      setRectCurrent(null);
    }

    if (mode === "line" && lineStart && lineCurrent) {
      setShapes((p) => [...p, { type: "line", start: lineStart, end: lineCurrent }]);
      setLineStart(null);
      setLineCurrent(null);
    }

    if (mode === "circle" && circleStart && circleCurrent) {
      setShapes((p) => [...p, { type: "circle", center: circleStart, edge: circleCurrent }]);
      setCircleStart(null);
      setCircleCurrent(null);
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
  rectStart={rectStart}
  rectCurrent={rectCurrent}
  lineStart={lineStart}
  lineCurrent={lineCurrent}
  circleStart={circleStart}
  circleCurrent={circleCurrent}
  points={points}
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