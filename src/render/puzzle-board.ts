import type { PuzzleConfig } from "../config.js";
import type { CellKey, Solution, SolveResult } from "../types.js";
import { createSolver } from "../solver.js";
import { PIECE_COLORS, TARGET_CLASSES, EMPTY_CLASSES } from "./colors.js";

/**
 * Web component <puzzle-board> — rendu du plateau avec classes Tailwind.
 *
 * Les pièces sont rendues comme des blocs connectés : pas de gap entre les
 * cases, bordures uniquement aux frontières entre pièces différentes,
 * coins arrondis seulement aux coins exposés. Pur CSS, pas de canvas.
 *
 * Propriétés :
 *   - config     : PuzzleConfig
 *   - target     : Record<string, string> (groupe → valeur cible)
 *   - solution   : Solution (Map<string, Placement>)
 *   - hideLabels : boolean — masque les labels des cases couvertes par une pièce
 */
/** Définition d'une couleur de pièce : classes Tailwind bg + text. */
export interface PieceColor {
  bg: string;
  text: string;
}

export class PuzzleBoardElement extends HTMLElement {
  private _config: PuzzleConfig | null = null;
  private _target: Record<string, string> | null = null;
  private _solution: Solution | null = null;
  private _hideLabels = false;
  private _cellRatio = 1;
  private _showLegend = true;
  private _pieceColors: PieceColor[] = PIECE_COLORS;
  private _targetClasses: string = TARGET_CLASSES;
  private _emptyClasses: string = "bg-gray-200 text-gray-700";

  set config(cfg: PuzzleConfig) {
    this._config = cfg;
    this.render();
  }
  get config(): PuzzleConfig | null {
    return this._config;
  }

  set target(t: Record<string, string>) {
    this._target = t;
    this.render();
  }
  get target(): Record<string, string> | null {
    return this._target;
  }

  set solution(sol: Solution) {
    this._solution = sol;
    this.render();
  }
  get solution(): Solution | null {
    return this._solution;
  }

  set hideLabels(v: boolean) {
    this._hideLabels = v;
    this.render();
  }
  get hideLabels(): boolean {
    return this._hideLabels;
  }

  /** Afficher la légende des pièces sous le plateau. */
  set showLegend(v: boolean) {
    this._showLegend = v;
    this.render();
  }
  get showLegend(): boolean {
    return this._showLegend;
  }

  /** Ratio hauteur/largeur d'une case (1 = carré, 0.6 = rectangulaire). */
  set cellRatio(v: number) {
    this._cellRatio = v;
    this.render();
  }
  get cellRatio(): number {
    return this._cellRatio;
  }

  /** Palette de couleurs pour les pièces. Cyclique si moins de couleurs que de pièces. */
  set pieceColors(v: PieceColor[]) {
    this._pieceColors = v;
    this.render();
  }
  get pieceColors(): PieceColor[] {
    return this._pieceColors;
  }

  /** Classes Tailwind pour les cases cibles (découvertes). */
  set targetClasses(v: string) {
    this._targetClasses = v;
    this.render();
  }
  get targetClasses(): string {
    return this._targetClasses;
  }

  /** Classes Tailwind pour les cases non couvertes (sans pièce, non cible). */
  set emptyClasses(v: string) {
    this._emptyClasses = v;
    this.render();
  }
  get emptyClasses(): string {
    return this._emptyClasses;
  }

  /**
   * Résout le puzzle pour la cible courante et met à jour le rendu.
   * Émet un CustomEvent "puzzle-solved" avec le SolveResult en detail.
   * Nécessite que `config` et `target` soient déjà définis.
   */
  resolve(): SolveResult | null {
    if (!this._config || !this._target) return null;

    const { solve } = createSolver(this._config);
    const result = solve(this._target);

    if (result.solution) {
      this._solution = result.solution;
    } else {
      this._solution = null;
    }

    this.render();
    this.dispatchEvent(
      new CustomEvent("puzzle-solved", { detail: result, bubbles: true }),
    );

    return result;
  }

  /**
   * Identifiant de "groupe" d'une case : nom de pièce, "target", ou null.
   * Deux cases adjacentes du même groupe ne reçoivent pas de bordure entre elles.
   */
  private cellGroup(
    key: CellKey,
    cellToPiece: Map<CellKey, string>,
    targetKeys: Set<CellKey>,
    validKeys: Set<CellKey>,
  ): string | null {
    if (!validKeys.has(key)) return null;
    if (targetKeys.has(key)) return "__target__";
    return cellToPiece.get(key) ?? "__empty__";
  }

