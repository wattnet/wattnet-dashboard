/**
 * Generates src/features/map/data/zoneCrossings.json
 *
 * For each adjacent zone pair, finds the midpoint of their shared border
 * and writes it as a static lookup used by FlowArrows.
 *
 * Algorithm for shared land borders:
 *   1. Collect all vertices shared between the two zone polygons (within
 *      SHARED_DEG) and deduplicate.
 *   2. Walk EACH zone's polygon ring in vertex order to emit shared vertices
 *      in topological ring order.
 *   3. Split the ring-ordered sequence into contiguous sections where any
 *      geographic gap > SECTION_GAP starts a new section. This handles
 *      borders with multiple non-contiguous segments (e.g. BA:HR Slavonia
 *      + Dalmatia, or FI:NO4 with fjord interruptions).
 *   4. Compute the 50%-arc-length midpoint across ALL sections in ring order
 *      (inter-section gaps are skipped — only intra-section arc is counted).
 *      This is the true midpoint of the total shared border.
 *   5. Average the midpoints from both zones' rings. For dense borders both
 *      rings agree; for very sparse borders (few shared vertices) neither
 *      ring alone is reliable and the average is a stable estimate.
 *   6. Special cases:
 *      - 1 unique vertex (tripoint): try the closest non-tripoint
 *        sample-point pair; fall back to the tripoint itself.
 *
 * Algorithm for maritime / near borders (no shared vertices):
 *   Midpoint of the closest sample-point pair across the two zones.
 *
 * Manual overrides are embedded in MANUAL_OVERRIDES below so they survive
 * regeneration. Add new overrides there rather than editing the JSON.
 *
 * Usage:  node scripts/compute-zone-crossings.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GEO_PATH = join(ROOT, "public/maps/wattnet.geojson");
const OUT_PATH = join(ROOT, "src/features/map/data/zoneCrossings.json");

const SHARED_DEG  = 0.015; // < ~1.5 km  →  treat as shared border vertex
const NEARBY_DEG  = 0.6;   // < ~60 km   →  treat as adjacent (maritime / close)
const SECTION_GAP = 0.5;   // gap > 0.5° between consecutive ring-ordered shared
                            // vertices triggers a new border section

// Manual overrides — values here take precedence over the computed result.
// Add pairs where the algorithm produces a wrong or misleading position.
const MANUAL_OVERRIDES = {
  "GB:IE":   [-5.5,      53.3     ], // Irish Sea — no land border, wider than NEARBY_DEG
  "NO4:SE2": [13.71641,  64.04621 ], // E-W section of border (user override)
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function vertexPoints(feature) {
  const pts = [];
  const addRing = (ring) => ring.forEach(c => pts.push(c));
  const g = feature.geometry;
  if (g.type === "Polygon") g.coordinates.forEach(addRing);
  else if (g.type === "MultiPolygon") g.coordinates.flat(1).forEach(addRing);
  return pts;
}

function samplePoints(feature) {
  const pts = [];
  const addRing = (ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const [ax, ay] = ring[i], [bx, by] = ring[i + 1];
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

function dedup(pts) {
  const out = [];
  for (const p of pts)
    if (!out.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < SHARED_DEG))
      out.push(p);
  return out;
}

// Walk one zone's polygon ring, emitting shared vertices in ring order.
function ringOrderedShared(allVerts, unique) {
  const ordered = [], used = new Set();
  for (const v of allVerts) {
    for (let si = 0; si < unique.length; si++) {
      if (used.has(si)) continue;
      if (Math.hypot(v[0] - unique[si][0], v[1] - unique[si][1]) < SHARED_DEG) {
        ordered.push(unique[si]);
        used.add(si);
        break;
      }
    }
  }
  return ordered.length ? ordered : unique;
}

// 50% arc-length midpoint of the shared border, traversing sections in ring
// order and skipping inter-section gaps.
function ringMidpoint(allVerts, unique) {
  if (unique.length === 1) return unique[0];

  const pts = ringOrderedShared(allVerts, unique);

  // Split into contiguous sections; large geographic gap = new section
  const sections = [[pts[0]]];
  for (let i = 1; i < pts.length; i++) {
    if (Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]) > SECTION_GAP)
      sections.push([]);
    sections[sections.length - 1].push(pts[i]);
  }

  // Total intra-section arc length (gaps between sections are excluded)
  let totalLen = 0;
  for (const sec of sections)
    for (let i = 0; i < sec.length - 1; i++)
      totalLen += Math.hypot(sec[i+1][0] - sec[i][0], sec[i+1][1] - sec[i][1]);

  // Sparse border: all sections are single vertices — return median vert
  if (totalLen === 0) {
    const mid = Math.floor(pts.length / 2);
    return pts.length % 2 === 0
      ? [(pts[mid-1][0] + pts[mid][0]) / 2, (pts[mid-1][1] + pts[mid][1]) / 2]
      : pts[mid];
  }

  // Walk sections in ring order, find 50% arc-length point
  let target = totalLen / 2;
  for (const sec of sections) {
    for (let i = 0; i < sec.length - 1; i++) {
      const seg = Math.hypot(sec[i+1][0] - sec[i][0], sec[i+1][1] - sec[i][1]);
      if (target <= seg) {
        const t = target / seg;
        return [sec[i][0] + t * (sec[i+1][0] - sec[i][0]),
                sec[i][1] + t * (sec[i+1][1] - sec[i][1])];
      }
      target -= seg;
    }
  }
  return sections[sections.length - 1][sections[sections.length - 1].length - 1];
}

// True midpoint of the shared border: average both zones' ring orderings.
// For dense borders both rings agree; for sparse borders the average is a
// stable estimate where neither ordering alone is reliable.
function borderMidpoint(vertsA, vertsB, unique) {
  const mA = ringMidpoint(vertsA, unique);
  const mB = ringMidpoint(vertsB, unique);
  return [(mA[0] + mB[0]) / 2, (mA[1] + mB[1]) / 2];
}

// ── Main ─────────────────────────────────────────────────────────────────────

const geo = JSON.parse(readFileSync(GEO_PATH, "utf8"));
const features = geo.features.filter(f => f.properties?.zoneName);

// Start with manual overrides; everything else is computed fresh
const result = { ...MANUAL_OVERRIDES };
let added = 0;

const sampled = features.map(f => ({
  zone: f.properties.zoneName,
  verts: vertexPoints(f),
  pts: samplePoints(f),
  box: null,
}));
sampled.forEach(s => (s.box = bbox(s.pts)));

for (let i = 0; i < sampled.length; i++) {
  const { zone: zA, verts: vA, pts: pA, box: bA } = sampled[i];
  process.stdout.write(`\r[${i + 1}/${sampled.length}] ${zA.padEnd(12)}`);

  for (let j = i + 1; j < sampled.length; j++) {
    const { zone: zB, verts: vB, pts: pB, box: bB } = sampled[j];
    const key = [zA, zB].sort().join(":");

    if (result[key]) continue;
    if (!bboxOverlap(bA, bB, NEARBY_DEG)) continue;

    const raw = [];
    for (const a of vA)
      for (const b of vB)
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < SHARED_DEG)
          raw.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);

    let pt;

    if (raw.length > 0) {
      const unique = dedup(raw);

      if (unique.length >= 2) {
        pt = borderMidpoint(vA, vB, unique);
      } else {
        // Tripoint: try closest non-tripoint sample pair
        const tp = unique[0];
        let minDist = Infinity, bestA = null, bestB = null;
        for (const a of pA) {
          if (Math.hypot(a[0] - tp[0], a[1] - tp[1]) < SHARED_DEG) continue;
          for (const b of pB) {
            if (Math.hypot(b[0] - tp[0], b[1] - tp[1]) < SHARED_DEG) continue;
            const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            if (d < minDist) { minDist = d; bestA = a; bestB = b; }
          }
        }
        pt = (bestA && minDist < NEARBY_DEG)
          ? [(bestA[0] + bestB[0]) / 2, (bestA[1] + bestB[1]) / 2]
          : tp;
      }

    } else {
      // Maritime / near border: midpoint of closest sample-point pair
      let minDist = Infinity, bestA = null, bestB = null;
      for (const a of pA)
        for (const b of pB) {
          const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (d < minDist) { minDist = d; bestA = a; bestB = b; }
        }
      if (minDist >= NEARBY_DEG) continue;
      pt = [(bestA[0] + bestB[0]) / 2, (bestA[1] + bestB[1]) / 2];
    }

    result[key] = [round5(pt[0]), round5(pt[1])];
    added++;
  }
}

console.log(`\n✓ ${added} computed + ${Object.keys(MANUAL_OVERRIDES).length} manual overrides  (${Object.keys(result).length} total)`);
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
console.log(`→ ${OUT_PATH}`);
