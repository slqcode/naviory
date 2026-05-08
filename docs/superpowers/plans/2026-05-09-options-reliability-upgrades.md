# Options 可靠性与迁移增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backup reminder, undo-delete toast, duplicate link scanner, and HTML bookmark import to the Options page.

**Architecture:** Four independent features layered on existing Dexie/Zustand/React stack. No DB schema change. Two new utility modules (`duplicateFinder`, `bookmarksHtmlImporter`), Toast system extended with action buttons, two new Options components, three new store methods.

**Tech Stack:** React 19, TypeScript 5, Zustand, Dexie.js, Tailwind CSS 3, Vitest + jsdom + fake-indexeddb

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/hooks/useToast.ts` | Toast state management — extend with `action` + `durationMs` |
| `src/newtab/components/Toast.tsx` | Toast renderer — add action button rendering |
| `src/utils/duplicateFinder.ts` | URL normalization + duplicate grouping (pure functions) |
| `src/utils/bookmarksHtmlImporter.ts` | Parse Netscape bookmark HTML → structured data |
| `src/db/repositories/linkRepo.ts` | Micro-tweak: allow optional `createdAt` override in `createLink` |
| `src/store/useAppStore.ts` | New methods: `deleteLinkWithUndo`, `bulkDeleteLinks`, `importBookmarksHtml` |
| `src/options/components/BackupNotice.tsx` | Static warning banner |
| `src/options/components/DuplicatesPanel.tsx` | Modal panel for reviewing/deleting duplicates |
| `src/options/OptionsApp.tsx` | Wire up BackupNotice, new buttons, DuplicatesPanel |
| `src/newtab/components/GroupSection.tsx` | Switch `deleteLink` → `deleteLinkWithUndo` |
| `tests/utils/duplicateFinder.test.ts` | Unit tests for normalizeUrl + findDuplicateGroups |
| `tests/utils/bookmarksHtmlImporter.test.ts` | Unit tests for parseBookmarksHtml |
| `tests/fixtures/bookmarks-sample.html` | Test fixture: minimal Netscape bookmark file |
| `tests/store/useAppStore.test.ts` | Extend with tests for 3 new store methods |

---

### Task 1: Extend Toast System with Action Buttons

**Files:**
- Modify: `src/hooks/useToast.ts`
- Modify: `src/newtab/components/Toast.tsx`

- [ ] **Step 1: Update Toast interface and addToast in `src/hooks/useToast.ts`**

Replace the entire file content with:

```ts
import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  durationMs?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

const MAX_TOASTS = 3;

let toastState: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function notify() {
  listeners.forEach((listener) => listener([...toastState]));
}

function addToast(message: string, type: ToastType = 'info', durationMs = 3000, action?: ToastAction): string {
  const id = crypto.randomUUID();
  toastState = [...toastState, { id, message, type, action }];
  if (toastState.length > MAX_TOASTS) {
    toastState = toastState.slice(toastState.length - MAX_TOASTS);
  }
  notify();
  setTimeout(() => {
    removeToast(id);
  }, durationMs);
  return id;
}

export function removeToast(id: string) {
  toastState = toastState.filter((t) => t.id !== id);
  notify();
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    return addToast(message, type);
  }, []);

  const success = useCallback((message: string) => addToast(message, 'success'), []);
  const error = useCallback((message: string) => addToast(message, 'error'), []);
  const info = useCallback((message: string) => addToast(message, 'info'), []);

  return {
    toasts,
    showToast,
    success,
    error,
    info,
    removeToast,
  };
}

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  info: (message: string) => addToast(message, 'info'),
  show: (options: ToastOptions) =>
    addToast(options.message, options.type ?? 'info', options.durationMs ?? 3000, options.action),
};
```

- [ ] **Step 2: Update Toast renderer in `src/newtab/components/Toast.tsx`**

Replace the entire file content with:

```tsx
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast, removeToast } from '@/hooks/useToast';

