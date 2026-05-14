import { useEffect, useMemo, useState } from 'react';
import { Settings, Plus, Download, Upload, Terminal } from 'lucide-react';
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
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/hooks/useToast';
import { downloadJson, readJsonFile, validateExportData } from '@/utils/importExport';
import { buildSearchIndex, rankMatches } from '@/utils/searchIndex';
import SearchBox from './components/SearchBox';
import GroupSection from './components/GroupSection';
import LinkEditorDialog from './components/LinkEditorDialog';
import GroupEditorDialog from './components/GroupEditorDialog';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import EmptyState from './components/EmptyState';
import StatusBar from './components/StatusBar';
import type { LinkGroup, QuickLink } from '@/types';

export default function App() {
  useTheme();
  const {
    groups,
    links,
    initialized,
    loading,
    initialize,
    deleteGroup,
    importData,
    exportData,
    reorderGroups,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const searchIndex = useMemo(() => buildSearchIndex(links), [links]);
  const rankedMatches = useMemo(
    () => (query.trim() ? rankMatches(query, searchIndex) : []),
    [query, searchIndex]
  );
  const matchedLinkIds = useMemo(
    () => new Set(rankedMatches.map((m) => m.link.id)),
    [rankedMatches]
  );

  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [defaultGroupId, setDefaultGroupId] = useState<string | undefined>(undefined);

  const [groupEditorOpen, setGroupEditorOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LinkGroup | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  } | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleAddLink = (groupId?: string) => {
    setEditingLink(null);
    setDefaultGroupId(groupId);
    setLinkEditorOpen(true);
  };

  const handleEditLink = (link: QuickLink) => {
    setEditingLink(link);
    setDefaultGroupId(undefined);
    setLinkEditorOpen(true);
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupEditorOpen(true);
  };

  const handleEditGroup = (group: LinkGroup) => {
    setEditingGroup(group);
    setGroupEditorOpen(true);
  };

  const handleDeleteGroup = (group: LinkGroup) => {
    const groupLinks = links.filter((l) => l.groupId === group.id);
    setConfirmConfig({
      title: 'delete group',
      message:
        groupLinks.length === 0
          ? `确定删除分组"${group.name}"吗？`
          : `分组"${group.name}"下有 ${groupLinks.length} 个链接，确定级联删除吗？`,
      danger: true,
      onConfirm: async () => {
        await deleteGroup(group.id, 'cascade');
        toast.success(groupLinks.length === 0 ? '分组已删除' : '分组及链接已删除');
      },
    });
    setConfirmOpen(true);
  };

  const handleExport = async () => {
    const data = await exportData();
    downloadJson(data, `naviory-backup-${new Date().toISOString().split('T')[0]}.json`);
    toast.success('导出成功');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = await readJsonFile(file);
        if (!validateExportData(data)) {
          toast.error('JSON 格式不正确');
          return;
        }
        setConfirmConfig({
          title: 'import data',
          message: '导入数据会覆盖当前所有数据，确定继续吗？',
          danger: true,
          onConfirm: async () => {
            await importData(data, 'overwrite');
            toast.success('导入成功');
          },
        });
        setConfirmOpen(true);
      } catch (err) {
        toast.error((err as Error).message);
      }
    };
    input.click();
  };

  const handleOpenOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('/src/options/index.html', '_blank');
    }
  };

  if (!initialized && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-muted font-mono text-sm">
        $ loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      {/* Header */}
      <header className="border-b border-border bg-surface/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-accent" />
            <span className="font-mono text-sm font-semibold tracking-tight text-text-primary">
              naviory
            </span>
            <span className="font-mono text-[11px] text-text-muted">workspace</span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <IconButton onClick={handleImport} title="导入 JSON">
              <Upload size={15} />
            </IconButton>
            <IconButton onClick={handleExport} title="导出 JSON">
              <Download size={15} />
            </IconButton>
            <IconButton onClick={handleOpenOptions} title="设置">
              <Settings size={15} />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <SearchBox
          query={query}
          onQueryChange={setQuery}
          rankedMatches={rankedMatches}
          groups={groups}
        />
      </div>

      {/* Groups */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {groups.length === 0 ? (
          <EmptyState
            title="# no workspace groups"
            description="create your first group to start organizing links"
            actionLabel="create group"
            onAction={handleAddGroup}
          />
        ) : (
          <GroupGrid
            groups={groups}
            links={links}
            query={query}
            matchedLinkIds={matchedLinkIds}
            onAddLink={handleAddLink}
            onEditLink={handleEditLink}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onAddGroup={handleAddGroup}
            onReorder={reorderGroups}
          />
        )}
      </main>

      <StatusBar linksCount={links.length} groupsCount={groups.length} />

      {/* Dialogs */}
      {linkEditorOpen && (
        <LinkEditorDialog
          link={editingLink}
          defaultGroupId={defaultGroupId}
          onClose={() => setLinkEditorOpen(false)}
        />
      )}

      {groupEditorOpen && (
        <GroupEditorDialog
          group={editingGroup}
          onClose={() => setGroupEditorOpen(false)}
        />
      )}

      {confirmOpen && confirmConfig && (
        <ConfirmDialog
          title={confirmConfig.title}
          message={confirmConfig.message}
          danger={confirmConfig.danger}
          onConfirm={async () => {
            await confirmConfig.onConfirm();
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <Toast />
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
    >
      {children}
    </button>
  );
}

function GroupGrid({
  groups,
  links,
  query,
  matchedLinkIds,
  onAddLink,
  onEditLink,
  onEditGroup,
  onDeleteGroup,
  onAddGroup,
  onReorder,
}: {
  groups: LinkGroup[];
  links: QuickLink[];
  query: string;
  matchedLinkIds: Set<string>;
  onAddLink: (groupId?: string) => void;
  onEditLink: (link: QuickLink) => void;
  onEditGroup: (group: LinkGroup) => void;
  onDeleteGroup: (group: LinkGroup) => void;
  onAddGroup: () => void;
  onReorder: (orderedIds: string[]) => Promise<void>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const orderedIds = arrayMove(groups, oldIndex, newIndex).map((g) => g.id);
    onReorder(orderedIds);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={groups.map((g) => g.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onAddGroup}
          className="btn-secondary flex items-center gap-2 font-mono"
        >
          <Plus size={14} />
          new group
        </button>
      </div>
    </>
  );
}

function SortableGroupItem({
  group,
  links: groupLinks,
  query,
  matchedLinkIds,
  onAddLink,
  onEditLink,
  onEditGroup,
  onDeleteGroup,
}: {
  group: LinkGroup;
  links: QuickLink[];
  query: string;
  matchedLinkIds: Set<string>;
  onAddLink: () => void;
  onEditLink: (link: QuickLink) => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <GroupSection
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
      group={group}
      links={groupLinks}
      query={query}
      matchedLinkIds={matchedLinkIds}
      onAddLink={onAddLink}
      onEditLink={onEditLink}
      onEditGroup={onEditGroup}
      onDeleteGroup={onDeleteGroup}
    />
  );
}
