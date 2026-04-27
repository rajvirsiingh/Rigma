const toPoint = (point) => `${point.x},${point.y}`;
const pointDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const buildVectorPathData = (points, closed = false) => {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${toPoint(points[0])}`;

  const segments = [`M ${toPoint(points[0])}`];

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const c1 = previous.outHandle || previous;
    const c2 = current.inHandle || current;
    segments.push(`C ${toPoint(c1)} ${toPoint(c2)} ${toPoint(current)}`);
  }

  if (closed && points.length > 2) {
    const last = points[points.length - 1];
    const first = points[0];
    const c1 = last.outHandle || last;
    const c2 = first.inHandle || first;
    segments.push(`C ${toPoint(c1)} ${toPoint(c2)} ${toPoint(first)} Z`);
  }

  return segments.join(" ");
};

export const getVectorBounds = (shape) => {
  const allPoints = [];
  (shape.points || []).forEach((point) => {
    allPoints.push({ x: point.x, y: point.y });
    if (point.inHandle) allPoints.push(point.inHandle);
    if (point.outHandle) allPoints.push(point.outHandle);
  });

  if (allPoints.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 };

  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
};

export const getCubicPoint = (p0, p1, p2, p3, t) => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: (mt2 * mt * p0.x) + (3 * mt2 * t * p1.x) + (3 * mt * t2 * p2.x) + (t2 * t * p3.x),
    y: (mt2 * mt * p0.y) + (3 * mt2 * t * p1.y) + (3 * mt * t2 * p2.y) + (t2 * t * p3.y),
  };
};

const getDistanceToCubic = (point, p0, p1, p2, p3, steps = 32) => {
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearestT = 0;
  let nearestPoint = p0;

  let previous = p0;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const current = getCubicPoint(p0, p1, p2, p3, t);

    // Approximate nearest point on cubic with sampled polyline segments.
    const vx = current.x - previous.x;
    const vy = current.y - previous.y;
    const wx = point.x - previous.x;
    const wy = point.y - previous.y;
    const lengthSq = vx * vx + vy * vy;
    const projection = lengthSq > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / lengthSq)) : 0;
    const candidate = {
      x: previous.x + (vx * projection),
      y: previous.y + (vy * projection),
    };
    const candidateDistance = pointDistance(point, candidate);

    if (candidateDistance < nearestDistance) {
      nearestDistance = candidateDistance;
      nearestT = (step - 1 + projection) / steps;
      nearestPoint = candidate;
    }
    previous = current;
  }

  return { distance: nearestDistance, t: nearestT, point: nearestPoint };
};

export const getVectorSegmentHit = (shape, targetPoint, tolerance = 8) => {
  if (!shape || shape.type !== "vectorPen" || !shape.points || shape.points.length < 2) return null;

  let bestHit = null;

  const checkSegment = (from, to, segmentIndex, isClosing = false) => {
    const p0 = { x: from.x, y: from.y };
    const p1 = from.outHandle || p0;
    const p3 = { x: to.x, y: to.y };
    const p2 = to.inHandle || p3;

    const hit = getDistanceToCubic(targetPoint, p0, p1, p2, p3);
    if (hit.distance <= tolerance && (!bestHit || hit.distance < bestHit.distance)) {
      bestHit = {
        segmentIndex,
        isClosing,
        distance: hit.distance,
        t: hit.t,
        point: hit.point,
      };
    }
  };

  for (let i = 0; i < shape.points.length - 1; i += 1) {
    checkSegment(shape.points[i], shape.points[i + 1], i, false);
  }

  if (shape.closed && shape.points.length > 2) {
    checkSegment(shape.points[shape.points.length - 1], shape.points[0], shape.points.length - 1, true);
  }

  return bestHit;
};
