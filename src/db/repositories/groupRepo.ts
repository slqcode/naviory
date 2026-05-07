// src/db/repositories/groupRepo.ts
import { db } from '../index';
import type { LinkGroup } from '@/types';
import { generateId } from '@/utils/id';
import { DEFAULT_GROUPS } from '../schema';

export async function getAllGroups(): Promise<LinkGroup[]> {
  return db.groups.orderBy('sort').toArray();
}

export async function getGroupById(id: string): Promise<LinkGroup | undefined> {
  return db.groups.get(id);
}

export async function createGroup(
  data: Omit<LinkGroup, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LinkGroup> {
  const now = Date.now();
  const group: LinkGroup = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.groups.add(group);
  return group;
}

export async function updateGroup(
  id: string,
  data: Partial<Omit<LinkGroup, 'id' | 'createdAt'>>
): Promise<void> {
  await db.groups.update(id, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteGroup(id: string): Promise<void> {
  await db.transaction('rw', [db.groups, db.links], async () => {
    await db.links.where('groupId').equals(id).delete();
    await db.groups.delete(id);
  });
}

export async function updateGroupsSort(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.groups, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.groups.update(orderedIds[i], {
        sort: i + 1,
        updatedAt: Date.now(),
      });
    }
  });
}

export async function initializeDefaultGroups(): Promise<void> {
  const count = await db.groups.count();
  if (count === 0) {
    const now = Date.now();
    const groups: LinkGroup[] = DEFAULT_GROUPS.map((g) => ({
      ...g,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    await db.groups.bulkAdd(groups);
  }
}
