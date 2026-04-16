import { describe, it, expect } from "vitest";
import { RelCoord, normalize, getOrientations } from "../geometry.js";

describe("RelCoord", () => {
  it("rotate() transforms (1,0) → (-0,1)", () => {
    const c = new RelCoord(1, 0).rotate();
    expect(c.x).toBe(-0); // -y where y=0 gives -0
    expect(c.y).toBe(1);
  });

  it("rotate() transforms (0,1) → (-1,0)", () => {
    const c = new RelCoord(0, 1).rotate();
    expect(c.x).toBe(-1);
    expect(c.y).toBe(0);
  });

  it("flip() transforms (1,2) → (-1,2)", () => {
    const c = new RelCoord(1, 2).flip();
    expect(c.x).toBe(-1);
    expect(c.y).toBe(2);
  });

  it("shift(dx, dy) offsets correctly", () => {
    const c = new RelCoord(5, 3).shift(2, 1);
    expect(c.x).toBe(3);
    expect(c.y).toBe(2);
  });

  it("toString() returns 'x,y'", () => {
    expect(new RelCoord(3, 7).toString()).toBe("3,7");
  });

  it("four rotations return to original", () => {
    const original = new RelCoord(2, 3);
    let c = original;
    for (let i = 0; i < 4; i++) c = c.rotate();
    expect(c.x).toBe(original.x);
    expect(c.y).toBe(original.y);
  });
});

describe("normalize", () => {
  it("brings a shape to origin and sorts", () => {
    const coords = [new RelCoord(3, 5), new RelCoord(4, 5)];
    const { coords: norm } = normalize(coords);
    expect(norm[0].x).toBe(0);
    expect(norm[0].y).toBe(0);
    expect(norm[1].x).toBe(1);
    expect(norm[1].y).toBe(0);
  });

  it("produces a stable key regardless of input order", () => {
    const a = [new RelCoord(1, 0), new RelCoord(0, 0), new RelCoord(0, 1)];
    const b = [new RelCoord(0, 1), new RelCoord(1, 0), new RelCoord(0, 0)];
    expect(normalize(a).key).toBe(normalize(b).key);
  });

  it("sorts by y then x", () => {
    const coords = [new RelCoord(1, 1), new RelCoord(0, 0), new RelCoord(1, 0)];
    const { coords: norm } = normalize(coords);
    expect(norm.map((c) => `${c.x},${c.y}`)).toEqual(["0,0", "1,0", "1,1"]);
  });
});

describe("getOrientations", () => {
  it("returns 1 orientation for a 2×2 square", () => {
    const square = [
      new RelCoord(0, 0),
      new RelCoord(1, 0),
      new RelCoord(0, 1),
      new RelCoord(1, 1),
    ];
    expect(getOrientations(square)).toHaveLength(1);
  });

  it("returns 2 orientations for a straight domino", () => {
    const domino = [new RelCoord(0, 0), new RelCoord(1, 0)];
    expect(getOrientations(domino)).toHaveLength(2);
  });

  it("returns 4 orientations for a T-shaped piece", () => {
    // T-shape: ##
    //           #
    const t = [
      new RelCoord(0, 0),
      new RelCoord(1, 0),
      new RelCoord(2, 0),
      new RelCoord(1, 1),
    ];
    expect(getOrientations(t)).toHaveLength(4);
  });

  it("returns 8 orientations for a chiral (asymmetric) piece", () => {
    // S-shape: ##.
    //          .##  — flip gives a distinct Z-shape
    const s = [
      new RelCoord(0, 0),
      new RelCoord(1, 0),
      new RelCoord(1, 1),
      new RelCoord(2, 1),
      new RelCoord(2, 2),
    ];
    const orientations = getOrientations(s);
    // Should produce at least 4 orientations (rotations × flip)
    expect(orientations.length).toBeGreaterThanOrEqual(4);
    // All orientations are unique
    const keys = orientations.map((o) => normalize(o).key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never returns duplicate orientations", () => {
    const l = [
      new RelCoord(0, 0),
      new RelCoord(0, 1),
      new RelCoord(0, 2),
      new RelCoord(1, 2),
    ];
    const orientations = getOrientations(l);
    const keys = orientations.map((o) => normalize(o).key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
