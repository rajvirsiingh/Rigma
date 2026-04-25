import Rectangle from "./shapes/Rectangle";
import Line from "./shapes/Line";
import Circle from "./shapes/Circle";
import Pen from "./shapes/Pen";

const ShapeRenderer = ({ shape, i, selectedShapeIndices, handleSelect, handleResizeStart, setHoveredShapeIndex }) => {
  const commonProps = {
    shape,
    isSelected: selectedShapeIndices.includes(i),
    onMouseDown: (e) => handleSelect(e, i),
    onResizeStart: (e, corner) => handleResizeStart(e, i, corner),
    onMouseEnter: () => setHoveredShapeIndex(i),
    onMouseLeave: () => setHoveredShapeIndex(null),
  };

  switch (shape.type) {
    case "rectangle":
      return <Rectangle key={i} {...commonProps} />;
    case "line":
      return <Line key={i} {...commonProps} />;
    case "circle":
      return <Circle key={i} {...commonProps} />;
    case "pen":
      return <Pen key={i} {...commonProps} />;
    default:
      return null;
  }
};

export default ShapeRenderer;