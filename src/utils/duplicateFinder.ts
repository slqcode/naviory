import type { QuickLink } from '@/types';

export function canonicalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const host = url.host.toLowerCase();
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!key.toLowerCase().startsWith('utm_')) {
      params.append(key, value);
    }
  });

  const search = params.toString() ? `?${params.toString()}` : '';
  return `${url.protocol}//${host}${pathname}${search}`;
}

export const normalizeUrl = canonicalizeUrl;

export interface DuplicateGroup {
  normalizedUrl: string;
  links: QuickLink[];
}

export function findDuplicateGroups(links: QuickLink[]): DuplicateGroup[] {
  const map = new Map<string, QuickLink[]>();

  for (const link of links) {
    const key = canonicalizeUrl(link.url);
    const group = map.get(key);
    if (group) {
      group.push(link);
    } else {
      map.set(key, [link]);
    }
  }

  const result: DuplicateGroup[] = [];
  for (const [normalizedUrl, groupLinks] of map) {
    if (groupLinks.length >= 2) {
      groupLinks.sort((a, b) => b.createdAt - a.createdAt);
      result.push({ normalizedUrl, links: groupLinks });
    }
  }
  return result;
}
