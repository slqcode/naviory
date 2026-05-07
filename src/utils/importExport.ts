// src/utils/importExport.ts
import type { ExportData } from '@/types';

export function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<ExportData>;
  if (typeof d.version !== 'number') return false;
  if (typeof d.exportedAt !== 'number') return false;
  if (!Array.isArray(d.groups)) return false;
  if (!Array.isArray(d.links)) return false;
  if (!d.settings || typeof d.settings !== 'object') return false;
  for (const group of d.groups) {
    if (!group.id || !group.name || typeof group.sort !== 'number') return false;
  }
  for (const link of d.links) {
    if (!link.id || !link.title || !link.url || !link.groupId) return false;
  }
  return true;
}

export function downloadJson(data: ExportData, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
