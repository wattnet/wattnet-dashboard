/**
 * Generates src/features/map/data/zoneCrossings.json
 *
 * For each adjacent zone pair, finds the centroid of their shared border
 * and writes it as a static lookup used by FlowArrows.
 *
 * Usage:  node scripts/compute-zone-crossings.mjs
 *
 * Re-run whenever wattnet.geojson changes. Existing entries in the output
 * file are PRESERVED so manual overrides survive regeneration.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GEO_PATH = join(ROOT, "public/maps/wattnet.geojson");
const OUT_PATH = join(ROOT, "src/features/map/data/zoneCrossings.json");

const SHARED_DEG = 0.015; // < ~1.5 km  →  treat as shared border vertex
const NEARBY_DEG = 0.6;   // < ~60 km   →  treat as adjacent (maritime / close borders)

// ── Helpers ──────────────────────────────────────────────────────────────────

// Real polygon vertices only — used for shared-border centroid
function vertexPoints(feature) {
  const pts = [];
  const addRing = (ring) => ring.forEach(c => pts.push(c));
  const g = feature.geometry;
  if (g.type === "Polygon") g.coordinates.forEach(addRing);
  else if (g.type === "MultiPolygon") g.coordinates.flat(1).forEach(addRing);
  return pts;
}

// Vertices + edge midpoints — used only for bbox and proximity detection
function samplePoints(feature) {
  const pts = [];
  const addRing = (ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[i + 1];
      pts.push([ax, ay], [(ax + bx) / 2, (ay + by) / 2]);
    }
  };
  const g = feature.geometry;
  if (g.type === "Polygon") g.coordinates.forEach(addRing);
  else if (g.type === "MultiPolygon") g.coordinates.flat(1).forEach(addRing);
  return pts;
}

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

function bboxOverlap([ax0, ay0, ax1, ay1], [bx0, by0, bx1, by1], margin) {
  return ax0 - margin <= bx1 && ax1 + margin >= bx0 &&
         ay0 - margin <= by1 && ay1 + margin >= by0;
}

function round5(n) { return Math.round(n * 1e5) / 1e5; }

// Area-weighted geographic centroid of a feature
function featureCentroid(feature) {
  const g = feature.geometry;
  const rings = g.type === "Polygon" ? g.coordinates : g.coordinates.flat(1);
  let totalArea = 0, sumX = 0, sumY = 0;
  for (const ring of rings) {
    let area = 0, cx = 0, cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i], [x1, y1] = ring[i + 1];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
    area /= 2;
    const absArea = Math.abs(area);
    totalArea += absArea;
    sumX += (cx / (6 * area)) * absArea;
    sumY += (cy / (6 * area)) * absArea;
  }
  return [sumX / totalArea, sumY / totalArea];
}

// Distance from point to line segment (clamped to segment endpoints)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ── Main ─────────────────────────────────────────────────────────────────────

const geo = JSON.parse(readFileSync(GEO_PATH, "utf8"));
const features = geo.features.filter(f => f.properties?.zoneName);

// Preserve any existing manual overrides
const existing = existsSync(OUT_PATH)
  ? JSON.parse(readFileSync(OUT_PATH, "utf8"))
  : {};

const result = { ...existing };
let added = 0;

const sampled = features.map(f => ({
  zone: f.properties.zoneName,
  verts: vertexPoints(f),        // real vertices for shared-border detection
  pts: samplePoints(f),          // vertices + midpoints for proximity/fallback
  centroid: featureCentroid(f),  // geographic centroid for crossing selection
  box: null,
}));
sampled.forEach(s => (s.box = bbox(s.pts)));

for (let i = 0; i < sampled.length; i++) {
  const { zone: zA, verts: vA, pts: pA, centroid: cA, box: bA } = sampled[i];
  process.stdout.write(`\r[${i + 1}/${sampled.length}] ${zA.padEnd(12)}`);

  for (let j = i + 1; j < sampled.length; j++) {
    const { zone: zB, verts: vB, pts: pB, centroid: cB, box: bB } = sampled[j];
    const key = [zA, zB].sort().join(":");

    // Skip if already in file (preserve manual overrides)
    if (result[key]) continue;
    // Quick bbox rejection
    if (!bboxOverlap(bA, bB, NEARBY_DEG)) continue;

    // Shared border: only real vertices to avoid fake midpoint matches
    const shared = [];
    for (const a of vA) {
      for (const b of vB) {
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < SHARED_DEG)
          shared.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      }
    }

    // Closest sample-point pair for maritime / near-border fallback
    let minDist = Infinity, bestA = null, bestB = null;
    if (shared.length === 0) {
      for (const a of pA) {
        for (const b of pB) {
          const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (d < minDist) { minDist = d; bestA = a; bestB = b; }
        }
      }
    }

    let pt;
    if (shared.length > 0) {
      // Pick the shared vertex closest to the line between the two zone centroids.
      // Avoids averaging over the entire border (which can land inside a zone for
      // complex shapes like HR wrapping around BA).
      let bestDist = Infinity, bestPt = null;
      for (const p of shared) {
        const d = distToSegment(p[0], p[1], cA[0], cA[1], cB[0], cB[1]);
        if (d < bestDist) { bestDist = d; bestPt = p; }
      }
      pt = bestPt;
    } else if (minDist < NEARBY_DEG) {
      // Closest point pair — covers maritime / near borders
      pt = [(bestA[0] + bestB[0]) / 2, (bestA[1] + bestB[1]) / 2];
    } else {
      continue;
    }

    result[key] = [round5(pt[0]), round5(pt[1])];
    added++;
  }
}

console.log(`\n✓ ${added} new crossings  (${Object.keys(result).length} total)`);

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
console.log(`→ ${OUT_PATH}`);
