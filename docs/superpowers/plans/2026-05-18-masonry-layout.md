# Masonry Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CSS grid layout with a JS-calculated masonry (waterfall) layout so group cards pack tightly without row-height gaps.

**Architecture:** A new `MasonryGrid` component measures each child's height via `ResizeObserver`, assigns items to the shortest column, and positions them with absolute positioning + transforms. The existing `dnd-kit` sortable context wraps the masonry container; drag-end reorders the logical array which triggers re-layout.

**Tech Stack:** React, TypeScript, ResizeObserver, @dnd-kit/core + sortable, Tailwind CSS, Vitest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/newtab/components/MasonryGrid.tsx` | Create | Masonry layout engine: measures children, computes positions, renders container |
| `src/newtab/App.tsx` | Modify | Replace grid div with `MasonryGrid`, change sorting strategy |
| `tests/components/MasonryGrid.test.ts` | Create | Unit tests for the column-assignment algorithm |

---

### Task 1: Column Assignment Algorithm (Pure Function)

**Files:**
- Create: `src/newtab/components/MasonryGrid.tsx` (algorithm only, no React yet)
- Create: `tests/components/MasonryGrid.test.ts`

- [ ] **Step 1: Write failing tests for `assignColumns`**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/MasonryGrid.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `assignColumns`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/MasonryGrid.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/newtab/components/MasonryGrid.tsx tests/components/MasonryGrid.test.ts
git commit -m "feat(masonry): add column assignment algorithm with tests"
```

---

### Task 2: MasonryGrid React Component

**Files:**
- Modify: `src/newtab/components/MasonryGrid.tsx`

- [ ] **Step 1: Implement the MasonryGrid component**

Add the React component below the existing `assignColumns` export in `MasonryGrid.tsx`:

```tsx
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';

interface MasonryGridProps {
  children: ReactNode[];
  gap?: number;
  className?: string;
}

export default function MasonryGrid({ children, gap = 16, className }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [positions, setPositions] = useState<ItemPosition[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const [columns, setColumns] = useState(3);
  const [containerWidth, setContainerWidth] = useState(0);

  // Responsive column count
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateColumns = () => {
      const width = el.clientWidth;
      setContainerWidth(width);
      if (width < 768) setColumns(1);
      else if (width < 1024) setColumns(2);
      else setColumns(3);
    };

    const ro = new ResizeObserver(updateColumns);
    ro.observe(el);
    updateColumns();
    return () => ro.disconnect();
  }, []);

  // Measure items and compute layout
  const recalculate = useCallback(() => {
    const heights: number[] = [];
    for (let i = 0; i < children.length; i++) {
      const el = itemRefs.current.get(i);
      heights.push(el ? el.offsetHeight : 0);
    }
    const pos = assignColumns(heights, columns, gap);
    setPositions(pos);

    // Container height = max column bottom
    const columnBottoms = new Array(columns).fill(0);
    for (const p of pos) {
      const h = heights[p.index] || 0;
      const bottom = p.y + h;
      if (bottom > columnBottoms[p.x]) columnBottoms[p.x] = bottom;
    }
    setContainerHeight(Math.max(...columnBottoms, 0));
  }, [children.length, columns, gap]);

  // Observe item size changes
  useEffect(() => {
    const ro = new ResizeObserver(recalculate);
    itemRefs.current.forEach((el) => ro.observe(el));
    recalculate();
    return () => ro.disconnect();
  }, [recalculate, children.length]);

  const columnWidth = containerWidth > 0
    ? (containerWidth - (columns - 1) * gap) / columns
    : 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', height: containerHeight }}
    >
      {children.map((child, i) => {
        const pos = positions.find((p) => p.index === i);
        const x = pos ? pos.x * (columnWidth + gap) : 0;
        const y = pos ? pos.y : 0;
        const style: CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          width: columnWidth || '100%',
          transform: `translate(${x}px, ${y}px)`,
          transition: 'transform 200ms ease',
        };
        return (
          <div
            key={i}
            ref={(el) => {
              if (el) itemRefs.current.set(i, el);
              else itemRefs.current.delete(i);
            }}
            style={style}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/newtab/components/MasonryGrid.tsx
git commit -m "feat(masonry): add MasonryGrid React component"
```

---

### Task 3: Integrate MasonryGrid into GroupGrid

**Files:**
- Modify: `src/newtab/App.tsx` (lines 324-353)

- [ ] **Step 1: Replace grid container with MasonryGrid**

In `App.tsx`, add the import at the top:

```ts
import MasonryGrid from './components/MasonryGrid';
```

Then replace the grid div in `GroupGrid` (the `<div className="grid grid-cols-1 gap-4 ...">` wrapper) with `MasonryGrid`:

```tsx
// Before (lines 335-351):
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {groups.map((group) => (
    <SortableGroupItem ... />
  ))}
</div>

// After:
<MasonryGrid gap={16}>
  {groups.map((group) => (
    <SortableGroupItem
      key={group.id}
      group={group}
      links={links
        .filter((l) => l.groupId === group.id)
        .sort((a, b) => a.sort - b.sort)}
      query={query}
      matchedLinkIds={matchedLinkIds}
      onAddLink={() => onAddLink(group.id)}
      onEditLink={onEditLink}
      onEditGroup={() => onEditGroup(group)}
      onDeleteGroup={() => onDeleteGroup(group)}
    />
  ))}
</MasonryGrid>
```

- [ ] **Step 2: Remove `rectSortingStrategy` import, keep `closestCenter`**

The `SortableContext` in `GroupGrid` currently uses `rectSortingStrategy`. Since masonry positions don't align to a grid, remove the strategy prop (defaults to no strategy, which works with `closestCenter` collision detection already in use):

```tsx
// Before:
<SortableContext
  items={groups.map((g) => g.id)}
  strategy={rectSortingStrategy}
>

// After:
<SortableContext items={groups.map((g) => g.id)}>
```

Remove `rectSortingStrategy` from the import statement at the top of `App.tsx`.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/newtab/App.tsx
git commit -m "feat(masonry): integrate MasonryGrid into GroupGrid"
```

---

### Task 4: Manual Verification & Polish

**Files:**
- Possibly tweak: `src/newtab/components/MasonryGrid.tsx`

- [ ] **Step 1: Start dev server and verify layout**

Run: `npm run dev`

Open the extension new tab page. Verify:
- Groups pack tightly in masonry layout (no row-height gaps)
- Responsive: resize window to see 1/2/3 column transitions
- Smooth animation when columns change

- [ ] **Step 2: Verify drag-and-drop still works**

- Drag a group card to a new position
- Verify the logical order changes and layout recalculates
- Verify no visual glitches during drag

- [ ] **Step 3: Fix any issues found during manual testing**

Address any visual or interaction bugs discovered.

- [ ] **Step 4: Final commit if any polish was needed**

```bash
git add -u
git commit -m "fix(masonry): polish after manual testing"
```
