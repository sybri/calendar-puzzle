/** Configuration complète d'un puzzle. */
export interface PuzzleConfig {
  /** Nom du puzzle. */
  name: string;

  /** Plateau 2D : chaque string est une valeur de case unique, null = case absente. */
  grid: (string | null)[][];

  /** Groupes nommés de cases. Chaque groupe fournit une valeur cible à découvrir. */
  groups: Record<string, string[]>;

  /** Labels d'affichage (optionnel). Clé = valeur dans grid, valeur = texte affiché. */
  labels?: Record<string, string>;

  /** Pièces : nom → liste de coordonnées relatives [x, y]. */
  pieces: Record<string, number[][]>;
}

/** Valide une config et lève une erreur si incohérente. */
export function validateConfig(config: PuzzleConfig): void {
  const gridValues = new Set<string>();

  for (const row of config.grid) {
    for (const cell of row) {
      if (cell !== null) {
        if (gridValues.has(cell)) {
          throw new Error(`Valeur dupliquée dans la grille : "${cell}"`);
        }
        gridValues.add(cell);
      }
    }
  }

  for (const [groupName, values] of Object.entries(config.groups)) {
    for (const v of values) {
      if (!gridValues.has(v)) {
        throw new Error(`Groupe "${groupName}" référence "${v}" absente de la grille`);
      }
    }
  }

  for (const [pieceName, coords] of Object.entries(config.pieces)) {
    if (coords.length === 0) {
      throw new Error(`Pièce "${pieceName}" est vide`);
    }
  }
}
