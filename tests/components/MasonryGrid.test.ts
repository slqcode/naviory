// tests/components/MasonryGrid.test.ts
import { describe, it, expect } from 'vitest';
import { assignColumns } from '@/newtab/components/MasonryGrid';

describe('assignColumns', () => {
  it('distributes items to shortest column', () => {
    const heights = [100, 200, 150, 80, 120];
    const result = assignColumns(heights, 3, 16);
    // Column 0: item0(100), item3(80) = 196
    // Column 1: item1(200) = 200
    // Column 2: item2(150), item4(120) = 286
    expect(result).toEqual([
      { index: 0, x: 0, y: 0 },
      { index: 1, x: 1, y: 0 },
      { index: 2, x: 2, y: 0 },
      { index: 3, x: 0, y: 116 }, // 100 + 16 gap
      { index: 4, x: 2, y: 166 }, // 150 + 16 gap
    ]);
  });

  it('handles single column', () => {
    const heights = [50, 60];
    const result = assignColumns(heights, 1, 16);
    expect(result).toEqual([
      { index: 0, x: 0, y: 0 },
      { index: 1, x: 0, y: 66 },
    ]);
  });

  it('handles empty input', () => {
    expect(assignColumns([], 3, 16)).toEqual([]);
  });
});
