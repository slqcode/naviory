# Style Lab — 设计文档

- **状态**：待实现
- **日期**：2026-05-09
- **范围**：新增独立的视觉探索页面，用来对比 4 套风格方案；**不动**主应用 / Options / Popup / 数据层 / 业务逻辑。

## 背景

用户对当前 New Tab 视觉风格不满意，但希望先做视觉探索，再决定要不要把某套风格移植到主应用。

## 目标

- 在不影响现有主页面的前提下，提供一个隔离的页面用来同时对比 4 套视觉方案
- 4 套方案都基于同一份模拟数据，覆盖：搜索框、顶部工具区、分组标题、链接卡片、hover、active、空态、设置按钮
- 输出一份方案对比（特点 / 优缺点 / 适合场景），帮助选型

## 非目标

- 不实现路由、不引入路由库
- 不引入新的 UI / 动画 / 状态管理库
- 不修改 `src/newtab/App.tsx`、`src/newtab/components/*`、`public/manifest.json`
- 不接 IndexedDB / Zustand store；不调用业务方法
- 不实现任何交互（搜索不触发、链接不跳转、设置不打开）
- 不写单元测试（视觉探索本质需要人眼评估）
- 不持久化 Tab / 亮暗 / 空态状态
- 不做复杂动画（仅允许 ≤ 100ms 的 `transition-colors`）

## 架构

纯增量、隔离。新增一个独立 Vite 入口 `src/newtab/style-lab/`，挂载到 `vite.config.ts` 的 `additionalInputs`；不写入 manifest，因此不进入扩展运行时（用户安装扩展时不会看到这个页面）。

开发访问：`pnpm dev` 后通过 `http://localhost:<port>/src/newtab/style-lab/`。
构建产物：`dist/` 中产出对应 HTML，可直接本地打开，但不被 `chrome_url_overrides` 引用。

### 文件结构

```
src/newtab/style-lab/
├── index.html              # Vite 入口 HTML
├── main.tsx                # React 挂载
├── StyleLab.tsx            # 根组件：Tab + 亮暗开关 + 空态开关
├── mockData.ts             # 共享模拟数据
└── variants/
    ├── MinimalVariant.tsx      # A. Minimal Productivity
    ├── SoftGlassVariant.tsx    # B. Soft Glass Dashboard
    ├── DevConsoleVariant.tsx   # C. Developer Console
    └── BentoVariant.tsx        # D. Bento Workspace
```

### 文件职责

| 文件 | 职责 |
|---|---|
| `index.html` | Vite 入口；加载 `main.tsx` |
| `main.tsx` | `ReactDOM.createRoot()` 挂载 `StyleLab` |
| `StyleLab.tsx` | 顶部 Tab、亮暗开关、空态开关；按 `active` 渲染对应 variant |
| `mockData.ts` | 导出 `mockGroups`：3 个分组、每组 5 条链接 |
| `variants/*.tsx` | 一套风格 = 一个文件；自包含搜索框 / 工具栏 / 分组 / 卡片 / 空态；接受 `{ empty?: boolean }` |

### 不动的文件

- `src/newtab/App.tsx` 及 `src/newtab/components/*`
- `public/manifest.json`
- `src/options/*`、`src/popup/*`、`src/store/*`、`src/db/*`

## Vite 配置改动

`vite.config.ts` 中 `additionalInputs` 数组追加一行：

```ts
additionalInputs: [
  'src/newtab/index.html',
  'src/newtab/style-lab/index.html',  // 新增
  'src/popup/index.html',
  'src/options/index.html',
],
```

这是本次唯一对项目根配置文件的改动。

## 共享模拟数据 `mockData.ts`

```ts
export interface MockLink {
  id: string;
  title: string;
  url: string;
}

export interface MockGroup {
  id: string;
  name: string;
  links: MockLink[];
}

export const mockGroups: MockGroup[] = [
  {
    id: 'work',
    name: '工作',
    links: [
      { id: 'w1', title: 'Linear',    url: 'https://linear.app' },
      { id: 'w2', title: 'Notion',    url: 'https://notion.so' },
      { id: 'w3', title: 'Figma',     url: 'https://figma.com' },
      { id: 'w4', title: 'Slack',     url: 'https://slack.com' },
      { id: 'w5', title: 'Calendar',  url: 'https://calendar.google.com' },
    ],
  },
  {
    id: 'ai',
    name: 'AI',
    links: [
      { id: 'a1', title: 'ChatGPT',   url: 'https://chat.openai.com' },
      { id: 'a2', title: 'Claude',    url: 'https://claude.ai' },
      { id: 'a3', title: 'Gemini',    url: 'https://gemini.google.com' },
      { id: 'a4', title: 'Perplexity',url: 'https://perplexity.ai' },
      { id: 'a5', title: 'v0',        url: 'https://v0.dev' },
    ],
  },
  {
    id: 'dev',
    name: '开发',
    links: [
      { id: 'd1', title: 'GitHub',    url: 'https://github.com' },
      { id: 'd2', title: 'MDN',       url: 'https://developer.mozilla.org' },
      { id: 'd3', title: 'npm',       url: 'https://npmjs.com' },
      { id: 'd4', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
      { id: 'd5', title: 'CanIUse',   url: 'https://caniuse.com' },
    ],
  },
];
```

