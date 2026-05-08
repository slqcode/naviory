import { describe, it, expect } from 'vitest';
import { getFaviconUrl, getInitialLetter } from '@/utils/favicon';

describe('getFaviconUrl', () => {
  it('优先使用浏览器提供的 favicon', () => {
    const tabFavicon = 'https://example.com/favicon.ico';
    expect(getFaviconUrl('https://example.com', tabFavicon)).toBe(tabFavicon);
  });

  it('不接受非 http 开头的 tabFavicon，回退到 Google API', () => {
    // 例如 chrome:// 开头的内部图标
    expect(getFaviconUrl('https://example.com', 'chrome://favicon/...')).toContain(
      'google.com/s2/favicons'
    );
  });

  it('没有 tabFavicon 时使用 Google Favicon API', () => {
    const url = getFaviconUrl('https://example.com');
    expect(url).toContain('google.com/s2/favicons');
    expect(url).toContain('domain=example.com');
    expect(url).toContain('sz=64');
  });

  it('提取正确的域名', () => {
    const url = getFaviconUrl('https://sub.example.com/path?q=1');
    expect(url).toContain('domain=sub.example.com');
  });

  it('非法 URL 返回空字符串', () => {
    expect(getFaviconUrl('not-a-url')).toBe('');
  });
});

describe('getInitialLetter', () => {
  it('返回首字母大写', () => {
    expect(getInitialLetter('hello')).toBe('H');
    expect(getInitialLetter('World')).toBe('W');
  });

  it('中文字符直接返回', () => {
    expect(getInitialLetter('工作')).toBe('工');
  });

  it('空字符串返回空字符串', () => {
    expect(getInitialLetter('')).toBe('');
  });
});
