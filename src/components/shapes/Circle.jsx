import SelectionOutline from '../SelectionOutline';

const Circle = ({ shape, isSelected, onMouseDown, onResizeStart, onMouseEnter, onMouseLeave }) => {
  const { center, edge, strokeColor = '#000000', fillColor = 'transparent', strokeWidth = 2 } = shape;
  const dx = edge.x - center.x;
  const dy = edge.y - center.y;
  const r = Math.sqrt(dx * dx + dy * dy);

  const pointerEvents = fillColor === 'transparent' || fillColor === 'none' ? 'stroke' : 'all';

  return (
    <>
      <circle
        cx={center.x}
        cy={center.y}
        r={r}
        stroke={strokeColor}
        fill={fillColor}
        strokeWidth={strokeWidth}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        pointerEvents={pointerEvents}
      />

      {isSelected && (
        <>
          <SelectionOutline
            x={center.x - r}
            y={center.y - r}
            width={r * 2}
            height={r * 2}
            color={strokeColor}
          />
          <circle
            cx={edge.x}
            cy={edge.y}
            r={5}
            fill="white"
            stroke="blue"
            strokeWidth={2}
            style={{ cursor: 'nwse-resize' }}
            onMouseDown={(e) => onResizeStart(e, 0)}
          />
        </>
      )}
    </>
  );
};

export default Circle;