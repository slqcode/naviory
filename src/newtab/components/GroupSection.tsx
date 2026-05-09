import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
  rectSortingStrategy,
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
  onAddLink: () => void;
  onEditLink: (link: QuickLink) => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
}

export default function GroupSection({
  group,
  links,
  onAddLink,
  onEditLink,
  onEditGroup,
  onDeleteGroup,
}: Props) {
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

  return (
    <section className="card p-4">
      {/* 分组头部 */}
      <header className="flex items-center justify-between mb-3">
        <button
          onClick={() => toggleGroupCollapsed(group.id)}
          className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 min-w-0"
        >
          {group.collapsed ? <ChevronRight size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
          <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${colorStyle.bgClass}`}>
            <GroupIcon size={14} className={colorStyle.textClass} />
          </span>
          <span className="truncate">{group.name}</span>
          <span className="text-xs text-gray-500 shrink-0">({links.length})</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 card overflow-hidden z-10">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onEditGroup();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Pencil size={14} />
                编辑
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onDeleteGroup();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} />
                删除
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 链接列表 */}
      {!group.collapsed && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={links.map((l) => l.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <SortableLink
                  key={link.id}
                  link={link}
                  onEdit={() => onEditLink(link)}
                  onDelete={() => deleteLinkWithUndo(link.id)}
                />
              ))}
              <button
                onClick={onAddLink}
                className="flex items-center justify-center gap-1 py-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-indigo-400 hover:text-indigo-600"
              >
                <Plus size={16} />
                <span className="text-sm">添加</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function SortableLink({
  link,
  onEdit,
  onDelete,
}: {
  link: QuickLink;
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LinkCard link={link} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
