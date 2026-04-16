/**
 * Coordonnée relative dans la définition d'une pièce.
 * Encapsule les transformations géométriques : rotation, flip, décalage.
 */
export class RelCoord {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  /** Rotation 90° sens horaire : (x, y) → (-y, x) */
  rotate(): RelCoord {
    return new RelCoord(-this.y, this.x);
  }

  /** Flip horizontal : (x, y) → (-x, y) */
  flip(): RelCoord {
    return new RelCoord(-this.x, this.y);
  }

  /** Décalage pour ramener à l'origine. */
  shift(dx: number, dy: number): RelCoord {
    return new RelCoord(this.x - dx, this.y - dy);
  }

  /** "x,y" — utilisé implicitement par join() pour la déduplication. */
  toString(): string {
    return `${this.x},${this.y}`;
  }
}

/**
 * Normalise une forme : ramène à l'origine et trie.
 * Retourne les coords normalisées + une key string pour détecter les doublons.
 */
export function normalize(coords: RelCoord[]): { coords: RelCoord[]; key: string } {
  const minX = Math.min(...coords.map((c) => c.x));
  const minY = Math.min(...coords.map((c) => c.y));
  const sorted = coords
    .map((c) => c.shift(minX, minY))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  return { coords: sorted, key: sorted.join("|") };
}

/**
 * Génère toutes les orientations uniques d'une forme.
 * 4 rotations × 2 (avec/sans flip) = 8 transformations max.
 * Les doublons (pièces symétriques) sont éliminés via la key.
 */
export function getOrientations(coords: RelCoord[]): RelCoord[][] {
  const seen = new Set<string>();
  const result: RelCoord[][] = [];
  let current = [...coords];

  for (let r = 0; r < 4; r++) {
    current = current.map((c) => c.rotate());
    const rot = normalize(current);
    if (!seen.has(rot.key)) {
      seen.add(rot.key);
      result.push(rot.coords);
    }

    const flip = normalize(current.map((c) => c.flip()));
    if (!seen.has(flip.key)) {
      seen.add(flip.key);
      result.push(flip.coords);
    }
  }

  return result;
}
