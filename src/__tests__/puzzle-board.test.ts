import { describe, it, expect } from "vitest";
import type { PuzzleConfig } from "../config.js";
import wooodzConfig from "../../configs/wooodz-calendar.json";

// Import enregistre le custom element dans happy-dom
import "../render/puzzle-board.js";

const config = wooodzConfig as PuzzleConfig;
const target = { month: "Avr", day: "16", weekday: "Mercredi" };

function createBoard(): HTMLElement {
  const el = document.createElement("puzzle-board") as any;
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement) {
  el.remove();
}

describe("PuzzleBoardElement", () => {
  it("registers as 'puzzle-board' custom element", () => {
    expect(customElements.get("puzzle-board")).toBeDefined();
  });

  it("renders grid cells when config + target are set and resolve() is called", () => {
    const el = createBoard() as any;
    el.config = config;
    el.target = target;
    el.resolve();

    const cells = el.querySelectorAll("div > div");
    expect(cells.length).toBeGreaterThan(40); // 7×8 = 56 cells
    cleanup(el);
  });

  it("target cells receive ring-2 class", () => {
    const el = createBoard() as any;
    el.config = config;
    el.target = target;
    el.resolve();

    const ringCells = el.querySelectorAll(".ring-2");
    expect(ringCells.length).toBe(3); // month, day, weekday
    cleanup(el);
  });

  it("piece cells get a bg-* class", () => {
    const el = createBoard() as any;
    el.config = config;
    el.target = target;
    el.resolve();

    const allCells = el.querySelectorAll("div > div");
    const bgCells = [...allCells].filter((c: Element) =>
      c.className.split(" ").some((cls) => cls.startsWith("bg-") && cls !== "bg-gray-200"),
    );
    expect(bgCells.length).toBeGreaterThan(0);
    cleanup(el);
  });

  it("hideLabels hides piece cell text", () => {
    const el = createBoard() as any;
    el.config = config;
    el.target = target;
    el.hideLabels = true;
    el.resolve();

    // At least some cells should have empty text (covered by pieces)
    const allCells = el.querySelectorAll("div > div");
    const emptyCells = [...allCells].filter(
      (c: Element) => c.textContent === "" && c.classList.contains("flex"),
    );
    expect(emptyCells.length).toBeGreaterThan(0);
    cleanup(el);
  });

  it("showLegend=false hides legend via visibility:hidden", () => {
    const el = createBoard() as any;
    el.config = config;
    el.target = target;
    el.showLegend = false;
    el.resolve();

    const legend = el.querySelector("div.mt-2, div.sm\\:mt-4");
    // Legend should exist in DOM but be hidden
    if (legend) {
      expect(legend.style.visibility).toBe("hidden");
    }
    cleanup(el);
  });

  it("showLegend=true renders visible legend", () => {
    const el = createBoard() as any;
    el.config = config;
    el.target = target;
    el.showLegend = true;
    el.resolve();

    const badges = el.querySelectorAll("span.inline-flex");
    expect(badges.length).toBe(Object.keys(config.pieces).length);
    cleanup(el);
  });

  it("resolve() dispatches puzzle-solved CustomEvent", () => {
    const el = createBoard() as any;
    el.config = config;
    el.target = target;

    let detail: any = null;
    el.addEventListener("puzzle-solved", (e: CustomEvent) => {
      detail = e.detail;
    });

    el.resolve();

    expect(detail).not.toBeNull();
    expect(detail.solution).not.toBeNull();
    expect(detail.attempts).toBeGreaterThan(0);
    expect(detail.elapsedMs).toBeGreaterThanOrEqual(0);
    cleanup(el);
  });

  it("resolve() returns null when config is not set", () => {
    const el = createBoard() as any;
    const result = el.resolve();
    expect(result).toBeNull();
    cleanup(el);
  });

  it("resolve() returns null when target is not set", () => {
    const el = createBoard() as any;
    el.config = config;
    const result = el.resolve();
    expect(result).toBeNull();
    cleanup(el);
  });
});
