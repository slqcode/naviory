import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  requireText: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function TypedConfirmDialog({
  title,
  message,
  requireText,
  danger,
  confirmLabel = '确定',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState('');
  const matched = typed === requireText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            请在下方输入{' '}
            <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">
              {requireText}
            </code>{' '}
            以确认。
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requireText}
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onCancel} className="btn-secondary" type="button">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!matched}
            className={`${danger ? 'btn-danger' : 'btn-primary'} disabled:opacity-50 disabled:cursor-not-allowed`}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
