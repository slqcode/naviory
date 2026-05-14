import type { ButtonHTMLAttributes, ReactNode } from 'react';

type BaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

interface CancelProps extends BaseProps {
  label?: string;
}

export function DialogCancelButton({ label = 'cancel', type = 'button', ...rest }: CancelProps) {
  return (
    <button
      {...rest}
      type={type}
      className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
      <span className="kbd">esc</span>
    </button>
  );
}

interface ConfirmProps extends BaseProps {
  label?: string;
  danger?: boolean;
  /** show enter kbd hint on the right (default true) */
  showEnter?: boolean;
}

export function DialogConfirmButton({
  label = 'confirm',
  danger,
  type = 'submit',
  showEnter = true,
  ...rest
}: ConfirmProps) {
  const tone = danger
    ? 'border-danger/40 bg-danger/10 text-danger hover:border-danger hover:bg-danger/20 focus-visible:ring-danger/50'
    : 'border-accent/40 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20 focus-visible:ring-accent/40';
  const promptColor = danger ? 'text-danger/60' : 'text-accent/60';
  const kbdColor = danger ? 'border-danger/40 text-danger/80' : 'border-accent/40 text-accent/80';

  return (
    <button
      {...rest}
      type={type}
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors focus:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${tone}`}
    >
      <span className={promptColor}>$</span>
      {label}
      {showEnter && <span className={`kbd ${kbdColor}`}>↵</span>}
    </button>
  );
}

interface FooterProps {
  hint?: ReactNode;
  children: ReactNode;
}

/** Standard dialog footer: optional left-side hint + right-aligned buttons. */
export function DialogFooter({ hint, children }: FooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <span className="font-mono text-[11px] text-text-muted">{hint}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
