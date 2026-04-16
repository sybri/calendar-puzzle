import type { Meta, StoryObj } from "@storybook/web-components";
import { expect } from "storybook/test";
import type { PuzzleConfig } from "../config.js";
import type { PieceColor } from "../render/puzzle-board.js";
import "../render/puzzle-board.js";

import wooodzConfig from "../../configs/wooodz-calendar.json";

const config = wooodzConfig as PuzzleConfig;
const target = { month: "Avr", day: "16", weekday: "Mercredi" };

function renderThemed(options: {
  pieceColors: PieceColor[];
  targetClasses: string;
  emptyClasses: string;
  borderColor?: string;
}) {
  const wrapper = document.createElement("div");
  wrapper.style.width = "min(28rem, 100%)";

  const boardEl = document.createElement("puzzle-board") as any;
  boardEl.className = "block";
  boardEl.config = config;
  boardEl.target = target;
  boardEl.pieceColors = options.pieceColors;
  boardEl.targetClasses = options.targetClasses;
  boardEl.emptyClasses = options.emptyClasses;
  boardEl.resolve();

  wrapper.appendChild(boardEl);

  // Surcharge couleur de bordure si demandé
  if (options.borderColor) {
    requestAnimationFrame(() => {
      boardEl
        .querySelectorAll("[class*=border-gray-800]")
        .forEach((el: HTMLElement) => {
          el.classList.remove("border-gray-800");
          el.classList.add(options.borderColor!);
        });
    });
  }

  return wrapper;
}

const meta: Meta = {
  title: "Guide/Themes",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
## Personnalisation CSS

Le composant \`<puzzle-board>\` utilise des classes **Tailwind CSS** en light DOM.
Tout est surchargeable via les propriétés JS :

| Propriété | Type | Description |
|---|---|---|
| \`pieceColors\` | \`PieceColor[]\` | Palette cyclique \`{ bg, text }\` — classes Tailwind |
| \`targetClasses\` | \`string\` | Classes des cases cibles (découvertes) |
| \`emptyClasses\` | \`string\` | Classes des cases non couvertes |

### Exemple minimal

\`\`\`js
const board = document.querySelector('puzzle-board');

// Thème sobre : alternance de gris
board.pieceColors = [
  { bg: 'bg-gray-200', text: 'text-gray-600' },
  { bg: 'bg-gray-300', text: 'text-gray-700' },
];
board.targetClasses = 'bg-gray-900 text-white font-bold';
board.emptyClasses = 'bg-white text-gray-400';
\`\`\`

### Surcharge CSS globale (light DOM)

\`\`\`css
/* Police des cases */
puzzle-board div[style*="aspect-ratio"] {
  font-family: 'JetBrains Mono', monospace;
}

/* Bordures plus épaisses */
puzzle-board .border-t-2 { border-top-width: 3px; }
puzzle-board .border-r-2 { border-right-width: 3px; }
puzzle-board .border-b-2 { border-bottom-width: 3px; }
puzzle-board .border-l-2 { border-left-width: 3px; }
\`\`\`
        `,
      },
    },
  },
};

export default meta;

function hasClass(el: Element, prefix: string): boolean {
  return el.className.split(" ").some((cls) => cls.startsWith(prefix));
}

