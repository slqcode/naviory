import { useEffect, useState } from 'react';

interface Props {
  linksCount: number;
  groupsCount: number;
}

export default function StatusBar({ linksCount, groupsCount }: Props) {
  const [now, setNow] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const tick = () => setNow(formatTime(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const version =
    typeof chrome !== 'undefined' && chrome.runtime?.getManifest
      ? chrome.runtime.getManifest().version
      : '0.1.0';

  return (
    <footer className="sticky bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-8 max-w-6xl items-center gap-3 px-4 font-mono text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          <span className="text-text-primary">LOCAL</span>
        </span>
        <Sep />
        <span>IndexedDB</span>
        <Sep />
        <span>{linksCount} links</span>
        <Sep />
        <span>{groupsCount} groups</span>
        <Sep />
        <span>v{version}</span>
        <span className="ml-auto">{now}</span>
      </div>
    </footer>
  );
}

function Sep() {
  return <span className="text-text-muted">·</span>;
}

function formatTime(d: Date) {
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
