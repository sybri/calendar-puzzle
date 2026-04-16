import type { Meta, StoryObj } from "@storybook/web-components";
import { type PuzzleConfig, todayTarget } from "../config.js";
import "../render/puzzle-board.js";

import wooodzConfig from "../../configs/wooodz-calendar.json";
import puzzleDayConfig from "../../configs/puzzle-day.json";

// Registre des configs disponibles
const CONFIGS: Record<string, PuzzleConfig> = {
  "Wooodz Calendar": wooodzConfig as PuzzleConfig,
  "Puzzle Jour": puzzleDayConfig as PuzzleConfig,
};

const configNames = Object.keys(CONFIGS);

interface PuzzleBoardArgs {
  puzzle: string;
  hideLabels: boolean;
  showDatePicker: boolean;
  showResult: boolean;
  showLegend: boolean;
  cellRatio: number;
  onPuzzleSolved: (...args: unknown[]) => void;
  [key: string]: unknown;
}

function renderBoard(args: PuzzleBoardArgs) {
  const config = CONFIGS[args.puzzle] ?? CONFIGS[configNames[0]];
  const groupNames = Object.keys(config.groups);
  const labels = config.labels ?? {};

  // Construire la cible depuis les args dynamiques, avec fallback sur todayTarget
  const defaults = todayTarget(config);
  const target: Record<string, string> = {};
  for (const group of groupNames) {
    const val = args[group];
    if (typeof val === "string" && val) {
      target[group] = val;
    } else {
      target[group] = defaults[group];
    }
  }

  const wrapper = document.createElement("div");
  wrapper.style.width = "min(28rem, 100%)";

  // Sélecteur de date (optionnel)
  if (args.showDatePicker) {
    const form = document.createElement("div");
    form.className = "flex flex-wrap gap-2 mb-4";
    form.style.display = "flex";
    form.style.flexWrap = "wrap";
    form.style.gap = "0.5rem";
    form.style.marginBottom = "1rem";

    for (const group of groupNames) {
      const select = document.createElement("select");
      select.style.padding = "0.25rem 0.5rem";
      select.style.borderRadius = "0.25rem";
      select.style.border = "1px solid #d1d5db";
      select.style.fontSize = "0.875rem";

      for (const v of config.groups[group]) {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = labels[v] ?? v;
        if (v === target[group]) opt.selected = true;
        select.appendChild(opt);
      }

      select.addEventListener("change", () => {
        target[group] = select.value;
        updateBoard();
      });

      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.flexDirection = "column";
      label.style.fontSize = "0.75rem";
      label.style.color = "#6b7280";
      label.textContent = group;
      label.appendChild(select);
      form.appendChild(label);
    }

    wrapper.appendChild(form);
  }

  const boardEl = document.createElement("puzzle-board");
  boardEl.className = "block";

  // Brancher l'événement puzzle-solved sur l'action Storybook
  const onPuzzleSolved = args.onPuzzleSolved;
  if (typeof onPuzzleSolved === "function") {
    boardEl.addEventListener("puzzle-solved", (e: Event) => {
      const detail = (e as CustomEvent).detail;
      onPuzzleSolved({
        attempts: detail.attempts,
        elapsedMs: detail.elapsedMs,
        solved: !!detail.solution,
      });
    });
  }

  wrapper.appendChild(boardEl);

  const info = document.createElement("p");
  info.style.fontSize = "0.75rem";
  info.style.color = "#6b7280";
  info.style.textAlign = "center";
  info.style.marginTop = "0.5rem";
  wrapper.appendChild(info);

  function updateBoard() {
    (boardEl as any).config = config;
    (boardEl as any).target = target;
    (boardEl as any).hideLabels = args.hideLabels;
    (boardEl as any).cellRatio = args.cellRatio ?? 1;
    (boardEl as any).showLegend = args.showLegend ?? true;

    const result = (boardEl as any).resolve();

    if (args.showResult ?? true) {
      if (result?.solution) {
        info.textContent = `Solution en ${(result.elapsedMs / 1000).toFixed(3)}s — ${result.attempts.toLocaleString("fr-FR")} essais`;
      } else {
        info.textContent = "Aucune solution trouvée";
      }
    } else {
      info.textContent = "";
    }
  }

  updateBoard();
  return wrapper;
}

const meta: Meta = {
  title: "PuzzleBoard",
  component: "puzzle-board",
  tags: ["autodocs"],
  argTypes: {
    puzzle: {
      control: "select",
      options: configNames,
      description: "Configuration de puzzle",
    },
    hideLabels: {
      control: "boolean",
      description: "Masquer les labels des cases couvertes (pièces occultantes)",
    },
    showResult: {
      control: "boolean",
      description: "Afficher le texte de résolution (temps, nombre d'essais)",
    },
    showLegend: {
      control: "boolean",
      description: "Afficher la légende des pièces sous le plateau",
    },
    showDatePicker: {
      control: "boolean",
      description: "Afficher le sélecteur de date interactif",
    },
    cellRatio: {
      control: { type: "range", min: 0.4, max: 1.5, step: 0.1 },
      description: "Ratio hauteur/largeur d'une case (1 = carré)",
    },
    onPuzzleSolved: {
      action: "puzzle-solved",
      description: "Événement émis quand le puzzle est résolu",
    },
  },
};

export default meta;

export const Today: StoryObj = {
  args: {
    puzzle: "Wooodz Calendar",
    hideLabels: false,
    showResult: true,
    showLegend: true,
    showDatePicker: true,
    cellRatio: 1,
  },
  render: (args) => renderBoard(args as PuzzleBoardArgs),
};

