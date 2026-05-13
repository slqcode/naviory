import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { parseSearchInput, buildSearchUrl, SEARCH_ENGINES } from '@/utils/search';
import { getFaviconUrl, getInitialLetter } from '@/utils/favicon';
import type { QuickLink } from '@/types';

const PREFIX_HINTS: Array<{ prefix: string; label: string }> = [
  { prefix: 'g', label: 'Google' },
  { prefix: 'b', label: 'Bing' },
  { prefix: 'bd', label: '百度' },
  { prefix: 'gh', label: 'GitHub' },
  { prefix: 'npm', label: 'npm' },
];

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const links = useAppStore((s) => s.links);
  const defaultEngine = useAppStore((s) => s.settings.defaultSearchEngine);
  const defaultOpenMode = useAppStore((s) => s.settings.defaultOpenMode);

  const { hasPrefix, engine, query: cleanQuery } = parseSearchInput(query);

  const matchedLinks: QuickLink[] =
    hasPrefix || !cleanQuery
      ? []
      : links
          .filter((l) => {
            const q = cleanQuery.toLowerCase();
            return (
              l.title.toLowerCase().includes(q) ||
              l.url.toLowerCase().includes(q) ||
              (l.description?.toLowerCase().includes(q) ?? false) ||
              (l.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
            );
          })
          .slice(0, 8);

  const openLink = (link: QuickLink) => {
    const mode = link.openMode ?? defaultOpenMode;
    if (mode === 'new-tab') {
      window.open(link.url, '_blank');
    } else {
      window.location.href = link.url;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (hasPrefix && engine) {
      window.location.href = buildSearchUrl(engine, cleanQuery);
    } else if (matchedLinks.length > 0) {
      openLink(matchedLinks[0]);
    } else {
      const url = SEARCH_ENGINES[defaultEngine] + encodeURIComponent(cleanQuery);
      window.location.href = url;
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 全局 "/" 聚焦 + Esc 失焦/清空
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const editable = target?.isContentEditable;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showPanel = focused && (matchedLinks.length > 0 || (hasPrefix && engine) || !query);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 font-mono text-sm focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30 transition-colors">
          <span className="select-none text-accent">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search links or type command..."
            className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kbd hidden sm:inline-flex">/</span>
        </div>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-border bg-surface-elevated shadow-md">
          {matchedLinks.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                # matches ({matchedLinks.length})
              </div>
              <ul className="py-1">
                {matchedLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        openLink(link);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-hover"
                    >
                      <LinkIcon url={link.url} title={link.title} icon={link.icon} />
                      <span className="flex-1 truncate text-sm text-text-primary">{link.title}</span>
                      <span className="ml-2 shrink-0 truncate font-mono text-[11px] text-text-muted max-w-[40%]">
                        {safeHost(link.url)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasPrefix && engine && (
            <div className="px-3 py-2 font-mono text-xs text-text-secondary">
              <span className="text-accent">↵</span> search{' '}
              <span className="text-text-primary">{engine}</span>{' '}
              <span className="text-text-muted">{cleanQuery || '...'}</span>
            </div>
          )}

          {!hasPrefix && (
            <div className="px-3 py-2">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                # prefixes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PREFIX_HINTS.map((h) => (
                  <span
                    key={h.prefix}
                    className="font-mono text-[11px] text-text-secondary"
                  >
                    <span className="kbd mr-1">{h.prefix}</span>
                    {h.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function LinkIcon({ url, title, icon }: { url: string; title: string; icon?: string }) {
  const [failed, setFailed] = useState(false);
  const src = icon || getFaviconUrl(url);
  if (!src || failed) {
    return (
      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-accent/10 font-mono text-[10px] font-semibold text-accent">
        {getInitialLetter(title)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-4 w-4 shrink-0 rounded"
    />
  );
}
