// src/utils/favicon.ts

export function getFaviconUrl(url: string, tabFavicon?: string): string {
  if (tabFavicon && tabFavicon.startsWith('http')) {
    return tabFavicon;
  }

  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

export function getInitialLetter(text: string): string {
  return text.charAt(0).toUpperCase();
}