export const SoberTheme: StoryObj = {
  name: "Sobre (sans couleur)",
  render: () =>
    renderThemed({
      pieceColors: [
        { bg: "bg-gray-200", text: "text-gray-600" },
        { bg: "bg-gray-300", text: "text-gray-700" },
        { bg: "bg-gray-200", text: "text-gray-600" },
        { bg: "bg-gray-300", text: "text-gray-700" },
        { bg: "bg-gray-200", text: "text-gray-600" },
        { bg: "bg-gray-300", text: "text-gray-700" },
        { bg: "bg-gray-200", text: "text-gray-600" },
        { bg: "bg-gray-300", text: "text-gray-700" },
        { bg: "bg-gray-200", text: "text-gray-600" },
        { bg: "bg-gray-300", text: "text-gray-700" },
      ],
      targetClasses: "bg-gray-900 text-white font-bold",
      emptyClasses: "bg-white text-gray-400",
      borderColor: "border-gray-400",
    }),
  play: async ({ canvasElement }) => {
    const board = canvasElement.querySelector("puzzle-board")!;
    const cells = Array.from(board.querySelectorAll("div > div.flex"));

    // Les pièces utilisent des gris (bg-gray-200 ou bg-gray-300)
    const grayCells = cells.filter((c) => hasClass(c, "bg-gray-"));
    await expect(grayCells.length).toBeGreaterThan(0);

    // Les cases cibles ont bg-gray-900
    const targets = board.querySelectorAll(".ring-2");
    await expect(targets.length).toBe(3);
  },
};

export const PastelTheme: StoryObj = {
  name: "Pastel",
  render: () =>
    renderThemed({
      pieceColors: [
        { bg: "bg-rose-200", text: "text-rose-800" },
        { bg: "bg-sky-200", text: "text-sky-800" },
        { bg: "bg-amber-200", text: "text-amber-800" },
        { bg: "bg-emerald-200", text: "text-emerald-800" },
        { bg: "bg-violet-200", text: "text-violet-800" },
        { bg: "bg-orange-200", text: "text-orange-800" },
        { bg: "bg-teal-200", text: "text-teal-800" },
        { bg: "bg-pink-200", text: "text-pink-800" },
        { bg: "bg-lime-200", text: "text-lime-800" },
        { bg: "bg-indigo-200", text: "text-indigo-800" },
      ],
      targetClasses: "bg-gray-800 text-white ring-2 ring-rose-400",
      emptyClasses: "bg-gray-50 text-gray-400",
      borderColor: "border-gray-300",
    }),
  play: async ({ canvasElement }) => {
    const board = canvasElement.querySelector("puzzle-board")!;
    const cells = Array.from(board.querySelectorAll("div > div.flex"));

    // Les pièces utilisent des couleurs pastel (bg-rose-, bg-sky-, etc.)
    const pastelCells = cells.filter(
      (c) => hasClass(c, "bg-rose-") || hasClass(c, "bg-sky-") ||
        hasClass(c, "bg-amber-") || hasClass(c, "bg-emerald-"),
    );
    await expect(pastelCells.length).toBeGreaterThan(0);

    // Les cases cibles existent
    const targets = board.querySelectorAll(".ring-2");
    await expect(targets.length).toBe(3);
  },
};

export const HighContrast: StoryObj = {
  name: "Contraste fort",
  render: () =>
    renderThemed({
      pieceColors: [
        { bg: "bg-black", text: "text-white" },
        { bg: "bg-white", text: "text-black" },
        { bg: "bg-black", text: "text-white" },
        { bg: "bg-white", text: "text-black" },
        { bg: "bg-black", text: "text-white" },
        { bg: "bg-white", text: "text-black" },
        { bg: "bg-black", text: "text-white" },
        { bg: "bg-white", text: "text-black" },
        { bg: "bg-black", text: "text-white" },
        { bg: "bg-white", text: "text-black" },
      ],
      targetClasses: "bg-yellow-400 text-black font-bold ring-2 ring-black",
      emptyClasses: "bg-gray-100 text-gray-500",
    }),
  play: async ({ canvasElement }) => {
    const board = canvasElement.querySelector("puzzle-board")!;
    const cells = Array.from(board.querySelectorAll("div > div.flex"));

    // Les pièces alternent bg-black / bg-white
    const bwCells = cells.filter(
      (c) => c.className.includes("bg-black") || c.className.includes("bg-white"),
    );
    await expect(bwCells.length).toBeGreaterThan(0);

    // Les cases cibles ont bg-yellow-400
    const targets = Array.from(board.querySelectorAll(".ring-2"));
    const yellowTargets = targets.filter((c) => c.className.includes("bg-yellow-400"));
    await expect(yellowTargets.length).toBe(3);
  },
};
