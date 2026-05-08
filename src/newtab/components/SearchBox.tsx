import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { parseSearchInput, buildSearchUrl, SEARCH_ENGINES } from '@/utils/search';
import { getFaviconUrl, getInitialLetter } from '@/utils/favicon';
import type { QuickLink } from '@/types';

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const links = useAppStore((s) => s.links);
  const defaultEngine = useAppStore((s) => s.settings.defaultSearchEngine);
  const defaultOpenMode = useAppStore((s) => s.settings.defaultOpenMode);

  const { hasPrefix, engine, query: cleanQuery } = parseSearchInput(query);

  // 本地链接搜索（无前缀时）
  const matchedLinks: QuickLink[] = hasPrefix || !cleanQuery
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

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="搜索本地链接或输入 URL，支持 g/b/bd/gh/npm 前缀"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 shadow-sm"
          />
        </div>
      </form>

      {/* 搜索结果下拉 */}
      {showResults && matchedLinks.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 card overflow-hidden z-10">
          {matchedLinks.map((link) => (
            <button
              key={link.id}
              onMouseDown={(e) => {
                e.preventDefault();
                openLink(link);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
            >
              <LinkIcon url={link.url} title={link.title} icon={link.icon} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{link.title}</div>
                <div className="text-xs text-gray-500 truncate">{link.url}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 前缀提示 */}
      {hasPrefix && engine && (
        <div className="absolute top-full left-0 right-0 mt-2 card px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
          按 Enter 使用 {engine} 搜索: {cleanQuery || '...'}
        </div>
      )}
    </div>
  );
}

function LinkIcon({ url, title, icon }: { url: string; title: string; icon?: string }) {
  const [failed, setFailed] = useState(false);
  const src = icon || getFaviconUrl(url);
  if (!src || failed) {
    return (
      <div className="w-6 h-6 rounded flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shrink-0">
        {getInitialLetter(title)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="w-6 h-6 rounded shrink-0"
    />
  );
}
