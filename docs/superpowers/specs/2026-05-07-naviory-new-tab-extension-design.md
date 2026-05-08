# Naviory 新标签页工作台扩展 - 设计文档

**日期：** 2026-05-07
**版本：** v0.1.0 (MVP)
**类型：** 浏览器扩展（Manifest V3）

## 1. 项目概述

### 1.1 目标

开发一个自用的新标签页工作台浏览器扩展，用于替代 Chrome / Edge 默认新标签页，管理常用入口。当前 MVP 阶段只做 IndexedDB 本地版，不做云同步、账号体系、服务端。

### 1.2 核心价值

- 替代原生新标签页，提供个性化工作台
- 统一管理常用网站快捷入口
- 支持多搜索引擎快速切换
- 本地存储保障隐私

### 1.3 范围界定

**MVP 包含：**
- 新标签页覆盖
- 分组与链接管理（CRUD + 拖拽排序）
- 搜索与搜索引擎切换
- 浅色/深色主题
- 数据导入导出
- Popup 快速收藏
- Options 设置

**MVP 不包含：**
- 云同步、账号系统
- 天气、热搜、新闻等小组件
- 修改浏览器原生书签
- Supabase、Cloudflare、Node 服务端集成

## 2. 技术栈

| 类别 | 选型 | 说明 |
|------|------|------|
| 构建工具 | Vite 5 + vite-plugin-web-extension | 支持多入口与 Manifest V3 |
| 框架 | React 18 + TypeScript 5 | 类型安全的 UI 开发 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 数据存储 | Dexie.js (IndexedDB) | 结构化本地存储 |
| 样式 | Tailwind CSS 3 | 原子化 CSS |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable | 现代化拖拽方案 |
| 图标 | lucide-react | SVG 图标库 |
| 扩展 | Manifest V3 | 最新扩展标准 |

## 3. 项目结构

```
naviory/
├── public/
│   └── manifest.json              # Manifest V3 配置
├── src/
│   ├── newtab/                    # 新标签页入口
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── SearchBox.tsx
│   │       ├── GroupSection.tsx
│   │       ├── LinkCard.tsx
│   │       ├── LinkEditorDialog.tsx
│   │       ├── GroupEditorDialog.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── Toast.tsx
│   │       └── EmptyState.tsx
│   ├── popup/                     # 快速收藏入口
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── PopupApp.tsx
│   ├── options/                   # 设置页入口
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── OptionsApp.tsx
│   ├── background/                # Service Worker
│   │   └── service-worker.ts
│   ├── db/                        # IndexedDB 数据层
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── repositories/
│   │       ├── groupRepo.ts
│   │       ├── linkRepo.ts
│   │       └── settingsRepo.ts
│   ├── store/                     # Zustand 状态管理
│   │   └── useAppStore.ts
│   ├── hooks/                     # React Hooks
│   │   ├── useTheme.ts
│   │   └── useToast.ts
│   ├── types/                     # TypeScript 类型
│   │   └── index.ts
│   ├── utils/                     # 工具函数
│   │   ├── id.ts
│   │   ├── url.ts
│   │   ├── favicon.ts
│   │   ├── importExport.ts
│   │   └── search.ts
│   └── styles/
│       └── globals.css
├── docs/
│   └── superpowers/specs/
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 4. 数据模型

### 4.1 类型定义

```typescript
// types/index.ts

export interface LinkGroup {
  id: string;              // UUID v4
  name: string;            // 分组名称
  icon?: string;           // lucide-react 图标名
  color?: string;          // 主题色（Tailwind 色系键名）
  sort: number;            // 排序权重
  collapsed?: boolean;     // 是否折叠
  createdAt: number;       // 毫秒时间戳
  updatedAt: number;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;           // favicon URL
  description?: string;
  tags?: string[];
  groupId: string;
  sort: number;
  openMode?: 'current' | 'new-tab';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;      // 软删除（预留）
}

export interface AppSettings {
  id: 'app-settings';      // 固定主键
  theme: 'system' | 'light' | 'dark';
  defaultSearchEngine: 'google' | 'bing' | 'baidu';
  defaultOpenMode: 'current' | 'new-tab';
  version: number;         // 数据版本，默认 1
  updatedAt: number;
}

export interface ExportData {
  version: number;
  exportedAt: number;
  groups: LinkGroup[];
  links: QuickLink[];
  settings: AppSettings;
}
```

### 4.2 Dexie Schema

```typescript
// db/index.ts
import Dexie, { Table } from 'dexie';

export class NaviDB extends Dexie {
  groups!: Table<LinkGroup, string>;
  links!: Table<QuickLink, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('naviory');
    this.version(1).stores({
      groups: 'id, sort',
      links: 'id, groupId, sort, url',
      settings: 'id',
    });
  }
}

