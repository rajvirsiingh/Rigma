import SelectionOutline from "../SelectionOutline";
import { buildVectorPathData, getVectorBounds } from "../../utils/vectorPath";

const HANDLE_RADIUS = 4;

const VectorPen = ({
  shape,
  isSelected,
  activePointIndex,
  onVectorPointMouseDown,
  onVectorPointDoubleClick,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { points = [], strokeColor = "#000000", strokeWidth = 2, fillColor = "transparent", closed = false } = shape;
  const d = buildVectorPathData(points, closed);
  const bounds = getVectorBounds(shape);
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;

  const showPoints = isSelected;

  return (
    <>
      <path
        d={d}
        fill={closed ? fillColor : "transparent"}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        pointerEvents="stroke"
      />
      {isSelected && <SelectionOutline x={bounds.left} y={bounds.top} width={width} height={height} color={strokeColor} />}
      {showPoints && points.map((point, index) => {
        const isActive = activePointIndex === index;
        return (
          <g key={index}>
            {isActive && point.inHandle && (
              <>
                <line x1={point.x} y1={point.y} x2={point.inHandle.x} y2={point.inHandle.y} stroke="#6b7280" strokeDasharray="3,2" />
                <circle
                  data-vector-control="true"
                  cx={point.inHandle.x}
                  cy={point.inHandle.y}
                  r={HANDLE_RADIUS}
                  fill="#ffffff"
                  stroke="#6b7280"
                  onMouseDown={(e) => onVectorPointMouseDown(e, index, "inHandle")}
                />
              </>
            )}
            {isActive && point.outHandle && (
              <>
                <line x1={point.x} y1={point.y} x2={point.outHandle.x} y2={point.outHandle.y} stroke="#6b7280" strokeDasharray="3,2" />
                <circle
                  data-vector-control="true"
                  cx={point.outHandle.x}
                  cy={point.outHandle.y}
                  r={HANDLE_RADIUS}
                  fill="#ffffff"
                  stroke="#6b7280"
                  onMouseDown={(e) => onVectorPointMouseDown(e, index, "outHandle")}
                />
              </>
            )}
            <circle
              data-vector-control="true"
              cx={point.x}
              cy={point.y}
              r={HANDLE_RADIUS + 1}
              fill={isActive ? "#2563eb" : "#60a5fa"}
              stroke="#ffffff"
              onMouseDown={(e) => onVectorPointMouseDown(e, index, "anchor")}
              onDoubleClick={(e) => onVectorPointDoubleClick(e, index)}
            />
          </g>
        );
      })}
    </>
  );
};

export default VectorPen;
