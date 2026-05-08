# Naviory 新标签页工作台扩展 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零构建一个自用的新标签页工作台浏览器扩展，支持分组管理快捷链接、搜索、拖拽排序、主题切换、数据导入导出。

**Architecture:** 采用分层架构 - UI 层（React 组件）→ 状态层（Zustand）→ 仓储层（Repositories）→ 数据层（Dexie/IndexedDB）。使用 Vite + vite-plugin-web-extension 构建 Manifest V3 扩展，支持 newtab、popup、options 三个入口。

**Tech Stack:** Vite 5, React 18, TypeScript 5, Zustand, Dexie.js, Tailwind CSS 3, @dnd-kit, lucide-react, vite-plugin-web-extension

---

## 文件结构规划

### 新建文件清单

**配置文件：**
- `package.json` - 项目依赖和脚本
- `vite.config.ts` - Vite 构建配置
- `tsconfig.json` - TypeScript 配置
- `tsconfig.node.json` - Node 环境 TS 配置
- `tailwind.config.js` - Tailwind 配置
- `postcss.config.js` - PostCSS 配置
- `.gitignore` - Git 忽略规则
- `README.md` - 项目文档

**Manifest 和资源：**
- `public/manifest.json` - Manifest V3 配置
- `public/icons/icon-16.png` - 扩展图标 16x16
- `public/icons/icon-48.png` - 扩展图标 48x48
- `public/icons/icon-128.png` - 扩展图标 128x128

**类型定义：**
- `src/types/index.ts` - 全局类型定义

**数据层：**
- `src/db/index.ts` - Dexie 数据库实例
- `src/db/schema.ts` - 数据表 Schema
- `src/db/repositories/groupRepo.ts` - 分组数据访问
- `src/db/repositories/linkRepo.ts` - 链接数据访问
- `src/db/repositories/settingsRepo.ts` - 设置数据访问

**工具函数：**
- `src/utils/id.ts` - UUID 生成
- `src/utils/url.ts` - URL 校验和规范化
- `src/utils/favicon.ts` - Favicon 获取
- `src/utils/search.ts` - 搜索逻辑
- `src/utils/importExport.ts` - 导入导出

**状态管理：**
- `src/store/useAppStore.ts` - Zustand 全局状态

**Hooks：**
- `src/hooks/useTheme.ts` - 主题切换
- `src/hooks/useToast.ts` - Toast 提示

**样式：**
- `src/styles/globals.css` - Tailwind 全局样式

**New Tab 页面：**
- `src/newtab/index.html` - HTML 入口
- `src/newtab/main.tsx` - React 挂载
- `src/newtab/App.tsx` - 主应用组件
- `src/newtab/components/SearchBox.tsx` - 搜索框
- `src/newtab/components/GroupSection.tsx` - 分组区域
- `src/newtab/components/LinkCard.tsx` - 链接卡片
- `src/newtab/components/LinkEditorDialog.tsx` - 链接编辑弹窗
- `src/newtab/components/GroupEditorDialog.tsx` - 分组编辑弹窗
- `src/newtab/components/ConfirmDialog.tsx` - 确认对话框
- `src/newtab/components/Toast.tsx` - Toast 组件
- `src/newtab/components/EmptyState.tsx` - 空状态

**Popup 页面：**
- `src/popup/index.html` - HTML 入口
- `src/popup/main.tsx` - React 挂载
- `src/popup/PopupApp.tsx` - Popup 主组件

**Options 页面：**
- `src/options/index.html` - HTML 入口
- `src/options/main.tsx` - React 挂载
- `src/options/OptionsApp.tsx` - Options 主组件

**Background：**
- `src/background/service-worker.ts` - Service Worker

---

## Task 1: 项目初始化和配置

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 package.json**

```bash
cd /Users/slq/my/naviory && pnpm init
```

Expected: 创建基础 package.json

- [ ] **Step 2: 安装核心依赖**

```bash
pnpm add react react-dom zustand dexie lucide-react
```

Expected: 安装成功

- [ ] **Step 3: 安装开发依赖**

```bash
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node vite-plugin-web-extension tailwindcss postcss autoprefixer @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: 安装成功

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './public/manifest.json',
      additionalInputs: [
        'src/newtab/index.html',
        'src/popup/index.html',
        'src/options/index.html',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 5: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: 初始化 Tailwind CSS**

```bash
pnpm exec tailwindcss init -p
```

Expected: 创建 tailwind.config.js 和 postcss.config.js

- [ ] **Step 8: 配置 tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 9: 创建 .gitignore**

```
node_modules
dist
.DS_Store
*.log
pnpm-lock.yaml
```

- [ ] **Step 10: 更新 package.json scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 11: 初始化 Git 仓库**

```bash
git init && git add . && git commit -m "chore: 初始化项目配置

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Expected: 创建初始提交

---

