import { describe, it, expect } from "vitest";
import { createSolver } from "../solver.js";
import { validateConfig } from "../config.js";
import type { PuzzleConfig } from "../config.js";
import config from "../../configs/puzzle-my-day.json";

const cfg = config as PuzzleConfig;

describe("puzzle-my-day config", () => {
  it("passes validation", () => {
    expect(() => validateConfig(cfg)).not.toThrow();
  });

  it("solves Apr 16 Wed", () => {
    const { solve } = createSolver(cfg);
    const result = solve({ month: "Apr", day: "16", weekday: "Wed" });
    expect(result.solution).not.toBeNull();
  }, 30_000);

  it("solves Jan 1 Mon", () => {
    const { solve } = createSolver(cfg);
    const result = solve({ month: "Jan", day: "1", weekday: "Mon" });
    expect(result.solution).not.toBeNull();
  }, 30_000);

  it("solves Dec 31 Sun", () => {
    const { solve } = createSolver(cfg);
    const result = solve({ month: "Dec", day: "31", weekday: "Sun" });
    expect(result.solution).not.toBeNull();
  }, 30_000);
});