export const HiddenLabels: StoryObj = {
  args: {
    puzzle: "Wooodz Calendar",
    hideLabels: true,
    showResult: true,
    showLegend: false,
    showDatePicker: false,
    cellRatio: 1,
  },
  render: (args) => renderBoard(args as PuzzleBoardArgs),
};

export const PuzzleDay: StoryObj = {
  args: {
    puzzle: "Puzzle Jour",
    hideLabels: false,
    showResult: true,
    showLegend: true,
    showDatePicker: true,
    cellRatio: 1,
  },
  render: (args) => renderBoard(args as PuzzleBoardArgs),
};

// ---------------------------------------------------------------------------
// Story "API Demo" — montre comment piloter le composant en JS pur
// ---------------------------------------------------------------------------

const API_SNIPPET = `\
import { todayTarget, createSolver, defaultConfig } from "calendar-puzzle";

// 1. Récupérer le composant
const board = document.querySelector("puzzle-board");

// 2. Lui donner une config
board.config = defaultConfig;

// 3. Résoudre la date du jour
board.target = todayTarget(defaultConfig);
const result = board.resolve();

console.log(result.elapsedMs, "ms —", result.attempts, "essais");

// 4. Résoudre une date arbitraire
board.target = { month: "Sep", day: "25", weekday: "Jeudi" };
board.resolve();

// 5. Écouter l'événement
board.addEventListener("puzzle-solved", (e) => {
  console.log(e.detail);
});`;

function renderApiDemo(args: PuzzleBoardArgs) {
  const config = CONFIGS[args.puzzle] ?? CONFIGS[configNames[0]];

  const root = document.createElement("div");
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "1.5rem";
  root.style.maxWidth = "56rem";

  // --- Toolbar ---
  const toolbar = document.createElement("div");
  toolbar.style.display = "flex";
  toolbar.style.flexWrap = "wrap";
  toolbar.style.gap = "0.5rem";
  toolbar.style.alignItems = "center";

  const btnToday = document.createElement("button");
  btnToday.textContent = "todayTarget(config)";
  btnToday.title = "Résoudre la date du jour";
  applyBtnStyle(btnToday, "#2563eb", "#fff");

  const btnCustom = document.createElement("button");
  btnCustom.textContent = "target = { month: 'Sep', day: '25', weekday: 'Jeudi' }";
  btnCustom.title = "Résoudre une date arbitraire";
  applyBtnStyle(btnCustom, "#7c3aed", "#fff");

  const status = document.createElement("span");
  status.style.fontSize = "0.75rem";
  status.style.color = "#6b7280";
  status.style.marginLeft = "auto";

  toolbar.append(btnToday, btnCustom, status);
  root.appendChild(toolbar);

  // --- Board ---
  const boardWrap = document.createElement("div");
  boardWrap.style.width = "min(28rem, 100%)";

  const boardEl = document.createElement("puzzle-board") as any;
  boardEl.className = "block";
  boardEl.config = config;
  boardWrap.appendChild(boardEl);
  root.appendChild(boardWrap);

  // --- Code snippet ---
  const pre = document.createElement("pre");
  pre.style.background = "#1e293b";
  pre.style.color = "#e2e8f0";
  pre.style.padding = "1rem";
  pre.style.borderRadius = "0.5rem";
  pre.style.fontSize = "0.8rem";
  pre.style.lineHeight = "1.5";
  pre.style.overflowX = "auto";
  pre.style.margin = "0";

  const code = document.createElement("code");
  code.textContent = API_SNIPPET;
  pre.appendChild(code);
  root.appendChild(pre);

  // --- Actions ---
  function solveAndShow(target: Record<string, string>) {
    boardEl.target = target;
    const result = boardEl.resolve();
    if (result?.solution) {
      const labels = config.labels ?? {};
      const targetLabel = Object.values(target)
        .map((v) => labels[v] ?? v)
        .join(" ");
      status.textContent = `${targetLabel} — ${(result.elapsedMs / 1000).toFixed(3)}s, ${result.attempts.toLocaleString("fr-FR")} essais`;
    } else {
      status.textContent = "Aucune solution";
    }
  }

  btnToday.addEventListener("click", () => {
    solveAndShow(todayTarget(config));
  });

  btnCustom.addEventListener("click", () => {
    const custom: Record<string, string> = { month: "Sep", day: "25" };
    if (config.groups.weekday) custom.weekday = "Jeudi";
    solveAndShow(custom);
  });

  // Résolution initiale
  solveAndShow(todayTarget(config));

  return root;
}

function applyBtnStyle(btn: HTMLButtonElement, bg: string, fg: string) {
  btn.style.padding = "0.4rem 0.75rem";
  btn.style.borderRadius = "0.375rem";
  btn.style.border = "none";
  btn.style.background = bg;
  btn.style.color = fg;
  btn.style.fontSize = "0.8rem";
  btn.style.fontFamily = "monospace";
  btn.style.cursor = "pointer";
}

export const ApiDemo: StoryObj = {
  args: {
    puzzle: "Wooodz Calendar",
    showLegend: true,
    cellRatio: 1,
  },
  render: (args) => renderApiDemo(args as PuzzleBoardArgs),
};

export const EmptyBoard: StoryObj = {
  args: {
    puzzle: "Wooodz Calendar",
    hideLabels: false,
    showResult: false,
    showLegend: false,
    showDatePicker: false,
    cellRatio: 1,
  },
  render: (args) => renderBoard(args as PuzzleBoardArgs),
};
