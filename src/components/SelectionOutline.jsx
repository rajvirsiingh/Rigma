const getOverlayColor = (shapeColor = '#000000') => {
  const hex = shapeColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use a visible accent color instead of black / white / gray.
  // Dark shapes get a bright cyan outline, light shapes get a warm orange outline.
  return luminance > 0.5 ? '#ff8c00' : '#00ffff';
};

const SelectionOutline = ({ x, y, width, height, color, borderRadius = { tl: 0, tr: 0, br: 0, bl: 0 } }) => {
  const stroke = color ? getOverlayColor(color) : '#ff8c00';
  const clamp = (value, max) => Math.max(0, Math.min(value, max));
  const tl = clamp(borderRadius.tl || 0, Math.min(width / 2, height / 2));
  const tr = clamp(borderRadius.tr || 0, Math.min(width / 2, height / 2));
  const br = clamp(borderRadius.br || 0, Math.min(width / 2, height / 2));
  const bl = clamp(borderRadius.bl || 0, Math.min(width / 2, height / 2));
  const path = `M ${x + tl},${y} H ${x + width - tr} ${tr > 0 ? `A ${tr},${tr} 0 0 1 ${x + width},${y + tr}` : `L ${x + width},${y}`} V ${y + height - br} ${br > 0 ? `A ${br},${br} 0 0 1 ${x + width - br},${y + height}` : `L ${x + width},${y + height}`} H ${x + bl} ${bl > 0 ? `A ${bl},${bl} 0 0 1 ${x},${y + height - bl}` : `L ${x},${y + height}`} V ${y + tl} ${tl > 0 ? `A ${tl},${tl} 0 0 1 ${x + tl},${y}` : `L ${x},${y}`} Z`;

  return (
    <path
      d={path}
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeDasharray="6 4"
      pointerEvents="stroke"
      style={{ cursor: 'move' }}
    />
  );
};

export default SelectionOutline;
