import { X } from 'lucide-react';
import { DialogCancelButton, DialogConfirmButton, DialogFooter } from './DialogButtons';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface Props {
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  danger,
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  onConfirm,
  onCancel,
}: Props) {
  useEscapeKey(onCancel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="panel-elevated w-full max-w-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold text-text-primary">
            <span className="text-text-muted">$</span> {title}
          </h2>
          <button
            onClick={onCancel}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="whitespace-pre-line text-sm text-text-secondary">{message}</p>
        </div>
        <DialogFooter hint={danger ? '! irreversible' : '# confirm'}>
          <DialogCancelButton onClick={onCancel} label={cancelLabel} />
          <DialogConfirmButton
            type="button"
            onClick={() => onConfirm()}
            label={confirmLabel}
            danger={danger}
          />
        </DialogFooter>
      </div>
    </div>
  );
}
