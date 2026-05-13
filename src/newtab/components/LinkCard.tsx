import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getFaviconUrl, getInitialLetter } from '@/utils/favicon';
import type { QuickLink } from '@/types';

interface Props {
  link: QuickLink;
  onEdit: () => void;
  onDelete: () => void;
}

export default function LinkCard({ link, onEdit, onDelete }: Props) {
  const [iconFailed, setIconFailed] = useState(false);
  const defaultOpenMode = useAppStore((s) => s.settings.defaultOpenMode);
  const iconUrl = link.icon || getFaviconUrl(link.url);
  const host = safeHost(link.url);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    const mode = link.openMode ?? defaultOpenMode;
    if (mode === 'new-tab') {
      window.open(link.url, '_blank');
    } else {
      window.location.href = link.url;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className="group/link relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
      title={link.description || link.url}
    >
      {iconUrl && !iconFailed ? (
        <img
          src={iconUrl}
          alt=""
          onError={() => setIconFailed(true)}
          className="h-4 w-4 shrink-0 rounded"
        />
      ) : (
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-accent/10 font-mono text-[10px] font-semibold text-accent">
          {getInitialLetter(link.title)}
        </div>
      )}

      <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
        {link.title}
      </span>

      <span className="ml-auto hidden shrink-0 truncate font-mono text-[11px] text-text-muted md:inline max-w-[45%] group-hover/link:opacity-0">
        {host}
      </span>

      <div className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-border bg-surface-elevated px-0.5 py-0.5 group-hover/link:flex">
        <button
          data-action="edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded p-1 text-text-muted hover:text-accent"
          title="编辑"
        >
          <Pencil size={11} />
        </button>
        <button
          data-action="delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-text-muted hover:text-danger"
          title="删除"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
}
