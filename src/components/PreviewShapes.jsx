const PreviewShapes = ({
  rectStart,
  rectCurrent,
  lineStart,
  lineCurrent,
  circleStart,
  circleCurrent,
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
        const r = Math.sqrt(dx * dx + dy * dy);
        return (
          <circle
            cx={circleStart.x}
            cy={circleStart.y}
            r={r}
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