## Task 2: Manifest V3 和静态资源

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-16.png`
- Create: `public/icons/icon-48.png`
- Create: `public/icons/icon-128.png`

- [ ] **Step 1: 创建 manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Naviory - 新标签页工作台",
  "version": "0.1.0",
  "description": "个人自用的新标签页快捷入口管理工具",
  "chrome_url_overrides": {
    "newtab": "src/newtab/index.html"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_title": "保存到 Naviory"
  },
  "options_page": "src/options/index.html",
  "background": {
    "service_worker": "src/background/service-worker.ts",
    "type": "module"
  },
  "permissions": ["storage", "tabs", "activeTab"],
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

- [ ] **Step 2: 创建占位图标（使用 ImageMagick 或手动创建）**

```bash
mkdir -p public/icons
```

注：图标需要手动创建或使用设计工具生成。临时可以使用纯色占位图标。

- [ ] **Step 3: 提交 Manifest 配置**

```bash
git add public/manifest.json public/icons && git commit -m "feat: 添加 Manifest V3 配置

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/types/index.ts

export interface LinkGroup {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sort: number;
  collapsed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  tags?: string[];
  groupId: string;
  sort: number;
  openMode?: 'current' | 'new-tab';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface AppSettings {
  id: 'app-settings';
  theme: 'system' | 'light' | 'dark';
  defaultSearchEngine: 'google' | 'bing' | 'baidu';
  defaultOpenMode: 'current' | 'new-tab';
  version: number;
  updatedAt: number;
}

export interface ExportData {
  version: number;
  exportedAt: number;
  groups: LinkGroup[];
  links: QuickLink[];
  settings: AppSettings;
}

export type SearchEngine = 'google' | 'bing' | 'baidu' | 'github' | 'npm';

export interface SearchPrefix {
  prefix: string;
  engine: SearchEngine;
  url: string;
}
```

- [ ] **Step 2: 提交类型定义**

```bash
git add src/types && git commit -m "feat: 添加 TypeScript 类型定义

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 工具函数层

**Files:**
- Create: `src/utils/id.ts`
- Create: `src/utils/url.ts`
- Create: `src/utils/favicon.ts`
- Create: `src/utils/search.ts`
- Create: `src/utils/importExport.ts`

- [ ] **Step 1: 创建 ID 生成工具**

```typescript
// src/utils/id.ts

export function generateId(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 2: 创建 URL 工具**

```typescript
// src/utils/url.ts

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function isValidUrl(input: string): boolean {
  try {
    new URL(normalizeUrl(input));
    return true;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
```

- [ ] **Step 3: 创建 Favicon 工具**

```typescript
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
```

- [ ] **Step 4: 创建搜索工具**

```typescript
// src/utils/search.ts
import type { SearchEngine, SearchPrefix } from '@/types';

export const SEARCH_PREFIXES: SearchPrefix[] = [
  { prefix: 'g', engine: 'google', url: 'https://www.google.com/search?q=' },
  { prefix: 'b', engine: 'bing', url: 'https://www.bing.com/search?q=' },
  { prefix: 'bd', engine: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { prefix: 'gh', engine: 'github', url: 'https://github.com/search?q=' },
  { prefix: 'npm', engine: 'npm', url: 'https://www.npmjs.com/search?q=' },
];

export const SEARCH_ENGINES: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  baidu: 'https://www.baidu.com/s?wd=',
  github: 'https://github.com/search?q=',
  npm: 'https://www.npmjs.com/search?q=',
};

export function parseSearchInput(input: string): {
  hasPrefix: boolean;
  engine?: SearchEngine;
  query: string;
} {
  const trimmed = input.trim();
  
  for (const { prefix, engine } of SEARCH_PREFIXES) {
    if (trimmed.startsWith(prefix + ' ')) {
      return {
        hasPrefix: true,
        engine,
        query: trimmed.slice(prefix.length + 1).trim(),
      };
    }
  }
  
  return {
    hasPrefix: false,
    query: trimmed,
  };
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return SEARCH_ENGINES[engine] + encodeURIComponent(query);
}
```

- [ ] **Step 5: 创建导入导出工具**

```typescript
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
```

- [ ] **Step 6: 提交工具函数**

```bash
git add src/utils && git commit -m "$(cat <<'EOF'
feat: 添加工具函数层

- ID 生成
- URL 校验和规范化
- Favicon 获取
- 搜索逻辑
- 导入导出

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 数据层 - Dexie 和 Repositories

由于这个任务内容较多，完整的实现计划已经超过了合理的长度。我建议将剩余任务（Task 5-12）精简为高层次的任务描述，每个任务包含关键步骤和代码示例，而不是逐行展开。

这样可以保持计划的可读性和可执行性，同时避免文档过长。

**剩余任务概览：**
- Task 5: 数据层（Dexie + Repositories）
- Task 6: 状态管理（Zustand Store）
- Task 7: 全局样式和 Hooks
- Task 8: New Tab 页面组件
- Task 9: Popup 页面
- Task 10: Options 页面
- Task 11: Background Service Worker
- Task 12: README 和最终验收

是否需要我继续完整展开所有任务，还是采用精简版本？

---
