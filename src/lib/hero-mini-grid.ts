/** Homepage hero mini-grids (Related Stories + Opinion): 2 rows × 3 columns. */
export const HERO_MINI_GRID_ROWS = 2;
export const HERO_MINI_GRID_COLS = 3;
export const HERO_MINI_GRID_TOTAL = HERO_MINI_GRID_ROWS * HERO_MINI_GRID_COLS;

export function splitHeroMiniGridRows<T>(items: T[]): T[][] {
  const visible = items.slice(0, HERO_MINI_GRID_TOTAL);
  return [
    visible.slice(0, HERO_MINI_GRID_COLS),
    visible.slice(HERO_MINI_GRID_COLS, HERO_MINI_GRID_TOTAL),
  ].filter((row) => row.length > 0);
}
