const Circle = ({ shape, isSelected, onMouseDown, onResizeStart }) => {
  const dx = shape.edge.x - shape.center.x;
  const dy = shape.edge.y - shape.center.y;
  const r = Math.sqrt(dx * dx + dy * dy);

  return (
    <>
      <circle
        cx={shape.center.x}
        cy={shape.center.y}
        r={r}
        stroke="black"
        fill="transparent"
        strokeWidth="2"
        onMouseDown={onMouseDown}
      />

      {isSelected && (
        <circle
          cx={shape.edge.x}
          cy={shape.edge.y}
          r={5}
          fill="white"
          stroke="black"
          onMouseDown={(e) => onResizeStart(e, 0)}
        />
      )}
    </>
  );
};

export default Circle;