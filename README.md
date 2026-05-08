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

以 Chrome / Edge 为例：

1. 执行 `pnpm build` 生成 `dist/` 目录
2. 打开 `chrome://extensions/`（Edge 打开 `edge://extensions/`）
3. 右上角开启 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择本项目下的 `dist/` 目录
6. 打开新标签页，即可看到 Naviory

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

当前版本 **不** 实现以下功能：

- 云同步 / 账号系统
- 服务端（Supabase、Cloudflare Workers 等）
- 天气、热搜、新闻等小组件
- 直接修改浏览器原生书签

## License

MIT
