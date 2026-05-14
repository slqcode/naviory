import { describe, it, expect } from 'vitest';
import sampleHtml from '../fixtures/bookmarks-sample.html?raw';
import { parseBookmarksHtml } from '@/utils/bookmarksHtmlImporter';

describe('parseBookmarksHtml', () => {
  it('treats user folders under 书签栏 / 其他书签 as top-level groups', () => {
    const result = parseBookmarksHtml(sampleHtml);
    expect(result.groupNames).toContain('工作');
    expect(result.groupNames).toContain('AI');
  });

  it('does NOT create a group for Chrome root containers (书签栏 / 其他书签)', () => {
    const result = parseBookmarksHtml(sampleHtml);
    expect(result.groupNames).not.toContain('书签栏');
    expect(result.groupNames).not.toContain('其他书签');
    expect(result.groupNames).not.toContain('Bookmarks Bar');
    expect(result.groupNames).not.toContain('Other Bookmarks');
  });

  it('puts orphan links (directly under a root container) into 未分组', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const orphan = result.links.find((l) => l.url === 'https://orphan.example.com');
    expect(orphan).toBeDefined();
    expect(orphan!.groupName).toBe('未分组');

    const otherTopLevel = result.links.find((l) => l.url === 'https://other.example.com');
    expect(otherTopLevel).toBeDefined();
    expect(otherTopLevel!.groupName).toBe('未分组');
  });

  it('flattens deeply nested folders to the top user-level parent', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const backend = result.links.find((l) => l.url === 'https://backend.example.com');
    expect(backend).toBeDefined();
    expect(backend!.groupName).toBe('工作');
  });

  it('converts ADD_DATE (seconds) to milliseconds', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const work = result.links.find((l) => l.url === 'https://work.example.com');
    expect(work!.createdAt).toBe(1700000100 * 1000);
  });

  it('leaves createdAt undefined when ADD_DATE is missing', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const noDate = result.links.find((l) => l.url === 'https://api.example.com');
    expect(noDate!.createdAt).toBeUndefined();
  });

  it('ignores ICON attribute (no data URI in results)', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const ai = result.links.find((l) => l.url === 'https://ai.example.com');
    expect(ai).toBeDefined();
    expect(JSON.stringify(ai)).not.toContain('data:image');
  });

  it('skips javascript: protocol links', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const jsLink = result.links.find((l) => l.url === 'javascript:void(0)');
    expect(jsLink).toBeUndefined();
  });

  it('skips links with empty href', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const empty = result.links.find((l) => l.url === '');
    expect(empty).toBeUndefined();
  });

  it('uses URL as title when textContent is empty', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const noTitle = result.links.find((l) => l.url === 'https://notitle.example.com');
    expect(noTitle).toBeDefined();
    expect(noTitle!.title).toBe('https://notitle.example.com');
  });

  it('throws on invalid HTML (no DL element)', () => {
    expect(() => parseBookmarksHtml('<html><body>no bookmarks</body></html>')).toThrow(
      '未识别的书签 HTML 格式'
    );
  });

  it('returns correct total link count (valid http(s) only)', () => {
    const result = parseBookmarksHtml(sampleHtml);
    expect(result.links).toHaveLength(7);
  });
});