Variant 组件直接 `import { mockGroups } from '../mockData'`。

## `StyleLab.tsx` 行为

职责：

1. 维护三个内存 state：`active: 'minimal' | 'soft-glass' | 'dev-console' | 'bento'`、`mode: 'light' | 'dark'`、`empty: boolean`。
2. 顶部固定一行工具条：
   - 左：4 个 Tab 按钮
   - 右：亮暗 toggle、空态 toggle
3. 工具条本身用最素的样式（neutral 灰底），**不参与任何一套风格的视觉评估**。
4. 根据 `mode` 给 StyleLab 外层容器加 / 去 `class="dark"`，让所有 variant 内的 Tailwind `dark:` 前缀响应。
5. 根据 `active` 选择性渲染一个 variant，传入 `{ empty }` prop。

刷新页面会重置三个 state（明确接受这个行为）。

## Variant 组件契约

所有 variant 导出默认组件，签名一致：

```ts
interface VariantProps {
  empty?: boolean;
}

export default function XxxVariant({ empty }: VariantProps): JSX.Element
```

每个 variant 内部必须自包含以下 UI 元素，组装结构由该风格自由决定：

- 顶部工具区（含设置按钮，使用 lucide `Settings` 图标）
- 搜索框
- 3 个分组（取自 `mockGroups`），每组渲染 5 个链接卡（`empty=true` 时改为该风格的空态）
- 链接卡需要有可见的 `:hover` 反馈
- 链接卡需要有可见的 `:active` 反馈（按下瞬间）
- 设置按钮需要有 `:hover` 反馈

空态由 variant 自行渲染，可以是"一行灰字 + 提示"、"占位卡"、"骨架块"，等等。

所有交互**只展示视觉状态**，无业务行为：
- 链接卡 click 不跳转（不要 `<a href>`，用 `<button type="button">` 或 `<div>`）
- 搜索框输入不触发搜索（保留 `onChange` 但什么都不做）
- 设置按钮 click 不打开任何东西

## 4 套风格视觉规范

以下是每套风格的设计基调；具体 Tailwind class 在实现时落细，不在 spec 里写死。

### A. Minimal Productivity

- **基调**：极简、低饱和、清晰、长期使用不疲劳
- **背景**：`bg-white` / `dark:bg-neutral-950`
- **强调色**：indigo 或 blue，单一色，低饱和
- **搜索框**：细边框 `border-neutral-200`，无投影，圆角 `rounded-lg`
- **链接卡**：单行（图标 + 标题），hover 用 `bg-neutral-50/100`，active 加深一档
- **分组标题**：小号、字重稍重、灰色
- **字体**：系统 sans（默认）
- **密度**：中等偏稀
- **参考**：Linear、Raycast、Notion

### B. Soft Glass Dashboard

- **基调**：玻璃拟态，柔和渐变背景，毛玻璃卡片
- **背景**：线性渐变（如 `bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200`，暗色版改深色），可加几个固定位置的模糊光斑
- **卡片**：`bg-white/40 backdrop-blur-md border border-white/50 shadow-lg`
- **搜索框**：同样玻璃质感
- **hover**：背景不透明度上调（如 `bg-white/60`）
- **active**：再上调 + 内阴影
- **字体**：sans，标题加字重对比
- **密度**：中等
- **参考**：macOS Big Sur、现代 SaaS 登录页

### C. Developer Console

- **基调**：终端 / 控制台感，深色优先，信息密度高
- **背景**：深色 `bg-zinc-950`；浅色版 `bg-zinc-50` 也走偏冷灰
- **强调色**：绿色或青色（`text-emerald-400` / `text-cyan-400`）
- **搜索框**：像 prompt（`> _` 前缀，mono 字体）
- **链接卡**：紧凑双行，URL 用 `font-mono`，可加状态点（不闪烁）
- **分组标题**：前缀符号（`# 工作` 或 `~/work`），小写或保留中文
- **字体**：标题 sans，URL/元信息 `font-mono`（`ui-monospace`）
- **密度**：高
- **参考**：iTerm、lazygit、GitHub 终端主题

### D. Bento Workspace

