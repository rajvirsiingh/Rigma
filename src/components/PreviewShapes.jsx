import { buildVectorPathData } from "../utils/vectorPath";

const PreviewShapes = ({
  rectStart,
  rectCurrent,
  lineStart,
  lineCurrent,
  circleStart,
  circleCurrent,
  shiftPressed,
  freehandPoints = [],
  vectorPenPoints = [],
  vectorPenClosed,
  activeVectorDraftPointIndex,
}) => {
  const vectorPreviewPath = buildVectorPathData(vectorPenPoints, vectorPenClosed);
  const activeDraftPoint = activeVectorDraftPointIndex !== null && activeVectorDraftPointIndex !== undefined
    ? vectorPenPoints[activeVectorDraftPointIndex]
    : null;

  return (
    <>
      {freehandPoints.length > 0 && (
        <polyline
          points={freehandPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {vectorPreviewPath && (
        <>
          <path
            d={vectorPreviewPath}
            fill={vectorPenClosed ? "rgba(59,130,246,0.12)" : "transparent"}
            stroke="#2563eb"
            strokeWidth="2"
            strokeDasharray="6,3"
            pointerEvents="none"
          />
          {vectorPenPoints.map((point, index) => (
            <circle
              key={`draft-anchor-${index}`}
              cx={point.x}
              cy={point.y}
              r={5}
              fill={index === activeVectorDraftPointIndex ? "#2563eb" : "#60a5fa"}
              stroke="#ffffff"
              pointerEvents="none"
            />
          ))}
          {activeDraftPoint?.inHandle && (
            <>
              <line
                x1={activeDraftPoint.x}
                y1={activeDraftPoint.y}
                x2={activeDraftPoint.inHandle.x}
                y2={activeDraftPoint.inHandle.y}
                stroke="#6b7280"
                strokeDasharray="3,2"
                pointerEvents="none"
              />
              <circle cx={activeDraftPoint.inHandle.x} cy={activeDraftPoint.inHandle.y} r={4} fill="#ffffff" stroke="#6b7280" pointerEvents="none" />
            </>
          )}
          {activeDraftPoint?.outHandle && (
            <>
              <line
                x1={activeDraftPoint.x}
                y1={activeDraftPoint.y}
                x2={activeDraftPoint.outHandle.x}
                y2={activeDraftPoint.outHandle.y}
                stroke="#6b7280"
                strokeDasharray="3,2"
                pointerEvents="none"
              />
              <circle cx={activeDraftPoint.outHandle.x} cy={activeDraftPoint.outHandle.y} r={4} fill="#ffffff" stroke="#6b7280" pointerEvents="none" />
            </>
          )}
        </>
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