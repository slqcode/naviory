# Naviory 实现计划 - 精简版

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 从零构建一个自用的新标签页工作台浏览器扩展 MVP

**Architecture:** React + TypeScript + Vite + Zustand + Dexie.js + Tailwind CSS

**Tech Stack:** Vite 5, React 18, TypeScript 5, Zustand, Dexie.js, Tailwind CSS 3, @dnd-kit, lucide-react, vite-plugin-web-extension

---

## 实现步骤总览

本计划包含 12 个主要任务，每个任务都是独立可执行的单元：

1. **项目初始化和配置** - 创建项目结构，配置构建工具
2. **Manifest V3 和静态资源** - 配置扩展清单和图标
3. **类型定义** - 定义 TypeScript 类型
4. **工具函数层** - ID、URL、Favicon、搜索、导入导出
5. **数据层** - Dexie 数据库和 Repositories
6. **状态管理** - Zustand Store
7. **全局样式和 Hooks** - Tailwind 样式、主题、Toast
8. **New Tab 页面** - 搜索框、分组、链接卡片、拖拽
9. **Popup 页面** - 快速收藏当前页面
10. **Options 页面** - 设置界面
11. **Background Service Worker** - 后台脚本
12. **README 和验收** - 文档和最终测试

---

## 详细任务说明

### Task 1-4: 基础设施层

这些任务已在主实现计划文档中详细展开：
- `/Users/slq/my/naviory/docs/superpowers/plans/2026-05-07-naviory-implementation.md`

包含：
- 项目初始化（package.json, vite.config.ts, tsconfig.json, tailwind.config.js）
- Manifest V3 配置
- TypeScript 类型定义
- 工具函数（id, url, favicon, search, importExport）

### Task 5: 数据层 - Dexie 和 Repositories

**关键文件：**
- `src/db/index.ts` - Dexie 实例
- `src/db/schema.ts` - 默认数据
- `src/db/repositories/groupRepo.ts` - 分组 CRUD
- `src/db/repositories/linkRepo.ts` - 链接 CRUD
- `src/db/repositories/settingsRepo.ts` - 设置 CRUD

**核心功能：**
- 初始化 7 个默认分组（工作、项目、AI、开发、文档、工具、临时）
- 提供完整的 CRUD 操作
- 支持批量排序更新
- 支持事务操作

### Task 6: 状态管理 - Zustand Store

**文件：** `src/store/useAppStore.ts`

**核心状态：**
```typescript
interface AppState {
  groups: LinkGroup[];
  links: QuickLink[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  
  // 初始化
  initialize: () => Promise<void>;
  
  // 分组操作
  addGroup, updateGroup, deleteGroup, reorderGroups, toggleGroupCollapsed
  
  // 链接操作
  addLink, updateLink, deleteLink, reorderLinks, checkUrlDuplicate
  
  // 设置操作
  updateSettings
  
  // 导入导出
  exportData, importData, clearAllData
}
```

### Task 7: 全局样式和 Hooks

**文件：**
- `src/styles/globals.css` - Tailwind 基础样式
- `src/hooks/useTheme.ts` - 主题切换（system/light/dark）
- `src/hooks/useToast.ts` - Toast 提示

### Task 8: New Tab 页面

**入口文件：**
- `src/newtab/index.html`
- `src/newtab/main.tsx`
- `src/newtab/App.tsx`

**核心组件：**
- `SearchBox.tsx` - 搜索框，支持前缀搜索
- `GroupSection.tsx` - 分组区域，支持折叠和拖拽
- `LinkCard.tsx` - 链接卡片，显示 favicon
- `LinkEditorDialog.tsx` - 新增/编辑链接弹窗
- `GroupEditorDialog.tsx` - 新增/编辑分组弹窗
- `ConfirmDialog.tsx` - 确认对话框
- `Toast.tsx` - Toast 组件
- `EmptyState.tsx` - 空状态提示

**关键功能：**
- 使用 @dnd-kit 实现拖拽排序
- 搜索本地链接 + 搜索引擎切换
- 主题切换
- 响应式布局

### Task 9: Popup 页面

**文件：**
- `src/popup/index.html`
- `src/popup/main.tsx`
- `src/popup/PopupApp.tsx`

**功能：**
- 获取当前 tab 的 title、url、favIconUrl
- 选择分组保存
- URL 重复检查
- 保存成功提示

### Task 10: Options 页面

**文件：**
- `src/options/index.html`
- `src/options/main.tsx`
- `src/options/OptionsApp.tsx`

**功能：**
- 主题设置（跟随系统/浅色/深色）
- 默认搜索引擎（Google/Bing/百度）
- 链接打开方式（当前页/新标签页）
- 数据导入导出
- 清空全部数据（二次确认）

### Task 11: Background Service Worker

**文件：** `src/background/service-worker.ts`

**功能：**
- 监听扩展安装事件
- 初始化默认数据
- 处理右键菜单（可选）

### Task 12: README 和验收

**文件：** `README.md`

**内容：**
- 项目介绍
- 功能特性
- 技术栈
- 开发指南（pnpm install, pnpm dev, pnpm build）
- 安装指南（如何加载到 Chrome/Edge）
- 使用说明
- 截图展示

**验收清单：**
- [ ] pnpm install 正常安装依赖
- [ ] pnpm dev 支持本地开发
- [ ] pnpm build 生成 dist 目录
- [ ] Chrome/Edge 加载 dist 后可用
- [ ] 新标签页被成功替换
- [ ] 可以新增、编辑、删除、拖拽链接
- [ ] 刷新浏览器后数据仍存在
- [ ] Popup 可保存当前页面
- [ ] Options 可修改设置
- [ ] JSON 导入导出可用
- [ ] TypeScript 无类型错误
- [ ] 控制台无明显报错

---

## 实现建议

由于这是一个从零开始的完整项目，建议采用以下执行策略：

**方案 A：分层实现（推荐）**
1. 先完成基础设施层（Task 1-5）
2. 再完成状态管理层（Task 6-7）
3. 最后完成 UI 层（Task 8-10）
4. 收尾（Task 11-12）

**方案 B：垂直切片**
1. 先实现最小可用版本（只有新标签页 + 基础链接管理）
2. 再逐步添加 Popup、Options、拖拽等功能

**方案 C：并行开发**
- 使用 subagent-driven-development 并行执行独立任务
- 适合快速迭代

---

## 下一步

详细的逐步实现计划已保存在：
`/Users/slq/my/naviory/docs/superpowers/plans/2026-05-07-naviory-implementation.md`

该文档包含 Task 1-4 的完整步骤和代码。Task 5-12 可以参考本文档的说明，结合设计文档进行实现。

建议使用 **superpowers:subagent-driven-development** 技能来执行实现计划。
