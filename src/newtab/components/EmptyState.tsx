interface Props {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <div className="mb-3 font-mono text-xs text-text-muted">~/naviory</div>
      <h3 className="mb-1 font-mono text-base text-text-primary">{title}</h3>
      <p className="mb-5 max-w-sm font-mono text-sm text-text-muted">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary font-mono">
          <span className="mr-1 text-text-muted">$</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
