import { describe, it, expect } from 'vitest';
import { buildSearchIndex, rankMatches, scoreMatch } from '@/utils/searchIndex';
import type { QuickLink } from '@/types';

function mk(partial: Partial<QuickLink>): QuickLink {
  return {
    id: partial.id ?? 'id-' + Math.random(),
    title: partial.title ?? '',
    url: partial.url ?? 'https://example.com',
    description: partial.description,
    tags: partial.tags,
    icon: partial.icon,
    groupId: partial.groupId ?? 'g1',
    sort: partial.sort ?? 0,
    createdAt: partial.createdAt ?? Date.now(),
    updatedAt: partial.updatedAt ?? Date.now(),
    openMode: partial.openMode,
  };
}

describe('searchIndex', () => {
  it('matches by Chinese title', () => {
    const links = [mk({ id: '1', title: '讯飞开放平台' })];
    const idx = buildSearchIndex(links);
    const e = idx.get('1')!;
    expect(scoreMatch('讯飞', e)).toBeGreaterThan(0);
  });

  it('matches by pinyin abbreviation', () => {
    const links = [mk({ id: '1', title: '讯飞开放平台' })];
    const idx = buildSearchIndex(links);
    const e = idx.get('1')!;
    expect(scoreMatch('xf', e)).toBeGreaterThan(0);
    expect(scoreMatch('xfkfpt', e)).toBeGreaterThan(0);
  });

  it('matches by full pinyin', () => {
    const links = [mk({ id: '1', title: '讯飞' })];
    const idx = buildSearchIndex(links);
    const e = idx.get('1')!;
    expect(scoreMatch('xunfei', e)).toBeGreaterThan(0);
  });

  it('does not match unrelated query', () => {
    const links = [mk({ id: '1', title: '讯飞' })];
    const idx = buildSearchIndex(links);
    const e = idx.get('1')!;
    expect(scoreMatch('zzz', e)).toBe(0);
  });

  it('exact title prefix beats pinyin abbr', () => {
    const links = [
      mk({ id: '1', title: 'Ghost CMS' }), // lower starts with 'gh'
      mk({ id: '2', title: '工行 hot' }), // pinyin abbr 'gh'
    ];
    const idx = buildSearchIndex(links);
    const ranked = rankMatches('gh', idx);
    expect(ranked[0].link.id).toBe('1'); // Ghost 'lower' starts with 'gh' -> 100
  });

  it('returns empty for empty query', () => {
    const links = [mk({ id: '1', title: '讯飞' })];
    const idx = buildSearchIndex(links);
    expect(rankMatches('', idx)).toEqual([]);
    expect(rankMatches('   ', idx)).toEqual([]);
  });

  it('matches host', () => {
    const links = [mk({ id: '1', title: 'AI Tool', url: 'https://kimi.moonshot.cn' })];
    const idx = buildSearchIndex(links);
    const e = idx.get('1')!;
    expect(scoreMatch('kimi', e)).toBeGreaterThan(0);
  });

  it('matches tags', () => {
    const links = [mk({ id: '1', title: 'Notes', tags: ['productivity'] })];
    const idx = buildSearchIndex(links);
    const e = idx.get('1')!;
    expect(scoreMatch('productivity', e)).toBeGreaterThan(0);
  });
});
