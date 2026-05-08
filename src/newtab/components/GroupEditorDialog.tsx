import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/useToast';
import type { LinkGroup } from '@/types';

interface Props {
  group: LinkGroup | null;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  'blue',
  'green',
  'purple',
  'orange',
  'yellow',
  'gray',
  'red',
  'pink',
  'indigo',
];
const ICON_OPTIONS = [
  'Briefcase',
  'FolderKanban',
  'Sparkles',
  'Code',
  'FileText',
  'Wrench',
  'Clock',
  'Bookmark',
  'Star',
];

export default function GroupEditorDialog({ group, onClose }: Props) {
  const { groups, addGroup, updateGroup } = useAppStore();

  const [name, setName] = useState(group?.name ?? '');
  const [icon, setIcon] = useState(group?.icon ?? 'Bookmark');
  const [color, setColor] = useState(group?.color ?? 'blue');

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
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{group ? '编辑分组' : '新增分组'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">分组名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">图标</label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="input"
            >
              {ICON_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">颜色</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="input"
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
