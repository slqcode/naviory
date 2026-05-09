import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { findDuplicateGroups } from '@/utils/duplicateFinder';
import { toast } from '@/hooks/useToast';
import ConfirmDialog from '@/newtab/components/ConfirmDialog';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DuplicatesPanel({ open, onClose }: Props) {
  const { links, groups, bulkDeleteLinks } = useAppStore();
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const wasOpenRef = useRef(false);

  const duplicateGroups = useMemo(
    () =>
      findDuplicateGroups(links).map((group) => ({
        ...group,
        links: [...group.links].sort((a, b) => b.createdAt - a.createdAt),
      })),
    [links]
  );
  const groupNameById = useMemo(() => new Map(groups.map((group) => [group.id, group.name])), [groups]);

  useEffect(() => {
    if (!open) {
      setSelectedToDelete(new Set());
      setConfirmOpen(false);
      wasOpenRef.current = false;
      return;
    }

    if (!wasOpenRef.current) {
      const defaults = new Set<string>();
      for (const group of duplicateGroups) {
        for (let i = 1; i < group.links.length; i += 1) {
          defaults.add(group.links[i].id);
        }
      }
      setSelectedToDelete(defaults);
      wasOpenRef.current = true;
    }
  }, [open, duplicateGroups]);

  if (!open) {
    return null;
  }

  const toggleSelection = (id: string) => {
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const ids = [...selectedToDelete];
      await bulkDeleteLinks(ids);
      toast.success(`已删除 ${ids.length} 条重复链接`);
      setConfirmOpen(false);
      onClose();
    } catch (err) {
      setConfirmOpen(false);
      toast.error((err as Error).message || '删除失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">重复链接扫描</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {duplicateGroups.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              没有发现重复链接
            </div>
          ) : (
            duplicateGroups.map((group) => (
              <section
                key={group.normalizedUrl}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <p className="mb-3 text-xs text-gray-500 break-all">{group.normalizedUrl}</p>
                <div className="space-y-2">
                  {group.links.map((link, index) => {
                    const isNewest = index === 0;
                    return (
                      <label
                        key={link.id}
                        className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToDelete.has(link.id)}
                          onChange={() => toggleSelection(link.id)}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {link.title}
                            </span>
                            {isNewest && (
                              <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                最新
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 break-all">{link.url}</div>
                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {groupNameById.get(link.groupId) ?? '未知分组'} ·{' '}
                            {new Date(link.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {duplicateGroups.length === 0
              ? '没有可清理的重复链接'
              : `共 ${duplicateGroups.length} 组重复，已选 ${selectedToDelete.size} 条待删除`}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              关闭
            </button>
            {duplicateGroups.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selectedToDelete.size === 0}
                className="btn-danger flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                删除选中
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="确认删除"
          message={`确定删除选中的 ${selectedToDelete.size} 条重复链接吗？此操作不可恢复。`}
          confirmLabel="确认删除"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
