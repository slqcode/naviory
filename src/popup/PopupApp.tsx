import { useEffect, useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/hooks/useToast';
import { normalizeUrl, isValidUrl } from '@/utils/url';
import Toast from '@/newtab/components/Toast';
import type { QuickLink } from '@/types';

export default function PopupApp() {
  useTheme();
  const { groups, links, initialized, initialize, addLink, checkUrlDuplicate } = useAppStore();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [groupId, setGroupId] = useState('');
  const [favicon, setFavicon] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState<QuickLink | null>(null);

  // 初始化 store + 读取当前 tab
  useEffect(() => {
    initialize();

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab) {
          setTitle(tab.title ?? '');
          setUrl(tab.url ?? '');
          setFavicon(tab.favIconUrl ?? '');
        }
      });
    }
  }, [initialize]);

  // 初始化 groupId
  useEffect(() => {
    if (!groupId && groups.length > 0) {
      setGroupId(groups[0].id);
    }
  }, [groups, groupId]);

  // 检查 URL 重复
  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setDuplicate(null);
      return;
    }
    const normalized = normalizeUrl(url);
    setDuplicate(checkUrlDuplicate(normalized));
  }, [url, links, checkUrlDuplicate]);

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
    if (duplicate) {
      toast.error('URL 已存在');
      return;
    }
    if (!groupId) {
      toast.error('请选择分组');
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizeUrl(url);
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const groupLinks = links.filter((l) => l.groupId === groupId);
      const sort = groupLinks.length + 1;

      await addLink({
        title: title.trim(),
        url: normalized,
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        groupId,
        sort,
        icon: favicon || undefined,
      });
      toast.success('保存成功');
      // 短暂延迟让用户看到提示
      setTimeout(() => window.close(), 500);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">加载中...</div>
    );
  }

  return (
    <div className="flex flex-col min-h-[450px]">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-indigo-600" />
          <h1 className="font-semibold">保存当前页面</h1>
        </div>
        <button
          onClick={() => window.close()}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X size={18} />
        </button>
      </header>

      {/* 预览：favicon + url */}
      {favicon && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          <img
            src={favicon}
            alt=""
            className="w-4 h-4 rounded"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          <span className="truncate">{url}</span>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
            标题 *
          </label>
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
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
            URL *
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input text-xs"
            required
          />
          {duplicate && (
            <p className="mt-1 text-xs text-red-600">
              URL 已存在于"{groups.find((g) => g.id === duplicate.groupId)?.name ?? '其他'}"
              分组（{duplicate.title}）
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
            描述
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
            分组 *
          </label>
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
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
            标签（逗号分隔）
          </label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="tag1, tag2"
            className="input"
          />
        </div>
      </form>

      {/* 底部操作 */}
      <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => window.close()}
          className="btn-secondary"
          disabled={loading}
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn-primary"
          disabled={loading || !!duplicate}
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </footer>

      <Toast />
    </div>
  );
}