export const db = new NaviDB();
```

### 4.3 默认数据

首次启动时创建以下默认分组：

| 分组 | sort | icon |
|------|------|------|
| 工作 | 1 | Briefcase |
| 项目 | 2 | FolderKanban |
| AI | 3 | Sparkles |
| 开发 | 4 | Code |
| 文档 | 5 | FileText |
| 工具 | 6 | Wrench |
| 临时 | 7 | Clock |

默认设置：
```typescript
{
  id: 'app-settings',
  theme: 'system',
  defaultSearchEngine: 'google',
  defaultOpenMode: 'current',
  version: 1,
  updatedAt: Date.now(),
}
```

## 5. 架构设计

### 5.1 分层架构

```
┌─────────────────────────────────────┐
│   UI 层 (React 组件)                │
├─────────────────────────────────────┤
│   状态层 (Zustand Store)            │
├─────────────────────────────────────┤
│   仓储层 (Repositories)             │
├─────────────────────────────────────┤
│   数据层 (Dexie / IndexedDB)        │
└─────────────────────────────────────┘
```

**职责划分：**
- **UI 层**：呈现数据，处理用户交互
- **状态层**：集中管理应用状态，协调 UI 和数据
- **仓储层**：封装业务查询，屏蔽 Dexie 细节
- **数据层**：持久化存储

### 5.2 Zustand Store 接口

```typescript
interface AppState {
  // 状态
  groups: LinkGroup[];
  links: QuickLink[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // 初始化
  initialize: () => Promise<void>;

  // 分组操作
  addGroup: (data: Omit<LinkGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LinkGroup>;
  updateGroup: (id: string, data: Partial<LinkGroup>) => Promise<void>;
  deleteGroup: (id: string, strategy: 'cascade' | 'move-to-temp') => Promise<void>;
  reorderGroups: (orderedIds: string[]) => Promise<void>;
  toggleGroupCollapsed: (id: string) => Promise<void>;

  // 链接操作
  addLink: (data: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt'>) => Promise<QuickLink>;
  updateLink: (id: string, data: Partial<QuickLink>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  reorderLinks: (groupId: string, orderedIds: string[]) => Promise<void>;
  checkUrlDuplicate: (url: string, excludeId?: string) => QuickLink | null;

  // 设置操作
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;

  // 导入导出
  exportData: () => Promise<ExportData>;
  importData: (data: ExportData, mode: 'overwrite' | 'merge') => Promise<void>;
  clearAllData: () => Promise<void>;
}
```

## 6. 功能模块设计

### 6.1 搜索模块

**搜索前缀映射：**

| 前缀 | 搜索引擎 | URL 模板 |
|------|----------|----------|
| `g` | Google | `https://www.google.com/search?q=` |
| `b` | Bing | `https://www.bing.com/search?q=` |
| `bd` | 百度 | `https://www.baidu.com/s?wd=` |
| `gh` | GitHub | `https://github.com/search?q=` |
| `npm` | npm | `https://www.npmjs.com/search?q=` |

**搜索流程：**
1. 用户在搜索框输入
2. 解析输入，检测前缀
3. 有前缀：Enter 后跳转到对应搜索引擎
4. 无前缀：实时在本地链接中模糊匹配（标题、URL、描述、标签）
5. 展示匹配结果（最多 8 条）
6. Enter 时：
   - 有匹配：打开第一个匹配链接
   - 无匹配：按默认搜索引擎搜索

### 6.2 Favicon 获取

**混合方案：**
- Popup 场景：优先使用 `chrome.tabs.favIconUrl`
- 其他场景：使用 `https://www.google.com/s2/favicons?domain={domain}&sz=64`
- 加载失败时显示首字母占位符

```typescript
// utils/favicon.ts
export function getFaviconUrl(url: string, tabFavicon?: string): string {
  if (tabFavicon && tabFavicon.startsWith('http')) return tabFavicon;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}
```

### 6.3 URL 校验

```typescript
// utils/url.ts
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
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
```

### 6.4 删除分组策略

分组下有链接时，弹窗询问：
- **一起删除所有链接**：级联删除
- **移动到「临时」分组**：链接保留，groupId 改为「临时」分组 ID

### 6.5 导入导出

**导出 JSON 格式：**
```json
{
  "version": 1,
  "exportedAt": 1715000000000,
  "groups": [...],
  "links": [...],
  "settings": {...}
}
```

**导入流程：**
1. 用户选择 JSON 文件
2. 解析并校验结构（groups / links / settings 必需字段）
3. 弹窗询问：覆盖当前数据 / 合并数据
4. 执行导入并刷新 UI

**校验规则：**
- 必需字段：`version`、`groups`、`links`、`settings`
- `version` 必须是数字且不高于当前支持版本
- 每个 group 必须有 `id`、`name`、`sort`
- 每个 link 必须有 `id`、`title`、`url`、`groupId`

## 7. UI 设计

### 7.1 新标签页布局

```
┌────────────────────────────────────────────────────┐
│                                      [⚙️ 设置]    │
│                                                    │
│            [🔍 搜索或输入 URL...        ]         │
│                                                    │
│  ┌── 工作 ──────────┐  ┌── 项目 ──────────┐      │
│  │ [🔗] [🔗] [🔗]   │  │ [🔗] [➕]        │      │
│  │ [➕]              │  │                  │      │
│  └──────────────────┘  └──────────────────┘      │
│                                                    │
│  [共 X 个链接 · X 个分组]      [导入] [导出]      │
└────────────────────────────────────────────────────┘
```

### 7.2 Popup 布局

弹窗尺寸：380 × 480px

```
┌───────────────────────────────┐
│  📌 保存当前页面              │
├───────────────────────────────┤
│  标题 [_______________]       │
│  URL  [_______________]       │
│  描述 [_______________]       │
│  分组 [▼ 工作          ]      │
│  标签 [tag1, tag2     ]       │
│                               │
│  ⚠️ URL 已存在于「工作」分组 │
│                               │
│         [取消]  [保存]        │
└───────────────────────────────┘
```

### 7.3 Options 布局

```
┌─────────────────────────────────────┐
│  ⚙️ Naviory 设置                    │
├─────────────────────────────────────┤
│  ▸ 外观                             │
│    主题：[跟随系统 ▼]               │
│                                     │
│  ▸ 搜索                             │
│    默认搜索引擎：[Google ▼]         │
│                                     │
│  ▸ 交互                             │
│    链接打开方式：[当前页 ▼]         │
│                                     │
│  ▸ 数据                             │
│    [📥 导入 JSON] [📤 导出 JSON]    │
│    [🗑️ 清空全部数据]                │
│                                     │
│  版本 0.1.0                         │
└─────────────────────────────────────┘
```

### 7.4 主题实现

- 使用 Tailwind 的 `dark:` 前缀
- 在 `<html>` 元素上切换 `class="dark"`
- 监听 `prefers-color-scheme` 媒体查询变化
- 主题切换逻辑封装在 `useTheme` hook 中

### 7.5 交互细节

- 链接卡片 hover 时显示编辑/删除按钮
- 拖拽时显示半透明预览，目标位置高亮
- 所有写操作完成后通过 Toast 反馈（成功/失败）
- 表单校验错误实时显示在字段下方
- 打开链接时根据 `settings.defaultOpenMode` 决定行为
- 空状态提示："还没有链接，点击添加第一个入口"

## 8. Manifest V3 配置

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
    "service_worker": "service-worker.js",
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

**权限说明：**
- `storage`：Chrome Storage API（预留，实际使用 IndexedDB）
- `tabs`：读取当前标签页的 title / url / favIconUrl
- `activeTab`：Popup 操作当前活动标签页

## 9. 实现步骤

1. **项目基础**：Vite + React + TypeScript + Tailwind + Manifest V3 多入口构建
2. **数据层**：Dexie 封装 + Repository + 默认数据初始化
3. **状态层**：Zustand store + CRUD + 导入导出
4. **新标签页**：搜索框 + 分组列表 + 链接卡片 + 编辑弹窗 + 拖拽
5. **Popup**：获取当前 tab + 保存表单 + 重复检查
6. **Options**：搜索引擎 / 主题 / 打开方式 / 数据管理
7. **细节完善**：URL 校验、favicon、空状态、Toast、README

## 10. 验收标准

1. `pnpm install` 正常安装依赖
2. `pnpm dev` 支持本地开发
3. `pnpm build` 生成 `dist` 目录
4. Chrome/Edge `chrome://extensions/` 加载 `dist` 后可用
5. 新标签页被成功替换
6. 可以新增、编辑、删除、拖拽链接
7. 刷新浏览器后数据仍存在
8. Popup 可保存当前页面
9. Options 可修改设置
10. JSON 导入导出可用
11. TypeScript 无类型错误
12. 控制台无明显报错
13. README 包含开发、构建、安装说明

## 11. 已决策的关键点

| 问题 | 决策 | 理由 |
|------|------|------|
| Favicon 获取方式 | 混合方案（浏览器 API + Google API） | 兼顾隐私与便利 |
| 构建插件 | vite-plugin-web-extension | 对 Manifest V3 支持成熟 |
| UI 组件库 | 不强制使用，按需手写 | 保持轻量，避免过度依赖 |
| 数据存储 | IndexedDB (Dexie) | 结构化存储，支持索引 |
| 软删除 | 链接保留 `deletedAt` 字段（预留） | 为未来的回收站功能预留 |
| 删除分组 | 级联删除 / 移到临时 两选项 | 避免误删且留退路 |

## 12. 风险与注意事项

1. **CSP 限制**：Manifest V3 禁止 inline script 和 eval，需要确保所有第三方库兼容
2. **Service Worker 生命周期**：不要在 SW 中保存状态，所有状态需持久化
3. **图标版权**：需要准备 16/48/128 像素的扩展图标
4. **数据迁移**：settings 中的 `version` 字段用于后续 schema 迁移
5. **Favicon CORS**：某些网站的 favicon 可能无法加载，需要 fallback 到首字母占位符
