// Config
export type { PuzzleConfig } from "./config.js";
export { validateConfig, todayTarget } from "./config.js";

// Types
export type { CellKey, Placement, Solution, SolveResult } from "./types.js";

// Moteur
export { RelCoord, normalize, getOrientations } from "./geometry.js";
export { Board } from "./board.js";
export { Piece, buildPieces } from "./piece.js";
export { Solver, createSolver } from "./solver.js";

// Web component
export { PuzzleBoardElement } from "./render/puzzle-board.js";
export type { PieceColor } from "./render/puzzle-board.js";
export { PIECE_COLORS, TARGET_CLASSES, EMPTY_CLASSES } from "./render/colors.js";

// Config par défaut
import defaultConfig from "../configs/wooodz-calendar.json";
export { defaultConfig };
