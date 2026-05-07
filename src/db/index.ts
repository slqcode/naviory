// src/db/index.ts
import Dexie, { Table } from 'dexie';
import type { LinkGroup, QuickLink, AppSettings } from '@/types';

export class NaviDB extends Dexie {
  groups!: Table<LinkGroup, string>;
  links!: Table<QuickLink, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('naviory');

    this.version(1).stores({
      groups: 'id, sort',
      links: 'id, groupId, sort, url',
      settings: 'id',
    });
  }
}

export const db = new NaviDB();
