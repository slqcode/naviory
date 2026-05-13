import { useEffect, useState } from 'react';
import { Settings, Plus, Download, Upload, Terminal } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/hooks/useToast';
import { downloadJson, readJsonFile, validateExportData } from '@/utils/importExport';
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
  } = useAppStore();

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
      title: '删除分组',
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
          title: '导入数据',
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
        <SearchBox />
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
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupSection
                  key={group.id}
                  group={group}
                  links={links
                    .filter((l) => l.groupId === group.id)
                    .sort((a, b) => a.sort - b.sort)}
                  onAddLink={() => handleAddLink(group.id)}
                  onEditLink={handleEditLink}
                  onEditGroup={() => handleEditGroup(group)}
                  onDeleteGroup={() => handleDeleteGroup(group)}
                />
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAddGroup}
                className="btn-secondary flex items-center gap-2 font-mono"
              >
                <Plus size={14} />
                new group
              </button>
            </div>
          </>
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
