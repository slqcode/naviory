# Naviory — Developer Console Workspace UI 重设计

**日期：2026-05-14**

## 目标

把当前 New Tab 工作台改造成「Developer Console Workspace」风格的新标签页：terminal + dashboard + monospace + 深色优先 + 高信息密度 + 命令面板感；参考 Raycast / Vercel Dashboard / Linear / VS Code / GitHub Dark。

**严格边界：仅视觉与交互层改造，不动业务逻辑 / 数据层 / 状态管理 / Manifest / JSON 导入导出格式。**

## 非目标

- 不修改 IndexedDB schema
- 不重写 Zustand store
- 不改动 JSON 导入导出格式
- 不新增云同步、账号、天气、热搜、小组件
- 不引入新的 UI 库
- 不改 `public/manifest.json`
- 不删除现有功能

## 一、Design Token 层

### 放置位置

- **CSS 变量** 声明于 [src/styles/globals.css](../../../src/styles/globals.css) 的 `@layer base`，分 `:root`（浅色）和 `.dark`（深色）两份。
- **Tailwind 映射** 在 [tailwind.config.js](../../../tailwind.config.js) 的 `theme.extend.colors` / `fontFamily` / `borderRadius` 中声明，值全部引用 CSS 变量（`rgb(var(--color-surface) / <alpha-value>)`）。

### Token 清单

颜色（给出深色模式值；浅色模式同步一套白底 + zinc + emerald）：

| Token | 深色值（zinc + emerald 家族） |
|---|---|
| `background` | zinc-950 附近 `#0a0a0b` |
| `surface` | zinc-900 `#18181b` |
| `surface-elevated` | zinc-800 `#27272a` |
| `surface-hover` | zinc-800/60 `#27272a99` |
| `border` | zinc-800 `#27272a` |
| `border-strong` | zinc-700 `#3f3f46` |
| `text-primary` | zinc-100 `#f4f4f5` |
| `text-secondary` | zinc-400 `#a1a1aa` |
| `text-muted` | zinc-500 `#71717a` |
| `accent` | emerald-400 `#34d399` |
| `accent-soft` | emerald-500/10 `rgba(16,185,129,0.1)` |
| `danger` | red-400 `#f87171` |
| `success` | emerald-400 `#34d399` |
| `warning` | amber-400 `#fbbf24` |

浅色模式使用对应亮色：`background` 白 / `surface` zinc-50 / `text-primary` zinc-900 / `border` zinc-200 / accent 保持 emerald-500 以维持风格一致。

### 字体 / 圆角 / 阴影 / 间距

- `font-sans`：系统字体栈（沿用当前 body）
- `font-mono`：`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, ...` — 用于搜索框、URL、标签、状态栏、快捷键提示
- 圆角只用 `rounded-md`（6px）和 `rounded-lg`（8px）；不用 `rounded-xl+`
- 阴影深色下极克制，仅浮层用 `shadow-md + ring-1 ring-border-strong`；主区域不用阴影，靠 border 和 surface 层级区分
- 基础间距：`gap-3`（12px）、`gap-4`（16px）；卡片 padding `p-3` 或 `px-3 py-2`

## 二、全局布局（AppShell）

```
┌──────────────────────────────────────────────────────────┐
│ Header:  Naviory   [command-input]          [⚙]          │  <- 顶部区
├──────────────────────────────────────────────────────────┤
│                                                          │
│  # workspace/work (3)       # workspace/dev (5)          │
│  ┌─────────────────────────┐ ┌──────────────────────┐    │
│  │ ▸ GitHub  github.com    │ │ ▸ pnpm  pnpmjs.io    │    │
│  │ ▸ Linear  linear.app    │ │ ▸ ...                │    │
│  └─────────────────────────┘ └──────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ LOCAL · IndexedDB · 128 links · 7 groups · v0.1.0 · 14:32│ <- 状态栏
└──────────────────────────────────────────────────────────┘
```

- 根容器 `min-h-screen bg-background text-text-primary`
- 顶部 Header：高度约 56px，左品牌名 + 右操作区（齿轮、主题切换可选合并）
- 主区：`max-w-6xl mx-auto px-4 py-6`，宽屏（1440/1920）保持合理
- 状态栏：固定底部 `sticky bottom-0`，高度约 32px，`font-mono text-xs text-text-secondary bg-surface border-t border-border`
- 分组列表仍保持 `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`，不做左侧 sidebar（YAGNI，改动面积小）

