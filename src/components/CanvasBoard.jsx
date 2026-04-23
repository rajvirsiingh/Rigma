import style from "./Canvas.module.css";
import ShapeRenderer from "./ShapeRenderer";
import PreviewShapes from "./PreviewShapes";
import { getBounds } from "../utils/canvasUtils";
import { useRef } from "react";

const CanvasBoard = ({
  shapes,
  hoverDimensions,
  selectedShapeIndex,
  drawingState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleCanvasMouseDownCapture,
  handleSelect,
  handleResizeStart,
  altPressed,
  hoveredShapeIndex,
  setHoveredShapeIndex,
}) => {
  const svgRef = useRef();

  const renderDistanceGuides = () => {
    if (!altPressed || selectedShapeIndex === null) return null;

    const svg = svgRef.current;
    if (!svg) return null;

    const boardRect = svg.getBoundingClientRect();
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;

    const selectedShape = shapes[selectedShapeIndex];
    const selectedBounds = getBounds(selectedShape);

    const guides = [];

    // Distance from left edge to shape left
    guides.push(
      <line key="left" x1={0} y1={selectedBounds.top} x2={selectedBounds.left} y2={selectedBounds.top} stroke="red" strokeWidth={1} />,
      <text key="left-text" x={selectedBounds.left / 2} y={selectedBounds.top - 5} textAnchor="middle" fontSize="12" fill="red">
        {Math.round(selectedBounds.left)}
      </text>
    );

    // Distance from top edge to shape top
    guides.push(
      <line key="top" x1={selectedBounds.left} y1={0} x2={selectedBounds.left} y2={selectedBounds.top} stroke="red" strokeWidth={1} />,
      <text key="top-text" x={selectedBounds.left - 5} y={selectedBounds.top / 2} textAnchor="end" fontSize="12" fill="red">
        {Math.round(selectedBounds.top)}
      </text>
    );

    // Distance from right edge to shape right
    guides.push(
      <line key="right" x1={selectedBounds.right} y1={selectedBounds.top} x2={boardWidth} y2={selectedBounds.top} stroke="red" strokeWidth={1} />,
      <text key="right-text" x={(selectedBounds.right + boardWidth) / 2} y={selectedBounds.top - 5} textAnchor="middle" fontSize="12" fill="red">
        {Math.round(boardWidth - selectedBounds.right)}
      </text>
    );

    // Distance from bottom edge to shape bottom
    guides.push(
      <line key="bottom" x1={selectedBounds.left} y1={selectedBounds.bottom} x2={selectedBounds.left} y2={boardHeight} stroke="red" strokeWidth={1} />,
      <text key="bottom-text" x={selectedBounds.left - 5} y={(selectedBounds.bottom + boardHeight) / 2} textAnchor="end" fontSize="12" fill="red">
        {Math.round(boardHeight - selectedBounds.bottom)}
      </text>
    );

    // If hovering another shape, show distances between shapes
    if (hoveredShapeIndex !== null && hoveredShapeIndex !== selectedShapeIndex) {
      const hoveredShape = shapes[hoveredShapeIndex];
      const hoveredBounds = getBounds(hoveredShape);

      const selectedCenterY = (selectedBounds.top + selectedBounds.bottom) / 2;
      const hoveredCenterY = (hoveredBounds.top + hoveredBounds.bottom) / 2;
      const selectedCenterX = (selectedBounds.left + selectedBounds.right) / 2;
      const hoveredCenterX = (hoveredBounds.left + hoveredBounds.right) / 2;

      // Horizontal distance
      if (selectedBounds.right < hoveredBounds.left) {
        guides.push(
          <line key="shape-h" x1={selectedBounds.right} y1={selectedCenterY} x2={hoveredBounds.left} y2={selectedCenterY} stroke="blue" strokeWidth={1} />,
          <text key="shape-h-text" x={(selectedBounds.right + hoveredBounds.left) / 2} y={selectedCenterY - 5} textAnchor="middle" fontSize="12" fill="blue">
            {Math.round(hoveredBounds.left - selectedBounds.right)}
          </text>
        );
      } else if (selectedBounds.left > hoveredBounds.right) {
        guides.push(
          <line key="shape-h" x1={hoveredBounds.right} y1={selectedCenterY} x2={selectedBounds.left} y2={selectedCenterY} stroke="blue" strokeWidth={1} />,
          <text key="shape-h-text" x={(hoveredBounds.right + selectedBounds.left) / 2} y={selectedCenterY - 5} textAnchor="middle" fontSize="12" fill="blue">
            {Math.round(selectedBounds.left - hoveredBounds.right)}
          </text>
        );
      }

      // Vertical distance
      if (selectedBounds.bottom < hoveredBounds.top) {
        guides.push(
          <line key="shape-v" x1={selectedCenterX} y1={selectedBounds.bottom} x2={selectedCenterX} y2={hoveredBounds.top} stroke="blue" strokeWidth={1} />,
          <text key="shape-v-text" x={selectedCenterX + 5} y={(selectedBounds.bottom + hoveredBounds.top) / 2} textAnchor="start" fontSize="12" fill="blue">
            {Math.round(hoveredBounds.top - selectedBounds.bottom)}
          </text>
        );
      } else if (selectedBounds.top > hoveredBounds.bottom) {
        guides.push(
          <line key="shape-v" x1={selectedCenterX} y1={hoveredBounds.bottom} x2={selectedCenterX} y2={selectedBounds.top} stroke="blue" strokeWidth={1} />,
          <text key="shape-v-text" x={selectedCenterX + 5} y={(hoveredBounds.bottom + selectedBounds.top) / 2} textAnchor="start" fontSize="12" fill="blue">
            {Math.round(selectedBounds.top - hoveredBounds.bottom)}
          </text>
        );
      }
    }

    return guides;
  };

  return (
    <section className={style.canvasContainer}>
      <svg
        ref={svgRef}
        className={style.canvas}
        onMouseDownCapture={handleCanvasMouseDownCapture}
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
            setHoveredShapeIndex={setHoveredShapeIndex}
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

        {renderDistanceGuides()}
      </svg>
    </section>
  );
};

export default CanvasBoard