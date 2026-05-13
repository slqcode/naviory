import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast, removeToast } from '@/hooks/useToast';

export default function Toast() {
  const { toasts } = useToast();

  return (
    <div className="fixed right-4 top-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon =
          t.type === 'success' ? CheckCircle : t.type === 'error' ? XCircle : Info;
        const barClass =
          t.type === 'success'
            ? 'bg-accent'
            : t.type === 'error'
            ? 'bg-danger'
            : 'bg-border-strong';
        const iconClass =
          t.type === 'success'
            ? 'text-accent'
            : t.type === 'error'
            ? 'text-danger'
            : 'text-text-secondary';
        const action = t.action;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex min-w-[240px] max-w-md items-center gap-2 overflow-hidden rounded-md border border-border-strong bg-surface-elevated shadow-md"
          >
            <span className={`h-full w-0.5 self-stretch ${barClass}`} aria-hidden />
            <Icon size={14} className={`ml-1 shrink-0 ${iconClass}`} />
            <span className="flex-1 py-2 font-mono text-xs text-text-primary">
              {t.message}
            </span>
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  removeToast(t.id);
                }}
                className="mr-2 shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-accent hover:bg-accent/10"
              >
                {action.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
