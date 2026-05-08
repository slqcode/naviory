import { describe, it, expect } from 'vitest';
import { parseSearchInput, buildSearchUrl, SEARCH_PREFIXES, SEARCH_ENGINES } from '@/utils/search';

describe('parseSearchInput', () => {
  it('无前缀时返回原输入', () => {
    const r = parseSearchInput('hello world');
    expect(r.hasPrefix).toBe(false);
    expect(r.engine).toBeUndefined();
    expect(r.query).toBe('hello world');
  });

  it('识别 Google 前缀', () => {
    const r = parseSearchInput('g react hooks');
    expect(r.hasPrefix).toBe(true);
    expect(r.engine).toBe('google');
    expect(r.query).toBe('react hooks');
  });

  it('识别 Bing 前缀', () => {
    const r = parseSearchInput('b typescript');
    expect(r.hasPrefix).toBe(true);
    expect(r.engine).toBe('bing');
    expect(r.query).toBe('typescript');
  });

  it('识别百度前缀 bd', () => {
    const r = parseSearchInput('bd 天气');
    expect(r.hasPrefix).toBe(true);
    expect(r.engine).toBe('baidu');
    expect(r.query).toBe('天气');
  });

  it('识别 GitHub 前缀 gh', () => {
    const r = parseSearchInput('gh zustand');
    expect(r.hasPrefix).toBe(true);
    expect(r.engine).toBe('github');
    expect(r.query).toBe('zustand');
  });

  it('识别 npm 前缀', () => {
    const r = parseSearchInput('npm dexie');
    expect(r.hasPrefix).toBe(true);
    expect(r.engine).toBe('npm');
    expect(r.query).toBe('dexie');
  });

  it('仅前缀不带 query 时，hasPrefix 为 false（需 prefix+空格 才算）', () => {
    // "g" 单独一个字符没有后缀空格，按规范应作为普通关键词处理
    const r = parseSearchInput('g');
    expect(r.hasPrefix).toBe(false);
    expect(r.query).toBe('g');
  });

  it('去除首尾空白', () => {
    const r = parseSearchInput('  gh  zustand  ');
    expect(r.hasPrefix).toBe(true);
    expect(r.engine).toBe('github');
    expect(r.query).toBe('zustand');
  });

  it('前缀之间不会互相覆盖：bd 不会被 b 误匹配', () => {
    // 当前实现按数组顺序第一个匹配的前缀，g/b 在前，bd 在后。
    // 如果 "bd foo" 先匹配 b，engine 会错误地变成 bing。
    // 这里验证实现是否正确处理多字符前缀。
    const r = parseSearchInput('bd 百度一下');
    expect(r.engine).toBe('baidu');
  });
});

describe('buildSearchUrl', () => {
  it('为 Google 构造正确 URL', () => {
    const url = buildSearchUrl('google', 'react hooks');
    expect(url).toBe('https://www.google.com/search?q=react%20hooks');
  });

  it('对中文 query 做 URL 编码', () => {
    const url = buildSearchUrl('baidu', '你好');
    expect(url).toContain('https://www.baidu.com/s?wd=');
    expect(url).toContain(encodeURIComponent('你好'));
  });

  it('所有搜索引擎都有对应的 URL 模板', () => {
    for (const engine of ['google', 'bing', 'baidu', 'github', 'npm'] as const) {
      expect(SEARCH_ENGINES[engine]).toMatch(/^https:\/\//);
    }
  });

  it('SEARCH_PREFIXES 中每个前缀都有对应的搜索引擎 URL', () => {
    for (const { engine } of SEARCH_PREFIXES) {
      expect(SEARCH_ENGINES[engine]).toBeDefined();
    }
  });
});
