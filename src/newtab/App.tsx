import { useEffect, useState } from 'react';
import { Settings, Plus, Download, Upload } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 顶部工具栏 */}
      <header className="flex justify-end p-4">
        <button
          onClick={handleOpenOptions}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title="设置"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* 搜索框 */}
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <SearchBox />
      </div>

      {/* 分组列表 */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {groups.length === 0 ? (
          <EmptyState
            title="还没有分组"
            description="点击下方按钮，创建第一个分组"
            actionLabel="创建分组"
            onAction={handleAddGroup}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div className="mt-8 flex justify-center gap-2">
              <button onClick={handleAddGroup} className="btn-secondary flex items-center gap-2">
                <Plus size={16} />
                新增分组
              </button>
            </div>
          </>
        )}

        {/* 底部统计/导入导出 */}
        <footer className="mt-12 flex items-center justify-between text-sm text-gray-500">
          <div>
            共 {links.length} 个链接 · {groups.length} 个分组
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex items-center gap-1 hover:text-indigo-600"
            >
              <Upload size={14} />
              导入
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 hover:text-indigo-600"
            >
              <Download size={14} />
              导出
            </button>
          </div>
        </footer>
      </main>

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
