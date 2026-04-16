import type { PuzzleConfig } from "./config.js";
import { validateConfig } from "./config.js";
import { Board } from "./board.js";
import { Piece, buildPieces } from "./piece.js";
import type { CellKey, Placement, Solution, SolveResult } from "./types.js";

/**
 * Résout le puzzle par backtracking avec :
 *   1. Pivot : case libre la plus en haut à gauche
 *   2. MCV : pièce la plus contrainte en premier
 *   3. Forward checking : élagage des impasses
 */
export class Solver {
  private foundSolution: Solution | null = null;
  private attempts = 0;

  constructor(
    private readonly board: Board,
    private readonly pieces: Map<string, Piece>,
  ) {}

  /**
   * Résout pour une cible donnée.
   * @param target Groupe → valeur de la case à laisser découverte.
   */
  solve(target: Record<string, string>): SolveResult {
    const t0 = performance.now();
    this.foundSolution = null;
    this.attempts = 0;

    const targetKeys = new Set<CellKey>(
      Object.values(target).map((v) => this.board.keyOf(v)),
    );

    const initialRemaining = new Set<CellKey>(
      [...this.board.valid].filter((k) => !targetKeys.has(k)),
    );

    this.backtrack(
      initialRemaining,
      new Set(this.pieces.keys()),
      new Map(),
    );

    return {
      solution: this.foundSolution,
      attempts: this.attempts,
      elapsedMs: performance.now() - t0,
    };
  }

  private backtrack(
    remaining: Set<CellKey>,
    pieceNames: Set<string>,
    partial: Solution,
  ): void {
    if (pieceNames.size === 0) {
      if (remaining.size === 0) this.foundSolution = new Map(partial);
      return;
    }

    const pivotKey = this.board.pivot(remaining);

    const candidates: Array<{ name: string; placements: Placement[] }> = [];

    for (const name of pieceNames) {
      const piece = this.pieces.get(name)!;
      const pivotPlacements = piece.placementsAt(pivotKey, remaining);

      if (pivotPlacements.length === 0) {
        if (!piece.canPlace(remaining)) return;
      }

      candidates.push({ name, placements: pivotPlacements });
    }

    candidates.sort((a, b) => a.placements.length - b.placements.length);

    for (const { name, placements } of candidates) {
      for (const placement of placements) {
        this.attempts++;

        const newRemaining = new Set(remaining);
        for (const k of placement) newRemaining.delete(k);

        const newPieces = new Set(pieceNames);
        newPieces.delete(name);

        partial.set(name, placement);
        this.backtrack(newRemaining, newPieces, partial);

        if (this.foundSolution) return;

        partial.delete(name);
      }
    }
  }
}

/** Factory : crée un solveur prêt à l'emploi depuis une config. */
export function createSolver(config: PuzzleConfig): {
  board: Board;
  pieces: Map<string, Piece>;
  solve: (target: Record<string, string>) => SolveResult;
} {
  validateConfig(config);
  const board = new Board(config);
  const pieces = buildPieces(config.pieces, board);
  const solver = new Solver(board, pieces);
  return {
    board,
    pieces,
    solve: (target) => solver.solve(target),
  };
}
