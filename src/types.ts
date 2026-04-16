/** Clé unique d'une case "x,y". String car JS ne hashe pas les objets par valeur. */
export type CellKey = `${number},${number}`;

/** Un placement = ensemble des cases occupées par une pièce dans une orientation donnée. */
export type Placement = ReadonlySet<CellKey>;

/** Solution : nom de pièce → placement final. */
export type Solution = Map<string, Placement>;

/** Résultat d'une résolution. */
export interface SolveResult {
  readonly solution: Solution | null;
  readonly attempts: number;
  readonly elapsedMs: number;
}
