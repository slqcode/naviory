// src/store/useAppStore.ts
import { create } from 'zustand';
import type { LinkGroup, QuickLink, AppSettings, ExportData } from '@/types';
import * as groupRepo from '@/db/repositories/groupRepo';
import * as linkRepo from '@/db/repositories/linkRepo';
import * as settingsRepo from '@/db/repositories/settingsRepo';
import { db } from '@/db';
import { DEFAULT_SETTINGS } from '@/db/schema';
import { toast } from '@/hooks/useToast';
import type { ParsedBookmarks } from '@/utils/bookmarksHtmlImporter';

interface AppState {
  // Data state
  groups: LinkGroup[];
  links: QuickLink[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Initialization
  initialize: () => Promise<void>;

  // Group actions
  addGroup: (data: Omit<LinkGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LinkGroup>;
  updateGroup: (id: string, data: Partial<Omit<LinkGroup, 'id' | 'createdAt'>>) => Promise<void>;
  deleteGroup: (id: string, strategy: 'cascade' | 'move-to-temp') => Promise<void>;
  reorderGroups: (orderedIds: string[]) => Promise<void>;
  toggleGroupCollapsed: (id: string) => Promise<void>;

  // Link actions
  addLink: (data: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt'>) => Promise<QuickLink>;
  updateLink: (id: string, data: Partial<Omit<QuickLink, 'id' | 'createdAt'>>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  deleteLinkWithUndo: (id: string) => Promise<void>;
  bulkDeleteLinks: (ids: string[]) => Promise<void>;
  reorderLinks: (groupId: string, orderedIds: string[]) => Promise<void>;
  checkUrlDuplicate: (url: string, excludeId?: string) => QuickLink | null;
  importBookmarksHtml: (
    parsed: ParsedBookmarks
  ) => Promise<{ groupsCreated: number; linksCreated: number }>;

  // Settings actions
  updateSettings: (data: Partial<Omit<AppSettings, 'id'>>) => Promise<void>;

  // Import / export
  exportData: () => Promise<ExportData>;
  importData: (data: ExportData, mode: 'overwrite' | 'merge') => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  groups: [],
  links: [],
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  initialized: false,

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  initialize: async () => {
    set({ loading: true, error: null });
    try {
      await groupRepo.initializeDefaultGroups();
      await settingsRepo.initializeDefaultSettings();
      const [groups, links, settings] = await Promise.all([
        groupRepo.getAllGroups(),
        linkRepo.getAllLinks(),
        settingsRepo.getSettings(),
      ]);
      set({ groups, links, settings, initialized: true, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  // ---------------------------------------------------------------------------
  // Group actions
  // ---------------------------------------------------------------------------
  addGroup: async (data) => {
    set({ loading: true, error: null });
    try {
      const group = await groupRepo.createGroup(data);
      const groups = await groupRepo.getAllGroups();
      set({ groups, loading: false });
      return group;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateGroup: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await groupRepo.updateGroup(id, data);
      const groups = await groupRepo.getAllGroups();
      set({ groups, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteGroup: async (id, strategy) => {
    set({ loading: true, error: null });
    try {
      if (strategy === 'move-to-temp') {
        // 找不到"临时"分组时必须抛错，避免链接被级联静默删除
        const tempGroup = get().groups.find((g) => g.name === '临时');
        if (!tempGroup) {
          throw new Error('未找到"临时"分组，无法移动链接');
        }
        if (tempGroup.id === id) {
          throw new Error('不能将"临时"分组移动到自身');
        }
        // 将链接先移动到临时分组，再删除空分组（事务保证原子性）
        await db.transaction('rw', [db.groups, db.links], async () => {
          await linkRepo.moveLinksToGroup(id, tempGroup.id);
          await db.groups.delete(id);
        });
      } else {
        // 'cascade': deleteGroup 内部已级联删除链接
        await groupRepo.deleteGroup(id);
      }
      const [groups, links] = await Promise.all([
        groupRepo.getAllGroups(),
        linkRepo.getAllLinks(),
      ]);
      set({ groups, links, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  reorderGroups: async (orderedIds) => {
    set({ loading: true, error: null });
    try {
      await groupRepo.updateGroupsSort(orderedIds);
      const groups = await groupRepo.getAllGroups();
      set({ groups, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  toggleGroupCollapsed: async (id) => {
    set({ loading: true, error: null });
    try {
      const group = get().groups.find((g) => g.id === id);
      if (!group) throw new Error(`Group ${id} not found`);
      await groupRepo.updateGroup(id, { collapsed: !group.collapsed });
      const groups = await groupRepo.getAllGroups();
      set({ groups, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  // ---------------------------------------------------------------------------
  // Link actions
  // ---------------------------------------------------------------------------
  addLink: async (data) => {
    set({ loading: true, error: null });
    try {
      const link = await linkRepo.createLink(data);
      const links = await linkRepo.getAllLinks();
      set({ links, loading: false });
      return link;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateLink: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await linkRepo.updateLink(id, data);
      const links = await linkRepo.getAllLinks();
      set({ links, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteLink: async (id) => {
    set({ loading: true, error: null });
    try {
      await linkRepo.deleteLink(id);
      const links = await linkRepo.getAllLinks();
      set({ links, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteLinkWithUndo: async (id) => {
    const snapshot = get().links.find((link) => link.id === id);
    if (!snapshot) return;

    await get().deleteLink(id);

    const restore = async () => {
      set({ loading: true, error: null });
      try {
        const originalGroup = get().groups.find((group) => group.id === snapshot.groupId);
        const tempGroup = get().groups.find((group) => group.name === '临时');
        const targetGroup = originalGroup ?? tempGroup;

        if (!targetGroup) {
          toast.error('无法恢复：目标分组和"临时"分组均不存在');
          set({ loading: false });
          return;
        }

        await db.links.put({
          ...snapshot,
          groupId: targetGroup.id,
          updatedAt: Date.now(),
        });
        const links = await linkRepo.getAllLinks();
        set({ links, loading: false });

        if (!originalGroup && tempGroup && targetGroup.id === tempGroup.id) {
          toast.show({
            message: '已恢复到"临时"分组（原分组已删除）',
            type: 'info',
          });
        } else {
          toast.success('已恢复');
        }
      } catch (e) {
        set({ error: (e as Error).message, loading: false });
        throw e;
      }
    };

    toast.show({
      message: '已删除链接',
      type: 'info',
      durationMs: 10000,
      action: {
        label: '撤销',
        onClick: restore,
      },
    });
  },

  bulkDeleteLinks: async (ids) => {
    set({ loading: true, error: null });
    try {
      await db.links.bulkDelete(ids);
      const links = await linkRepo.getAllLinks();
      set({ links, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  reorderLinks: async (groupId, orderedIds) => {
    set({ loading: true, error: null });
    try {
      await linkRepo.updateLinksSort(groupId, orderedIds);
      const links = await linkRepo.getAllLinks();
      set({ links, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  checkUrlDuplicate: (url, excludeId) => {
    return get().links.find((l) => l.url === url && l.id !== excludeId) ?? null;
  },

  // ---------------------------------------------------------------------------
  // Settings actions
  // ---------------------------------------------------------------------------
  updateSettings: async (data) => {
    set({ loading: true, error: null });
    try {
      await settingsRepo.updateSettings(data);
      const settings = await settingsRepo.getSettings();
      set({ settings, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  // ---------------------------------------------------------------------------
  // Import / export
  // ---------------------------------------------------------------------------
  exportData: async () => {
    const { groups, links, settings } = get();
    let appVersion: string | undefined;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
        appVersion = chrome.runtime.getManifest().version;
      }
    } catch {
      appVersion = undefined;
    }
    return {
      version: 1,
      ...(appVersion ? { appVersion } : {}),
      exportedAt: Date.now(),
      groups,
      links,
      settings,
    };
  },

  importData: async (data, mode) => {
    set({ loading: true, error: null });
    try {
      if (mode === 'overwrite') {
        // 整个覆盖操作包在事务中，失败时回滚，避免数据部分丢失
        await db.transaction('rw', [db.groups, db.links, db.settings], async () => {
          await db.links.clear();
          await db.groups.clear();
          await db.settings.clear();
          if (data.groups.length > 0) await db.groups.bulkAdd(data.groups);
          if (data.links.length > 0) await db.links.bulkAdd(data.links);
          await db.settings.put(data.settings);
        });
      } else {
        // 'merge': 新增不存在的，更新已存在的
        await db.transaction('rw', [db.groups, db.links, db.settings], async () => {
          for (const group of data.groups) {
            await db.groups.put(group);
          }
          for (const link of data.links) {
            await db.links.put(link);
          }
          await db.settings.put(data.settings);
        });
      }

      const [groups, links, settings] = await Promise.all([
        groupRepo.getAllGroups(),
        linkRepo.getAllLinks(),
        settingsRepo.getSettings(),
      ]);
      set({ groups, links, settings, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  importBookmarksHtml: async (parsed) => {
    set({ loading: true, error: null });
    try {
      let groupsCreated = 0;
      let linksCreated = 0;

      await db.transaction('rw', [db.groups, db.links], async () => {
        const groups = await groupRepo.getAllGroups();
        const groupByName = new Map(groups.map((group) => [group.name, group]));

        const currentMaxSort = groups.reduce((max, group) => Math.max(max, group.sort), 0);
        let nextGroupSort = currentMaxSort + 1;

        for (const groupName of parsed.groupNames) {
          if (!groupByName.has(groupName)) {
            const created = await groupRepo.createGroup({
              name: groupName,
              sort: nextGroupSort,
              collapsed: false,
            });
            groupByName.set(groupName, created);
            groupsCreated += 1;
            nextGroupSort += 1;
          }
        }

        const allLinks = await linkRepo.getAllLinks();
        const nextSortByGroupId = new Map<string, number>();
        for (const link of allLinks) {
          const current = nextSortByGroupId.get(link.groupId) ?? 1;
          nextSortByGroupId.set(link.groupId, Math.max(current, link.sort + 1));
        }

        for (const item of parsed.links) {
          const group = groupByName.get(item.groupName);
          if (!group) continue;

          const nextSort = nextSortByGroupId.get(group.id) ?? 1;
          await linkRepo.createLink({
            title: item.title,
            url: item.url,
            groupId: group.id,
            sort: nextSort,
            ...(item.createdAt !== undefined ? { createdAt: item.createdAt } : {}),
          });
          nextSortByGroupId.set(group.id, nextSort + 1);
          linksCreated += 1;
        }
      });

      const [nextGroups, nextLinks] = await Promise.all([
        groupRepo.getAllGroups(),
        linkRepo.getAllLinks(),
      ]);
      set({ groups: nextGroups, links: nextLinks, loading: false });

      return { groupsCreated, linksCreated };
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  clearAllData: async () => {
    set({ loading: true, error: null });
    try {
      await db.links.clear();
      await db.groups.clear();
      await db.settings.clear();
      set({ groups: [], links: [], settings: DEFAULT_SETTINGS, initialized: false });
      await get().initialize();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
}));
