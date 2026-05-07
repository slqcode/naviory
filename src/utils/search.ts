// src/utils/search.ts
import type { SearchEngine, SearchPrefix } from '@/types';

export const SEARCH_PREFIXES: SearchPrefix[] = [
  { prefix: 'g', engine: 'google', url: 'https://www.google.com/search?q=' },
  { prefix: 'b', engine: 'bing', url: 'https://www.bing.com/search?q=' },
  { prefix: 'bd', engine: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { prefix: 'gh', engine: 'github', url: 'https://github.com/search?q=' },
  { prefix: 'npm', engine: 'npm', url: 'https://www.npmjs.com/search?q=' },
];

export const SEARCH_ENGINES: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  baidu: 'https://www.baidu.com/s?wd=',
  github: 'https://github.com/search?q=',
  npm: 'https://www.npmjs.com/search?q=',
};

export function parseSearchInput(input: string): {
  hasPrefix: boolean;
  engine?: SearchEngine;
  query: string;
} {
  const trimmed = input.trim();

  for (const { prefix, engine } of SEARCH_PREFIXES) {
    if (trimmed.startsWith(prefix + ' ')) {
      return {
        hasPrefix: true,
        engine,
        query: trimmed.slice(prefix.length + 1).trim(),
      };
    }
  }

  return {
    hasPrefix: false,
    query: trimmed,
  };
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return SEARCH_ENGINES[engine] + encodeURIComponent(query);
}
