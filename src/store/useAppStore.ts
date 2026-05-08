// src/store/useAppStore.ts
import { create } from 'zustand';
import type { LinkGroup, QuickLink, AppSettings, ExportData } from '@/types';
import * as groupRepo from '@/db/repositories/groupRepo';
import * as linkRepo from '@/db/repositories/linkRepo';
import * as settingsRepo from '@/db/repositories/settingsRepo';
import { db } from '@/db';
import { DEFAULT_SETTINGS } from '@/db/schema';

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
  reorderLinks: (groupId: string, orderedIds: string[]) => Promise<void>;
  checkUrlDuplicate: (url: string, excludeId?: string) => QuickLink | null;

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
        const tempGroup = get().groups.find((g) => g.name === '临时');
        if (tempGroup) {
          await linkRepo.moveLinksToGroup(id, tempGroup.id);
        }
        await groupRepo.deleteGroup(id);
      } else {
        // 'cascade': deleteGroup already cascades link deletion
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
    return {
      version: 1,
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
        // Clear everything first
        await db.links.clear();
        await db.groups.clear();
        await db.settings.clear();

        // Bulk-insert imported data
        if (data.groups.length > 0) await db.groups.bulkAdd(data.groups);
        if (data.links.length > 0) await db.links.bulkAdd(data.links);
        await db.settings.put(data.settings);
      } else {
        // 'merge': add new, update existing
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
