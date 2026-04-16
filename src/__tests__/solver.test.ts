import { describe, it, expect } from "vitest";
import { createSolver } from "../solver.js";
import type { PuzzleConfig } from "../config.js";
import type { CellKey } from "../types.js";
import wooodzConfig from "../../configs/wooodz-calendar.json";
import puzzleDayConfig from "../../configs/puzzle-day.json";

const wooodz = wooodzConfig as PuzzleConfig;
const puzzleDay = puzzleDayConfig as PuzzleConfig;

describe("createSolver", () => {
  it("creates a solver without throwing (wooodz)", () => {
    expect(() => createSolver(wooodz)).not.toThrow();
  });

  it("creates a solver without throwing (puzzle-day)", () => {
    expect(() => createSolver(puzzleDay)).not.toThrow();
  });

  it("returns board, pieces, and solve function", () => {
    const { board, pieces, solve } = createSolver(wooodz);
    expect(board).toBeDefined();
    expect(pieces.size).toBe(Object.keys(wooodz.pieces).length);
    expect(typeof solve).toBe("function");
  });
});

describe("solve (wooodz)", () => {
  const { board, pieces, solve } = createSolver(wooodz);
  const target = { month: "Avr", day: "16", weekday: "Mercredi" };

  it("finds a solution for a known solvable target", () => {
    const result = solve(target);
    expect(result.solution).not.toBeNull();
  }, 30_000);

  it("uses each piece exactly once", () => {
    const result = solve(target);
    expect(result.solution!.size).toBe(pieces.size);
  }, 30_000);

  it("covers exactly all non-target valid cells", () => {
    const result = solve(target);
    const targetKeys = new Set<CellKey>(
      Object.values(target).map((v) => board.keyOf(v)),
    );
    const expectedCells = new Set(
      [...board.valid].filter((k) => !targetKeys.has(k)),
    );

    const coveredCells = new Set<CellKey>();
    for (const [, placement] of result.solution!) {
      for (const k of placement) coveredCells.add(k);
    }

    expect(coveredCells.size).toBe(expectedCells.size);
    for (const k of expectedCells) {
      expect(coveredCells.has(k)).toBe(true);
    }
  }, 30_000);

  it("has a positive attempts counter", () => {
    const result = solve(target);
    expect(result.attempts).toBeGreaterThan(0);
  }, 30_000);

  it("reports elapsed time", () => {
    const result = solve(target);
    expect(result.elapsedMs).toBeGreaterThan(0);
  }, 30_000);
});

describe("solve (puzzle-day)", () => {
  const { solve } = createSolver(puzzleDay);

  it("finds a solution for puzzle-day", () => {
    const result = solve({ month: "Jan", day: "1" });
    expect(result.solution).not.toBeNull();
  }, 30_000);
});

describe("solve edge cases", () => {
  it("solves different dates (Jan 1 Mon)", () => {
    const { solve } = createSolver(wooodz);
    const result = solve({ month: "Jan", day: "1", weekday: "Lundi" });
    expect(result.solution).not.toBeNull();
  }, 30_000);

  it("solves last day of year (Dec 31 Dim)", () => {
    const { solve } = createSolver(wooodz);
    const result = solve({ month: "Dec", day: "31", weekday: "Dimanche" });
    expect(result.solution).not.toBeNull();
  }, 30_000);

  it("performance: solves in under 10 seconds", () => {
    const { solve } = createSolver(wooodz);
    const result = solve({ month: "Avr", day: "16", weekday: "Mercredi" });
    expect(result.elapsedMs).toBeLessThan(10_000);
  }, 30_000);
});
