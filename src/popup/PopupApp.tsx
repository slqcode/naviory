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

  useEffect(() => {
    if (!groupId && groups.length > 0) {
      setGroupId(groups[0].id);
    }
  }, [groups, groupId]);

  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setDuplicate(null);
      return;
    }
    const normalized = normalizeUrl(url);
    setDuplicate(checkUrlDuplicate(normalized));
  }, [url, links, checkUrlDuplicate]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
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
      setTimeout(() => window.close(), 500);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <div className="bg-background p-4 text-center font-mono text-sm text-text-muted">
        $ loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-[450px] flex-col bg-background text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bookmark size={14} className="text-accent" />
          <h1 className="font-mono text-sm font-semibold">
            <span className="text-text-muted">$</span> save link
          </h1>
        </div>
        <button
          onClick={() => window.close()}
          className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </header>

      {favicon && (
        <div className="flex items-center gap-2 border-b border-border bg-surface/60 px-4 py-2 font-mono text-[11px] text-text-muted">
          <img
            src={favicon}
            alt=""
            className="h-3.5 w-3.5 rounded"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          <span className="truncate">{url}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 space-y-3 px-4 py-4">
        <PopupField label="title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
            maxLength={100}
          />
        </PopupField>

        <PopupField label="url" required>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-mono text-[11px]"
            required
          />
          {duplicate && (
            <p className="mt-1 font-mono text-[11px] text-danger">
              ! exists in "{groups.find((g) => g.id === duplicate.groupId)?.name ?? '?'}":{' '}
              {duplicate.title}
            </p>
          )}
        </PopupField>

        <PopupField label="description">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            maxLength={200}
          />
        </PopupField>

        <PopupField label="group" required>
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
        </PopupField>

        <PopupField label="tags (comma separated)">
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="tag1, tag2"
            className="input-mono"
          />
        </PopupField>
      </form>

      <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
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
          {loading ? 'saving...' : 'save'}
        </button>
      </footer>

      <Toast />
    </div>
  );
}

function PopupField({
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
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {children}
    </label>
  );
}
