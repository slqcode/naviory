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
  const PreviewIcon = GROUP_ICONS.find((i) => i.name === icon)?.component ?? GROUP_ICONS[0].component;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold">{group ? '编辑分组' : '新增分组'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 预览区 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${previewStyle.bgClass}`}>
              <PreviewIcon size={20} className={previewStyle.textClass} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {name.trim() || '分组预览'}
              </div>
              <div className="text-xs text-gray-500">{icon} · {color}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">分组名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              maxLength={20}
              autoFocus
            />
          </div>

          {/* 图标选择器 */}
          <div>
            <label className="block text-sm font-medium mb-2">图标</label>
            <div className="grid grid-cols-8 gap-2">
              {GROUP_ICONS.map(({ name: iconName, component: IconComp }) => {
                const selected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={`aspect-square flex items-center justify-center rounded-md border transition-colors ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-500'
                    }`}
                  >
                    <IconComp size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 颜色选择器 */}
          <div>
            <label className="block text-sm font-medium mb-2">颜色</label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => {
                const selected = color === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    title={c.key}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                      selected ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selected && <Check size={14} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
