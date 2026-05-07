// src/types/index.ts

export interface LinkGroup {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sort: number;
  collapsed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  tags?: string[];
  groupId: string;
  sort: number;
  openMode?: 'current' | 'new-tab';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface AppSettings {
  id: 'app-settings';
  theme: 'system' | 'light' | 'dark';
  defaultSearchEngine: 'google' | 'bing' | 'baidu';
  defaultOpenMode: 'current' | 'new-tab';
  version: number;
  updatedAt: number;
}

export interface ExportData {
  version: number;
  exportedAt: number;
  groups: LinkGroup[];
  links: QuickLink[];
  settings: AppSettings;
}

export type SearchEngine = 'google' | 'bing' | 'baidu' | 'github' | 'npm';

export interface SearchPrefix {
  prefix: string;
  engine: SearchEngine;
  url: string;
}
