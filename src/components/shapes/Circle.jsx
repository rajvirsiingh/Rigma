import SelectionOutline from '../SelectionOutline';

const Circle = ({ shape, isSelected, onMouseDown, onResizeStart, onMouseEnter, onMouseLeave }) => {
  const { center, radiusX = 0, radiusY = 0, strokeColor = '#000000', fillColor = 'transparent', strokeWidth = 2 } = shape;
  const pointerEvents = fillColor === 'transparent' || fillColor === 'none' ? 'stroke' : 'all';

  const handles = [
    { x: center.x + radiusX, y: center.y, cursor: 'e-resize', corner: 0 },
    { x: center.x, y: center.y - radiusY, cursor: 'n-resize', corner: 1 },
    { x: center.x - radiusX, y: center.y, cursor: 'w-resize', corner: 2 },
    { x: center.x, y: center.y + radiusY, cursor: 's-resize', corner: 3 },
  ];

  return (
    <>
      <ellipse
        cx={center.x}
        cy={center.y}
        rx={radiusX}
        ry={radiusY}
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
            x={center.x - radiusX}
            y={center.y - radiusY}
            width={radiusX * 2}
            height={radiusY * 2}
            color={strokeColor}
          />
          {handles.map((handle) => (
            <circle
              key={handle.corner}
              cx={handle.x}
              cy={handle.y}
              r={5}
              fill="white"
              stroke="blue"
              strokeWidth={2}
              style={{ cursor: handle.cursor }}
              onMouseDown={(e) => onResizeStart(e, handle.corner)}
            />
          ))}
        </>
      )}
    </>
  );
};

export default Circle;