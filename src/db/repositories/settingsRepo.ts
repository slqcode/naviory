// src/db/repositories/settingsRepo.ts
import { db } from '../index';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '../schema';

const SETTINGS_ID = 'app-settings';

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get(SETTINGS_ID);
  return settings || DEFAULT_SETTINGS;
}

export async function updateSettings(
  data: Partial<Omit<AppSettings, 'id'>>
): Promise<void> {
  await db.settings.update(SETTINGS_ID, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function initializeDefaultSettings(): Promise<void> {
  const settings = await db.settings.get(SETTINGS_ID);
  if (!settings) {
    await db.settings.add(DEFAULT_SETTINGS);
  }
}
