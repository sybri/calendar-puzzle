import type { PuzzleConfig } from "./config.js";
import type { CellKey } from "./types.js";

/**
 * Représente le plateau du puzzle.
 * Construit trois index depuis la grille de la config :
 *   - cells   : CellKey → valeur string
 *   - byValue : valeur string → CellKey
 *   - valid   : ensemble des CellKey valides
 */
export class Board {
  readonly cells: Map<CellKey, string>;
  readonly byValue: Map<string, CellKey>;
  readonly valid: Set<CellKey>;
  readonly labels: Record<string, string>;
  readonly rows: number;
  readonly cols: number;

  constructor(config: PuzzleConfig) {
    this.cells = new Map();
    this.byValue = new Map();
    this.labels = config.labels ?? {};
    this.rows = config.grid.length;
    this.cols = Math.max(...config.grid.map((r) => r.length));

    for (let y = 0; y < config.grid.length; y++) {
      for (let x = 0; x < config.grid[y].length; x++) {
        const value = config.grid[y][x];
        if (value !== null) {
          const key = this.key(x, y);
          this.cells.set(key, value);
          this.byValue.set(value, key);
        }
      }
    }

    this.valid = new Set(this.cells.keys());
  }

  /** Construit une CellKey depuis des coordonnées. */
  key(x: number, y: number): CellKey {
    return `${x},${y}`;
  }

  /** Retourne la CellKey de la case portant cette valeur. */
  keyOf(value: string): CellKey {
    const key = this.byValue.get(value);
    if (!key) throw new Error(`Valeur "${value}" introuvable sur le plateau`);
    return key;
  }

  /** Retourne le label affiché de la case à cette clé. */
  labelAt(key: CellKey): string {
    const value = this.cells.get(key);
    if (!value) return "?";
    return this.labels[value] ?? value;
  }

  /** Case libre la plus en haut à gauche — le "pivot" du backtracking. */
  pivot(remaining: Set<CellKey>): CellKey {
    return [...remaining].sort((a, b) => {
      const [ax, ay] = a.split(",").map(Number);
      const [bx, by] = b.split(",").map(Number);
      return ay - by || ax - bx;
    })[0];
  }
}
