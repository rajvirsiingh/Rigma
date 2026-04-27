import { jsPDF } from "jspdf";
import { buildVectorPathData } from "./vectorPath";

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const buildRoundedRectPath = (x, y, width, height, radius) => {
  const clamp = (val, max) => Math.max(0, Math.min(val, max));
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
    "Z",
  ].join(" ");
};

const shapeToMarkup = (shape, index) => {
  if (shape.type === "rectangle") {
    const x = Math.min(shape.start.x, shape.end.x);
    const y = Math.min(shape.start.y, shape.end.y);
    const width = Math.abs(shape.end.x - shape.start.x);
    const height = Math.abs(shape.end.y - shape.start.y);
    const d = buildRoundedRectPath(x, y, width, height, shape.borderRadius);
    return `<path d="${d}" fill="${shape.fillColor || "transparent"}" stroke="${shape.strokeColor || "#000000"}" stroke-width="${shape.strokeWidth || 0}" />`;
  }
  if (shape.type === "line") {
    return `<line x1="${shape.start.x}" y1="${shape.start.y}" x2="${shape.end.x}" y2="${shape.end.y}" stroke="${shape.strokeColor || "#000000"}" stroke-width="${shape.strokeWidth || 2}" />`;
  }
  if (shape.type === "circle") {
    return `<ellipse cx="${shape.center.x}" cy="${shape.center.y}" rx="${shape.radiusX}" ry="${shape.radiusY}" fill="${shape.fillColor || "transparent"}" stroke="${shape.strokeColor || "#000000"}" stroke-width="${shape.strokeWidth || 0}" />`;
  }
  if (shape.type === "freehand") {
    const points = (shape.points || []).map((point) => `${point.x},${point.y}`).join(" ");
    return `<polyline points="${points}" fill="none" stroke="${shape.strokeColor || "#000000"}" stroke-width="${shape.strokeWidth || 2}" stroke-linecap="round" stroke-linejoin="round" />`;
  }
  if (shape.type === "vectorPen") {
    const d = buildVectorPathData(shape.points || [], Boolean(shape.closed));
    return `<path d="${d}" fill="${shape.closed ? (shape.fillColor || "transparent") : "transparent"}" stroke="${shape.strokeColor || "#000000"}" stroke-width="${shape.strokeWidth || 2}" />`;
  }
  if (shape.type === "text") {
    const rotate = shape.rotation ? ` transform="rotate(${shape.rotation} ${shape.x} ${shape.y})"` : "";
    return `<text x="${shape.x}" y="${shape.y}" fill="${shape.fillColor || "#000000"}" font-family="${escapeXml(shape.fontFamily || "Arial")}" font-size="${shape.fontSize || 24}" text-anchor="${shape.textAlign === "center" ? "middle" : shape.textAlign === "right" ? "end" : "start"}"${rotate}>${escapeXml(shape.text || "")}</text>`;
  }
  if (shape.type === "image") {
    const crop = shape.crop || { x: 0, y: 0, width: 1, height: 1 };
    const safeCropWidth = Math.max(0.01, crop.width);
    const safeCropHeight = Math.max(0.01, crop.height);
    const drawX = shape.x - ((crop.x / safeCropWidth) * shape.width);
    const drawY = shape.y - ((crop.y / safeCropHeight) * shape.height);
    const drawW = shape.width / safeCropWidth;
    const drawH = shape.height / safeCropHeight;
    const clipId = `export-image-clip-${shape.id || index}`;
    return `<g><clipPath id="${clipId}"><rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" /></clipPath><image x="${drawX}" y="${drawY}" width="${drawW}" height="${drawH}" href="${shape.href}" preserveAspectRatio="none" clip-path="url(#${clipId})" /></g>`;
  }
  return "";
};

export const buildExportSvg = (shapes, width, height) => {
  const body = shapes.map((shape, index) => shapeToMarkup(shape, index)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff" />${body}</svg>`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const downloadAsSvg = (shapes, width, height) => {
  const svgText = buildExportSvg(shapes, width, height);
  downloadBlob(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }), "whiteboard.svg");
};

const renderSvgToCanvas = (svgText, width, height) =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const image = new Image();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    image.onload = () => {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    image.onerror = reject;
    image.src = url;
  });

export const downloadAsPng = async (shapes, width, height) => {
  const svgText = buildExportSvg(shapes, width, height);
  const canvas = await renderSvgToCanvas(svgText, width, height);
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "whiteboard.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const downloadAsPdf = async (shapes, width, height) => {
  const svgText = buildExportSvg(shapes, width, height);
  const canvas = await renderSvgToCanvas(svgText, width, height);
  const pngData = canvas.toDataURL("image/png");
  const orientation = width >= height ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "pt", format: [width, height] });
  doc.addImage(pngData, "PNG", 0, 0, width, height);
  doc.save("whiteboard.pdf");
};
