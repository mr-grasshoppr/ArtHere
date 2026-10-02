import { describe, it, expect } from 'vitest';
import { mixByArtist } from '../mix-by-artist';

type Piece = { artist: string; n: number };

const pieces = (counts: Record<string, number>): Piece[] =>
  Object.entries(counts).flatMap(([artist, count]) => Array.from({ length: count }, (_, n) => ({ artist, n })));

/** A seeded generator, so a failure reproduces. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const artistOf = (p: Piece) => p.artist;

/** Whether any order keeps every artist off their own side and top neighbor. */
function arrangementExists(counts: Record<string, number>): boolean {
  const left = { ...counts };
  const total = Object.values(left).reduce((a, b) => a + b, 0);
  const seq: string[] = [];
  const go = (): boolean => {
    if (seq.length === total) return true;
    for (const k of Object.keys(left)) {
      if (!left[k] || seq[seq.length - 1] === k || seq[seq.length - 3] === k) continue;
      left[k]--;
      seq.push(k);
      if (go()) return true;
      seq.pop();
      left[k]++;
    }
    return false;
  };
  return go();
}

describe('mixByArtist', () => {
  it('keeps every piece exactly once', () => {
    const input = pieces({ a: 4, b: 2, c: 3 });
    const out = mixByArtist(input, artistOf, seeded(1));
    expect(out).toHaveLength(input.length);
    expect(new Set(out)).toEqual(new Set(input));
  });

  it("keeps each artist's own pieces in their order (hero first)", () => {
    const out = mixByArtist(pieces({ a: 4, b: 4, c: 4 }), artistOf, seeded(2));
    for (const artist of ['a', 'b', 'c']) {
      expect(out.filter((p) => p.artist === artist).map((p) => p.n)).toEqual([0, 1, 2, 3]);
    }
  });

  it('never puts one artist beside or directly above themselves when it can be avoided', () => {
    // Real panel shapes: three to six artists, one to four pieces each —
    // checked against an exhaustive search, which says when it's possible.
    let checked = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const rand = seeded(seed);
      const counts: Record<string, number> = {};
      const artists = 3 + Math.floor(rand() * 4);
      for (let i = 0; i < artists; i++) counts[`artist${i}`] = 1 + Math.floor(rand() * 4);
      if (!arrangementExists(counts)) continue;
      checked++;
      const out = mixByArtist(pieces(counts), artistOf, rand);
      for (let i = 1; i < out.length; i++) {
        expect(out[i].artist, `seed ${seed}, beside at ${i}`).not.toBe(out[i - 1].artist);
        if (i >= 3) expect(out[i].artist, `seed ${seed}, above at ${i}`).not.toBe(out[i - 3].artist);
      }
    }
    expect(checked).toBeGreaterThan(250);
  });

  it('keeps clashes to a minimum when one artist has most of the pieces', () => {
    const out = mixByArtist(pieces({ a: 6, b: 1 }), artistOf, seeded(7));
    expect(out).toHaveLength(7);
    expect(out.filter((p) => p.artist === 'b')).toHaveLength(1);
  });

  it('shows every artist once before anyone repeats', () => {
    const out = mixByArtist(pieces({ a: 3, b: 3, c: 3, d: 3 }), artistOf, seeded(4));
    expect(new Set(out.slice(0, 4).map(artistOf)).size).toBe(4);
  });

  it('spreads a prolific artist out instead of leaving their pieces in a clump at the end', () => {
    const out = mixByArtist(pieces({ a: 4, b: 1, c: 1, d: 1, e: 1 }), artistOf, seeded(5));
    const positions = out.flatMap((p, i) => (p.artist === 'a' ? [i] : []));
    expect(positions).toEqual([0, 2, 4, 6]);
  });

  it('varies the order between visits', () => {
    const input = pieces({ a: 2, b: 2, c: 2, d: 2, e: 2 });
    const orders = new Set([1, 2, 3, 4, 5, 6].map((s) => mixByArtist(input, artistOf, seeded(s)).map(artistOf).join('')));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('still returns everything when only one artist is left to place', () => {
    const out = mixByArtist(pieces({ a: 3 }), artistOf, seeded(6));
    expect(out.map((p) => p.n)).toEqual([0, 1, 2]);
  });
});