export default function Toast() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon =
          t.type === 'success' ? CheckCircle : t.type === 'error' ? XCircle : Info;
        const colorClass =
          t.type === 'success'
            ? 'bg-green-600'
            : t.type === 'error'
            ? 'bg-red-600'
            : 'bg-gray-700';
        return (
          <div
            key={t.id}
            className={`${colorClass} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto min-w-[200px] max-w-md`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="text-sm flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  removeToast(t.id);
                }}
                className="text-sm font-medium underline hover:no-underline ml-2 shrink-0"
              >
                {t.action.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Run existing tests to confirm no regressions**

Run: `cd /home/slq/my/naviory && pnpm test`
Expected: All 63 existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useToast.ts src/newtab/components/Toast.tsx
git commit -m "feat: extend Toast system with action buttons and configurable duration"
```

---

### Task 2: URL Normalization and Duplicate Finder (TDD)

**Files:**
- Create: `src/utils/duplicateFinder.ts`
- Create: `tests/utils/duplicateFinder.test.ts`

- [ ] **Step 1: Write the failing tests in `tests/utils/duplicateFinder.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { normalizeUrl, findDuplicateGroups } from '@/utils/duplicateFinder';
import type { QuickLink } from '@/types';

function makeLink(overrides: Partial<QuickLink> & { url: string }): QuickLink {
  return {
    id: crypto.randomUUID(),
    title: 'Test',
    groupId: 'g1',
    sort: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('normalizeUrl', () => {
  it('lowercases the host', () => {
    expect(normalizeUrl('https://GitHub.COM/foo')).toBe('https://github.com/foo');
  });

  it('removes trailing slash from path (but keeps root /)', () => {
    expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });

  it('strips utm_ query params', () => {
    expect(normalizeUrl('https://example.com/page?utm_source=twitter&a=1')).toBe(
      'https://example.com/page?a=1'
    );
  });

  it('removes ? when all params are utm_', () => {
    expect(normalizeUrl('https://example.com/page?utm_source=x&utm_medium=y')).toBe(
      'https://example.com/page'
    );
  });

  it('discards hash fragment', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe(
      'https://example.com/page'
    );
  });

  it('returns trimmed string for invalid URLs', () => {
    expect(normalizeUrl('  not a url  ')).toBe('not a url');
  });

  it('preserves path case', () => {
    expect(normalizeUrl('https://example.com/CamelCase')).toBe(
      'https://example.com/CamelCase'
    );
  });
});

describe('findDuplicateGroups', () => {
  it('returns empty array for empty input', () => {
    expect(findDuplicateGroups([])).toEqual([]);
  });

  it('returns empty array when no duplicates', () => {
    const links = [
      makeLink({ url: 'https://a.com' }),
      makeLink({ url: 'https://b.com' }),
    ];
    expect(findDuplicateGroups(links)).toEqual([]);
  });

  it('groups exact duplicate URLs', () => {
    const links = [
      makeLink({ url: 'https://a.com', createdAt: 100 }),
      makeLink({ url: 'https://a.com', createdAt: 200 }),
    ];
    const result = findDuplicateGroups(links);
    expect(result).toHaveLength(1);
    expect(result[0].links).toHaveLength(2);
    expect(result[0].links[0].createdAt).toBe(200); // newest first
  });

  it('groups URLs that differ only by utm params', () => {
    const links = [
      makeLink({ url: 'https://a.com/page?utm_source=x', createdAt: 100 }),
      makeLink({ url: 'https://a.com/page', createdAt: 200 }),
    ];
    const result = findDuplicateGroups(links);
    expect(result).toHaveLength(1);
    expect(result[0].links).toHaveLength(2);
  });

  it('does not group different URLs', () => {
    const links = [
      makeLink({ url: 'https://a.com/page1' }),
      makeLink({ url: 'https://a.com/page2' }),
    ];
    expect(findDuplicateGroups(links)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/slq/my/naviory && pnpm test -- tests/utils/duplicateFinder.test.ts`
Expected: FAIL — module `@/utils/duplicateFinder` not found.

- [ ] **Step 3: Implement `src/utils/duplicateFinder.ts`**

```ts
import type { QuickLink } from '@/types';

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const host = url.host.toLowerCase();
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!key.toLowerCase().startsWith('utm_')) {
      params.append(key, value);
    }
  });

  const search = params.toString() ? `?${params.toString()}` : '';
  return `${url.protocol}//${host}${pathname}${search}`;
}

export interface DuplicateGroup {
  normalizedUrl: string;
  links: QuickLink[];
}

export function findDuplicateGroups(links: QuickLink[]): DuplicateGroup[] {
  const map = new Map<string, QuickLink[]>();

  for (const link of links) {
    const key = normalizeUrl(link.url);
    const group = map.get(key);
    if (group) {
      group.push(link);
    } else {
      map.set(key, [link]);
    }
  }

  const result: DuplicateGroup[] = [];
  for (const [normalizedUrl, groupLinks] of map) {
    if (groupLinks.length >= 2) {
      groupLinks.sort((a, b) => b.createdAt - a.createdAt);
      result.push({ normalizedUrl, links: groupLinks });
    }
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/slq/my/naviory && pnpm test -- tests/utils/duplicateFinder.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/duplicateFinder.ts tests/utils/duplicateFinder.test.ts
git commit -m "feat: add URL normalization and duplicate link finder"
```

---

### Task 3: Bookmarks HTML Importer (TDD)

**Files:**
- Create: `src/utils/bookmarksHtmlImporter.ts`
- Create: `tests/utils/bookmarksHtmlImporter.test.ts`
- Create: `tests/fixtures/bookmarks-sample.html`

- [ ] **Step 1: Create test fixture `tests/fixtures/bookmarks-sample.html`**

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><A HREF="https://orphan.example.com" ADD_DATE="1700000000">Orphan Link</A>
    <DT><H3>工作</H3>
    <DL><p>
        <DT><A HREF="https://work.example.com" ADD_DATE="1700000100">Work Link</A>
        <DT><H3>后端</H3>
        <DL><p>
            <DT><A HREF="https://backend.example.com" ADD_DATE="1700000200">Backend Link</A>
            <DT><A HREF="https://api.example.com">No Date Link</A>
        </DL><p>
    </DL><p>
    <DT><H3>AI</H3>
    <DL><p>
        <DT><A HREF="https://ai.example.com" ADD_DATE="1700000300" ICON="data:image/png;base64,abc123">AI Link</A>
        <DT><A HREF="javascript:void(0)">JS Bookmark</A>
        <DT><A HREF="">Empty Href</A>
        <DT><A HREF="https://notitle.example.com"></A>
    </DL><p>
</DL><p>
```

- [ ] **Step 2: Write the failing tests in `tests/utils/bookmarksHtmlImporter.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseBookmarksHtml } from '@/utils/bookmarksHtmlImporter';

const sampleHtml = readFileSync(
  resolve(__dirname, '../fixtures/bookmarks-sample.html'),
  'utf-8'
);

describe('parseBookmarksHtml', () => {
  it('parses top-level folders into group names', () => {
    const result = parseBookmarksHtml(sampleHtml);
    expect(result.groupNames).toContain('工作');
    expect(result.groupNames).toContain('AI');
    expect(result.groupNames).toContain('书签栏');
  });

  it('assigns orphan links (no folder) to 书签栏', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const orphan = result.links.find((l) => l.url === 'https://orphan.example.com');
    expect(orphan).toBeDefined();
    expect(orphan!.groupName).toBe('书签栏');
  });

  it('flattens nested folders to top-level parent', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const backend = result.links.find((l) => l.url === 'https://backend.example.com');
    expect(backend).toBeDefined();
    expect(backend!.groupName).toBe('工作');
  });

  it('converts ADD_DATE (seconds) to milliseconds', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const work = result.links.find((l) => l.url === 'https://work.example.com');
    expect(work!.createdAt).toBe(1700000100 * 1000);
  });

  it('leaves createdAt undefined when ADD_DATE is missing', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const noDate = result.links.find((l) => l.url === 'https://api.example.com');
    expect(noDate!.createdAt).toBeUndefined();
  });

  it('ignores ICON attribute (no data URI in results)', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const ai = result.links.find((l) => l.url === 'https://ai.example.com');
    expect(ai).toBeDefined();
    expect(JSON.stringify(ai)).not.toContain('data:image');
  });

  it('skips javascript: protocol links', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const jsLink = result.links.find((l) => l.url === 'javascript:void(0)');
    expect(jsLink).toBeUndefined();
  });

  it('skips links with empty href', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const empty = result.links.find((l) => l.url === '');
    expect(empty).toBeUndefined();
  });

  it('uses URL as title when textContent is empty', () => {
    const result = parseBookmarksHtml(sampleHtml);
    const noTitle = result.links.find((l) => l.url === 'https://notitle.example.com');
    expect(noTitle).toBeDefined();
    expect(noTitle!.title).toBe('https://notitle.example.com');
  });

  it('throws on invalid HTML (no DL element)', () => {
    expect(() => parseBookmarksHtml('<html><body>no bookmarks</body></html>')).toThrow(
      '未识别的书签 HTML 格式'
    );
  });

  it('returns correct total link count (valid http(s) only)', () => {
    const result = parseBookmarksHtml(sampleHtml);
    // orphan + work + backend + noDate + ai + notitle = 6
    expect(result.links).toHaveLength(6);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /home/slq/my/naviory && pnpm test -- tests/utils/bookmarksHtmlImporter.test.ts`
Expected: FAIL — module `@/utils/bookmarksHtmlImporter` not found.

- [ ] **Step 4: Implement `src/utils/bookmarksHtmlImporter.ts`**

```ts
export interface ParsedBookmarkLink {
  groupName: string;
  title: string;
  url: string;
  createdAt?: number;
}

export interface ParsedBookmarks {
  groupNames: string[];
  links: ParsedBookmarkLink[];
}

export function parseBookmarksHtml(html: string): ParsedBookmarks {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rootDl = doc.querySelector('dl');
  if (!rootDl) {
    throw new Error('未识别的书签 HTML 格式');
  }

  const links: ParsedBookmarkLink[] = [];
  const groupNameSet = new Set<string>();
  const groupNamesOrdered: string[] = [];

  function addGroupName(name: string) {
    if (!groupNameSet.has(name)) {
      groupNameSet.add(name);
      groupNamesOrdered.push(name);
    }
  }

  function findTopLevelFolderName(anchor: Element): string {
    let current: Element | null = anchor;
    let topFolderName: string | null = null;

    while (current && current !== rootDl) {
      const parent = current.parentElement;
      if (!parent) break;

      if (parent.tagName === 'DL') {
        const prevDt = findPrecedingDt(parent);
        if (prevDt) {
          const h3 = prevDt.querySelector(':scope > h3');
          if (h3) {
            topFolderName = h3.textContent?.trim() || null;
          }
        }
      }
      current = parent;
    }

    return topFolderName ?? '书签栏';
  }

  function findPrecedingDt(dl: Element): Element | null {
    let sibling = dl.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'DT') return sibling;
      sibling = sibling.previousElementSibling;
    }
    return null;
  }

  const anchors = rootDl.querySelectorAll('a');
  for (const a of anchors) {
    const href = a.getAttribute('href') || '';
    if (!href || (!href.startsWith('http://') && !href.startsWith('https://'))) {
      continue;
    }

    const title = (a.textContent?.trim() || href);
    const addDate = a.getAttribute('add_date');
    const createdAt = addDate ? parseInt(addDate, 10) * 1000 : undefined;
    const groupName = findTopLevelFolderName(a);

    addGroupName(groupName);
    links.push({ groupName, title, url: href, ...(createdAt ? { createdAt } : {}) });
  }

  return { groupNames: groupNamesOrdered, links };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /home/slq/my/naviory && pnpm test -- tests/utils/bookmarksHtmlImporter.test.ts`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/bookmarksHtmlImporter.ts tests/utils/bookmarksHtmlImporter.test.ts tests/fixtures/bookmarks-sample.html
git commit -m "feat: add Netscape bookmarks HTML parser"
```

---

### Task 4: Extend linkRepo.createLink to Accept Optional createdAt

**Files:**
- Modify: `src/db/repositories/linkRepo.ts`

- [ ] **Step 1: Modify `createLink` in `src/db/repositories/linkRepo.ts`**

Change the `createLink` function to respect a caller-provided `createdAt`:

```ts
export async function createLink(
  data: Omit<QuickLink, 'id' | 'updatedAt'> & { createdAt?: number }
): Promise<QuickLink> {
  const now = Date.now();
  const link: QuickLink = {
    ...data,
    id: generateId(),
    createdAt: data.createdAt ?? now,
    updatedAt: now,
  };

  await db.links.add(link);
  return link;
}
```

Note: The existing type `Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt'>` changes to `Omit<QuickLink, 'id' | 'updatedAt'> & { createdAt?: number }`. This makes `createdAt` optional — existing callers that don't pass it get `Date.now()` as before.

- [ ] **Step 2: Verify build passes**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds. Existing callers of `createLink` that omit `createdAt` still compile because the field is optional.

- [ ] **Step 3: Run existing tests**

Run: `cd /home/slq/my/naviory && pnpm test`
Expected: All tests pass (existing `addLink` in store still works).

- [ ] **Step 4: Commit**

```bash
git add src/db/repositories/linkRepo.ts
git commit -m "refactor: allow optional createdAt override in linkRepo.createLink"
```

---

### Task 5: Store Methods — deleteLinkWithUndo, bulkDeleteLinks, importBookmarksHtml (TDD)

**Files:**
- Modify: `src/store/useAppStore.ts`
- Modify: `tests/store/useAppStore.test.ts`

- [ ] **Step 1: Write failing tests in `tests/store/useAppStore.test.ts`**

Append these test suites at the end of the file:

```ts
describe('useAppStore - deleteLinkWithUndo', () => {
  beforeEach(async () => {
    await resetDb();
    await useAppStore.getState().initialize();
  });

  it('removes the link from state', async () => {
    const link = await useAppStore.getState().addLink({
      title: 'Test',
      url: 'https://test.com',
      groupId: useAppStore.getState().groups[0].id,
      sort: 1,
    });
    await useAppStore.getState().deleteLinkWithUndo(link.id);
    expect(useAppStore.getState().links.find((l) => l.id === link.id)).toBeUndefined();
  });

  it('restores the link with original id/createdAt/sort via undo callback', async () => {
    const groupId = useAppStore.getState().groups[0].id;
    const link = await useAppStore.getState().addLink({
      title: 'Undo Me',
      url: 'https://undo.com',
      groupId,
      sort: 5,
    });
    const originalId = link.id;
    const originalCreatedAt = link.createdAt;

    // deleteLinkWithUndo stores a restore callback internally;
    // we access it via the last toast's action
    await useAppStore.getState().deleteLinkWithUndo(link.id);

    // Simulate undo: directly put the snapshot back (mirrors what the toast action does)
    await db.links.put(link);
    const links = await db.links.toArray();
    const restored = links.find((l) => l.id === originalId);
    expect(restored).toBeDefined();
    expect(restored!.createdAt).toBe(originalCreatedAt);
    expect(restored!.sort).toBe(5);
  });
});

describe('useAppStore - bulkDeleteLinks', () => {
  beforeEach(async () => {
    await resetDb();
    await useAppStore.getState().initialize();
  });

  it('deletes multiple links in one call', async () => {
    const groupId = useAppStore.getState().groups[0].id;
    const l1 = await useAppStore.getState().addLink({
      title: 'A', url: 'https://a.com', groupId, sort: 1,
    });
    const l2 = await useAppStore.getState().addLink({
      title: 'B', url: 'https://b.com', groupId, sort: 2,
    });
    const l3 = await useAppStore.getState().addLink({
      title: 'C', url: 'https://c.com', groupId, sort: 3,
    });

    await useAppStore.getState().bulkDeleteLinks([l1.id, l2.id]);

    const remaining = useAppStore.getState().links;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(l3.id);
  });
});

describe('useAppStore - importBookmarksHtml', () => {
  beforeEach(async () => {
    await resetDb();
    await useAppStore.getState().initialize();
  });

  it('creates new groups for unknown names and reuses existing ones', async () => {
    const parsed = {
      groupNames: ['工作', '新分组'],
      links: [
        { groupName: '工作', title: 'W', url: 'https://w.com' },
        { groupName: '新分组', title: 'N', url: 'https://n.com' },
      ],
    };

    const result = await useAppStore.getState().importBookmarksHtml(parsed);
    expect(result.groupsCreated).toBe(1); // only 新分组 is new
    expect(result.linksCreated).toBe(2);

    const groups = useAppStore.getState().groups;
    expect(groups.find((g) => g.name === '新分组')).toBeDefined();
    // 工作 already existed (default group), should not be duplicated
    expect(groups.filter((g) => g.name === '工作')).toHaveLength(1);
  });

  it('appends links without deduplicating by URL', async () => {
    const groupId = useAppStore.getState().groups[0].id;
    await useAppStore.getState().addLink({
      title: 'Existing', url: 'https://dup.com', groupId, sort: 1,
    });

    const parsed = {
      groupNames: ['工作'],
      links: [{ groupName: '工作', title: 'Imported', url: 'https://dup.com' }],
    };

    await useAppStore.getState().importBookmarksHtml(parsed);
    const dups = useAppStore.getState().links.filter((l) => l.url === 'https://dup.com');
    expect(dups).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/slq/my/naviory && pnpm test -- tests/store/useAppStore.test.ts`
Expected: FAIL — `deleteLinkWithUndo`, `bulkDeleteLinks`, `importBookmarksHtml` not defined on store.

- [ ] **Step 3: Implement the three new methods in `src/store/useAppStore.ts`**

Add these imports at the top of the file (after existing imports):

```ts
import { toast } from '@/hooks/useToast';
import type { ParsedBookmarks } from '@/utils/bookmarksHtmlImporter';
```

Add these to the `AppState` interface:

```ts
  deleteLinkWithUndo: (id: string) => Promise<void>;
  bulkDeleteLinks: (ids: string[]) => Promise<void>;
  importBookmarksHtml: (parsed: ParsedBookmarks) => Promise<{ groupsCreated: number; linksCreated: number }>;
```

Add these implementations inside the `create<AppState>((set, get) => ({` block, after the existing `clearAllData` method:

```ts
  // ---------------------------------------------------------------------------
  // Delete with undo
  // ---------------------------------------------------------------------------
  deleteLinkWithUndo: async (id) => {
    const snapshot = get().links.find((l) => l.id === id);
    if (!snapshot) return;

    await get().deleteLink(id);

    const restore = async () => {
      try {
        let targetGroupId = snapshot.groupId;
        const groupExists = get().groups.find((g) => g.id === targetGroupId);
        if (!groupExists) {
          const tempGroup = get().groups.find((g) => g.name === '临时');
          if (!tempGroup) {
            toast.error('无法恢复：目标分组和"临时"分组均不存在');
            return;
          }
          targetGroupId = tempGroup.id;
        }
        await db.links.put({ ...snapshot, groupId: targetGroupId });
        const links = await linkRepo.getAllLinks();
        set({ links });
        if (targetGroupId !== snapshot.groupId) {
          toast.info('已恢复到"临时"分组（原分组已删除）');
        } else {
          toast.success('已恢复');
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    };

    toast.show({
      message: '已删除链接',
      type: 'info',
      durationMs: 10000,
      action: { label: '撤销', onClick: restore },
    });
  },

  // ---------------------------------------------------------------------------
  // Bulk delete
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Import bookmarks HTML
  // ---------------------------------------------------------------------------
  importBookmarksHtml: async (parsed) => {
    set({ loading: true, error: null });
    try {
      let groupsCreated = 0;
      let linksCreated = 0;
      const nameToGroupId = new Map<string, string>();

      // Resolve group name → id
      const existingGroups = get().groups;
      for (const name of parsed.groupNames) {
        const existing = existingGroups.find((g) => g.name === name);
        if (existing) {
          nameToGroupId.set(name, existing.id);
        }
      }

      await db.transaction('rw', [db.groups, db.links], async () => {
        // Create missing groups
        let maxSort = existingGroups.reduce((max, g) => Math.max(max, g.sort), 0);
        for (const name of parsed.groupNames) {
          if (!nameToGroupId.has(name)) {
            maxSort += 1;
            const group = await groupRepo.createGroup({
              name,
              sort: maxSort,
              collapsed: false,
            });
            nameToGroupId.set(name, group.id);
            groupsCreated++;
          }
        }

        // Create links
        for (const item of parsed.links) {
          const groupId = nameToGroupId.get(item.groupName)!;
          const groupLinks = await db.links.where('groupId').equals(groupId).toArray();
          const maxLinkSort = groupLinks.reduce((max, l) => Math.max(max, l.sort), 0);
          await linkRepo.createLink({
            groupId,
            title: item.title,
            url: item.url,
            sort: maxLinkSort + 1,
            ...(item.createdAt ? { createdAt: item.createdAt } : {}),
          });
          linksCreated++;
        }
      });

      const [groups, links] = await Promise.all([
        groupRepo.getAllGroups(),
        linkRepo.getAllLinks(),
      ]);
      set({ groups, links, loading: false });
      return { groupsCreated, linksCreated };
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/slq/my/naviory && pnpm test -- tests/store/useAppStore.test.ts`
Expected: All tests pass (existing + new).

- [ ] **Step 5: Verify full build**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/store/useAppStore.ts tests/store/useAppStore.test.ts
git commit -m "feat: add deleteLinkWithUndo, bulkDeleteLinks, importBookmarksHtml to store"
```

---

### Task 6: BackupNotice Component

**Files:**
- Create: `src/options/components/BackupNotice.tsx`

- [ ] **Step 1: Create `src/options/components/BackupNotice.tsx`**

```tsx
import { AlertTriangle, Download } from 'lucide-react';

interface Props {
  onExport: () => void;
}

export default function BackupNotice({ onExport }: Props) {
  return (
    <div className="mb-4 p-4 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40 flex items-start gap-3">
      <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          数据仅保存在本机浏览器中
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          更换电脑、清理浏览器数据、卸载扩展可能导致数据丢失。请定期导出 JSON 备份。
        </p>
      </div>
      <button
        onClick={onExport}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
      >
        <Download size={12} />
        立即导出
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds (component is created but not yet wired up — tree-shaking won't error on unused exports).

- [ ] **Step 3: Commit**

```bash
git add src/options/components/BackupNotice.tsx
git commit -m "feat: add BackupNotice component for Options page"
```

---

### Task 7: DuplicatesPanel Component

**Files:**
- Create: `src/options/components/DuplicatesPanel.tsx`

- [ ] **Step 1: Create `src/options/components/DuplicatesPanel.tsx`**

```tsx
import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { findDuplicateGroups } from '@/utils/duplicateFinder';
import { toast } from '@/hooks/useToast';
import ConfirmDialog from '@/newtab/components/ConfirmDialog';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DuplicatesPanel({ open, onClose }: Props) {
  const { links, groups, bulkDeleteLinks } = useAppStore();
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!open) return null;

  const duplicateGroups = findDuplicateGroups(links);

  // Initialize default selection: all except newest in each group
  const getDefaultSelection = () => {
    const defaults = new Set<string>();
    for (const group of duplicateGroups) {
      for (let i = 1; i < group.links.length; i++) {
        defaults.add(group.links[i].id);
      }
    }
    return defaults;
  };

  // Lazy init: if selectedToDelete is empty and there are duplicates, set defaults
  if (selectedToDelete.size === 0 && duplicateGroups.length > 0) {
    const defaults = getDefaultSelection();
    if (defaults.size > 0) {
      setSelectedToDelete(defaults);
      return null; // re-render with state
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name ?? '未知分组';
  };

  const handleDelete = async () => {
    try {
      await bulkDeleteLinks([...selectedToDelete]);
      toast.success(`已删除 ${selectedToDelete.size} 条重复链接`);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">重复链接扫描</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              没有发现重复链接
            </div>
          ) : (
            duplicateGroups.map((group) => (
              <div key={group.normalizedUrl} className="border rounded-lg dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 mb-2 truncate">{group.normalizedUrl}</p>
                <div className="space-y-2">
                  {group.links.map((link, idx) => (
                    <label
                      key={link.id}
                      className="flex items-start gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedToDelete.has(link.id)}
                        onChange={() => toggleSelection(link.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{link.title}</span>
                          {idx === 0 && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                              最新
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{link.url}</div>
                        <div className="text-xs text-gray-400">
                          {getGroupName(link.groupId)} · {new Date(link.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {duplicateGroups.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700">
            <span className="text-sm text-gray-500">
              共 {duplicateGroups.length} 组重复，已选 {selectedToDelete.size} 条待删除
            </span>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">
                取消
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={selectedToDelete.size === 0}
                className="btn-danger flex items-center gap-1 text-sm px-4 py-2 disabled:opacity-50"
              >
                <Trash2 size={14} />
                删除选中
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="确认删除"
          message={`确定删除选中的 ${selectedToDelete.size} 条重复链接吗？此操作不可恢复。`}
          confirmLabel="确认删除"
          danger
          onConfirm={async () => {
            setConfirmOpen(false);
            await handleDelete();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/options/components/DuplicatesPanel.tsx
git commit -m "feat: add DuplicatesPanel component for scanning and removing duplicate links"
```

---

### Task 8: Wire Up Options Page (BackupNotice, HTML Import, Duplicates Panel)

**Files:**
- Modify: `src/options/OptionsApp.tsx`

- [ ] **Step 1: Update imports and store destructuring in `src/options/OptionsApp.tsx`**

Change the lucide-react import from:
```ts
import { Settings, Palette, Search, ExternalLink, Database, Info, Download, Upload, Trash2 } from 'lucide-react';
```
to:
```ts
import { Settings, Palette, Search, ExternalLink, Database, Info, Download, Upload, Trash2, FileUp, ScanSearch } from 'lucide-react';
```

Add new imports after the existing ones:
```ts
import BackupNotice from '@/options/components/BackupNotice';
import DuplicatesPanel from '@/options/components/DuplicatesPanel';
import { parseBookmarksHtml } from '@/utils/bookmarksHtmlImporter';
```

Update the store destructuring to include `importBookmarksHtml`:
```ts
const {
  settings,
  groups,
  links,
  initialized,
  initialize,
  updateSettings,
  exportData,
  importData,
  importBookmarksHtml,
  clearAllData,
} = useAppStore();
```

- [ ] **Step 2: Add state for DuplicatesPanel**

Inside the component, after the existing `confirmConfig` state:

```ts
const [duplicatesOpen, setDuplicatesOpen] = useState(false);
```

- [ ] **Step 3: Add `handleImportHtml` handler**

After the existing `handleClearData` function:

```ts
const handleImportHtml = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'text/html,.html,.htm';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const html = await file.text();
      const parsed = parseBookmarksHtml(html);
      if (parsed.links.length === 0) {
        toast.show({ message: '未找到书签', type: 'info' });
        return;
      }
      const { groupsCreated, linksCreated } = await importBookmarksHtml(parsed);
      toast.success(`已导入 ${linksCreated} 条链接，新增 ${groupsCreated} 个分组`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  input.click();
};
```

- [ ] **Step 4: Insert BackupNotice after the header**

In the JSX, right after the `<header>` closing tag and before `<div className="space-y-4">`:

```tsx
<BackupNotice onExport={handleExport} />
```

- [ ] **Step 5: Add two new buttons in the 数据管理 Section**

In the `<Section icon={<Database size={18} />} title="数据管理">` section, update the button group to include the two new buttons. The full button group becomes:

```tsx
<div className="flex flex-wrap gap-2">
  <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
    <Download size={14} />
    导出 JSON
  </button>
  <button onClick={handleImport} className="btn-secondary flex items-center gap-2">
    <Upload size={14} />
    导入 JSON
  </button>
  <button onClick={handleImportHtml} className="btn-secondary flex items-center gap-2">
    <FileUp size={14} />
    导入浏览器书签 (HTML)
  </button>
  <button onClick={() => setDuplicatesOpen(true)} className="btn-secondary flex items-center gap-2">
    <ScanSearch size={14} />
    扫描重复链接
  </button>
  <button onClick={handleClearData} className="btn-danger flex items-center gap-2">
    <Trash2 size={14} />
    清空全部数据
  </button>
</div>
```

- [ ] **Step 6: Mount DuplicatesPanel**

Right before the closing `</div>` of the root element (after `<Toast />`):

```tsx
<DuplicatesPanel open={duplicatesOpen} onClose={() => setDuplicatesOpen(false)} />
```

- [ ] **Step 7: Verify build passes**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds.

- [ ] **Step 8: Run all tests**

Run: `cd /home/slq/my/naviory && pnpm test`
Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/options/OptionsApp.tsx
git commit -m "feat: wire up BackupNotice, HTML import, and DuplicatesPanel in Options page"
```

---

### Task 9: Switch Newtab deleteLink to deleteLinkWithUndo

**Files:**
- Modify: `src/newtab/components/GroupSection.tsx`

- [ ] **Step 1: Update the destructured store call in `GroupSection.tsx`**

Change line 41 from:
```ts
const { toggleGroupCollapsed, reorderLinks, deleteLink } = useAppStore();
```
to:
```ts
const { toggleGroupCollapsed, reorderLinks, deleteLinkWithUndo } = useAppStore();
```

- [ ] **Step 2: Update the usage on line 127**

Change:
```ts
onDelete={() => deleteLink(link.id)}
```
to:
```ts
onDelete={() => deleteLinkWithUndo(link.id)}
```

- [ ] **Step 3: Verify build passes**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Run all tests**

Run: `cd /home/slq/my/naviory && pnpm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/newtab/components/GroupSection.tsx
git commit -m "feat: use deleteLinkWithUndo for link deletion in newtab (10s undo window)"
```

---

### Task 10: Final Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd /home/slq/my/naviory && pnpm test`
Expected: All tests pass (63 existing + new tests).

- [ ] **Step 2: Run production build**

Run: `cd /home/slq/my/naviory && pnpm build`
Expected: Build succeeds, `dist/` directory generated.

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd /home/slq/my/naviory && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit any remaining changes (if any)**

If there are uncommitted fixes from verification:
```bash
git add -A
git commit -m "fix: address integration issues from final verification"
```





