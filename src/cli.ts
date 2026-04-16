import { createSolver } from "./solver.js";
import type { PuzzleConfig } from "./config.js";
import type { CellKey, Solution } from "./types.js";
import { Board } from "./board.js";
import defaultConfig from "../configs/wooodz-calendar.json";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const INVERT = "\x1b[7m";

const ANSI_PIECES: Array<[string, string]> = [
  ["\x1b[41m", "\x1b[97m"],
  ["\x1b[42m", "\x1b[30m"],
  ["\x1b[43m", "\x1b[30m"],
  ["\x1b[44m", "\x1b[97m"],
  ["\x1b[45m", "\x1b[97m"],
  ["\x1b[46m", "\x1b[30m"],
  ["\x1b[101m", "\x1b[30m"],
  ["\x1b[102m", "\x1b[30m"],
  ["\x1b[103m", "\x1b[30m"],
  ["\x1b[104m", "\x1b[97m"],
];

const MONTHS_LOOKUP: Array<{ key: string; full: string; label: string }> = [
  { key: "Jan", full: "Janvier", label: "Jan" },
  { key: "Fev", full: "Février", label: "Fév" },
  { key: "Mars", full: "Mars", label: "Mar" },
  { key: "Avr", full: "Avril", label: "Avr" },
  { key: "Mai", full: "Mai", label: "Mai" },
  { key: "Juin", full: "Juin", label: "Juin" },
  { key: "Juil", full: "Juillet", label: "Juil" },
  { key: "Aout", full: "Août", label: "Aoû" },
  { key: "Sep", full: "Septembre", label: "Sep" },
  { key: "Oct", full: "Octobre", label: "Oct" },
  { key: "Nov", full: "Novembre", label: "Nov" },
  { key: "Dec", full: "Décembre", label: "Déc" },
];

const WEEKDAYS_LOOKUP: Array<{ key: string; full: string; label: string }> = [
  { key: "Lundi", full: "Lundi", label: "Lun" },
  { key: "Mardi", full: "Mardi", label: "Mar" },
  { key: "Mercredi", full: "Mercredi", label: "Mer" },
  { key: "Jeudi", full: "Jeudi", label: "Jeu" },
  { key: "Vendredi", full: "Vendredi", label: "Ven" },
  { key: "Samedi", full: "Samedi", label: "Sam" },
  { key: "Dimanche", full: "Dimanche", label: "Dim" },
];

function parseMonth(raw: string): string | null {
  if (/^\d+$/.test(raw)) {
    const n = parseInt(raw);
    return n >= 1 && n <= 12 ? MONTHS_LOOKUP[n - 1].key : null;
  }
  const lower = raw.toLowerCase();
  for (const m of MONTHS_LOOKUP) {
    if (
      m.label.toLowerCase() === lower ||
      m.full.toLowerCase().startsWith(lower)
    )
      return m.key;
  }
  return null;
}

function parseDay(raw: string): string | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = parseInt(raw);
  return n >= 1 && n <= 31 ? String(n) : null;
}

function parseWeekday(raw: string): string | null {
  if (/^\d+$/.test(raw)) {
    const n = parseInt(raw);
    return n >= 1 && n <= 7 ? WEEKDAYS_LOOKUP[n - 1].key : null;
  }
  const lower = raw.toLowerCase();
  for (const w of WEEKDAYS_LOOKUP) {
    if (
      w.label.toLowerCase() === lower ||
      w.full.toLowerCase().startsWith(lower)
    )
      return w.key;
  }
  return null;
}

function printSolution(
  config: PuzzleConfig,
  board: Board,
  solution: Solution,
  target: Record<string, string>,
): void {
  const pieceNames = [...solution.keys()].sort();
  const colorMap = new Map(
    pieceNames.map((n, i) => [n, ANSI_PIECES[i % 10]]),
  );
  const cellToPiece = new Map<CellKey, string>();
  for (const [name, p] of solution) for (const k of p) cellToPiece.set(k, name);

  const targetKeys = new Set<CellKey>(
    Object.values(target).map((v) => board.keyOf(v)),
  );

  const labels = config.labels ?? {};
  const targetLabels = Object.values(target)
    .map((v) => labels[v] ?? v)
    .join("  ");

  console.log(`\n${"=".repeat(62)}`);
  console.log(`  Solution  ${BOLD}${targetLabels}${RESET}`);
  console.log(`${"=".repeat(62)}`);

  for (let y = 0; y < config.grid.length; y++) {
    let line = ` R${y}  `;
    for (let x = 0; x < board.cols; x++) {
      const key = board.key(x, y);
      const value = board.cells.get(key);
      if (!value) {
        line += "      ";
        continue;
      }

      const label = (labels[value] ?? value).padStart(4);
      const piece = cellToPiece.get(key);
      const isTarget = targetKeys.has(key);

      if (isTarget) {
        line += `${BOLD}${INVERT} ${label} ${RESET}`;
      } else if (piece) {
        const [bg, fg] = colorMap.get(piece)!;
        line += `${bg}${fg} ${label} ${RESET}`;
      } else {
        line += ` ${label}  `;
      }
    }
    console.log(line);
  }

  console.log(`\n  Légende :`);
  for (const name of pieceNames) {
    const [bg, fg] = colorMap.get(name)!;
    const cellLabels = [...(solution.get(name) ?? [])]
      .map((k) => board.labelAt(k))
      .sort()
      .join(", ");
    console.log(`  ${bg}${fg} ${name.padStart(3)} ${RESET}  [${cellLabels}]`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.log("Usage: calendar-puzzle <mois> <jour> <jour_semaine>");
    console.log("  Ex: Avr 16 Mer   |   4 16 3   |   Avril 16 Mercredi");
    if (args.length !== 0) process.exit(1);
    return;
  }

  const month = parseMonth(args[0]);
  if (!month) {
    console.error(`Mois invalide : "${args[0]}"`);
    return process.exit(1);
  }
  const day = parseDay(args[1]);
  if (!day) {
    console.error(`Jour invalide : "${args[1]}" (1-31)`);
    return process.exit(1);
  }
  const weekday = parseWeekday(args[2]);
  if (!weekday) {
    console.error(`Jour semaine invalide : "${args[2]}"`);
    return process.exit(1);
  }

  const target: Record<string, string> = { month, day, weekday };
  const config: PuzzleConfig = defaultConfig;
  const { board, solve } = createSolver(config);

  const labels = config.labels ?? {};
  const targetLabels = Object.values(target)
    .map((v) => labels[v] ?? v)
    .join(" ");

  console.log(`\n  Résolution pour ${BOLD}${targetLabels}${RESET}...\n`);

  const result = solve(target);

  if (result.solution) {
    console.log(
      `  ${BOLD}\x1b[32m✅ Solution trouvée${RESET} en ${(result.elapsedMs / 1000).toFixed(3)}s  —  ${BOLD}${result.attempts.toLocaleString("fr-FR")}${RESET} essais`,
    );
    printSolution(config, board, result.solution, target);
  } else {
    console.log(
      `  ${BOLD}\x1b[31m❌ Aucune solution trouvée${RESET} (${(result.elapsedMs / 1000).toFixed(3)}s)`,
    );
  }
}

main();
