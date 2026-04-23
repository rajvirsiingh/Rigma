import SelectionOutline from '../SelectionOutline';

const buildRoundedRectPath = (x, y, width, height, radius) => {
  const clamp = (value, max) => Math.max(0, Math.min(value, max));
  const maxRadius = Math.min(width / 2, height / 2);
  const tl = clamp(radius?.tl ?? 0, maxRadius);
  const tr = clamp(radius?.tr ?? 0, maxRadius);
  const br = clamp(radius?.br ?? 0, maxRadius);
  const bl = clamp(radius?.bl ?? 0, maxRadius);

  return [
    `M ${x + tl},${y}`,
    `H ${x + width - tr}`,
    tr > 0 ? `A ${tr},${tr} 0 0 1 ${x + width},${y + tr}` : `L ${x + width},${y}`,
    `V ${y + height - br}`,
    br > 0 ? `A ${br},${br} 0 0 1 ${x + width - br},${y + height}` : `L ${x + width},${y + height}`,
    `H ${x + bl}`,
    bl > 0 ? `A ${bl},${bl} 0 0 1 ${x},${y + height - bl}` : `L ${x},${y + height}`,
    `V ${y + tl}`,
    tl > 0 ? `A ${tl},${tl} 0 0 1 ${x + tl},${y}` : `L ${x},${y}`,
    'Z',
  ].join(' ');
};

const Rectangle = ({ shape, isSelected, onMouseDown, onResizeStart, onMouseEnter, onMouseLeave }) => {
  const {
    start,
    end,
    strokeColor = '#000000',
    fillColor = 'transparent',
    strokeWidth = 2,
    borderRadius = { tl: 0, tr: 0, br: 0, bl: 0 },
  } = shape;
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  const path = buildRoundedRectPath(x, y, width, height, borderRadius);
  const pointerEvents = fillColor === 'transparent' || fillColor === 'none' ? 'stroke' : 'all';

  return (
    <>
      <path
        d={path}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        pointerEvents={pointerEvents}
      />
      {isSelected && (
        <>
          <SelectionOutline
            x={x}
            y={y}
            width={width}
            height={height}
            color={strokeColor}
            borderRadius={borderRadius}
          />
          {[0, 1, 2, 3].map((corner) => {
            let cx, cy;
            if (corner === 0) { cx = x; cy = y; }
            if (corner === 1) { cx = x + width; cy = y; }
            if (corner === 2) { cx = x; cy = y + height; }
            if (corner === 3) { cx = x + width; cy = y + height; }
            const cursors = ['nw-resize', 'ne-resize', 'sw-resize', 'se-resize'];
            return (
              <circle
                key={corner}
                cx={cx}
                cy={cy}
                r={5}
                fill="white"
                stroke="blue"
                strokeWidth={2}
                style={{ cursor: cursors[corner] }}
                onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, corner); }}
              />
            );
          })}
          {/* Side resize handles */}
          {[4, 5, 6, 7].map((side) => {
            let cx, cy, cursor;
            if (side === 4) { cx = x + width / 2; cy = y; cursor = 'n-resize'; } // top
            if (side === 5) { cx = x + width / 2; cy = y + height; cursor = 's-resize'; } // bottom
            if (side === 6) { cx = x; cy = y + height / 2; cursor = 'w-resize'; } // left
            if (side === 7) { cx = x + width; cy = y + height / 2; cursor = 'e-resize'; } // right
            return (
              <circle
                key={side}
                cx={cx}
                cy={cy}
                r={4}
                fill="white"
                stroke="blue"
                strokeWidth={2}
                style={{ cursor }}
                onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, side); }}
              />
            );
          })}
        </>
      )}
    </>
  );
};

export default Rectangle;