import { describe, it, expect } from 'vitest';
import { validateExportData } from '@/utils/importExport';

const validExport = {
  version: 1,
  exportedAt: 1_700_000_000_000,
  groups: [
    {
      id: 'g1',
      name: '工作',
      sort: 1,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    },
  ],
  links: [
    {
      id: 'l1',
      title: '示例',
      url: 'https://example.com',
      groupId: 'g1',
      sort: 1,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    },
  ],
  settings: {
    id: 'app-settings',
    theme: 'system',
    defaultSearchEngine: 'google',
    defaultOpenMode: 'current',
    version: 1,
    updatedAt: 1_700_000_000_000,
  },
};

describe('validateExportData', () => {
  it('接受格式完整的数据', () => {
    expect(validateExportData(validExport)).toBe(true);
  });

  it('接受 groups 和 links 都为空数组的情况', () => {
    expect(
      validateExportData({
        ...validExport,
        groups: [],
        links: [],
      })
    ).toBe(true);
  });

  it('拒绝 null 和非对象', () => {
    expect(validateExportData(null)).toBe(false);
    expect(validateExportData(undefined)).toBe(false);
    expect(validateExportData('string')).toBe(false);
    expect(validateExportData(123)).toBe(false);
  });

  it('拒绝缺少 version 字段', () => {
    const { version, ...rest } = validExport;
    void version;
    expect(validateExportData(rest)).toBe(false);
  });

  it('拒绝 version 不是数字', () => {
    expect(validateExportData({ ...validExport, version: '1' })).toBe(false);
  });

  it('拒绝缺少 exportedAt', () => {
    const { exportedAt, ...rest } = validExport;
    void exportedAt;
    expect(validateExportData(rest)).toBe(false);
  });

  it('拒绝 groups 不是数组', () => {
    expect(validateExportData({ ...validExport, groups: {} })).toBe(false);
  });

  it('拒绝 links 不是数组', () => {
    expect(validateExportData({ ...validExport, links: 'nope' })).toBe(false);
  });

  it('拒绝 group 缺少必填字段', () => {
    expect(
      validateExportData({
        ...validExport,
        groups: [{ id: 'g1', name: '' }],
      })
    ).toBe(false);
  });

  it('拒绝 link 缺少 url', () => {
    expect(
      validateExportData({
        ...validExport,
        links: [
          {
            id: 'l1',
            title: '无 URL',
            groupId: 'g1',
            sort: 1,
          },
        ],
      })
    ).toBe(false);
  });

  it('拒绝 link 缺少 groupId', () => {
    expect(
      validateExportData({
        ...validExport,
        links: [
          {
            id: 'l1',
            title: 'X',
            url: 'https://x.com',
            sort: 1,
          },
        ],
      })
    ).toBe(false);
  });

  it('拒绝缺少 settings', () => {
    const { settings, ...rest } = validExport;
    void settings;
    expect(validateExportData(rest)).toBe(false);
  });
});