## 三、组件级重设计

### 1. SearchBox → CommandInput

- 外壳：`bg-surface border border-border rounded-md focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/30`
- 左侧：`> ` prompt（`text-accent font-mono`）
- 输入：`font-mono placeholder:text-text-muted`，placeholder `Search links or type command...`
- 右侧：`⌘K` / `/` hint，`font-mono text-xs text-text-muted border border-border px-1.5 py-0.5 rounded`
- 聚焦/有输入时展示下拉面板：
  - 面板：`bg-surface-elevated border border-border rounded-md shadow-md mt-1`
  - `Matches` 小标题（`# matches (n)`，`font-mono text-xs text-text-muted`）+ 链接行
  - 无匹配时展示 `# commands` 提示前缀（`g` / `b` / `bd` / `gh` / `npm`）
- 快捷键：
  - 自动聚焦（原已有）
  - `/` 在非输入框焦点下聚焦搜索框
  - `Esc` 失焦并清空 + 收起下拉
  - Enter 行为不变（命中跳转 / 不命中走默认引擎 / 前缀走对应引擎）

### 2. GroupSection → WorkspacePanel

- 容器：`bg-surface border border-border rounded-lg`
- 标题行：`px-3 py-2 border-b border-border`
  - 展开箭头（`▸ / ▾`）
  - 分组名 `font-mono text-sm text-text-primary`
  - 链接数量 `font-mono text-xs text-text-muted`
  - hover 时显示「+ 添加 / 编辑 / 删除」操作（保持原有按钮语义）
- 列表区：`p-2`，卡片之间 `gap-1`
- 折叠：`▸` 收起时仅显示标题行，保持原状态持久化（已存在）

### 3. LinkCard → CommandLink

- 从当前 card 样式改为 row 样式：
  - `flex items-center gap-2 px-2 py-1.5 rounded-md`
  - hover：`bg-surface-hover`
  - focus-visible：`ring-1 ring-accent/40`（支持键盘焦点）
- 布局：
  - 左：16px favicon（圆角）/ 或 `getInitialLetter` 占位
  - 中：标题 `text-sm text-text-primary truncate` + 域名 `font-mono text-xs text-text-muted truncate`
  - tags（如有）：小标签 `font-mono text-[10px] bg-accent-soft text-accent px-1 rounded`，最多 2 个
  - 右：hover 时显示编辑/删除按钮（小 icon button）
- 保留点击打开逻辑 + `defaultOpenMode` + 删除 toast 撤销

### 4. LinkEditorDialog / GroupEditorDialog / ConfirmDialog / TypedConfirmDialog

- 遮罩：`bg-black/60`
- 面板：`bg-surface-elevated border border-border-strong rounded-lg shadow-md`
- 标题栏 `px-4 py-3 border-b border-border text-sm font-semibold`
- 表单元素统一：
  - `input/select/textarea`：`bg-surface border border-border rounded-md px-2 py-1.5 text-sm focus:border-accent/50 focus:ring-1 focus:ring-accent/30`
  - URL 输入用 `font-mono`
  - 错误提示：`text-danger text-xs font-mono`，不用大色块
- 危险确认（`TypedConfirmDialog`）保留原输入 `DELETE` 逻辑，视觉升级到 danger 风格边框

### 5. Toast

- 容器：`bg-surface-elevated border border-border-strong rounded-md shadow-md font-mono text-sm`
- success / error / info 用左侧 3px 色条（accent / danger / border-strong）区分
- action 按钮（撤销）保持原逻辑

### 6. EmptyState

- `font-mono text-text-muted text-sm`
- 文案模板：`# no links in this group, press "+ 添加" to create one`

### 7. StatusBar（新增）

- 文件：[src/newtab/components/StatusBar.tsx](../../../src/newtab/components/StatusBar.tsx)
- 固定底部；展示：
  ```
  LOCAL · IndexedDB · {links.length} links · {groups.length} groups · v{version} · HH:MM
  ```
- 时间每 30s 刷新一次（轻量 `setInterval`，组件卸载时清除）
- 「LOCAL」前加一个小圆点 `●` 以 accent 色显示活动状态
- 样式：`font-mono text-xs text-text-secondary bg-surface border-t border-border px-4 h-8`

### 8. Popup

