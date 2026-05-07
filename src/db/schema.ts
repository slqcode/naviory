// src/db/schema.ts
import type { LinkGroup, AppSettings } from '@/types';

export const DEFAULT_GROUPS: Omit<LinkGroup, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '工作', icon: 'Briefcase', color: 'blue', sort: 1, collapsed: false },
  { name: '项目', icon: 'FolderKanban', color: 'green', sort: 2, collapsed: false },
  { name: 'AI', icon: 'Sparkles', color: 'purple', sort: 3, collapsed: false },
  { name: '开发', icon: 'Code', color: 'orange', sort: 4, collapsed: false },
  { name: '文档', icon: 'FileText', color: 'yellow', sort: 5, collapsed: false },
  { name: '工具', icon: 'Wrench', color: 'gray', sort: 6, collapsed: false },
  { name: '临时', icon: 'Clock', color: 'red', sort: 7, collapsed: false },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app-settings',
  theme: 'system',
  defaultSearchEngine: 'google',
  defaultOpenMode: 'current',
  version: 1,
  updatedAt: Date.now(),
};
