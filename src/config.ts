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

/**
 * Construit un target "aujourd'hui" pour une config donnée.
 *
 * Convention des groupes reconnus :
 * - `month`   → index par `Date.getMonth()` (0 = janvier)
 * - `day`     → index par `Date.getDate() - 1` (jour du mois, 1-based → 0-based)
 * - `weekday` → index par jour de la semaine, lundi = 0
 *
 * Les groupes non reconnus reçoivent la première valeur par défaut.
 * @param date — date à utiliser (défaut : maintenant)
 */
export function todayTarget(
  config: PuzzleConfig,
  date: Date = new Date(),
): Record<string, string> {
  const target: Record<string, string> = {};

  for (const [group, values] of Object.entries(config.groups)) {
    let index: number;
    switch (group) {
      case "month":
        index = date.getMonth();
        break;
      case "day":
        index = date.getDate() - 1;
        break;
      case "weekday":
        index = (date.getDay() + 6) % 7; // lundi = 0
        break;
      default:
        index = 0;
    }
    target[group] = values[index] ?? values[0];
  }

  return target;
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
