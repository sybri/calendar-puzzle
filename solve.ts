/**
 * puzzle_solver.ts
 * ================
 * Solver pour le puzzle calendrier Wooodz.
 *
 * Le plateau est une grille irrégulière de 50 cases portant les 12 mois,
 * les jours 1-31 et les 7 jours de la semaine. Dix pièces de type
 * tétromino/pentomino doivent couvrir exactement 47 cases, laissant
 * découvertes les 3 cases correspondant à une date (mois + jour + jour de semaine).
 *
 * Algorithme : backtracking avec :
 *   - Heuristique du pivot (case libre la plus en haut à gauche)
 *   - MCV (Most Constrained Variable) : pièce avec le moins de placements d'abord
 *   - Forward checking : élagage si une pièce n'a plus aucun placement possible
 *   - Lookup table précalculée : évite de recalculer les placements à chaque nœud
 *
 * Architecture :
 *   RelCoord  — coordonnée relative avec transformations géométriques
 *   Board     — plateau : index des cases, lookup valeur↔clé
 *   Piece     — pièce : forme, orientations, lookup case→placements
 *   Solver    — backtracking + résultat
 */

// =============================================================================
// ENUMS
// =============================================================================

enum Month {
  Janvier   = "Jan",  Fevrier   = "Fev",  Mars      = "Mars",
  Avril     = "Avr",  Mai       = "Mai",  Juin      = "Juin",
  Juillet   = "Juil", Aout      = "Aout", Septembre = "Sep",
  Octobre   = "Oct",  Novembre  = "Nov",  Decembre  = "Dec",
}

enum Day {
  D1  = "1",  D2  = "2",  D3  = "3",  D4  = "4",  D5  = "5",
  D6  = "6",  D7  = "7",  D8  = "8",  D9  = "9",  D10 = "10",
  D11 = "11", D12 = "12", D13 = "13", D14 = "14", D15 = "15",
  D16 = "16", D17 = "17", D18 = "18", D19 = "19", D20 = "20",
  D21 = "21", D22 = "22", D23 = "23", D24 = "24", D25 = "25",
  D26 = "26", D27 = "27", D28 = "28", D29 = "29", D30 = "30",
  D31 = "31",
}

enum Weekday {
  Lundi = "Lundi", Mardi = "Mardi", Mercredi = "Mercredi",
  Jeudi = "Jeudi", Vendredi = "Vendredi", Samedi = "Samedi", Dimanche = "Dimanche",
}

enum PieceName {
  P1 = "P1", P2 = "P2", P3 = "P3", P4 = "P4",  P5  = "P5",
  P6 = "P6", P7 = "P7", P8 = "P8", P9 = "P9",  P10 = "P10",
}

/** Union de toutes les valeurs possibles d'une case. */
type CellValue = Month | Day | Weekday;

/**
 * Labels affichés pour chaque valeur d'enum.
 * Mars et Mardi partagent le label "Mar" — leurs clés internes restent distinctes.
 */
const LABEL: Record<CellValue, string> = {
  [Month.Janvier]: "Jan", [Month.Fevrier]: "Fév", [Month.Mars]:  "Mar",
  [Month.Avril]:   "Avr", [Month.Mai]:    "Mai",  [Month.Juin]:  "Juin",
  [Month.Juillet]: "Juil",[Month.Aout]:   "Aoû",  [Month.Septembre]: "Sep",
  [Month.Octobre]: "Oct", [Month.Novembre]:"Nov", [Month.Decembre]:  "Déc",
  [Day.D1]: "1",  [Day.D2]: "2",  [Day.D3]: "3",  [Day.D4]: "4",
  [Day.D5]: "5",  [Day.D6]: "6",  [Day.D7]: "7",  [Day.D8]: "8",
  [Day.D9]: "9",  [Day.D10]:"10", [Day.D11]:"11", [Day.D12]:"12",
  [Day.D13]:"13", [Day.D14]:"14", [Day.D15]:"15", [Day.D16]:"16",
  [Day.D17]:"17", [Day.D18]:"18", [Day.D19]:"19", [Day.D20]:"20",
  [Day.D21]:"21", [Day.D22]:"22", [Day.D23]:"23", [Day.D24]:"24",
  [Day.D25]:"25", [Day.D26]:"26", [Day.D27]:"27", [Day.D28]:"28",
  [Day.D29]:"29", [Day.D30]:"30", [Day.D31]:"31",
  [Weekday.Lundi]:    "Lun", [Weekday.Mardi]:    "Mar",
  [Weekday.Mercredi]: "Mer", [Weekday.Jeudi]:    "Jeu",
  [Weekday.Vendredi]: "Ven", [Weekday.Samedi]:   "Sam",
  [Weekday.Dimanche]: "Dim",
};