- 维持紧凑 360px 宽
- 应用新 token，URL 区域使用 `font-mono`
- 保存按钮：`bg-accent text-zinc-950 hover:bg-accent/90 rounded-md`

### 9. Options

- 每个 Section 变为「配置分组卡」：`bg-surface border border-border rounded-lg`
- Section 标题用 `font-mono` 小字 + icon
- Radio 组改成更紧凑的按钮组样式（保留 fieldset/legend 语义，不改现有实现基本结构，只换 class）
- 「清空全部数据」放在独立 Danger Zone 分区：`border-danger/40 bg-danger/5`
- `BackupNotice` 保留黄色警告属性，但色调靠近 `warning` token

## 四、主题

- HTML 根 `<html class="dark">` 默认加上（与现有 `useTheme` 兼容 — `useTheme` 会根据设置切 class）
- 浅色：CSS 变量一套浅色值，保留 `class="light"` 或无 `.dark` 时生效
- 跟随系统：沿用现有 `useTheme` 对 `prefers-color-scheme` 的监听
- 所有组件使用 `bg-background` / `bg-surface` / `text-text-primary` 等 token 工具类，不在组件里写 `dark:xxx`

## 五、交互细节

- 搜索框 `autoFocus`（已存在）
- 全局 `keydown` 监听：
  - `/` → 若焦点不在 input/textarea，`e.preventDefault()` 并聚焦搜索框
  - `Esc` → 搜索框失焦并清空查询 + 收起面板
- 删除链接：保持现有 10s toast 撤销
- 删除分组：保持现有 ConfirmDialog 二次确认
- 清空全部数据：保持现有 TypedConfirmDialog（输入 DELETE）
- hover 显示操作按钮：保留现有 group-hover 模式，配新 hover 背景

## 六、受影响文件清单

**新增：**
- [src/newtab/components/StatusBar.tsx](../../../src/newtab/components/StatusBar.tsx)

**样式/结构修改（不改业务）：**
- [src/styles/globals.css](../../../src/styles/globals.css) — CSS 变量 + 基础类
- [tailwind.config.js](../../../tailwind.config.js) — 颜色 / fontFamily / borderRadius 扩展
- [src/newtab/App.tsx](../../../src/newtab/App.tsx) — AppShell + 全局快捷键 + StatusBar 挂载
- [src/newtab/components/SearchBox.tsx](../../../src/newtab/components/SearchBox.tsx)
- [src/newtab/components/GroupSection.tsx](../../../src/newtab/components/GroupSection.tsx)
- [src/newtab/components/LinkCard.tsx](../../../src/newtab/components/LinkCard.tsx)
- [src/newtab/components/LinkEditorDialog.tsx](../../../src/newtab/components/LinkEditorDialog.tsx)
- [src/newtab/components/GroupEditorDialog.tsx](../../../src/newtab/components/GroupEditorDialog.tsx)
- [src/newtab/components/ConfirmDialog.tsx](../../../src/newtab/components/ConfirmDialog.tsx)
- [src/newtab/components/TypedConfirmDialog.tsx](../../../src/newtab/components/TypedConfirmDialog.tsx)
- [src/newtab/components/Toast.tsx](../../../src/newtab/components/Toast.tsx)
- [src/newtab/components/EmptyState.tsx](../../../src/newtab/components/EmptyState.tsx)
- [src/popup/PopupApp.tsx](../../../src/popup/PopupApp.tsx)
- [src/options/OptionsApp.tsx](../../../src/options/OptionsApp.tsx)
- [src/options/components/BackupNotice.tsx](../../../src/options/components/BackupNotice.tsx)
- [src/options/components/DuplicatesPanel.tsx](../../../src/options/components/DuplicatesPanel.tsx)

**不动：**
- [public/manifest.json](../../../public/manifest.json)
- `src/types/`、`src/db/`、`src/store/`、`src/utils/`
- 测试文件

## 七、验收

- `pnpm typecheck` 0 错
- `pnpm lint` 0 错
- `pnpm test` 91/91 通过
- `pnpm build` 成功
- 手动：New Tab / Popup / Options 三个入口视觉符合 Developer Console 风格，功能不回归

## 八、不在本次范围

- 左侧 sidebar 分组导航（改动面积过大，YAGNI）
- 跨分组拖拽（数据层改动）
- i18n 多语言（独立任务）
- Chrome Web Store 上架素材
