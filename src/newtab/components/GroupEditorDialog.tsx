import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/useToast';
import { GROUP_ICONS, GROUP_COLORS, getGroupColorStyle } from '@/utils/groupTheme';
import type { LinkGroup } from '@/types';

interface Props {
  group: LinkGroup | null;
  onClose: () => void;
}

export default function GroupEditorDialog({ group, onClose }: Props) {
  const { groups, addGroup, updateGroup } = useAppStore();

  const [name, setName] = useState(group?.name ?? '');
  const [icon, setIcon] = useState(group?.icon ?? 'Bookmark');
  const [color, setColor] = useState(group?.color ?? 'indigo');

  const previewStyle = getGroupColorStyle(color);
  const PreviewIcon =
    GROUP_ICONS.find((i) => i.name === icon)?.component ?? GROUP_ICONS[0].component;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('分组名称不能为空');
      return;
    }
    try {
      if (group) {
        await updateGroup(group.id, { name: name.trim(), icon, color });
        toast.success('更新成功');
      } else {
        const sort = groups.length + 1;
        await addGroup({ name: name.trim(), icon, color, sort, collapsed: false });
        toast.success('添加成功');
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="panel-elevated flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold text-text-primary">
            <span className="text-text-muted">$</span> {group ? 'edit group' : 'new group'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* preview */}
          <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${previewStyle.bgClass}`}
            >
              <PreviewIcon size={16} className={previewStyle.textClass} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-sm text-text-primary">
                <span className="text-text-muted"># </span>
                {name.trim() || 'group-preview'}
              </div>
              <div className="font-mono text-[11px] text-text-muted">
                icon:{icon} · color:{color}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-text-muted">
              name <span className="ml-1 text-accent">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              maxLength={20}
              autoFocus
            />
          </label>

          <div>
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-text-muted">
              icon
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {GROUP_ICONS.map(({ name: iconName, component: IconComp }) => {
                const selected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={`flex aspect-square items-center justify-center rounded-md border transition-colors ${
                      selected
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
                    }`}
                  >
                    <IconComp size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-text-muted">
              color
            </span>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => {
                const selected = color === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    title={c.key}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-transform ${
                      selected ? 'scale-110 ring-2 ring-border-strong ring-offset-2 ring-offset-surface-elevated' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selected && <Check size={12} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button type="button" onClick={handleSubmit} className="btn-primary">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
