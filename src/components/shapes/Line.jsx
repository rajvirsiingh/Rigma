import SelectionOutline from '../SelectionOutline';

const Line = ({ shape, isSelected, onMouseDown, onResizeStart, onMouseEnter, onMouseLeave }) => {
  const { start, end, strokeColor = '#000000', strokeWidth = 2 } = shape;
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        pointerEvents="stroke"
      />

      {isSelected && (
        <>
          <SelectionOutline x={x} y={y} width={width} height={height} color={strokeColor} />
          <circle cx={start.x} cy={start.y} r={5} fill="white" stroke="blue" strokeWidth={2}
            style={{ cursor: 'nwse-resize' }}
            onMouseDown={(e) => onResizeStart(e, 0)} />
          <circle cx={end.x} cy={end.y} r={5} fill="white" stroke="blue" strokeWidth={2}
            style={{ cursor: 'nwse-resize' }}
            onMouseDown={(e) => onResizeStart(e, 1)} />
        </>
      )}
    </>
  );
};

export default Line;