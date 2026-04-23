const PreviewShapes = ({
  rectStart,
  rectCurrent,
  lineStart,
  lineCurrent,
  circleStart,
  circleCurrent,
  shiftPressed,
  points,
}) => {
  return (
    <>
      {points.length > 0 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {rectStart && rectCurrent && (
        <rect
          x={Math.min(rectStart.x, rectCurrent.x)}
          y={Math.min(rectStart.y, rectCurrent.y)}
          width={Math.abs(rectCurrent.x - rectStart.x)}
          height={Math.abs(rectCurrent.y - rectStart.y)}
          fill="transparent"
          stroke="red"
          strokeWidth="2"
        />
      )}

      {lineStart && lineCurrent && (
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineCurrent.x}
          y2={lineCurrent.y}
          stroke="red"
          strokeWidth="2"
        />
      )}

      {circleStart && circleCurrent && (() => {
        const dx = circleCurrent.x - circleStart.x;
        const dy = circleCurrent.y - circleStart.y;
        const size = shiftPressed ? Math.max(Math.abs(dx), Math.abs(dy)) : null;
        const currentX = shiftPressed ? circleStart.x + Math.sign(dx || 1) * size : circleCurrent.x;
        const currentY = shiftPressed ? circleStart.y + Math.sign(dy || 1) * size : circleCurrent.y;
        const left = Math.min(circleStart.x, currentX);
        const top = Math.min(circleStart.y, currentY);
        const width = Math.abs(currentX - circleStart.x);
        const height = Math.abs(currentY - circleStart.y);
        const cx = left + width / 2;
        const cy = top + height / 2;
        return (
          <ellipse
            cx={cx}
            cy={cy}
            rx={width / 2}
            ry={height / 2}
            fill="transparent"
            stroke="red"
            strokeWidth="2"
          />
        );
      })()}
    </>
  );
};

export default PreviewShapes;