  private render(): void {
    if (!this._config) return;

    const config = this._config;
    const labels = config.labels ?? {};
    const cols = Math.max(...config.grid.map((r) => r.length));
    const rows = config.grid.length;

    // Index valeur → CellKey + ensemble des clés valides
    const valueToKey = new Map<string, CellKey>();
    const validKeys = new Set<CellKey>();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < config.grid[y].length; x++) {
        const v = config.grid[y][x];
        if (v !== null) {
          const k: CellKey = `${x},${y}`;
          valueToKey.set(v, k);
          validKeys.add(k);
        }
      }
    }

    // Cases cibles
    const targetKeys = new Set<CellKey>();
    if (this._target) {
      for (const v of Object.values(this._target)) {
        const k = valueToKey.get(v);
        if (k) targetKeys.add(k);
      }
    }

    // CellKey → nom de pièce (seulement si showSolution)
    const cellToPiece = new Map<CellKey, string>();
    if (this._solution) {
      for (const [name, placement] of this._solution) {
        for (const k of placement) cellToPiece.set(k, name);
      }
    }

    // Couleur par pièce
    const pieceNames = this._solution
      ? [...this._solution.keys()].sort()
      : [];
    const colors = this._pieceColors;
    const colorMap = new Map(
      pieceNames.map((n, i) => [n, colors[i % colors.length]]),
    );

    // Le composant ne doit jamais dépasser son parent
    this.style.maxWidth = "100%";
    this.style.boxSizing = "border-box";

    // Construction du HTML
    this.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "grid w-full max-w-full";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const value = config.grid[y]?.[x] ?? null;
        const cell = document.createElement("div");
        const key: CellKey = `${x},${y}`;

        if (value === null) {
          cell.className = EMPTY_CLASSES;
          grid.appendChild(cell);
          continue;
        }

        // Base — text-[0.6rem] sur mobile, text-sm sur écran normal
        const classes = [
          "flex",
          "items-center",
          "justify-center",
          "text-[0.6rem]",
          "sm:text-sm",
          "font-medium",
          "overflow-hidden",
          "leading-tight",
        ];
        cell.style.aspectRatio = `1 / ${this._cellRatio}`;

        const myGroup = this.cellGroup(key, cellToPiece, targetKeys, validKeys);
        const piece = cellToPiece.get(key);

        // Label : visible sauf si hideLabels + case couverte par une pièce
        if (this._hideLabels && piece) {
          cell.textContent = "";
        } else {
          cell.textContent = labels[value] ?? value;
        }

        // Couleur de fond
        if (targetKeys.has(key)) {
          classes.push(...this._targetClasses.split(" "));
        } else if (piece) {
          const color = colorMap.get(piece)!;
          classes.push(color.bg, color.text);
        } else {
          classes.push(...this._emptyClasses.split(" "));
        }

        // Voisins : top, right, bottom, left
        const topKey: CellKey = `${x},${y - 1}`;
        const rightKey: CellKey = `${x + 1},${y}`;
        const bottomKey: CellKey = `${x},${y + 1}`;
        const leftKey: CellKey = `${x - 1},${y}`;

        const topGroup = this.cellGroup(
          topKey,
          cellToPiece,
          targetKeys,
          validKeys,
        );
        const rightGroup = this.cellGroup(
          rightKey,
          cellToPiece,
          targetKeys,
          validKeys,
        );
        const bottomGroup = this.cellGroup(
          bottomKey,
          cellToPiece,
          targetKeys,
          validKeys,
        );
        const leftGroup = this.cellGroup(
          leftKey,
          cellToPiece,
          targetKeys,
          validKeys,
        );

        const borderTop = topGroup !== myGroup;
        const borderRight = rightGroup !== myGroup;
        const borderBottom = bottomGroup !== myGroup;
        const borderLeft = leftGroup !== myGroup;

        // Bordures sur les côtés exposés
        if (borderTop) classes.push("border-t-2");
        if (borderRight) classes.push("border-r-2");
        if (borderBottom) classes.push("border-b-2");
        if (borderLeft) classes.push("border-l-2");

        if (borderTop || borderRight || borderBottom || borderLeft) {
          classes.push("border-gray-800");
        }

        // Coins arrondis seulement quand les deux côtés adjacents ont une bordure
        if (borderTop && borderLeft) classes.push("rounded-tl-lg");
        if (borderTop && borderRight) classes.push("rounded-tr-lg");
        if (borderBottom && borderLeft) classes.push("rounded-bl-lg");
        if (borderBottom && borderRight) classes.push("rounded-br-lg");

        cell.className = classes.join(" ");
        grid.appendChild(cell);
      }
    }

    this.appendChild(grid);

    // Légende
    if (this._showLegend && this._solution && pieceNames.length > 0) {
      const legend = document.createElement("div");
      legend.className = "mt-2 sm:mt-4 flex flex-wrap gap-1 sm:gap-2";

      for (const name of pieceNames) {
        const color = colorMap.get(name)!;
        const badge = document.createElement("span");
        badge.className = `inline-flex items-center gap-1 rounded px-1.5 py-0.5 sm:px-2 sm:py-1 text-[0.6rem] sm:text-xs font-medium ${color.bg} ${color.text}`;
        badge.textContent = name;
        legend.appendChild(badge);
      }

      this.appendChild(legend);
    }
  }
}

if (typeof customElements !== "undefined") {
  customElements.define("puzzle-board", PuzzleBoardElement);
}
