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
          const groupName = topLevelFolderName ?? '书签栏';

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
          const folderName = h3.textContent?.trim() || '书签栏';
          walkDl(nestedDl, topLevelFolderName ?? folderName);
        }
      }
    }
  }

  walkDl(rootDl, null);
  return { groupNames: groupNamesOrdered, links };
}
