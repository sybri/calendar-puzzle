import type { Board } from "./board.js";
import { RelCoord, getOrientations } from "./geometry.js";
import type { CellKey, Placement } from "./types.js";

/**
 * Représente une pièce du puzzle.
 * Encapsule la forme, toutes ses orientations, et la lookup table
 * précalculée associant chaque case du plateau à ses placements valides.
 */
export class Piece {
  readonly name: string;
  readonly orientations: RelCoord[][];

  /** Lookup : CellKey → Placement[] — "quels placements couvrent cette case ?" */
  readonly byCell: Map<CellKey, Placement[]>;

  constructor(name: string, shape: RelCoord[], board: Board) {
    this.name = name;
    this.orientations = getOrientations(shape);
    this.byCell = this.buildLookup(board);
  }

  /** Précalcule tous les placements valides pour chaque case du plateau. */
  private buildLookup(board: Board): Map<CellKey, Placement[]> {
    const lookup = new Map<CellKey, Placement[]>();

    for (const key of board.valid) {
      const [cx, cy] = key.split(",").map(Number);
      const placements: Placement[] = [];

      for (const orientation of this.orientations) {
        for (const anchor of orientation) {
          const placed = new Set<CellKey>(
            orientation.map((c) =>
              board.key(cx - anchor.x + c.x, cy - anchor.y + c.y),
            ),
          );
          if ([...placed].every((k) => board.valid.has(k))) {
            placements.push(placed);
          }
        }
      }

      lookup.set(key, placements);
    }

    return lookup;
  }

  /** Placements valides couvrant `pivotKey` parmi les cases libres. */
  placementsAt(pivotKey: CellKey, remaining: Set<CellKey>): Placement[] {
    return (this.byCell.get(pivotKey) ?? []).filter((p) =>
      [...p].every((k) => remaining.has(k)),
    );
  }

  /** Vérifie si la pièce peut encore se placer quelque part (forward checking). */
  canPlace(remaining: Set<CellKey>): boolean {
    for (const key of remaining) {
      for (const p of this.byCell.get(key) ?? []) {
        if ([...p].every((k) => remaining.has(k))) return true;
      }
    }
    return false;
  }
}

/** Construit toutes les pièces depuis la config. */
export function buildPieces(
  pieceDefs: Record<string, number[][]>,
  board: Board,
): Map<string, Piece> {
  return new Map(
    Object.entries(pieceDefs).map(([name, coords]) => [
      name,
      new Piece(
        name,
        coords.map((c) => new RelCoord(c[0], c[1])),
        board,
      ),
    ]),
  );
}
