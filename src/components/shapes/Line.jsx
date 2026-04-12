const Line = ({ shape, isSelected, onMouseDown, onResizeStart }) => {
  return (
    <>
      <line
        x1={shape.start.x}
        y1={shape.start.y}
        x2={shape.end.x}
        y2={shape.end.y}
        stroke="black"
        strokeWidth="2"
        onMouseDown={onMouseDown}
      />

      {isSelected && (
        <>
          <circle cx={shape.start.x} cy={shape.start.y} r={5} fill="white" stroke="black"
            onMouseDown={(e) => onResizeStart(e, 0)} />
          <circle cx={shape.end.x} cy={shape.end.y} r={5} fill="white" stroke="black"
            onMouseDown={(e) => onResizeStart(e, 1)} />
        </>
      )}
    </>
  );
};

export default Line;