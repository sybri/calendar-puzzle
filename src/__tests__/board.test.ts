import { describe, it, expect } from "vitest";
import { Board } from "../board.js";
import type { PuzzleConfig } from "../config.js";

const miniConfig: PuzzleConfig = {
  name: "mini",
  grid: [
    ["A", "B", "C"],
    ["D", null, "E"],
    ["F", "G", "H"],
  ],
  groups: { g: ["A", "B"] },
  labels: { A: "Alpha", B: "Beta" },
  pieces: { P1: [[0, 0]] },
};

describe("Board", () => {
  const board = new Board(miniConfig);

  it("builds cells map with correct size (excludes null)", () => {
    expect(board.cells.size).toBe(8);
  });

  it("computes rows and cols correctly", () => {
    expect(board.rows).toBe(3);
    expect(board.cols).toBe(3);
  });

  it("byValue maps each value to its CellKey", () => {
    expect(board.byValue.get("A")).toBe("0,0");
    expect(board.byValue.get("E")).toBe("2,1");
    expect(board.byValue.get("H")).toBe("2,2");
  });

  it("valid set matches cells keys", () => {
    expect(board.valid.size).toBe(board.cells.size);
    for (const key of board.cells.keys()) {
      expect(board.valid.has(key)).toBe(true);
    }
  });

  it("null cell is excluded from valid", () => {
    expect(board.valid.has("1,1")).toBe(false);
  });

  it("key(x, y) returns 'x,y' format", () => {
    expect(board.key(2, 3)).toBe("2,3");
  });

  it("keyOf(value) returns correct key", () => {
    expect(board.keyOf("D")).toBe("0,1");
  });

  it("keyOf throws for unknown value", () => {
    expect(() => board.keyOf("Z")).toThrow('Valeur "Z" introuvable');
  });

  it("labelAt returns label when present", () => {
    expect(board.labelAt("0,0")).toBe("Alpha");
  });

  it("labelAt returns raw value when no label", () => {
    expect(board.labelAt("2,2")).toBe("H");
  });

  it("labelAt returns '?' for invalid key", () => {
    expect(board.labelAt("1,1")).toBe("?");
    expect(board.labelAt("9,9")).toBe("?");
  });

  it("pivot returns top-left-most key from a set", () => {
    const keys = new Set(["2,1", "0,2", "1,0", "0,0"] as const);
    expect(board.pivot(keys)).toBe("0,0");
  });

  it("pivot sorts by y first, then x", () => {
    const keys = new Set(["2,0", "0,1"] as const);
    expect(board.pivot(keys)).toBe("2,0");
  });
});

describe("Board with ragged grid", () => {
  it("handles rows of different lengths", () => {
    const ragged: PuzzleConfig = {
      name: "ragged",
      grid: [["A", "B", "C"], ["D", "E"]],
      groups: {},
      pieces: { P1: [[0, 0]] },
    };
    const board = new Board(ragged);
    expect(board.cols).toBe(3);
    expect(board.rows).toBe(2);
    expect(board.cells.size).toBe(5);
  });
});
