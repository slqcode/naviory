import { describe, it, expect } from 'vitest';
import { normalizeUrl, isValidUrl, extractDomain } from '@/utils/url';

describe('normalizeUrl', () => {
  it('保留已有的 http:// 协议', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('保留已有的 https:// 协议', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('协议大小写不敏感（返回原字符串，不小写化）', () => {
    expect(normalizeUrl('HTTPS://example.com')).toBe('HTTPS://example.com');
    expect(normalizeUrl('Http://example.com')).toBe('Http://example.com');
  });

  it('没有协议时自动加 https://', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('去除首尾空白', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('保留路径和查询参数', () => {
    expect(normalizeUrl('example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });
});

describe('isValidUrl', () => {
  it('接受标准 URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
  });

  it('接受未带协议但可补齐的域名', () => {
    expect(isValidUrl('example.com')).toBe(true);
    expect(isValidUrl('sub.example.com/path')).toBe(true);
  });

  it('拒绝空字符串', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('拒绝纯空格', () => {
    // 纯空格补 https:// 后变为 "https://" —— 这在 URL 构造里其实合法但无 host
    // URL 对 "https://" 会抛错，所以这里应返回 false
    expect(isValidUrl('   ')).toBe(false);
  });

  it('拒绝非法输入', () => {
    expect(isValidUrl('not a url with spaces')).toBe(false);
  });
});

describe('extractDomain', () => {
  it('提取标准域名', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('提取子域名', () => {
    expect(extractDomain('https://sub.example.com')).toBe('sub.example.com');
  });

  it('去除端口号前的其他部分', () => {
    expect(extractDomain('https://example.com:8080/path')).toBe('example.com');
  });

  it('非法 URL 返回空字符串', () => {
    expect(extractDomain('not a url')).toBe('');
    expect(extractDomain('')).toBe('');
  });
});
