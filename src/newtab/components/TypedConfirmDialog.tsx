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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="panel-elevated w-full max-w-sm border-danger/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold text-danger">
            <span className="text-text-muted">$</span> {title}
          </h2>
          <button
            onClick={onCancel}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="whitespace-pre-line text-sm text-text-secondary">{message}</p>
          <p className="font-mono text-xs text-text-muted">
            type{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-danger">
              {requireText}
            </code>{' '}
            to confirm.
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requireText}
            autoFocus
            className="input-mono"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button onClick={onCancel} className="btn-secondary" type="button">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!matched}
            className={danger ? 'btn-danger' : 'btn-primary'}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
