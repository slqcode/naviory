import { useState, forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreVertical, Pencil, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '@/store/useAppStore';
import { getGroupIcon, getGroupColorStyle } from '@/utils/groupTheme';
import type { LinkGroup, QuickLink } from '@/types';
import LinkCard from './LinkCard';

interface Props {
  group: LinkGroup;
  links: QuickLink[];
  query?: string;
  matchedLinkIds?: Set<string>;
  onAddLink: () => void;
  onEditLink: (link: QuickLink) => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  style?: CSSProperties;
}

const GroupSection = forwardRef<HTMLElement, Props>(function GroupSection(
  {
    group,
    links,
    query,
    matchedLinkIds,
    onAddLink,
    onEditLink,
    onEditGroup,
    onDeleteGroup,
    dragHandleProps,
    isDragging,
    style,
  },
  ref
) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleGroupCollapsed, reorderLinks, deleteLinkWithUndo } = useAppStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const orderedIds = arrayMove(links, oldIndex, newIndex).map((l) => l.id);
    reorderLinks(group.id, orderedIds);
  };

  const GroupIcon = getGroupIcon(group.icon);
  const colorStyle = getGroupColorStyle(group.color);

  const isFiltering = !!query?.trim();
  const matchCount = isFiltering && matchedLinkIds
    ? links.filter((l) => matchedLinkIds.has(l.id)).length
    : 0;
  // 搜索期间，0 命中分组视图层折叠；其余强制展开（让用户看到命中）。
  const effectiveCollapsed = isFiltering ? matchCount === 0 : group.collapsed;

  return (
    <section
      ref={ref}
      style={style}
      className={`panel group/section relative ${isDragging ? 'opacity-50' : ''} ${
        isFiltering && matchCount === 0 ? 'opacity-50' : ''
      }`}
    >
      {/* Header */}
      <header className="flex items-center gap-1 border-b border-border px-3 py-2">
        {dragHandleProps && (
          <button
            type="button"
            {...dragHandleProps}
            title="拖拽排序"
            aria-label="拖拽分组排序"
            className="cursor-grab touch-none rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:text-text-primary active:cursor-grabbing group-hover/section:opacity-100"
          >
            <GripVertical size={13} />
          </button>
        )}
        <button
          onClick={() => toggleGroupCollapsed(group.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-text-primary hover:text-accent"
          disabled={isFiltering}
        >
          {effectiveCollapsed ? (
            <ChevronRight size={14} className="shrink-0 text-text-muted" />
          ) : (
            <ChevronDown size={14} className="shrink-0 text-text-muted" />
          )}
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${colorStyle.bgClass}`}
          >
            <GroupIcon size={12} className={colorStyle.textClass} />
          </span>
          <span className="truncate font-mono text-sm">
            <span className="text-text-muted"># </span>
            {group.name}
          </span>
          <span className="ml-1 shrink-0 font-mono text-[11px] text-text-muted">
            {isFiltering ? `(${matchCount}/${links.length})` : `(${links.length})`}
          </span>
        </button>

        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/section:opacity-100">
          <button
            onClick={onAddLink}
            title="添加链接"
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-accent"
          >
            <Plus size={13} />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
              className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
              title="更多"
            >
              <MoreVertical size={13} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-md border border-border-strong bg-surface-elevated shadow-md">
                <div className="border-b border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  # actions
                </div>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onEditGroup();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-xs text-text-primary hover:bg-surface-hover hover:text-accent"
                >
                  <Pencil size={11} className="text-text-muted" />
                  edit
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onDeleteGroup();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-xs text-danger hover:bg-danger/10"
                >
                  <Trash2 size={11} />
                  delete
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      {!effectiveCollapsed && (
        <div className="max-h-[400px] overflow-y-auto p-2">
          {links.length === 0 ? (
            <button
              onClick={onAddLink}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-2 py-2 font-mono text-xs text-text-muted hover:border-accent/40 hover:text-accent"
            >
              <Plus size={12} />
              add link
            </button>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-0.5">
                  {links.map((link) => (
                    <SortableLink
                      key={link.id}
                      link={link}
                      dimmed={isFiltering && !matchedLinkIds?.has(link.id)}
                      onEdit={() => onEditLink(link)}
                      onDelete={() => deleteLinkWithUndo(link.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
              <button
                onClick={onAddLink}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1.5 font-mono text-xs text-text-muted hover:border-accent/40 hover:text-accent"
              >
                <Plus size={12} />
                add link
              </button>
            </DndContext>
          )}
        </div>
      )}
    </section>
  );
});

export default GroupSection;

function SortableLink({
  link,
  dimmed,
  onEdit,
  onDelete,
}: {
  link: QuickLink;
  dimmed?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LinkCard link={link} dimmed={dimmed} onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}
