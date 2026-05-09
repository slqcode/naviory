import { describe, it, expect } from 'vitest';
import { normalizeUrl, findDuplicateGroups } from '@/utils/duplicateFinder';
import type { QuickLink } from '@/types';

function makeLink(overrides: Partial<QuickLink> & { url: string }): QuickLink {
  return {
    id: crypto.randomUUID(),
    title: 'Test',
    groupId: 'g1',
    sort: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('normalizeUrl', () => {
  it('lowercases the host', () => {
    expect(normalizeUrl('https://GitHub.COM/foo')).toBe('https://github.com/foo');
  });

  it('removes trailing slash from path (but keeps root /)', () => {
    expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });

  it('strips utm_ query params', () => {
    expect(normalizeUrl('https://example.com/page?utm_source=twitter&a=1')).toBe(
      'https://example.com/page?a=1'
    );
  });

  it('removes ? when all params are utm_', () => {
    expect(normalizeUrl('https://example.com/page?utm_source=x&utm_medium=y')).toBe(
      'https://example.com/page'
    );
  });

  it('discards hash fragment', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe(
      'https://example.com/page'
    );
  });

  it('returns trimmed string for invalid URLs', () => {
    expect(normalizeUrl('  not a url  ')).toBe('not a url');
  });

  it('preserves path case', () => {
    expect(normalizeUrl('https://example.com/CamelCase')).toBe(
      'https://example.com/CamelCase'
    );
  });
});

describe('findDuplicateGroups', () => {
  it('returns empty array for empty input', () => {
    expect(findDuplicateGroups([])).toEqual([]);
  });

  it('returns empty array when no duplicates', () => {
    const links = [
      makeLink({ url: 'https://a.com' }),
      makeLink({ url: 'https://b.com' }),
    ];
    expect(findDuplicateGroups(links)).toEqual([]);
  });

  it('groups exact duplicate URLs', () => {
    const links = [
      makeLink({ url: 'https://a.com', createdAt: 100 }),
      makeLink({ url: 'https://a.com', createdAt: 200 }),
    ];
    const result = findDuplicateGroups(links);
    expect(result).toHaveLength(1);
    expect(result[0].links).toHaveLength(2);
    expect(result[0].links[0].createdAt).toBe(200); // newest first
  });

  it('groups URLs that differ only by utm params', () => {
    const links = [
      makeLink({ url: 'https://a.com/page?utm_source=x', createdAt: 100 }),
      makeLink({ url: 'https://a.com/page', createdAt: 200 }),
    ];
    const result = findDuplicateGroups(links);
    expect(result).toHaveLength(1);
    expect(result[0].links).toHaveLength(2);
  });

  it('returns multiple duplicate groups independently', () => {
    const links = [
      makeLink({ url: 'https://a.com', createdAt: 100 }),
      makeLink({ url: 'https://a.com', createdAt: 200 }),
      makeLink({ url: 'https://b.com/page?utm_source=x', createdAt: 300 }),
      makeLink({ url: 'https://b.com/page', createdAt: 400 }),
      makeLink({ url: 'https://c.com/unique' }),
    ];

    const result = findDuplicateGroups(links);
    expect(result).toHaveLength(2);
    expect(result.map((g) => g.normalizedUrl)).toEqual([
      'https://a.com/',
      'https://b.com/page',
    ]);
  });

  it('does not group different URLs', () => {
    const links = [
      makeLink({ url: 'https://a.com/page1' }),
      makeLink({ url: 'https://a.com/page2' }),
    ];
    expect(findDuplicateGroups(links)).toEqual([]);
  });
});
