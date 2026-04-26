export const getCoords = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const touch = e.touches?.[0] || e;
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

export const updateShapeForDrag = (shape, dx, dy) => {
  if (shape.type === "rectangle") {
    return {
      ...shape,
      start: { x: shape.start.x + dx, y: shape.start.y + dy },
      end: { x: shape.end.x + dx, y: shape.end.y + dy },
    };
  }
  if (shape.type === "line") {
    return {
      ...shape,
      start: { x: shape.start.x + dx, y: shape.start.y + dy },
      end: { x: shape.end.x + dx, y: shape.end.y + dy },
    };
  }
  if (shape.type === "circle") {
    const center = shape.center ?? { x: shape.edge?.x ?? 0, y: shape.edge?.y ?? 0 };
    const moved = { ...shape, center: { x: center.x + dx, y: center.y + dy } };
    if (shape.edge) {
      moved.edge = { x: shape.edge.x + dx, y: shape.edge.y + dy };
    }
    return moved;
  }
  if (shape.type === 'text') {
    return { ...shape, x: shape.x + dx, y: shape.y + dy };
  }
  return shape;
};

export const updateShapeForResize = (shape, x, y, resizeCorner) => {
  if (shape.type === "rectangle") {
    const { start, end } = shape;
    const currentLeft = Math.min(start.x, end.x);
    const currentTop = Math.min(start.y, end.y);
    const currentRight = Math.max(start.x, end.x);
    const currentBottom = Math.max(start.y, end.y);

    let newStart = { ...start };
    let newEnd = { ...end };

    if (resizeCorner === 0) { // top-left
      if (start.x === currentLeft) newStart.x = x; else newEnd.x = x;
      if (start.y === currentTop) newStart.y = y; else newEnd.y = y;
    } else if (resizeCorner === 1) { // top-right
      if (start.x === currentRight) newStart.x = x; else newEnd.x = x;
      if (start.y === currentTop) newStart.y = y; else newEnd.y = y;
    } else if (resizeCorner === 2) { // bottom-left
      if (start.x === currentLeft) newStart.x = x; else newEnd.x = x;
      if (start.y === currentBottom) newStart.y = y; else newEnd.y = y;
    } else if (resizeCorner === 3) { // bottom-right
      if (start.x === currentRight) newStart.x = x; else newEnd.x = x;
      if (start.y === currentBottom) newStart.y = y; else newEnd.y = y;
    } else if (resizeCorner === 4) { // top
      if (start.y === currentTop) newStart.y = y; else newEnd.y = y;
    } else if (resizeCorner === 5) { // bottom
      if (start.y === currentBottom) newStart.y = y; else newEnd.y = y;
    } else if (resizeCorner === 6) { // left
      if (start.x === currentLeft) newStart.x = x; else newEnd.x = x;
    } else if (resizeCorner === 7) { // right
      if (start.x === currentRight) newStart.x = x; else newEnd.x = x;
    }

    return { ...shape, start: newStart, end: newEnd };
  }
  if (shape.type === "line") {
    const start = resizeCorner === 0 ? { x, y } : shape.start;
    const end = resizeCorner === 1 ? { x, y } : shape.end;
    return { ...shape, start, end };
  }
  if (shape.type === "circle") {
    const radiusX = Math.max(0, Math.abs(x - shape.center.x));
    const radiusY = Math.max(0, Math.abs(y - shape.center.y));
    return { ...shape, radiusX, radiusY };
  }
  return shape;
};