- **基调**：Bento Grid，模块化卡片，层次清晰，承载大量入口
- **背景**：中性 `bg-stone-100` / `dark:bg-stone-900`
- **布局**：CSS Grid，分组块尺寸不等（用 `col-span-2`、`row-span-2` 制造层次）
- **搜索框**：单独占一块 Bento，顶部横跨 2 列
- **卡片**：厚圆角 `rounded-2xl`，柔和投影 `shadow-sm`
- **hover**：投影加深 + 微弱背景变化（**不做位移 / 缩放**）
- **active**：投影减弱模拟按下
- **字体**：sans
- **密度**：高
- **参考**：Apple bento 介绍页、One Bento 模板

## 状态展示要求

| 状态 | 实现方式 |
|---|---|
| 默认 | variant 默认渲染 |
| hover | Tailwind `hover:` 前缀，鼠标悬停可见 |
| active | Tailwind `active:` 前缀，鼠标按下可见 |
| 空态 | variant 接受 `empty` prop，由 StyleLab 顶部 toggle 控制；每套风格自定义空态外观 |
| 暗色 | StyleLab 顶部 toggle 切换外层 `class="dark"`，4 套 variant 内部用 `dark:` 前缀响应 |

## 错误处理

无外部依赖、无异步、无 I/O，没有可能的错误路径。TypeScript 静态检查覆盖 prop 缺失。

## 测试

**不写单元测试**。

手动验证清单（实现完成后跑一遍）：

1. `pnpm dev` 启动后访问 `/src/newtab/style-lab/` 能打开
2. 4 个 Tab 切换无报错，每套 variant 都能渲染
3. 亮暗 toggle 在所有 4 套上生效
4. 空态 toggle 在所有 4 套上生效
5. 4 套 variant 的链接卡 / 设置按钮 hover、active 都能看到视觉反馈
6. `pnpm build` 成功，`dist/` 含 style-lab 的 HTML 产物
7. 在浏览器中加载 `dist/` 作为扩展，新标签页仍是原主应用（manifest 未变）
8. 现有 `pnpm test` 全部通过（不应受影响）

## 文件清单

**新增**：

- `src/newtab/style-lab/index.html`
- `src/newtab/style-lab/main.tsx`
- `src/newtab/style-lab/StyleLab.tsx`
- `src/newtab/style-lab/mockData.ts`
- `src/newtab/style-lab/variants/MinimalVariant.tsx`
- `src/newtab/style-lab/variants/SoftGlassVariant.tsx`
- `src/newtab/style-lab/variants/DevConsoleVariant.tsx`
- `src/newtab/style-lab/variants/BentoVariant.tsx`

**修改**：

- `vite.config.ts`（仅在 `additionalInputs` 加一行）

---

## 方案对比（初版，实现完成后会结合实际效果再修订一次）

### A. Minimal Productivity

- **特点**：低饱和、纯文本主导、视觉负担小
- **优点**：
  - 长时间使用不疲劳
  - 视觉干扰最少，让用户聚焦在「下一步要去哪」而不是界面本身
  - 实现成本最低、维护最简单
- **缺点**：
  - 信息层次靠字号 / 颜色对比建立，密度上不去
  - 缺乏品牌记忆点，看起来「没设计」
  - 大量入口时分组之间区分度不强
- **适合场景**：每天打开几十次的高频工作台，用户主要操作目标是「快速跳走」

### B. Soft Glass Dashboard

- **特点**：现代感、视觉柔和、有当下流行的 SaaS 美学
- **优点**：
  - 暗色模式下尤其漂亮，分享截图友好
  - 渐变和模糊提供丰富的视觉层次
  - 容易让用户「第一眼就喜欢」
- **缺点**：
  - `backdrop-blur` 在低端机 / 集显笔记本上有性能开销
  - 文字对比度需要谨慎调，半透明背景上小字容易糊
  - 长期看会审美疲劳
- **适合场景**：偶尔展示 / 截图的展示型页面，注重第一印象的扩展商店截图

### C. Developer Console

- **特点**：技术感强、信息密度高、mono 字体唤起终端记忆
- **优点**：
  - 单屏能塞最多入口
  - 对开发者用户来说亲切、自带「专业」滤镜
  - 暗色模式天然合适，浅色版本可以同样工整
- **缺点**：
  - 对非开发者人群审美门槛较高
  - mono 字体对中文渲染不友好（中文要 fallback）
  - 浅色模式做好的难度高于其它三种
- **适合场景**：开发者自用工作台、有大量 GitHub / npm / 文档类入口的人

### D. Bento Workspace

- **特点**：模块化、可承载大量信息、层次自带节奏
- **优点**：
  - 一眼就能看到「所有入口」，扫视效率高
  - 不规则网格制造视觉节奏，比纯列表有趣
  - 拓展性好，未来加 widget（天气、待办）也自然
- **缺点**：
  - Grid 编排成本高，分组数量 / 链接数量变化时手工调网格累
  - 不规则布局对响应式不友好
  - 单个块过大会浪费空间
- **适合场景**：把新标签页当成「工作面板」而不是「跳板」的用户，有 widget 扩展计划
