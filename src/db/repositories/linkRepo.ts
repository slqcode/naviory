// src/db/repositories/linkRepo.ts
import { db } from '../index';
import type { QuickLink } from '@/types';
import { generateId } from '@/utils/id';

export async function getAllLinks(): Promise<QuickLink[]> {
  return db.links.toArray();
}

export async function getLinksByGroupId(groupId: string): Promise<QuickLink[]> {
  return db.links.where('groupId').equals(groupId).sortBy('sort');
}

export async function getLinkById(id: string): Promise<QuickLink | undefined> {
  return db.links.get(id);
}

export async function findLinkByUrl(url: string): Promise<QuickLink | undefined> {
  return db.links.where('url').equals(url).first();
}

export async function createLink(
  data: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt'>
): Promise<QuickLink> {
  const now = Date.now();
  const link: QuickLink = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.links.add(link);
  return link;
}

export async function updateLink(
  id: string,
  data: Partial<Omit<QuickLink, 'id' | 'createdAt'>>
): Promise<void> {
  await db.links.update(id, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteLink(id: string): Promise<void> {
  await db.links.delete(id);
}

export async function deleteLinksByGroupId(groupId: string): Promise<void> {
  await db.links.where('groupId').equals(groupId).delete();
}

export async function moveLinksToGroup(
  fromGroupId: string,
  toGroupId: string
): Promise<void> {
  const links = await getLinksByGroupId(fromGroupId);
  await db.transaction('rw', db.links, async () => {
    for (const link of links) {
      await db.links.update(link.id, {
        groupId: toGroupId,
        updatedAt: Date.now(),
      });
    }
  });
}

export async function updateLinksSort(
  groupId: string,
  orderedIds: string[]
): Promise<void> {
  await db.transaction('rw', db.links, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const link = await db.links.get(orderedIds[i]);
      if (link && link.groupId === groupId) {
        await db.links.update(orderedIds[i], {
          sort: i + 1,
          updatedAt: Date.now(),
        });
      }
    }
  });
}
