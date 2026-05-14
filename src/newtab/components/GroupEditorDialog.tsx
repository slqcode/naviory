import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/useToast';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { DialogCancelButton, DialogConfirmButton, DialogFooter } from './DialogButtons';
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

  useEscapeKey(onClose);

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
      <form
        onSubmit={handleSubmit}
        className="panel-elevated flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold text-text-primary">
            <span className="text-text-muted">$</span> {group ? 'edit group' : 'new group'}
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
          {/* preview row — minimal, console-style */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs">
            <span className="text-text-muted">preview&gt;</span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${previewStyle.bgClass}`}
            >
              <PreviewIcon size={12} className={previewStyle.textClass} />
            </span>
            <span className="truncate text-text-primary">
              <span className="text-text-muted"># </span>
              {name.trim() || 'group-name'}
            </span>
            <span className="ml-auto shrink-0 text-text-muted">
              {icon}:{color}
            </span>
          </div>

          <Field label="name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              maxLength={20}
              autoFocus
            />
          </Field>

          <Field label="icon">
            <div className="grid grid-cols-8 gap-1.5 rounded-md border border-border bg-surface p-2">
              {GROUP_ICONS.map(({ name: iconName, component: IconComp }) => {
                const selected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={`flex aspect-square items-center justify-center rounded transition-colors ${
                      selected
                        ? 'bg-accent/15 text-accent ring-1 ring-accent/50'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <IconComp size={14} />
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="color">
            <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-surface p-2">
              {GROUP_COLORS.map((c) => {
                const selected = color === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    title={c.key}
                    className={`flex h-6 w-6 items-center justify-center rounded transition-transform ${
                      selected ? 'ring-1 ring-accent ring-offset-2 ring-offset-surface' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selected && <Check size={11} className="text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <DialogFooter hint={group ? '# editing' : '# new'}>
          <DialogCancelButton onClick={onClose} />
          <DialogConfirmButton type="submit" label="save" />
        </DialogFooter>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {children}
    </label>
  );
}
