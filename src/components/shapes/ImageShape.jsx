import SelectionOutline from "../SelectionOutline";

const ImageShape = ({ shape, isSelected, onMouseDown, onResizeStart, onMouseEnter, onMouseLeave }) => {
  const { id, x, y, width, height, href, crop } = shape;
  const cropRect = crop || { x: 0, y: 0, width: 1, height: 1 };
  const safeCropWidth = Math.max(0.01, cropRect.width);
  const safeCropHeight = Math.max(0.01, cropRect.height);
  const imageX = x - ((cropRect.x / safeCropWidth) * width);
  const imageY = y - ((cropRect.y / safeCropHeight) * height);
  const imageWidth = width / safeCropWidth;
  const imageHeight = height / safeCropHeight;
  const clipId = `img-clip-${id || `tmp-${x}-${y}-${width}-${height}`}`.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <image
        x={imageX}
        y={imageY}
        width={imageWidth}
        height={imageHeight}
        href={href}
        preserveAspectRatio="none"
        clipPath={`url(#${clipId})`}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      {isSelected && (
        <>
          <SelectionOutline x={x} y={y} width={width} height={height} color="#2563eb" />
          {[0, 1, 2, 3].map((corner) => {
            let cx;
            let cy;
            if (corner === 0) { cx = x; cy = y; }
            if (corner === 1) { cx = x + width; cy = y; }
            if (corner === 2) { cx = x; cy = y + height; }
            if (corner === 3) { cx = x + width; cy = y + height; }
            const cursors = ["nw-resize", "ne-resize", "sw-resize", "se-resize"];
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
        </>
      )}
    </>
  );
};

export default ImageShape;
