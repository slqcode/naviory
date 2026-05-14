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

// Chrome / Edge 导出的根容器名（中英文 / 不同浏览器版本）。这些不应被当作分组。
const ROOT_CONTAINERS = new Set([
  '书签栏',
  '收藏栏',
  '其他书签',
  '移动设备书签',
  'Bookmarks Bar',
  'Bookmarks bar',
  'Favorites Bar',
  'Favorites bar',
  'Other Bookmarks',
  'Other bookmarks',
  'Mobile Bookmarks',
  'Mobile bookmarks',
]);

const FALLBACK_GROUP_NAME = '未分组';

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

  function findDirectChild(parent: Element, tagName: string): Element | null {
    for (const child of Array.from(parent.children)) {
      if (child.tagName === tagName) {
        return child;
      }
    }
    return null;
  }

  function findNestedDl(dt: Element): Element | null {
    const directDl = findDirectChild(dt, 'DL');
    if (directDl) return directDl;

    let sibling = dt.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === 'DL') return sibling;
      if (sibling.tagName === 'DT') break;
      sibling = sibling.nextElementSibling;
    }
    return null;
  }

  function walkDl(dl: Element, topLevelFolderName: string | null) {
    const directDts = Array.from(dl.children).filter((child) => child.tagName === 'DT');

    for (const dt of directDts) {
      const anchor = findDirectChild(dt, 'A');
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          const title = anchor.textContent?.trim() || href;
          const addDate = anchor.getAttribute('add_date');
          const parsedDate = addDate ? Number.parseInt(addDate, 10) : Number.NaN;
          const createdAt = Number.isFinite(parsedDate) ? parsedDate * 1000 : undefined;
          // 没有归属用户分组的链接（书签栏直接子链接）放入「未分组」
          const groupName = topLevelFolderName ?? FALLBACK_GROUP_NAME;

          addGroupName(groupName);
          links.push({
            groupName,
            title,
            url: href,
            ...(createdAt !== undefined ? { createdAt } : {}),
          });
        }
      }

      const h3 = findDirectChild(dt, 'H3');
      if (h3) {
        const nestedDl = findNestedDl(dt);
        if (nestedDl) {
          const folderName = h3.textContent?.trim() || '';
          // 跳过 Chrome 根容器（书签栏/其他书签/移动设备书签），让用户在它们下创建的
          // 直接子文件夹（工作/AI/项目...）成为 Naviory 分组。
          const isRootContainer = !folderName || ROOT_CONTAINERS.has(folderName);
          const nextTopLevel = topLevelFolderName ?? (isRootContainer ? null : folderName);
          walkDl(nestedDl, nextTopLevel);
        }
      }
    }
  }

  walkDl(rootDl, null);
  return { groupNames: groupNamesOrdered, links };
}
