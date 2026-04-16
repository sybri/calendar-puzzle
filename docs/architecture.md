# Architecture

## Vue d'ensemble

```
calendar-puzzle/
├── src/
│   ├── types.ts              # Types fondamentaux (CellKey, Placement, Solution, SolveResult)
│   ├── config.ts             # Interface PuzzleConfig + validateConfig()
│   ├── geometry.ts           # RelCoord + transformations (rotation, flip, normalize)
│   ├── board.ts              # Board — indexation de la grille
│   ├── piece.ts              # Piece — orientations + lookup table precalculee
│   ├── solver.ts             # Solver — backtracking + factory createSolver()
│   ├── render/
│   │   ├── puzzle-board.ts   # Web component <puzzle-board>
│   │   └── colors.ts         # Palette Tailwind par defaut
│   ├── stories/              # Stories Storybook
│   ├── index.ts              # Barrel export public
│   └── cli.ts                # Point d'entree CLI (non exporte)
├── configs/                  # Fichiers JSON de configuration de puzzles
├── .github/workflows/        # CI/CD (release + storybook)
├── demo/                     # Page HTML de demo
└── docs/                     # Documentation
```

## Flux de donnees

```
PuzzleConfig (JSON)
       │
       ▼
   Board (indexation grille)
       │
       ▼
   Piece[] (orientations + lookup table byCell)
       │
       ▼
   Solver.solve(target) → SolveResult { solution, attempts, elapsedMs }
       │
       ▼
   PuzzleBoardElement.render() → DOM avec classes Tailwind
```

## Moteur de resolution

### Lookup table (Piece.byCell)

Cle de la performance. Construite une seule fois par piece au demarrage :

```
Pour chaque case du plateau :
  Pour chaque orientation de la piece :
    Pour chaque cellule de l'orientation comme ancre :
      Si toutes les cellules du placement sont sur le plateau → stocker
```

Resultat : `Map<CellKey, Placement[]>` — "quels placements de cette piece couvrent cette case ?"

### Backtracking (Solver.backtrack)

1. Trouver le **pivot** (case libre la plus en haut a gauche)
2. Pour chaque piece restante, lister les placements valides au pivot
3. **Forward checking** : si une piece n'a aucun placement nulle part → retour
4. **MCV** : trier les pieces par nombre de placements (moins = premier)
5. Pour chaque placement candidat : placer, recurser, backtrack si echec

### CellKey

Format `"x,y"` — string car JavaScript ne hashe pas les objets par valeur. Utilise comme cle de Set et Map partout.

## Web component

### Rendu connecte des pieces

Pas de gap entre les cases. Pour chaque case :
- Verifier les 4 voisins (haut, droite, bas, gauche)
- Si le voisin appartient a une piece differente ou est vide → bordure de ce cote
- Si deux cotes adjacents ont une bordure → coin arrondi

### Proprietes de theme

Le composant accepte des surcharges de classes Tailwind :
- `pieceColors: PieceColor[]` — palette `{ bg, text }` cyclique
- `targetClasses: string` — classes pour les cases cibles
- `emptyClasses: string` — classes pour les cases non couvertes

Le light DOM permet aussi la surcharge CSS directe via `puzzle-board .class`.

## Configuration

### Structure PuzzleConfig

- `grid` : grille 2D, `null` pour les cases absentes (forme irreguliere)
- `groups` : regroupements semantiques de cases. Le solver laisse une case decouverte par groupe
- `labels` : optionnel, surcharge l'affichage (ex: "Fev" → "Fev")
- `pieces` : coordonnees relatives `[x, y][]` pour chaque piece

### Ajouter un nouveau puzzle

1. Creer un fichier JSON dans `configs/` suivant l'interface PuzzleConfig
2. Valider avec `validateConfig()`
3. Passer a `createSolver()` pour obtenir un solveur
