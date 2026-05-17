// src/newtab/components/MasonryGrid.tsx (initial — just the algorithm export)

export interface ItemPosition {
  index: number;
  x: number; // column index (0-based)
  y: number; // top offset in px
}

export function assignColumns(
  heights: number[],
  columns: number,
  gap: number
): ItemPosition[] {
  if (heights.length === 0) return [];
  const columnHeights = new Array(columns).fill(0);
  const positions: ItemPosition[] = [];

  for (let i = 0; i < heights.length; i++) {
    const shortest = columnHeights.indexOf(Math.min(...columnHeights));
    const y = columnHeights[shortest] > 0 ? columnHeights[shortest] + gap : 0;
    positions.push({ index: i, x: shortest, y });
    columnHeights[shortest] = y + heights[i];
  }

  return positions;
}
