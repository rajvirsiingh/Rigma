import Rectangle from "./shapes/Rectangle";
import Line from "./shapes/Line";
import Circle from "./shapes/Circle";
import Pen from "./shapes/Pen";
import TextShape from "./shapes/Text";
import VectorPen from "./shapes/VectorPen";
import ImageShape from "./shapes/ImageShape";

const ShapeRenderer = ({
  shape,
  i,
  selectedShapeIndices,
  handleSelect,
  handleResizeStart,
  setHoveredShapeIndex,
  handleTextEdit,
  activeVectorPoint,
  onVectorPointMouseDown,
  onVectorPointDoubleClick,
}) => {
  const commonProps = {
    shape,
    isSelected: selectedShapeIndices.includes(i),
    onMouseDown: (e) => handleSelect(e, i),
    onResizeStart: (e, corner) => handleResizeStart(e, i, corner),
    onMouseEnter: () => setHoveredShapeIndex(i),
    onMouseLeave: () => setHoveredShapeIndex(null),
    onTextEdit: () => handleTextEdit(i),
  };

  switch (shape.type) {
    case "rectangle":
      return <Rectangle key={i} {...commonProps} />;
    case "line":
      return <Line key={i} {...commonProps} />;
    case "circle":
      return <Circle key={i} {...commonProps} />;
    case "freehand":
      return <Pen key={i} {...commonProps} />;
    case "vectorPen":
      return (
        <VectorPen
          key={i}
          {...commonProps}
          activePointIndex={activeVectorPoint?.shapeIndex === i ? activeVectorPoint.pointIndex : null}
          onVectorPointMouseDown={(e, pointIndex, handle) => onVectorPointMouseDown(e, i, pointIndex, handle)}
          onVectorPointDoubleClick={(e, pointIndex) => onVectorPointDoubleClick(e, i, pointIndex)}
        />
      );
    case "text":
      return <TextShape key={i} {...commonProps} onTextEdit={() => handleTextEdit(i)} />;
    case "image":
      return <ImageShape key={i} {...commonProps} />;
    default:
      return null;
  }
};

export default ShapeRenderer;