// =============================================================================
// TYPES
// =============================================================================

/**
 * Clé unique d'une case "x,y".
 * String car JS ne hashe pas les objets par valeur.
 */
type CellKey = `${number},${number}`;

/** Un placement = cases occupées par une pièce dans une orientation donnée. */
type Placement = ReadonlySet<CellKey>;

/** Solution : nom de pièce → placement final. */
type Solution = Map<PieceName, Placement>;

/** Date cible : les trois valeurs à laisser découvertes. */
interface TargetDate {
  readonly month:   Month;
  readonly day:     Day;
  readonly weekday: Weekday;
}

/** Résultat d'une résolution. */
interface SolveResult {
  readonly solution:  Solution | null;
  readonly attempts:  number;
  readonly elapsedMs: number;
}

// =============================================================================
// RelCoord — coordonnée relative avec transformations géométriques
// =============================================================================

/**
 * Coordonnée relative dans la définition d'une pièce.
 *
 * Encapsule les transformations géométriques du puzzle :
 * rotation, flip, décalage. toString() permet son utilisation
 * directe comme clé de Set (via join()) sans conversion manuelle.
 */
class RelCoord {
  constructor(readonly x: number, readonly y: number) {}

  /** Rotation 90° sens horaire : (x, y) → (-y, x) */
  rotate(): RelCoord { return new RelCoord(-this.y, this.x); }

  /** Flip horizontal : (x, y) → (-x, y) */
  flip():   RelCoord { return new RelCoord(-this.x, this.y); }

  /** Décalage pour ramener à l'origine */
  shift(dx: number, dy: number): RelCoord { return new RelCoord(this.x - dx, this.y - dy); }

  /** "x,y" — utilisé implicitement par join() pour la déduplication */
  toString(): string { return `${this.x},${this.y}`; }
}

/** Alias court pour la déclaration des pièces */
const rc = (x: number, y: number) => new RelCoord(x, y);

/**
 * Ramène une forme à l'origine et la trie.
 * Retourne coords (pour les orientations) + key (pour détecter les doublons).
 *
 * La key string est nécessaire car JS compare les tableaux par référence —
 * on ne peut pas faire Set<RelCoord[]>. toString() est appelé implicitement par join().
 */
function normalize(coords: RelCoord[]): { coords: RelCoord[]; key: string } {
  const minX   = Math.min(...coords.map(c => c.x));
  const minY   = Math.min(...coords.map(c => c.y));
  const sorted = coords.map(c => c.shift(minX, minY)).sort((a, b) => a.y - b.y || a.x - b.x);
  return { coords: sorted, key: sorted.join("|") };
}

/**
 * Génère toutes les orientations uniques d'une forme.
 * 4 rotations × 1 flip = 8 transformations max.
 * Les doublons (pièces symétriques) sont éliminés via la key de normalize.
 */
function getOrientations(coords: RelCoord[]): RelCoord[][] {
  const seen   = new Set<string>();
  const result: RelCoord[][] = [];
  let   current = [...coords];

  for (let r = 0; r < 4; r++) {
    current    = current.map(c => c.rotate());
    const rot  = normalize(current);
    if (!seen.has(rot.key))  { seen.add(rot.key);  result.push(rot.coords); }

    const flip = normalize(current.map(c => c.flip()));
    if (!seen.has(flip.key)) { seen.add(flip.key); result.push(flip.coords); }
  }

  return result;
}

// =============================================================================
// Board — plateau et ses index
// =============================================================================

