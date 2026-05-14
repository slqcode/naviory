import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { normalizeUrl, isValidUrl } from '@/utils/url';
import { toast } from '@/hooks/useToast';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { DialogCancelButton, DialogConfirmButton, DialogFooter } from './DialogButtons';
import type { QuickLink } from '@/types';

interface Props {
  link: QuickLink | null;
  defaultGroupId?: string;
  onClose: () => void;
}

export default function LinkEditorDialog({ link, defaultGroupId, onClose }: Props) {
  const { groups, links, addLink, updateLink, checkUrlDuplicate } = useAppStore();

  useEscapeKey(onClose);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="panel-elevated w-full max-w-md">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold text-text-primary">
            <span className="text-text-muted">$</span> {link ? 'edit link' : 'new link'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 px-4 py-4">
          <Field label="title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
              maxLength={100}
              autoFocus
            />
          </Field>

          <Field label="url" required>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="input-mono"
              required
            />
            {urlError && (
              <p className="mt-1 font-mono text-[11px] text-danger">! {urlError}</p>
            )}
          </Field>

          <Field label="description">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              maxLength={200}
            />
          </Field>

          <Field label="tags (comma separated)">
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="tag1, tag2"
              className="input-mono"
            />
          </Field>

          <Field label="group" required>
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
          </Field>

          <Field label="open mode">
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
          </Field>
          </div>

          <DialogFooter hint={link ? '# editing' : '# new'}>
            <DialogCancelButton onClick={onClose} />
            <DialogConfirmButton type="submit" label="save" />
          </DialogFooter>
        </form>
      </div>
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
