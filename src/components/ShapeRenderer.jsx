import Rectangle from "./shapes/Rectangle";
import Line from "./shapes/Line";
import Circle from "./shapes/Circle";
import Pen from "./shapes/Pen";
import TextShape from "./shapes/Text";

const ShapeRenderer = ({ shape, i, selectedShapeIndices, handleSelect, handleResizeStart, setHoveredShapeIndex, handleTextEdit }) => {
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
    case "pen":
      return <Pen key={i} {...commonProps} />;    case "text":
      return <TextShape key={i} {...commonProps} onTextEdit={() => handleTextEdit(i)} />;    default:
      return null;
  }
};

export default ShapeRenderer;