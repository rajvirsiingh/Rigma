const Rectangle = ({ shape, isSelected, onMouseDown, onResizeStart }) => {
  const { start, end } = shape;
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        stroke={isSelected ? "blue" : "black"}
        strokeWidth={2}
        onMouseDown={onMouseDown}
      />
      {isSelected && (
        <>
          {/* resize handles */}
          {[0, 1, 2, 3].map((corner) => {
            let cx, cy;
            if (corner === 0) { cx = x; cy = y; }
            if (corner === 1) { cx = x + width; cy = y; }
            if (corner === 2) { cx = x; cy = y + height; }
            if (corner === 3) { cx = x + width; cy = y + height; }
            return (
              <circle
                key={corner}
                cx={cx}
                cy={cy}
                r={5}
                fill="white"
                stroke="blue"
                strokeWidth={2}
                onMouseDown={(e) => onResizeStart(e, corner)}
              />
            );
          })}
        </>
      )}
    </>
  );
};

export default Rectangle;