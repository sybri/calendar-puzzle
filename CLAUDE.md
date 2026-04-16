# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run build          # Build ESM + CJS + .d.ts via tsup
npm run typecheck      # tsc --noEmit (strict)
npm run dev            # tsup --watch
npm run storybook      # Storybook dev server on port 6006
npm run build-storybook # Build static Storybook
```

CLI testing: `node dist/cli.js Avr 16 Mer` (or `4 16 3`, or `Avril 16 Mercredi`)

## Architecture

The codebase is a configurable puzzle solver engine + web component, published as a dual ESM/CJS npm package.

### Module dependency graph

```
config.ts (PuzzleConfig interface)
    ↓
geometry.ts (RelCoord, normalize, getOrientations)
    ↓
board.ts (Board — grid indexing: cells, byValue, valid)
    ↓
piece.ts (Piece — orientations + precalculated lookup table byCell)
    ↓
solver.ts (Solver — backtracking + createSolver factory)
    ↓
render/puzzle-board.ts (PuzzleBoardElement — <puzzle-board> web component)

index.ts — barrel re-exports everything + defaultConfig from configs/wooodz-calendar.json
cli.ts — standalone CLI entry point (not part of library export)
```

### Key design decisions

- **No enums** — cell values and piece names are plain strings from JSON config. This makes the solver generic for any puzzle, not just the Wooodz calendar.
- **PuzzleConfig is the contract** — grid layout, piece shapes, groups, and labels are all defined in JSON files under `configs/`. The solver engine knows nothing about months or weekdays.
- **Precalculated lookup table** — `Piece.byCell` maps each board cell to all valid placements covering that cell. Built once at construction, avoids recalculation during backtracking.
- **Light DOM web component** — `<puzzle-board>` renders directly into the page DOM with Tailwind CSS classes, allowing full style customization by consumers.
- **Connected piece rendering** — no gap between cells, borders only at piece boundaries, rounded corners only at exposed corners. All done with conditional Tailwind border/rounded classes.

### Solver algorithm (solver.ts)

Backtracking with 3 optimizations:
1. **Pivot** — always covers the topmost-leftmost free cell (prevents isolation)
2. **MCV** — tries the piece with fewest valid placements at the pivot first
3. **Forward checking** — if any remaining piece has zero valid placements anywhere, prune immediately

Target is `Record<string, string>` mapping group names to cell values to leave uncovered.

### Web component API (render/puzzle-board.ts)

Properties: `config`, `target`, `solution`, `hideLabels`, `showLegend`, `cellRatio`, `pieceColors`, `targetClasses`, `emptyClasses`.

`resolve()` method: solves the puzzle, updates the DOM, and dispatches `CustomEvent("puzzle-solved")` with `SolveResult` as detail.

### Puzzle configuration format

```typescript
interface PuzzleConfig {
  name: string;
  grid: (string | null)[][];         // 2D board, null = absent cell
  groups: Record<string, string[]>;   // named groups (one target per group)
  labels?: Record<string, string>;    // display overrides
  pieces: Record<string, number[][]>; // piece shapes as [x,y] coords
}
```

Two configs ship in `configs/`: `wooodz-calendar.json` (7x8, 10 pieces, 3 groups) and `puzzle-day.json` (7x7, 8 pieces, 2 groups).

## CI/CD

- **semantic-release** on push to `main` — commit messages must follow Conventional Commits (`feat:`, `fix:`, etc.)
- **Storybook** auto-deploys to GitHub Pages on push to `main`
- Node 22 required in CI (semantic-release v25 requirement)

## Git identity for this project

```bash
git config user.name "sybri"
git config user.email "sylvain.brissy@gmail.com"
```
