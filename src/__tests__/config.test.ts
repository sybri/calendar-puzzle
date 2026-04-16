import { describe, it, expect } from "vitest";
import { validateConfig, todayTarget } from "../config.js";
import type { PuzzleConfig } from "../config.js";
import wooodzConfig from "../../configs/wooodz-calendar.json";
import puzzleDayConfig from "../../configs/puzzle-day.json";

const wooodz = wooodzConfig as PuzzleConfig;
const puzzleDay = puzzleDayConfig as PuzzleConfig;

describe("validateConfig", () => {
  it("accepts a valid config (wooodz)", () => {
    expect(() => validateConfig(wooodz)).not.toThrow();
  });

  it("accepts a valid config (puzzle-day)", () => {
    expect(() => validateConfig(puzzleDay)).not.toThrow();
  });

  it("throws on duplicate grid value", () => {
    const bad: PuzzleConfig = {
      name: "dup",
      grid: [["A", "B"], ["A", null]],
      groups: {},
      pieces: { P1: [[0, 0]] },
    };
    expect(() => validateConfig(bad)).toThrow("Valeur dupliquée");
  });

  it("throws when a group references a value absent from grid", () => {
    const bad: PuzzleConfig = {
      name: "bad-group",
      grid: [["A", "B"]],
      groups: { g: ["A", "C"] },
      pieces: { P1: [[0, 0]] },
    };
    expect(() => validateConfig(bad)).toThrow("absente de la grille");
  });

  it("throws on empty piece", () => {
    const bad: PuzzleConfig = {
      name: "empty-piece",
      grid: [["A", "B"]],
      groups: {},
      pieces: { P1: [] },
    };
    expect(() => validateConfig(bad)).toThrow("est vide");
  });
});

describe("todayTarget", () => {
  it("returns correct target for a known date (Wooodz)", () => {
    const date = new Date("2025-04-16T12:00:00"); // mercredi 16 avril
    const result = todayTarget(wooodz, date);
    expect(result).toEqual({
      month: "Avr",
      day: "16",
      weekday: "Mercredi",
    });
  });

  it("maps Monday correctly (day index remapping)", () => {
    const monday = new Date("2025-04-14T12:00:00");
    const result = todayTarget(wooodz, monday);
    expect(result.weekday).toBe("Lundi");
  });

  it("maps Sunday correctly", () => {
    const sunday = new Date("2025-04-20T12:00:00");
    const result = todayTarget(wooodz, sunday);
    expect(result.weekday).toBe("Dimanche");
  });

  it("works with puzzle-day config (no weekday group)", () => {
    const date = new Date("2025-12-25T12:00:00");
    const result = todayTarget(puzzleDay, date);
    expect(result).toEqual({
      month: "Dec",
      day: "25",
    });
    expect(result.weekday).toBeUndefined();
  });

  it("falls back to first value for unknown group names", () => {
    const cfg: PuzzleConfig = {
      name: "custom",
      grid: [["X", "Y"]],
      groups: { foo: ["X", "Y"] },
      pieces: { P1: [[0, 0]] },
    };
    const result = todayTarget(cfg);
    expect(result.foo).toBe("X");
  });

  it("clamps to first value when index overflows", () => {
    const cfg: PuzzleConfig = {
      name: "short-month",
      grid: [["A", "B"]],
      groups: { month: ["A", "B"] }, // only 2 entries, getMonth() can return > 1
      pieces: { P1: [[0, 0]] },
    };
    // December = index 11, but only 2 values → overflow → fallback to values[0]
    const dec = new Date("2025-12-01T12:00:00");
    const result = todayTarget(cfg, dec);
    expect(result.month).toBe("A");
  });
});