/**
 * Représente le plateau du puzzle.
 *
 * Encapsule les trois index construits depuis BOARD_GRID :
 *   - cells    : CellKey → CellValue  (accès par coordonnées)
 *   - byValue  : CellValue → CellKey  (retrouver la case d'une valeur)
 *   - valid    : Set<CellKey>         (ensemble des cases valides)
 *
 * Fournit des méthodes sémantiques qui remplacent les fonctions standalone
 * toKey(), BOARD_INDEX, VALUE_INDEX, VALID_CELLS.
 */
class Board {
  /** CellKey → CellValue */
  readonly cells:   Map<CellKey, CellValue>;
  /** CellValue → CellKey */
  readonly byValue: Map<CellValue, CellKey>;
  /** Toutes les CellKey valides */
  readonly valid:   Set<CellKey>;

  constructor(grid: (CellValue | null)[][]) {
    this.cells   = new Map();
    this.byValue = new Map();

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const value = grid[y][x];
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
  key(x: number, y: number): CellKey { return `${x},${y}`; }

  /** Retourne la CellKey de la case portant cette valeur. */
  keyOf(value: CellValue): CellKey {
    const key = this.byValue.get(value);
    if (!key) throw new Error(`Valeur "${value}" introuvable sur le plateau`);
    return key;
  }

  /** Retourne le label affiché de la case à cette clé. */
  labelAt(key: CellKey): string {
    const value = this.cells.get(key);
    return value ? LABEL[value] : "?";
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

// =============================================================================
// Piece — forme, orientations et lookup table
// =============================================================================

/**
 * Représente une pièce du puzzle.
 *
 * Encapsule la forme canonique, toutes ses orientations, et la lookup table
 * précalculée qui associe à chaque case du plateau la liste des placements
 * valides qui couvrent cette case.
 *
 * La lookup table est le cœur de la performance : au lieu de recalculer
 * les placements à chaque nœud du backtracking, on filtre une liste précalculée.
 */
class Piece {
  readonly name:         PieceName;
  readonly shape:        RelCoord[];
  readonly orientations: RelCoord[][];

  /**
   * Lookup table : CellKey → Placement[].
   * "Quels placements de cette pièce couvrent cette case ?"
   */
  readonly byCell: Map<CellKey, Placement[]>;

  constructor(name: PieceName, shape: RelCoord[], board: Board) {
    this.name         = name;
    this.shape        = shape;
    this.orientations = getOrientations(shape);
    this.byCell       = this.buildLookup(board);
  }

  /**
   * Précalcule tous les placements valides pour chaque case du plateau.
   * Appelé une seule fois à la construction — O(cases × orientations × taille).
   */
  private buildLookup(board: Board): Map<CellKey, Placement[]> {
    const lookup = new Map<CellKey, Placement[]>();

    for (const key of board.valid) {
      const [cx, cy]  = key.split(",").map(Number);
      const placements: Placement[] = [];

      for (const orientation of this.orientations) {
        for (const anchor of orientation) {
          // Ancre l'orientation pour que 'anchor' tombe sur la case courante
          const placed = new Set<CellKey>(
            orientation.map(c => board.key(cx - anchor.x + c.x, cy - anchor.y + c.y))
          );
          if ([...placed].every(k => board.valid.has(k))) {
            placements.push(placed);
          }
        }
      }

      lookup.set(key, placements);
    }

    return lookup;
  }

  /**
   * Retourne les placements valides qui couvrent `pivotKey`
   * parmi les cases encore libres (`remaining`).
   */
  placementsAt(pivotKey: CellKey, remaining: Set<CellKey>): Placement[] {
    return (this.byCell.get(pivotKey) ?? []).filter(
      p => [...p].every(k => remaining.has(k))
    );
  }

  /**
   * Vérifie si la pièce peut se placer quelque part dans `remaining`.
   * Utilisé par le forward checking pour détecter les impasses.
   */
  canPlace(remaining: Set<CellKey>): boolean {
    for (const key of remaining) {
      for (const p of this.byCell.get(key) ?? []) {
        if ([...p].every(k => remaining.has(k))) return true;
      }
    }
    return false;
  }
}

// =============================================================================
// Solver — backtracking
// =============================================================================

/**
 * Résout le puzzle pour une date cible.
 *
 * Trois optimisations du backtracking :
 *
 * 1. **Pivot** : case libre la plus en haut à gauche.
 *    Elle doit être couverte maintenant — sinon elle sera isolée.
 *
 * 2. **MCV** : pièce avec le moins de placements au pivot en premier.
 *    La pièce la plus contrainte mène vite à une impasse ou une solution.
 *
 * 3. **Forward checking** : si une pièce ne peut plus se placer nulle part
 *    → impasse certaine, on remonte sans explorer davantage.
 */
class Solver {
  private foundSolution: Solution | null = null;
  private attempts      = 0;

  constructor(
    private readonly board:  Board,
    private readonly pieces: Map<PieceName, Piece>,
  ) {}

  solve(target: TargetDate): SolveResult {
    const t0 = performance.now();
    this.foundSolution = null;
    this.attempts      = 0;

    // Les 3 cases à laisser découvertes
    const targetKeys = new Set<CellKey>([
      this.board.keyOf(target.month),
      this.board.keyOf(target.day),
      this.board.keyOf(target.weekday),
    ]);

    const initialRemaining = new Set<CellKey>(
      [...this.board.valid].filter(k => !targetKeys.has(k))
    );

    this.backtrack(initialRemaining, new Set(this.pieces.keys()), new Map());

    return {
      solution:  this.foundSolution,
      attempts:  this.attempts,
      elapsedMs: performance.now() - t0,
    };
  }

  private backtrack(
    remaining: Set<CellKey>,
    pieceNames: Set<PieceName>,
    partial: Solution
  ): void {
    // Cas de base : toutes les pièces placées, toutes les cases couvertes
    if (pieceNames.size === 0) {
      if (remaining.size === 0) this.foundSolution = new Map(partial);
      return;
    }

    const pivotKey = this.board.pivot(remaining);

    // Construire les candidats : placements au pivot + forward checking
    const candidates: Array<{ name: PieceName; placements: Placement[] }> = [];

    for (const name of pieceNames) {
      const piece            = this.pieces.get(name)!;
      const pivotPlacements  = piece.placementsAt(pivotKey, remaining);

      if (pivotPlacements.length === 0) {
        // Forward checking : peut-elle se placer ailleurs ?
        if (!piece.canPlace(remaining)) return;  // impasse certaine
      }

      candidates.push({ name, placements: pivotPlacements });
    }

    // MCV : pièce la plus contrainte en premier
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

        if (this.foundSolution) return;  // solution trouvée → remonter

        partial.delete(name);  // backtrack
      }
    }
  }
}

// =============================================================================
// DONNÉES DU PUZZLE
// =============================================================================

/**
 * Déclaration statique du plateau.
 * BOARD_GRID[y][x] = valeur de la case, null = case inexistante.
 */
const BOARD_GRID: (CellValue | null)[][] = [
  [ Month.Janvier, Month.Fevrier, Month.Mars,      Month.Avril,    Month.Mai,      Month.Juin,      null ],
  [ Month.Juillet, Month.Aout,   Month.Septembre,  Month.Octobre,  Month.Novembre, Month.Decembre,  null ],
  [ Day.D1,  Day.D2,  Day.D3,  Day.D4,  Day.D5,  Day.D6,  Day.D7  ],
  [ Day.D8,  Day.D9,  Day.D10, Day.D11, Day.D12, Day.D13, Day.D14 ],
  [ Day.D15, Day.D16, Day.D17, Day.D18, Day.D19, Day.D20, Day.D21 ],
  [ Day.D22, Day.D23, Day.D24, Day.D25, Day.D26, Day.D27, Day.D28 ],
  [ Day.D29, Day.D30, Day.D31, Weekday.Lundi, Weekday.Mardi, Weekday.Mercredi, Weekday.Jeudi ],
  [ null, null, null, null, Weekday.Vendredi, Weekday.Samedi, Weekday.Dimanche ],
];

/** Formes canoniques des 10 pièces. */
const PIECES_RAW: Record<PieceName, RelCoord[]> = {
  [PieceName.P1]:  [rc(1,0), rc(0,1), rc(1,1), rc(0,2)],
  [PieceName.P2]:  [rc(0,0), rc(0,1), rc(0,2), rc(0,3)],
  [PieceName.P3]:  [rc(1,0), rc(0,1), rc(1,1), rc(0,2), rc(1,2)],
  [PieceName.P4]:  [rc(1,0), rc(1,1), rc(0,2), rc(1,2), rc(2,2)],
  [PieceName.P5]:  [rc(0,0), rc(1,0), rc(1,1), rc(1,2), rc(2,2)],
  [PieceName.P6]:  [rc(0,0), rc(1,0), rc(0,1), rc(0,2), rc(1,2)],
  [PieceName.P7]:  [rc(0,0), rc(1,0), rc(2,0), rc(0,1), rc(0,2)],
  [PieceName.P8]:  [rc(0,0), rc(0,1), rc(0,2), rc(1,2), rc(1,3)],
  [PieceName.P9]:  [rc(0,0), rc(0,1), rc(0,2), rc(0,3), rc(1,3)],
  [PieceName.P10]: [rc(0,0), rc(0,1), rc(0,2), rc(1,2)],
};

// Instances globales construites une seule fois au démarrage
const BOARD  = new Board(BOARD_GRID);
const PIECES = new Map<PieceName, Piece>(
  Object.values(PieceName).map(name => [name, new Piece(name, PIECES_RAW[name], BOARD)])
);
const SOLVER = new Solver(BOARD, PIECES);

// =============================================================================
// AFFICHAGE
// =============================================================================

const ANSI_PIECES: Array<[string, string]> = [
  ["\x1b[41m",  "\x1b[97m"], ["\x1b[42m",  "\x1b[30m"], ["\x1b[43m",  "\x1b[30m"],
  ["\x1b[44m",  "\x1b[97m"], ["\x1b[45m",  "\x1b[97m"], ["\x1b[46m",  "\x1b[30m"],
  ["\x1b[101m", "\x1b[30m"], ["\x1b[102m", "\x1b[30m"], ["\x1b[103m", "\x1b[30m"],
  ["\x1b[104m", "\x1b[97m"],
];
const RESET = "\x1b[0m", BOLD = "\x1b[1m", INVERT = "\x1b[7m";

/** Affiche la solution dans le terminal avec couleurs ANSI. */
function printSolution(solution: Solution, target: TargetDate): void {
  const pieceNames  = [...solution.keys()].sort() as PieceName[];
  const colorMap    = new Map(pieceNames.map((n, i) => [n, ANSI_PIECES[i % 10]]));
  const cellToPiece = new Map<CellKey, PieceName>();
  for (const [name, p] of solution) for (const k of p) cellToPiece.set(k, name);

  const targetKeys = new Set([
    BOARD.keyOf(target.month),
    BOARD.keyOf(target.day),
    BOARD.keyOf(target.weekday),
  ]);

  console.log(`\n${"=".repeat(62)}`);
  console.log(`  Solution  ${BOLD}${LABEL[target.month]}  ${LABEL[target.day]}  ${LABEL[target.weekday]}${RESET}`);
  console.log(`${"=".repeat(62)}`);

  for (let y = 0; y < BOARD_GRID.length; y++) {
    let line = ` R${y}  `;
    for (let x = 0; x < 7; x++) {
      const key   = BOARD.key(x, y);
      const value = BOARD.cells.get(key);
      if (!value) { line += "      "; continue; }

      const label    = LABEL[value].padStart(4);
      const piece    = cellToPiece.get(key);
      const isTarget = targetKeys.has(key);

      if (isTarget)     line += `${BOLD}${INVERT} ${label} ${RESET}`;
      else if (piece) { const [bg, fg] = colorMap.get(piece)!; line += `${bg}${fg} ${label} ${RESET}`; }
      else              line += ` ${label}  `;
    }
    console.log(line);
  }

  console.log(`\n  Légende :`);
  for (const name of pieceNames) {
    const [bg, fg] = colorMap.get(name)!;
    const labels   = [...(solution.get(name) ?? [])].map(k => BOARD.labelAt(k)).sort().join(", ");
    console.log(`  ${bg}${fg} ${name.padStart(3)} ${RESET}  [${labels}]`);
  }
}

// =============================================================================
// PARSING
// =============================================================================

const MONTHS_DISPLAY: Array<{ key: Month; full: string }> = [
  { key: Month.Janvier,   full: "Janvier"   }, { key: Month.Fevrier,   full: "Février"   },
  { key: Month.Mars,      full: "Mars"      }, { key: Month.Avril,     full: "Avril"     },
  { key: Month.Mai,       full: "Mai"       }, { key: Month.Juin,      full: "Juin"      },
  { key: Month.Juillet,   full: "Juillet"   }, { key: Month.Aout,      full: "Août"      },
  { key: Month.Septembre, full: "Septembre" }, { key: Month.Octobre,   full: "Octobre"   },
  { key: Month.Novembre,  full: "Novembre"  }, { key: Month.Decembre,  full: "Décembre"  },
];

const WEEKDAYS_DISPLAY: Array<{ key: Weekday; full: string }> = [
  { key: Weekday.Lundi,    full: "Lundi"    }, { key: Weekday.Mardi,    full: "Mardi"    },
  { key: Weekday.Mercredi, full: "Mercredi" }, { key: Weekday.Jeudi,    full: "Jeudi"    },
  { key: Weekday.Vendredi, full: "Vendredi" }, { key: Weekday.Samedi,   full: "Samedi"   },
  { key: Weekday.Dimanche, full: "Dimanche" },
];

function parseMonth(raw: string): Month | null {
  if (/^\d+$/.test(raw)) { const n = parseInt(raw); return (n >= 1 && n <= 12) ? MONTHS_DISPLAY[n-1].key : null; }
  const lower = raw.toLowerCase();
  for (const { key, full } of MONTHS_DISPLAY)
    if (LABEL[key].toLowerCase() === lower || full.toLowerCase().startsWith(lower)) return key;
  return null;
}

function parseDay(raw: string): Day | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = parseInt(raw);
  return (n >= 1 && n <= 31 && Object.values(Day).includes(String(n) as Day)) ? (String(n) as Day) : null;
}

