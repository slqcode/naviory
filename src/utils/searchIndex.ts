import { pinyin } from 'pinyin-pro';
import type { QuickLink } from '@/types';

export interface SearchEntry {
  link: QuickLink;
  lower: string;
  pinyinFull: string;
  pinyinAbbr: string;
  host: string;
  tags: string[];
  description: string;
}

function safeHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function indexEntry(link: QuickLink): SearchEntry {
  const title = link.title ?? '';
  const lower = title.toLowerCase();
  const hasChinese = /[一-龥]/.test(title);
  const pinyinFull = hasChinese
    ? pinyin(title, { toneType: 'none', type: 'string' })
        .toLowerCase()
        .replace(/\s+/g, '')
    : '';
  const pinyinAbbr = hasChinese
    ? pinyin(title, { toneType: 'none', pattern: 'first', type: 'string' })
        .toLowerCase()
        .replace(/\s+/g, '')
    : '';
  return {
    link,
    lower,
    pinyinFull,
    pinyinAbbr,
    host: safeHost(link.url),
    tags: (link.tags ?? []).map((t) => t.toLowerCase()),
    description: (link.description ?? '').toLowerCase(),
  };
}

export function buildSearchIndex(links: QuickLink[]): Map<string, SearchEntry> {
  const map = new Map<string, SearchEntry>();
  for (const link of links) {
    map.set(link.id, indexEntry(link));
  }
  return map;
}

/** 0 = no match. Higher = better. */
export function scoreMatch(query: string, entry: SearchEntry): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  // 1. title 前缀精确
  if (entry.lower.startsWith(q)) return 100;

  // 3. 拼音首字母前缀（让 "xf" -> "讯飞" 排在 title contains 之前是合理的，
  //    因为用户输入 ASCII 缩写时大概率就是想用拼音匹配）
  if (entry.pinyinAbbr && entry.pinyinAbbr.startsWith(q)) return 70;

  // 2. title 包含
  if (entry.lower.includes(q)) return 60;

  // 4. 拼音全拼包含
  if (entry.pinyinFull && entry.pinyinFull.includes(q)) return 40;

  // 5. host
  if (entry.host.includes(q)) return 30;

  // 6. tags
  if (entry.tags.some((t) => t.includes(q))) return 25;

  // 7. description
  if (entry.description.includes(q)) return 15;

  return 0;
}

export interface RankedLink {
  link: QuickLink;
  score: number;
}

export function rankMatches(
  query: string,
  index: Map<string, SearchEntry>
): RankedLink[] {
  const q = query.trim();
  if (!q) return [];
  const out: RankedLink[] = [];
  for (const entry of index.values()) {
    const score = scoreMatch(q, entry);
    if (score > 0) {
      out.push({ link: entry.link, score });
    }
  }
  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.link.createdAt - a.link.createdAt;
  });
  return out;
}
