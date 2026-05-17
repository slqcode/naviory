// src/newtab/components/MasonryGrid.tsx
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';

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
            className="[&:focus-within]:z-10 [&:hover]:z-10"
            style={style}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
