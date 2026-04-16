# Calendar Puzzle

Lors d'une balade, j'ai craque pour un bel objet en bois : un casse-tete calendrier. Le principe est simple — des pieces de type tetromino/pentomino a poser sur un plateau pour representer n'importe quelle date de l'annee, en laissant visibles exactement trois cases : le mois, le jour et le jour de la semaine.

J'ai reussi quelques dates... puis je me suis retrouve bloque pendant des heures. En cherchant sur Internet, j'ai decouvert que ce type de puzzle etait assez repandu, mais le mien en particulier n'existait nulle part — impossible de trouver les solutions.

J'ai donc decide de construire un solveur universel pour ce type de casse-tete. Le resultat est un **composant web** que vous pouvez integrer sur votre site, avec un moteur de resolution configurable pour s'adapter a n'importe quel plateau et n'importe quel jeu de pieces.

## Demo

[Storybook en ligne](https://sybri.github.io/calendar-puzzle)

## Installation

```bash
npm install calendar-puzzle
```

## Utilisation rapide

### En JavaScript / TypeScript

```js
import { createSolver, defaultConfig } from 'calendar-puzzle';

const { solve } = createSolver(defaultConfig);
const result = solve({ month: 'Avr', day: '16', weekday: 'Mercredi' });

console.log(result.solution);  // Map<string, Set<CellKey>>
console.log(result.elapsedMs); // temps de resolution en ms
console.log(result.attempts);  // nombre d'essais
```

### Web Component

```html
<script type="module">
  import { createSolver, defaultConfig, PuzzleBoardElement } from 'calendar-puzzle';

  const board = document.querySelector('puzzle-board');
  board.config = defaultConfig;
  board.target = { month: 'Avr', day: '16', weekday: 'Mercredi' };

  // Resoudre et afficher automatiquement
  board.resolve();

  // Ecouter l'evenement de resolution
  board.addEventListener('puzzle-solved', (e) => {
    console.log(e.detail); // { solution, attempts, elapsedMs }
  });
</script>

<puzzle-board></puzzle-board>
```

### CLI

```bash
npx calendar-puzzle Avr 16 Mer
```

## Configuration personnalisee

Le plateau, les pieces et les labels sont definis dans un fichier JSON. Vous pouvez creer votre propre configuration pour n'importe quel casse-tete de ce type.

```json
{
  "name": "Mon Puzzle",
  "grid": [
    ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", null],
    ["Juil", "Aout", "Sep", "Oct", "Nov", "Dec", null],
    ["1", "2", "3", "4", "5", "6", "7"],
    ...
  ],
  "groups": {
    "month": ["Jan", "Fev", "Mar", ...],
    "day": ["1", "2", "3", ...],
    "weekday": ["Lundi", "Mardi", ...]
  },
  "labels": {
    "Jan": "Jan", "Fev": "Fev", ...
  },
  "pieces": {
    "P1": [[1,0], [0,1], [1,1], [0,2]],
    "P2": [[0,0], [0,1], [0,2], [0,3]],
    ...
  }
}
```

```js
import { createSolver } from 'calendar-puzzle';
import myConfig from './my-puzzle.json';

const { solve } = createSolver(myConfig);
```

## Personnalisation du rendu

Le composant utilise des classes **Tailwind CSS** en light DOM. Tout est surchargeable.

### Proprietes du composant

| Propriete | Type | Description |
|---|---|---|
| `config` | `PuzzleConfig` | Configuration du puzzle (plateau + pieces) |
| `target` | `Record<string, string>` | Cible : groupe -> valeur a decouvrir |
| `hideLabels` | `boolean` | Masquer les labels sous les pieces |
| `showLegend` | `boolean` | Afficher la legende des pieces |
| `cellRatio` | `number` | Ratio hauteur/largeur des cases (1 = carre) |
| `pieceColors` | `PieceColor[]` | Palette de couleurs `{ bg, text }` |
| `targetClasses` | `string` | Classes Tailwind pour les cases cibles |
| `emptyClasses` | `string` | Classes Tailwind pour les cases vides |

### Methodes

| Methode | Retour | Description |
|---|---|---|
| `resolve()` | `SolveResult` | Resout le puzzle et emet l'evenement `puzzle-solved` |

### Exemple : theme sobre sans couleur

```js
const board = document.querySelector('puzzle-board');

board.pieceColors = [
  { bg: 'bg-gray-200', text: 'text-gray-600' },
  { bg: 'bg-gray-300', text: 'text-gray-700' },
];
board.targetClasses = 'bg-gray-900 text-white font-bold';
board.emptyClasses = 'bg-white text-gray-400';
```

## Comment ca marche

Le moteur utilise un algorithme de **backtracking** avec trois optimisations :

1. **Pivot** — couvre toujours la case libre la plus en haut a gauche en premier
2. **MCV** (Most Constrained Variable) — essaie d'abord la piece qui a le moins de placements possibles
3. **Forward checking** — detecte les impasses avant d'explorer des branches inutiles

Les placements valides sont **precalcules** dans une lookup table au demarrage, ce qui evite de les recalculer a chaque noeud de l'arbre de recherche. La plupart des dates sont resolues en moins de 100ms.

## Developpement

```bash
npm install
npm run build        # Build ESM + CJS + types
npm run typecheck    # Verification des types
npm run storybook    # Storybook en local (port 6006)
```

## Licence

MIT
