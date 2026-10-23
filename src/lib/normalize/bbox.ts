export interface BoundingBox {
  x: number;      // Normalized horizontal coordinate (0.0 to 1.0)
  y: number;      // Normalized vertical coordinate (0.0 to 1.0)
  width: number;  // Normalized width (0.0 to 1.0)
  height: number; // Normalized height (0.0 to 1.0)
}

/**
 * Normalizes any bounding box input (normalized, pixel-based, or [ymin, xmin, ymax, xmax])
 * to a standardized BoundingBox with coordinates strictly bounded within [0.0, 1.0].
 */
export function normalizeBBox(
  rawBbox?: unknown,
  baseWidth = 600,
  baseHeight = 520
): BoundingBox | undefined {
  if (!rawBbox) return undefined;

  // Handle [ymin, xmin, ymax, xmax] array format (standard in some vision APIs)
  if (Array.isArray(rawBbox) && rawBbox.length === 4) {
    const [ymin, xmin, ymax, xmax] = rawBbox.map(Number);
    const scale = Math.max(ymin, xmin, ymax, xmax) > 1.0 ? 1000 : 1.0;
    const x0 = Math.max(0, Math.min(1, xmin / scale));
    const y0 = Math.max(0, Math.min(1, ymin / scale));
    const x1 = Math.max(0, Math.min(1, xmax / scale));
    const y1 = Math.max(0, Math.min(1, ymax / scale));
    return {
      x: Math.round(x0 * 1000) / 1000,
      y: Math.round(y0 * 1000) / 1000,
      width: Math.round(Math.max(0.01, x1 - x0) * 1000) / 1000,
      height: Math.round(Math.max(0.01, y1 - y0) * 1000) / 1000,
    };
  }

  // Handle object format { x, y, width, height }
  if (typeof rawBbox === 'object' && rawBbox !== null) {
    const b = rawBbox as Record<string, unknown>;
    const x = Number(b.x ?? 0);
    const y = Number(b.y ?? 0);
    const width = Number(b.width ?? 0);
    const height = Number(b.height ?? 0);

    // If already normalized <= 1.0
    if (x <= 1.0 && y <= 1.0 && width <= 1.0 && height <= 1.0 && (width > 0 || height > 0)) {
      return {
        x: Math.round(Math.max(0, Math.min(1, x)) * 1000) / 1000,
        y: Math.round(Math.max(0, Math.min(1, y)) * 1000) / 1000,
        width: Math.round(Math.max(0.01, Math.min(1 - x, width)) * 1000) / 1000,
        height: Math.round(Math.max(0.01, Math.min(1 - y, height)) * 1000) / 1000,
      };
    }

    // If in percentage 0..100
    if (x <= 100 && y <= 100 && width <= 100 && height <= 100 && (x > 1.0 || y > 1.0)) {
      return {
        x: Math.round(Math.max(0, Math.min(1, x / 100)) * 1000) / 1000,
        y: Math.round(Math.max(0, Math.min(1, y / 100)) * 1000) / 1000,
        width: Math.round(Math.max(0.01, Math.min(1, width / 100)) * 1000) / 1000,
        height: Math.round(Math.max(0.01, Math.min(1, height / 100)) * 1000) / 1000,
      };
    }

    // Absolute pixel coordinates scaled to reference base
    const scaleW = baseWidth || 600;
    const scaleH = baseHeight || 520;
    const nx = Math.max(0, Math.min(1, x / scaleW));
    const ny = Math.max(0, Math.min(1, y / scaleH));
    const nw = Math.max(0.01, Math.min(1 - nx, width / scaleW));
    const nh = Math.max(0.01, Math.min(1 - ny, height / scaleH));

    return {
      x: Math.round(nx * 1000) / 1000,
      y: Math.round(ny * 1000) / 1000,
      width: Math.round(nw * 1000) / 1000,
      height: Math.round(nh * 1000) / 1000,
    };
  }

  return undefined;
}
