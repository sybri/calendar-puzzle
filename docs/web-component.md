# Web Component — <puzzle-board>

## Proprietes

| Propriete | Type | Defaut | Description |
|---|---|---|---|
| `config` | `PuzzleConfig` | `null` | Configuration du puzzle |
| `target` | `Record<string, string>` | `null` | Cible : groupe → valeur a decouvrir |
| `solution` | `Solution` | `null` | Solution a afficher (Map<string, Placement>) |
| `hideLabels` | `boolean` | `false` | Masque les labels sous les pieces |
| `showLegend` | `boolean` | `true` | Affiche la legende des pieces |
| `cellRatio` | `number` | `1` | Ratio hauteur/largeur (1 = carre) |
| `pieceColors` | `PieceColor[]` | 10 couleurs vives | Palette `{ bg, text }` cyclique |
| `targetClasses` | `string` | `"bg-gray-900 text-white ring-2 ring-amber-400"` | Classes des cases cibles |
| `emptyClasses` | `string` | `"bg-gray-200 text-gray-700"` | Classes des cases vides |

## Methodes

### `resolve(): SolveResult | null`

Resout le puzzle pour `config` + `target` courants. Met a jour le DOM et emet un evenement.

Retourne `null` si config ou target ne sont pas definis.

## Evenements

### `puzzle-solved`

`CustomEvent` emis apres chaque appel a `resolve()`.

```typescript
board.addEventListener('puzzle-solved', (e: CustomEvent) => {
  e.detail.solution;  // Solution | null
  e.detail.attempts;  // number
  e.detail.elapsedMs; // number
});
```

## Exemples d'integration

### Minimal

```html
<script type="module">
  import { createSolver, defaultConfig } from 'calendar-puzzle';

  const board = document.querySelector('puzzle-board');
  board.config = defaultConfig;
  board.target = { month: 'Avr', day: '16', weekday: 'Mercredi' };
  board.resolve();
</script>
<puzzle-board></puzzle-board>
```

### Theme personnalise

```js
board.pieceColors = [
  { bg: 'bg-gray-200', text: 'text-gray-600' },
  { bg: 'bg-gray-300', text: 'text-gray-700' },
];
board.targetClasses = 'bg-black text-white font-bold';
```

### Ecouter sans afficher

```js
board.showLegend = false;
board.addEventListener('puzzle-solved', (e) => {
  console.log(`Resolu en ${e.detail.elapsedMs}ms`);
});
board.resolve();
```

## Structure du DOM genere

```html
<puzzle-board>
  <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr))">
    <!-- Une div par case de la grille -->
    <div class="flex items-center justify-center text-[0.6rem] sm:text-sm font-medium
                bg-red-500 text-white border-t-2 border-l-2 border-gray-800 rounded-tl-lg"
         style="aspect-ratio: 1 / 1">
      Jan
    </div>
    <!-- ... -->
  </div>
  <!-- Legende optionnelle -->
  <div class="mt-2 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
    <span class="... bg-red-500 text-white">P1</span>
    <!-- ... -->
  </div>
</puzzle-board>
```