export const getBounds = (shape) => {
  if (shape.type === "rectangle") {
    const left = Math.min(shape.start.x, shape.end.x);
    const top = Math.min(shape.start.y, shape.end.y);
    const right = Math.max(shape.start.x, shape.end.x);
    const bottom = Math.max(shape.start.y, shape.end.y);
    return { left, top, right, bottom };
  }
  if (shape.type === "circle") {
    const rx = shape.radiusX ?? Math.abs(shape.edge?.x - shape.center.x);
    const ry = shape.radiusY ?? Math.abs(shape.edge?.y - shape.center.y);
    return { left: shape.center.x - rx, top: shape.center.y - ry, right: shape.center.x + rx, bottom: shape.center.y + ry };
  }
  if (shape.type === "line") {
    const left = Math.min(shape.start.x, shape.end.x);
    const top = Math.min(shape.start.y, shape.end.y);
    const right = Math.max(shape.start.x, shape.end.x);
    const bottom = Math.max(shape.start.y, shape.end.y);
    return { left, top, right, bottom };
  }
  if (shape.type === "pen") {
    const xs = shape.points.map(p => p.x);
    const ys = shape.points.map(p => p.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    return { left, top, right, bottom };
  }
  if (shape.type === 'text') {
    const width = Math.max(0, shape.text?.length * (shape.fontSize * 0.6));
    const height = Math.max(0, shape.fontSize * 1.2);
    const x = shape.x + (shape.textAlign === 'center' ? -width / 2 : shape.textAlign === 'right' ? -width : 0);
    const y = shape.y - height * 0.8;
    return { left: x, top: y, right: x + width, bottom: y + height };
  }
  return { left: 0, top: 0, right: 0, bottom: 0 };
};

export const calculateHoverDimensions = (shape) => {
  if (shape.type === "rectangle") {
    const { start, end } = shape;
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y) - 10,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }
  if (shape.type === "line") {
    const { start, end } = shape;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2 - 10,
      width: Math.round(length),
      height: null,
    };
  }
  if (shape.type === "circle") {
    const rx = shape.radiusX ?? Math.abs(shape.edge?.x - shape.center.x);
    const ry = shape.radiusY ?? Math.abs(shape.edge?.y - shape.center.y);
    return {
      x: shape.center.x - rx,
      y: shape.center.y - ry - 10,
      width: Math.round(rx * 2),
      height: Math.round(ry * 2),
    };
  }
  return null;
};

const hasVisibleFill = (shape) => {
  return shape.fillColor && shape.fillColor !== 'transparent' && shape.fillColor !== 'none';
};

const getDistanceToLine = (x, y, x1, y1, x2, y2) => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;

  let closestX;
  let closestY;
  if (param < 0) {
    closestX = x1;
    closestY = y1;
  } else if (param > 1) {
    closestX = x2;
    closestY = y2;
  } else {
    closestX = x1 + param * C;
    closestY = y1 + param * D;
  }

  const dx = x - closestX;
  const dy = y - closestY;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getShapeAtPoint = (shapes, x, y) => {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    const shape = shapes[i];
    if (shape.type === 'rectangle') {
      const { start, end, strokeWidth = 0 } = shape;
      const left = Math.min(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      const inside = x >= left && x <= left + width && y >= top && y <= top + height;
      if (inside) {
        if (hasVisibleFill(shape)) return i;
        const halfStroke = strokeWidth / 2;
        const nearEdge = (
          x <= left + halfStroke ||
          x >= left + width - halfStroke ||
          y <= top + halfStroke ||
          y >= top + height - halfStroke
        );
        if (nearEdge) return i;
      }
    } else if (shape.type === 'circle') {
      const { center, strokeWidth = 0 } = shape;
      const rx = shape.radiusX ?? Math.abs(shape.edge?.x - center.x);
      const ry = shape.radiusY ?? Math.abs(shape.edge?.y - center.y);
      const dx = x - center.x;
      const dy = y - center.y;
      const ellipseEquation = (dx * dx) / (rx * rx || 1) + (dy * dy) / (ry * ry || 1);
      if (hasVisibleFill(shape) && ellipseEquation <= 1) return i;
      if (!hasVisibleFill(shape)) {
        const threshold = strokeWidth / Math.max(rx, ry, 1);
        if (Math.abs(ellipseEquation - 1) <= threshold) return i;
      }
    } else if (shape.type === 'line') {
      const { start, end, strokeWidth = 0 } = shape;
      if (getDistanceToLine(x, y, start.x, start.y, end.x, end.y) <= strokeWidth / 2) return i;
    } else if (shape.type === 'pen') {
      const { points, strokeWidth = 0 } = shape;
      for (let p = 0; p < points.length - 1; p += 1) {
        const dist = getDistanceToLine(x, y, points[p].x, points[p].y, points[p + 1].x, points[p + 1].y);
        if (dist <= strokeWidth / 2) return i;
      }    } else if (shape.type === 'text') {
      const bounds = getBounds(shape);
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) return i;    }
  }
  return null;
};