/** Palette de couleurs Tailwind pour les pièces (bg + text). */
export const PIECE_COLORS: Array<{ bg: string; text: string }> = [
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-green-500", text: "text-white" },
  { bg: "bg-yellow-400", text: "text-gray-900" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-orange-400", text: "text-gray-900" },
  { bg: "bg-lime-400", text: "text-gray-900" },
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-sky-400", text: "text-gray-900" },
];

/** Classes Tailwind pour les cases cibles (découvertes). */
export const TARGET_CLASSES = "bg-gray-900 text-white ring-2 ring-amber-400";

/** Classes Tailwind pour une case vide (pas sur le plateau). */
export const EMPTY_CLASSES = "invisible";
