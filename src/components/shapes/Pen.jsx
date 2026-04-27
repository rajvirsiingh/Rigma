import SelectionOutline from '../SelectionOutline';

const Freehand = ({ shape, isSelected, onMouseDown, onMouseEnter, onMouseLeave }) => {
  const { points, strokeColor = '#000000', strokeWidth = 2 } = shape;
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  const x = Math.min(...xValues);
  const y = Math.min(...yValues);
  const width = Math.max(...xValues) - x;
  const height = Math.max(...yValues) - y;

  return (
    <>
      <polyline
        points={points.map(p => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        pointerEvents="stroke"
      />
      {isSelected && <SelectionOutline x={x} y={y} width={width} height={height} color={strokeColor} />}
    </>
  );
};

export default Freehand;