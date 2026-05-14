import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { findDuplicateGroups } from '@/utils/duplicateFinder';
import { toast } from '@/hooks/useToast';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import ConfirmDialog from '@/newtab/components/ConfirmDialog';
import {
  DialogCancelButton,
  DialogConfirmButton,
} from '@/newtab/components/DialogButtons';

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
  const groupNameById = useMemo(
    () => new Map(groups.map((group) => [group.id, group.name])),
    [groups]
  );

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

  useEscapeKey(onClose, open && !confirmOpen);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="panel-elevated flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold text-text-primary">
            <span className="text-text-muted">$</span> scan duplicates
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {duplicateGroups.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center font-mono text-sm text-text-muted">
              # no duplicates found
            </div>
          ) : (
            duplicateGroups.map((group) => (
              <section
                key={group.normalizedUrl}
                className="rounded-md border border-border bg-surface p-3"
              >
                <p className="mb-2 break-all font-mono text-[11px] text-text-muted">
                  {group.normalizedUrl}
                </p>
                <div className="space-y-1">
                  {group.links.map((link, index) => {
                    const isNewest = index === 0;
                    return (
                      <label
                        key={link.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-surface-hover"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToDelete.has(link.id)}
                          onChange={() => toggleSelection(link.id)}
                          className="mt-1 accent-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm text-text-primary">
                              {link.title}
                            </span>
                            {isNewest && (
                              <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                                newest
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 break-all font-mono text-[11px] text-text-muted">
                            {link.url}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-text-muted">
                            {groupNameById.get(link.groupId) ?? '?'} ·{' '}
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

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span className="font-mono text-[11px] text-text-muted">
            {duplicateGroups.length === 0
              ? '# nothing to clean'
              : `# ${duplicateGroups.length} duplicate groups · ${selectedToDelete.size} selected`}
          </span>
          <div className="flex items-center gap-2">
            <DialogCancelButton onClick={onClose} label="close" />
            {duplicateGroups.length > 0 && (
              <DialogConfirmButton
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selectedToDelete.size === 0}
                label="delete selected"
                danger
                showEnter={false}
              />
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="confirm delete"
          message={`确定删除选中的 ${selectedToDelete.size} 条重复链接吗？此操作不可恢复。`}
          confirmLabel="delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
