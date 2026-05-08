import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { normalizeUrl, isValidUrl } from '@/utils/url';
import { toast } from '@/hooks/useToast';
import type { QuickLink } from '@/types';

interface Props {
  link: QuickLink | null;
  defaultGroupId?: string;
  onClose: () => void;
}

export default function LinkEditorDialog({ link, defaultGroupId, onClose }: Props) {
  const { groups, links, addLink, updateLink, checkUrlDuplicate } = useAppStore();

  const [title, setTitle] = useState(link?.title ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [description, setDescription] = useState(link?.description ?? '');
  const [tagsText, setTagsText] = useState(link?.tags?.join(', ') ?? '');
  const [groupId, setGroupId] = useState(
    link?.groupId ?? defaultGroupId ?? groups[0]?.id ?? ''
  );
  const [openMode, setOpenMode] = useState<'current' | 'new-tab' | 'default'>(
    link?.openMode ?? 'default'
  );
  const [urlError, setUrlError] = useState<string>('');

  useEffect(() => {
    if (!url) {
      setUrlError('');
      return;
    }
    if (!isValidUrl(url)) {
      setUrlError('URL 格式不正确');
      return;
    }
    const normalized = normalizeUrl(url);
    const duplicate = checkUrlDuplicate(normalized, link?.id);
    if (duplicate) {
      const dupGroup = groups.find((g) => g.id === duplicate.groupId);
      setUrlError(`URL 已存在于"${dupGroup?.name ?? '其他'}"分组（${duplicate.title}）`);
    } else {
      setUrlError('');
    }
  }, [url, link?.id, links, groups, checkUrlDuplicate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('标题不能为空');
      return;
    }
    if (!url.trim() || !isValidUrl(url)) {
      toast.error('URL 格式不正确');
      return;
    }
    if (!groupId) {
      toast.error('请选择分组');
      return;
    }

    const normalized = normalizeUrl(url);
    const duplicate = checkUrlDuplicate(normalized, link?.id);
    if (duplicate) {
      toast.error('URL 已存在');
      return;
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const data = {
        title: title.trim(),
        url: normalized,
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        groupId,
        openMode: openMode === 'default' ? undefined : openMode,
      };

      if (link) {
        await updateLink(link.id, data);
        toast.success('更新成功');
      } else {
        const groupLinks = links.filter((l) => l.groupId === groupId);
        const sort = groupLinks.length + 1;
        await addLink({ ...data, sort });
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
          <h2 className="text-lg font-semibold">{link ? '编辑链接' : '新增链接'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="input"
              required
            />
            {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="tag1, tag2"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">分组 *</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="input"
              required
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">打开方式</label>
            <select
              value={openMode}
              onChange={(e) =>
                setOpenMode(e.target.value as 'current' | 'new-tab' | 'default')
              }
              className="input"
            >
              <option value="default">跟随全局设置</option>
              <option value="current">当前页</option>
              <option value="new-tab">新标签页</option>
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
