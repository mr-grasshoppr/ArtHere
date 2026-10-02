// Lays out map pins so they never overlap, at any zoom, as call-outs: a pin
// that overlaps another at its real spot is nudged just clear, joined to its
// spot by a short leader line. Pins with room stay exactly on their spot.
//
// It settles like a few springs and spacers: every nudged pin is pulled back
// toward its real spot, and any two pins that would touch are pushed apart.
// Where that comes to rest, each pin is as close to its real spot as it can
// be without touching another — so the arrangement mirrors the real one and
// every line is only as long as the separation needs.
//
// It also carries over between zoom steps: each layout starts from where the
// previous one left the pins (`previous`), not from scratch. Laying out from
// scratch each step let a crowded group come to rest a different way every
// frame, so pins swapped places and sprawled as you zoomed; starting from the
// last frame, they glide.

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface CalloutLayout {
  /** Where to draw each pin, in the input's order. */
  positions: ScreenPoint[];
  /**
   * Each pin's real spot, when it was nudged off it — the leader line runs
   * from here to the pin. Null for a pin drawn on its own spot.
   */
  anchors: (ScreenPoint | null)[];
  /** Each pin's nudge from its real spot — pass back in as `previous` next frame. */
  offsets: ScreenPoint[];
}

const ROUNDS = 60;
// Each round, a nudged pin moves this share of the way back to its real spot
// before the spacing is enforced again.
const PULL = 0.15;
// Spacing passes per round, and a final set so the result never touches.
const SPACING_PASSES = 3;
const FINAL_PASSES = 40;

/**
 * Where to draw every pin, given their real spots on screen. Only pins closer
 * than `touchDistance` to another pin — actually overlapping — are nudged;
 * nudged pins keep `minDistance` (which adds a little breathing room) from
 * everything. `previous` is the last frame's `offsets`, to carry over.
 */
export function layoutCallouts(
  points: ScreenPoint[],
  minDistance: number,
  touchDistance = minDistance,
  previous?: ScreenPoint[]
): CalloutLayout {
  const n = points.length;
  const nudged = points.map((p, i) => points.some((q, j) => j !== i && Math.hypot(p.x - q.x, p.y - q.y) < touchDistance));

  // Start where the last frame left each nudged pin. With nothing to carry
  // over, start on the real spot — fanning out any that share one exactly,
  // so there's a direction to push them in.
  const pos = points.map((p, i) => {
    const prev = nudged[i] ? previous?.[i] : undefined;
    return prev ? { x: p.x + prev.x, y: p.y + prev.y } : { x: p.x, y: p.y };
  });
  for (let i = 0; i < n; i++) {
    if (!nudged[i] || previous?.[i]) continue;
    for (let j = 0; j < i; j++) {
      if (Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y) < 1e-6) {
        const angle = -Math.PI / 2 + i * 2.399963; // golden angle: never repeats
        pos[i].x += Math.cos(angle) * 0.05;
        pos[i].y += Math.sin(angle) * 0.05;
        break;
      }
    }
  }

  const space = () => {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (!nudged[i] && !nudged[j]) continue;
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const d = Math.hypot(dx, dy) || 1e-6;
        if (d >= minDistance) continue;
        // A hair over the shortfall, so pairs actually clear rather than
        // creeping up on the minimum forever. A nudged pin touching one on
        // its own spot moves the whole way itself; two nudged pins split it.
        const shortfall = minDistance - d + 0.01;
        const [si, sj] = nudged[i] && nudged[j] ? [shortfall / 2, shortfall / 2] : nudged[i] ? [shortfall, 0] : [0, shortfall];
        pos[i].x -= (dx / d) * si;
        pos[i].y -= (dy / d) * si;
        pos[j].x += (dx / d) * sj;
        pos[j].y += (dy / d) * sj;
        moved = true;
      }
    }
    return moved;
  };

  for (let round = 0; round < ROUNDS; round++) {
    for (let i = 0; i < n; i++) {
      if (!nudged[i]) continue;
      pos[i].x += (points[i].x - pos[i].x) * PULL;
      pos[i].y += (points[i].y - pos[i].y) * PULL;
    }
    for (let pass = 0; pass < SPACING_PASSES; pass++) if (!space()) break;
  }
  for (let pass = 0; pass < FINAL_PASSES; pass++) if (!space()) break;

  return {
    positions: pos,
    anchors: points.map((p, i) => (nudged[i] ? p : null)),
    offsets: pos.map((p, i) => ({ x: p.x - points[i].x, y: p.y - points[i].y })),
  };
}
