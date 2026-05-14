import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { parseSearchInput, buildSearchUrl, SEARCH_ENGINES } from '@/utils/search';
import { getFaviconUrl, getInitialLetter } from '@/utils/favicon';
import type { LinkGroup, QuickLink } from '@/types';
import type { RankedLink } from '@/utils/searchIndex';

const PREFIX_HINTS: Array<{ prefix: string; label: string }> = [
  { prefix: 'g', label: 'Google' },
  { prefix: 'b', label: 'Bing' },
  { prefix: 'bd', label: '百度' },
  { prefix: 'gh', label: 'GitHub' },
  { prefix: 'npm', label: 'npm' },
];

const MAX_RESULTS = 30;

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  rankedMatches: RankedLink[];
  groups: LinkGroup[];
}

export default function SearchBox({ query, onQueryChange, rankedMatches, groups }: Props) {
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const defaultEngine = useAppStore((s) => s.settings.defaultSearchEngine);
  const defaultOpenMode = useAppStore((s) => s.settings.defaultOpenMode);

  const { hasPrefix, engine, query: cleanQuery } = parseSearchInput(query);
  const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

  const matchedLinks: QuickLink[] =
    hasPrefix || !cleanQuery
      ? []
      : rankedMatches.slice(0, MAX_RESULTS).map((m) => m.link);

  // 当结果集变化时把高亮归位
  useEffect(() => {
    if (highlight >= matchedLinks.length) {
      setHighlight(matchedLinks.length === 0 ? 0 : matchedLinks.length - 1);
    }
  }, [matchedLinks.length, highlight]);

  // 高亮项滚入视野
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

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
      openLink(matchedLinks[Math.min(highlight, matchedLinks.length - 1)]);
    } else {
      const url = SEARCH_ENGINES[defaultEngine] + encodeURIComponent(cleanQuery);
      window.location.href = url;
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 全局 / 与 Cmd/Ctrl+K 聚焦；Esc 失焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (e.key === '/' || isShortcut) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const editable = target?.isContentEditable;
        if (!isShortcut && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable))
          return;
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && matchedLinks.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matchedLinks.length);
    } else if (e.key === 'ArrowUp' && matchedLinks.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h - 1 + matchedLinks.length) % matchedLinks.length);
    } else if (e.key === 'Escape') {
      if (query) {
        e.preventDefault();
        onQueryChange('');
        setHighlight(0);
      } else {
        inputRef.current?.blur();
      }
    } else if (e.key === 'Tab' && matchedLinks.length > 0 && !e.shiftKey) {
      // Tab 也确认
      e.preventDefault();
      openLink(matchedLinks[Math.min(highlight, matchedLinks.length - 1)]);
    }
  };

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
            onChange={(e) => {
              onQueryChange(e.target.value);
              setHighlight(0);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Search links or type command... (try xf for 讯飞)"
            className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kbd hidden sm:inline-flex">⌘K</span>
        </div>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-surface-elevated shadow-md">
          {matchedLinks.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                # matches ({matchedLinks.length}
                {rankedMatches.length > MAX_RESULTS ? ` of ${rankedMatches.length}` : ''})
              </div>
              <ul ref={listRef} className="py-1">
                {matchedLinks.map((link, idx) => {
                  const isHighlighted = idx === highlight;
                  const groupName = groupNameById.get(link.groupId);
                  return (
                    <li key={link.id}>
                      <button
                        type="button"
                        data-idx={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          openLink(link);
                        }}
                        onMouseEnter={() => setHighlight(idx)}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left ${
                          isHighlighted
                            ? 'bg-accent/10 text-accent'
                            : 'hover:bg-surface-hover'
                        }`}
                      >
                        <LinkIcon url={link.url} title={link.title} icon={link.icon} />
                        <span
                          className={`flex-1 truncate text-sm ${
                            isHighlighted ? 'text-accent' : 'text-text-primary'
                          }`}
                        >
                          {link.title}
                        </span>
                        {groupName && (
                          <span className="ml-2 shrink-0 truncate font-mono text-[11px] text-text-muted">
                            # {groupName}
                          </span>
                        )}
                        <span className="ml-2 shrink-0 truncate font-mono text-[11px] text-text-muted max-w-[35%]">
                          {safeHost(link.url)}
                        </span>
                      </button>
                    </li>
                  );
                })}
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
                # prefixes · ↑↓ navigate · ↵ open · esc clear
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
