# Naviory

个人自用的新标签页工作台浏览器扩展（Manifest V3）。用来替代 Chrome / Edge 默认新标签页，统一管理常用入口。

## 特性

- 🗂 **分组管理**：将常用链接按工作、项目、AI、开发、文档、工具、临时等分组
- 🔍 **搜索**：本地链接模糊搜索，支持前缀快捷搜索引擎（g / b / bd / gh / npm）
- 🎨 **主题**：跟随系统 / 浅色 / 深色三种模式
- 🖱️ **拖拽排序**：链接可在分组内拖拽排序
- 📎 **快速收藏**：点击扩展图标，一键保存当前页面
- 💾 **本地存储**：使用 IndexedDB（Dexie），数据全部在本地
- 📤 **导入导出**：JSON 格式备份与恢复
- ⚙️ **设置**：主题、搜索引擎、打开方式可配置

## 技术栈

- Vite 5 + vite-plugin-web-extension
- React 19 + TypeScript 5
- Zustand（状态管理）
- Dexie.js（IndexedDB 封装）
- Tailwind CSS 3
- @dnd-kit（拖拽）
- lucide-react（图标）

## 开发指南

### 环境准备

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

`vite dev` 会启动开发服务器，并监听源文件变更。

### 构建产物

```bash
pnpm build
```

构建成功后会在 `dist/` 目录生成完整的扩展包。

### 运行测试

```bash
pnpm test         # 运行一次
pnpm test:watch   # 监听模式
pnpm test:ui      # Vitest UI
```

测试使用 Vitest + jsdom + fake-indexeddb，覆盖工具函数层和 Zustand store 的关键行为（63 个用例）。

## 安装到浏览器

### Chrome

1. 执行 `pnpm build` 生成 `dist/` 目录
2. 打开 `chrome://extensions/`
3. 右上角开启 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择本项目下的 `dist/` 目录
6. 打开新标签页，即可看到 Naviory

### Edge

1. 执行 `pnpm build` 生成 `dist/` 目录
2. 打开 `edge://extensions/`
3. 左下角开启 **开发人员模式**
4. 点击 **加载解压缩的扩展**
5. 选择本项目下的 `dist/` 目录
6. 打开新标签页验证

## 使用说明

### 搜索框

- 直接输入关键词：在本地链接中模糊匹配（匹配到会展示下拉），未命中则使用默认搜索引擎
- 前缀搜索：
  - `g <关键词>` → Google
  - `b <关键词>` → Bing
  - `bd <关键词>` → 百度
  - `gh <关键词>` → GitHub
  - `npm <关键词>` → npm

### 分组 / 链接管理

- 新增分组：首页底部 **新增分组** 按钮
- 新增链接：分组内右下角 **+ 添加**
- 编辑 / 删除：hover 链接卡片显示操作按钮
- 拖拽：长按链接卡片即可拖拽排序
- 折叠分组：点击分组名左侧箭头

### Popup 快速收藏

点击浏览器工具栏的 Naviory 图标，弹出保存表单，默认填入当前页面的标题、URL、favicon，可选择分组、添加描述和标签。

### Options 设置

在扩展管理页面点击 **详情** → **扩展程序选项**，或新标签页右上角的齿轮图标打开。

可配置：
- 主题：跟随系统 / 浅色 / 深色
- 默认搜索引擎：Google / Bing / 百度
- 链接打开方式：当前页 / 新标签页
- 数据管理：导入 / 导出 / 清空

## 数据存储

- 所有数据保存在浏览器本地 **IndexedDB**（数据库名 `naviory`），不向任何服务器发送
- 包含三张表：`groups` / `links` / `settings`
- 浏览器在以下情况会清空 IndexedDB：
  - 用户在浏览器设置里清除"网站数据 / Cookie"
  - 卸载扩展或重置浏览器
  - 切换浏览器配置文件 / 更换电脑
- 浏览器为单一来源分配的 IndexedDB 存储是动态配额，正常使用情况下足够数千条链接

## 备份与恢复

由于数据只在本机，请**定期备份**：

### 备份（导出 JSON）

1. 打开 Options（齿轮图标 → 数据管理）
2. 点击 **导出 JSON**
3. 浏览器会下载 `naviory-backup-YYYY-MM-DD.json`，建议保存到云盘或同步目录

文件包含所有分组、链接、设置和应用版本号。

### 恢复（导入 JSON）

1. 打开 Options → 数据管理
2. 点击 **导入 JSON** → 选择备份文件
3. 系统会要求二次确认覆盖现有数据

恢复操作是覆盖式，会替换所有当前数据。如果只是想合并几条入口，建议手动添加。

### 重要提醒

- 卸载扩展、清理浏览器数据、更换电脑前，请先导出备份
- 导出按钮在设置页顶部黄色提示条上也有"立即导出"快捷入口

## 项目结构

```
naviory/
├── public/
│   ├── manifest.json         # Manifest V3
│   └── icons/                # 扩展图标
├── src/
│   ├── types/                # TypeScript 类型
│   ├── utils/                # 工具函数（id, url, favicon, search, importExport）
│   ├── db/                   # Dexie 数据层 + Repositories
│   ├── store/                # Zustand 全局状态
│   ├── hooks/                # React Hooks（useTheme, useToast）
│   ├── styles/               # Tailwind 全局样式
│   ├── newtab/               # 新标签页入口
│   │   └── components/       # 各 UI 组件
│   ├── popup/                # Popup 入口
│   ├── options/              # Options 入口
│   └── background/           # Service Worker
├── docs/superpowers/         # 设计文档和实现计划
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 数据模型

所有数据存储在浏览器 IndexedDB 中（数据库名 `naviory`），包含三张表：

- `groups`：分组
- `links`：链接
- `settings`：应用设置

详细的 schema 见 `src/types/index.ts` 和 `src/db/index.ts`。

## 开发约定

- 所有代码使用 TypeScript，严格模式
- UI 组件使用函数式 + Hooks
- 写操作统一经过 `useAppStore`，不直接调用 Repository
- 关键逻辑处使用中文注释
- 每个独立功能一次提交，提交信息遵循 Conventional Commits

## 限制与非目标（MVP）

**数据范围限制：**

- **无云同步**：数据只在当前浏览器的 IndexedDB 中，不会跨设备同步
- **无账号体系**：没有登录、没有用户身份
- **数据只在本机**：浏览器清理数据、卸载扩展、更换电脑都会丢失数据，请定期导出备份

**功能非目标：**

- 服务端（Supabase、Cloudflare Workers 等）
- 天气、热搜、新闻等小组件
- 直接修改浏览器原生书签

## 隐私

数据仅保存于本地 IndexedDB，扩展不向任何服务器发起网络请求，不出售、不共享、不分析、不追踪用户。详见 [docs/privacy.md](docs/privacy.md)。

## License

MIT