function parseWeekday(raw: string): Weekday | null {
  if (/^\d+$/.test(raw)) { const n = parseInt(raw); return (n >= 1 && n <= 7) ? WEEKDAYS_DISPLAY[n-1].key : null; }
  const lower = raw.toLowerCase();
  for (const { key, full } of WEEKDAYS_DISPLAY)
    if (LABEL[key].toLowerCase() === lower || full.toLowerCase().startsWith(lower)) return key;
  return null;
}

// =============================================================================
// POINT D'ENTRÉE
// =============================================================================

/** Résout et affiche pour une date donnée. */
function runOnce(target: TargetDate): void {
  console.log(`\n  Résolution pour ${BOLD}${LABEL[target.month]} ${LABEL[target.day]} ${LABEL[target.weekday]}${RESET}...\n`);

  const result = SOLVER.solve(target);

  if (result.solution) {
    console.log(`  ${BOLD}\x1b[32m✅ Solution trouvée${RESET} en ${(result.elapsedMs/1000).toFixed(3)}s  —  ${BOLD}${result.attempts.toLocaleString("fr-FR")}${RESET} essais`);
    printSolution(result.solution, target);
  } else {
    console.log(`  ${BOLD}\x1b[31m❌ Aucune solution trouvée${RESET} (${(result.elapsedMs/1000).toFixed(3)}s)`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.log("Usage: puzzle_solver.ts <mois> <jour> <jour_semaine>");
    console.log("  Ex: Avr 16 Mer   |   4 16 3   |   Avril 16 Mercredi");
    if (args.length !== 0) process.exit(1);
    return;
  }
  const month   = parseMonth(args[0]);   if (!month)   { console.error(`Mois invalide : "${args[0]}"`);         process.exit(1); }
  const day     = parseDay(args[1]);     if (!day)     { console.error(`Jour invalide : "${args[1]}" (1-31)`);  process.exit(1); }
  const weekday = parseWeekday(args[2]); if (!weekday) { console.error(`Jour semaine invalide : "${args[2]}"`); process.exit(1); }
  runOnce({ month, day, weekday });
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Month, Day, Weekday, PieceName,
  type CellValue, type CellKey, type Placement, type Solution,
  type TargetDate, type SolveResult,
  LABEL, BOARD_GRID, PIECES_RAW,
  RelCoord, Board, Piece, Solver,
  BOARD, PIECES, SOLVER,
  rc, normalize, getOrientations,
  MONTHS_DISPLAY, WEEKDAYS_DISPLAY,
  parseMonth, parseDay, parseWeekday,
  printSolution, runOnce,
};

if (typeof require !== "undefined" && require.main === module) main();
