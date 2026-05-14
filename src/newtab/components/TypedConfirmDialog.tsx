import { useState } from 'react';
import { X } from 'lucide-react';
import { DialogCancelButton, DialogConfirmButton, DialogFooter } from './DialogButtons';
import { useEscapeKey } from '@/hooks/useEscapeKey';

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
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState('');
  const matched = typed === requireText;

  useEscapeKey(onCancel);

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
        <DialogFooter hint="! irreversible">
          <DialogCancelButton onClick={onCancel} label={cancelLabel} />
          <DialogConfirmButton
            type="button"
            onClick={() => onConfirm()}
            label={confirmLabel}
            danger={danger}
            disabled={!matched}
          />
        </DialogFooter>
      </div>
    </div>
  );
}
