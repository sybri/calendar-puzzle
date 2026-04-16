import { describe, it, expect } from "vitest";
import { createSolver } from "../solver.js";
import { validateConfig } from "../config.js";
import type { PuzzleConfig } from "../config.js";
import wholeYearConfig from "../../configs/whole-year.json";

const config = wholeYearConfig as PuzzleConfig;

describe("whole-year config", () => {
  it("passes validation", () => {
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("solves Apr 16", () => {
    const { solve } = createSolver(config);
    const result = solve({ month: "Apr", day: "16" });
    expect(result.solution).not.toBeNull();
  }, 30_000);

  it("solves Jan 1", () => {
    const { solve } = createSolver(config);
    const result = solve({ month: "Jan", day: "1" });
    expect(result.solution).not.toBeNull();
  }, 30_000);

  it("solves Dec 31", () => {
    const { solve } = createSolver(config);
    const result = solve({ month: "Dec", day: "31" });
    expect(result.solution).not.toBeNull();
  }, 30_000);
});
