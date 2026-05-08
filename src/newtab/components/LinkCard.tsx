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
      onClick={handleClick}
      className="group relative flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
      title={link.description || link.url}
    >
      {iconUrl && !iconFailed ? (
        <img
          src={iconUrl}
          alt=""
          onError={() => setIconFailed(true)}
          className="w-6 h-6 rounded shrink-0"
        />
      ) : (
        <div className="w-6 h-6 rounded flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shrink-0">
          {getInitialLetter(link.title)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
          {link.title}
        </div>
      </div>
      <div className="hidden group-hover:flex items-center gap-0.5 absolute right-1 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded shadow">
        <button
          data-action="edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 hover:text-indigo-600 text-gray-500"
          title="编辑"
        >
          <Pencil size={12} />
        </button>
        <button
          data-action="delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:text-red-600 text-gray-500"
          title="删除"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
