import { describe, it, expect } from "vitest";
import { Piece, buildPieces } from "../piece.js";
import { Board } from "../board.js";
import { RelCoord } from "../geometry.js";
import type { PuzzleConfig } from "../config.js";
import type { CellKey } from "../types.js";

const miniConfig: PuzzleConfig = {
  name: "mini",
  grid: [
    ["A", "B", "C", "D"],
    ["E", "F", "G", "H"],
    ["I", "J", "K", "L"],
    ["M", "N", "O", "P"],
  ],
  groups: {},
  pieces: {
    Line: [[0, 0], [1, 0], [2, 0]], // horizontal 3-cell bar
    Dot: [[0, 0]],                   // single cell
  },
};

const board = new Board(miniConfig);

describe("Piece", () => {
  const line = new Piece(
    "Line",
    [new RelCoord(0, 0), new RelCoord(1, 0), new RelCoord(2, 0)],
    board,
  );

  it("computes orientations (bar has 2: horizontal + vertical)", () => {
    expect(line.orientations.length).toBe(2);
  });

  it("byCell has an entry for every valid cell", () => {
    for (const key of board.valid) {
      expect(line.byCell.has(key)).toBe(true);
    }
  });

  it("placementsAt returns placements fitting in remaining", () => {
    const remaining = new Set<CellKey>(["0,0", "1,0", "2,0", "3,0"]);
    const placements = line.placementsAt("0,0", remaining);
    expect(placements.length).toBeGreaterThan(0);
    for (const p of placements) {
      for (const k of p) {
        expect(remaining.has(k)).toBe(true);
      }
    }
  });

  it("placementsAt returns empty when piece does not fit", () => {
    // only 2 cells available in a row — 3-cell bar cannot fit
    const remaining = new Set<CellKey>(["0,0", "1,0"]);
    const placements = line.placementsAt("0,0", remaining);
    expect(placements).toHaveLength(0);
  });

  it("canPlace returns true when a placement exists", () => {
    const remaining = new Set<CellKey>(["0,0", "1,0", "2,0"]);
    expect(line.canPlace(remaining)).toBe(true);
  });

  it("canPlace returns false when remaining cells are too fragmented", () => {
    // 3 cells but not adjacent
    const remaining = new Set<CellKey>(["0,0", "2,0", "0,2"]);
    expect(line.canPlace(remaining)).toBe(false);
  });
});

describe("buildPieces", () => {
  it("returns a Map with all piece names from config", () => {
    const pieces = buildPieces(miniConfig.pieces, board);
    expect(pieces.size).toBe(2);
    expect(pieces.has("Line")).toBe(true);
    expect(pieces.has("Dot")).toBe(true);
  });

  it("each piece has a valid byCell lookup", () => {
    const pieces = buildPieces(miniConfig.pieces, board);
    for (const [, piece] of pieces) {
      expect(piece.byCell.size).toBe(board.valid.size);
    }
  });
});
