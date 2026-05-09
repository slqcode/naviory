import { describe, it, expect } from 'vitest';
import sampleHtml from '../fixtures/bookmarks-sample.html?raw';
import { parseBookmarksHtml } from '@/utils/bookmarksHtmlImporter';

describe('parseBookmarksHtml', () => {
  it('parses top-level folders into group names', () => {
    const result = parseBookmarksHtml(sampleHtml);
    expect(result.groupNames).toContain('工作');
    expect(result.groupNames).toContain('AI');
    expect(result.groupNames).toContain('书签栏');
  });

  it('assigns orphan links (no folder) to 书签栏', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const orphan = result.links.find((l) => l.url === 'https://orphan.example.com');
    expect(orphan).toBeDefined();
    expect(orphan!.groupName).toBe('书签栏');
  });

  it('flattens nested folders to top-level parent', () => {
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
    expect(result.links).toHaveLength(6);
  });
});
