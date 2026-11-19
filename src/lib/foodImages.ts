/**
 * Plate photos from the prototype's image set. Items that come back from the API
 * without a photo get one of these (picked deterministically from their title), so
 * cards never show an empty grey tile.
 */
const PLATES = [
  "/img/figma-2026-10/06edb",
  "/img/figma-2026-10/07000",
  "/img/figma-2026-10/16294",
  "/img/figma-2026-10/20973",
  "/img/figma-2026-10/2e27f",
  "/img/figma-2026-10/391be",
  "/img/figma-2026-10/439a8",
  "/img/figma-2026-10/4f72f",
  "/img/figma-2026-10/50a2d",
  "/img/figma-2026-10/51aeb",
  "/img/figma-2026-10/57970",
  "/img/figma-2026-10/5f62b",
  "/img/figma-2026-10/69319",
  "/img/figma-2026-10/6e007",
  "/img/figma-2026-10/73d54",
  "/img/figma-2026-10/864df",
  "/img/figma-2026-10/8ea6a",
  "/img/figma-2026-10/8ebc1",
  "/img/figma-2026-10/90126",
  "/img/figma-2026-10/95abf",
  "/img/figma-2026-10/97568",
  "/img/figma-2026-10/a9703",
  "/img/figma-2026-10/abb93",
  "/img/figma-2026-10/afaf0",
  "/img/figma-2026-10/b74e1",
  "/img/figma-2026-10/b7b03",
  "/img/figma-2026-10/bd35e",
  "/img/figma-2026-10/c2e3f",
  "/img/figma-2026-10/c61e8",
  "/img/figma-2026-10/c6cb5",
  "/img/figma-2026-10/cb632",
  "/img/figma-2026-10/cec42",
  "/img/figma-2026-10/d552a",
  "/img/figma-2026-10/da4d4",
  "/img/figma-2026-10/eb492",
  "/img/figma-2026-10/f049d",
  "/img/figma-2026-10/f0a1e",
] as const;

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** A stable plate photo for `seed` (usually the item title or id). */
export const fallbackFoodImage = (seed: string): string => PLATES[hash(seed) % PLATES.length];
