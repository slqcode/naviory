# Options 可靠性与迁移增强 — 设计文档

- **状态**：待实现
- **日期**：2026-05-09
- **范围**：Options 页 + store + 工具函数；**不涉及**数据库 schema 升级、云同步、权限变更。

## 背景

Naviory 使用浏览器 IndexedDB（Dexie）作为唯一存储，没有云同步。MVP 已具备 JSON 导入/导出与清空数据。本次增量补齐四项，目的是让"本地存储"在丢数据风险、误删、冗余、迁移成本这几个面上都有缓冲。

## 目标

1. 用户清楚理解"数据仅在本机"的风险，并能一键导出备份。
2. 误删单个链接有 10 秒撤销窗口。
3. 用户可扫描并手选清理重复链接（不自动删除）。
4. 用户可从 Chrome/Edge 导出的 `bookmarks.html` 导入常用入口。

## 非目标

- **不启用软删除 / 回收站**：`QuickLink.deletedAt` 字段保持预留状态，本次不写入、不读取、不展示。后续若需回收站，单独立项。
- **不做云同步 / 账号**：遵循现有 MVP 非目标。
- **不改动 DB schema**：继续用 version 1。
- **不引入组件测试框架**：DuplicatesPanel 与 Toast 撤销交互以手动验证清单覆盖。
- **不自动清理重复**：扫描仅展示，删除需用户勾选 + 二次确认。
- **不提供"不再显示备份提醒"开关**：警示条持久可见。

## 架构影响

纯增量。新增两个工具模块、一个组件目录、若干 store 方法；扩展 Options 页与现有 Toast。

### 新增文件

```
src/utils/duplicateFinder.ts
src/utils/bookmarksHtmlImporter.ts
src/options/components/BackupNotice.tsx
src/options/components/DuplicatesPanel.tsx
tests/utils/duplicateFinder.test.ts
tests/utils/bookmarksHtmlImporter.test.ts
tests/fixtures/bookmarks-sample.html
```

### 扩展文件

```
src/hooks/useToast.ts             // 支持 action 按钮 + 自定义 durationMs
src/store/useAppStore.ts          // 新增 deleteLinkWithUndo / bulkDeleteLinks / importBookmarksHtml
src/options/OptionsApp.tsx        // 顶部 BackupNotice；数据管理区两个新按钮 + 面板挂载
src/newtab/components/**          // 删除链接的调用点改用 deleteLinkWithUndo
tests/store/useAppStore.test.ts   // 覆盖三个新方法
```

### 不动

- `src/db/schema.ts` / `src/db/index.ts`：schema version 保持 1。
- `src/types/index.ts`：`deletedAt?: number` 字段保留但本次不使用。
- `public/manifest.json`：不新增权限。

## 功能 1：备份提醒

### 组件 `BackupNotice`

- 文件：`src/options/components/BackupNotice.tsx`
- 无状态、无 props（或仅 `onExport: () => void`）。
- 内容（中文，固定文案）：
  - 标题：**数据仅保存在本机浏览器中**
  - 正文：更换电脑、清理浏览器数据、卸载扩展可能导致数据丢失。请定期导出 JSON 备份。
  - 操作：右侧按钮「立即导出」→ 调用 Options 现有 `handleExport`。
- 视觉：黄/橙色 tint（例：`bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40`），与 `btn-danger` 红色、`btn-primary` 蓝色区分。
- 位置：`<header>` 下方，所有 `<Section>` 上方，持久可见。

## 功能 2：撤销删除（Toast 版）

### Toast API 扩展

当前 `useToast` 只提供 `toast.success / toast.error(text)`。扩展为：

```ts
toast.show({
  message: string;
  type?: 'success' | 'error' | 'info';
  durationMs?: number;              // 默认 3000
  action?: { label: string; onClick: () => void };
});

// 保留向下兼容
toast.success(msg)  // 等价 toast.show({ message: msg, type: 'success' })
toast.error(msg)    // 等价 toast.show({ message: msg, type: 'error' })
```

带 `action` 的 Toast 渲染时尾部追加一个按钮（如 `撤销`），点击后调 `onClick` 并立即关闭当前 Toast。

多条 Toast 同时存在时采用堆叠（若现有实现是单条覆盖，需调整为队列；堆叠上限 3 条，超出的新增项顶掉最早一条）。

### store 方法 `deleteLinkWithUndo`

```ts
deleteLinkWithUndo: (id: string) => Promise<void>
```

1. 在内存闭包里保存完整的 `QuickLink` 对象 `snapshot`（来自 `get().links`）。找不到时直接 return。
2. 调用现有 `deleteLink(id)`（从 DB 与 store 中真删）。
3. 调用 `toast.show({ message: '已删除链接', durationMs: 10000, action: { label: '撤销', onClick: restore } })`。
4. `restore` 的逻辑：
   - 若 `get().groups.find(g => g.id === snapshot.groupId)` 不存在：把 `snapshot.groupId` 改写成"临时"分组的 id；若连"临时"都不存在（用户自己删了），抛错由 toast.error 显示。
   - `await db.links.put(snapshot)` —— **必须用 `put` 不用 `createLink`**，以保留原 id / createdAt / sort。
   - 调 `linkRepo.getAllLinks()` 刷新 store 的 `links`。
   - toast.success（若发生过组重定向，toast.info 说明已挂到"临时"）。
5. 不设置 setTimeout 真删——第 2 步已真删；Toast 只给撤销机会。

### 调用点改造

`src/newtab/components/` 中所有调用 `useAppStore().deleteLink(id)` 的位置改为 `deleteLinkWithUndo(id)`。分组删除、清空、导入覆盖**不改**，继续走 ConfirmDialog。

## 功能 3：重复链接清理

### `src/utils/duplicateFinder.ts`

```ts
import type { QuickLink } from '@/types';

export function normalizeUrl(raw: string): string;

export interface DuplicateGroup {
  normalizedUrl: string;
  links: QuickLink[];  // 按 createdAt 降序，最新在前
}

export function findDuplicateGroups(links: QuickLink[]): DuplicateGroup[];
```

**归一化规则**（实现于 `normalizeUrl`）：

1. `trimmed = raw.trim()`
2. 用 `new URL(trimmed)` 解析；**失败时返回 `trimmed`**（fallback，不抛）。
3. `host = url.host.toLowerCase()`
4. `pathname`：若长度 > 1 且以 `/` 结尾，去掉末尾 `/`；根路径 `/` 保留。
5. 遍历 `url.searchParams`，删除所有以 `utm_`（不区分大小写）开头的 key；剩余参数保留原顺序。
6. 丢弃 hash。
7. 返回 ``${url.protocol}//${host}${pathname}${newSearch}``；`newSearch` 为空时省略 `?`。

**`findDuplicateGroups`**：

- 对每个 link 算 `key = normalizeUrl(link.url)`，用 `Map<string, QuickLink[]>` 聚合。
- 过滤掉长度 < 2 的组。
- 每组内部按 `createdAt` 降序排序。
- 返回数组。

### 组件 `DuplicatesPanel`

- 文件：`src/options/components/DuplicatesPanel.tsx`
- Props：`{ open: boolean; onClose: () => void }`
- 内部状态：`selectedToDelete: Set<string>`
- 挂载时调用 `findDuplicateGroups(useAppStore.getState().links)` 得到重复组；每组默认除"最新一条"外的全部 id 放入初始 `selectedToDelete`。
- 渲染：每组一张卡片，列出该组链接（title / URL / group name / createdAt 格式化为本地时间）。每条一个 checkbox 控制是否标记为待删。
- 底部：`共 N 组重复，已选 M 条待删除`；按钮「删除选中」（danger）/「取消」。
- 「删除选中」点击 → `ConfirmDialog` 二次确认 → `bulkDeleteLinks([...selectedToDelete])` → toast.success `已删除 M 条` → `onClose()`。
- 批量删除**不挂 Toast 撤销**（超出本轮 Q2 范围；用户已显式勾选 + 二次确认）。
- 空态：无重复时面板内容显示「没有发现重复链接」，只保留关闭按钮。
- 视觉：复用 `ConfirmDialog` 的遮罩层模式，最大宽度限制，滚动区域放在卡片列表。

### store 方法 `bulkDeleteLinks`

```ts
bulkDeleteLinks: (ids: string[]) => Promise<void>
```

实现：`db.links.bulkDelete(ids)` → 刷新 `links`。失败抛错（由调用方 toast.error）。

## 功能 4：HTML 导入（Chrome/Edge 书签）

### `src/utils/bookmarksHtmlImporter.ts`

```ts
export interface ParsedBookmarkLink {
  groupName: string;
  title: string;
  url: string;
  createdAt?: number;  // ms；无 ADD_DATE 时 undefined
}

export interface ParsedBookmarks {
  groupNames: string[];  // 唯一、按首次出现顺序
  links: ParsedBookmarkLink[];
}

export function parseBookmarksHtml(html: string): ParsedBookmarks;
```

**解析规则**（落实 Q4 方案 B：顶层文件夹 → 分组，嵌套扁平化）：

1. 用 `new DOMParser().parseFromString(html, 'text/html')` 解析。
2. 定位根 `<DL>`（`document.querySelector('dl')`）；找不到则抛 `Error('未识别的书签 HTML 格式')`。
3. 遍历所有 `<A>` 节点（`document.querySelectorAll('a')`，因为所有书签都在一个 `<DL>` 树里）。
4. 对每个 `<A>`：
   - 向上找最外层 `<H3>`：沿 `parentElement` 往上遍历，每遇到一个 `<DL>`，其紧邻的前一个兄弟若是 `<DT>` 且 `<DT>` 内有 `<H3>`，记下来；取**最浅**（最靠近根）的那个 `<H3>` 的文本作为分组名。
   - 若一路到根都没找到 `<H3>`：分组名 = `书签栏`。
   - `title` = `<A>` 的 `textContent` trim；为空时用 URL 作为 title。
   - `url` = `<A>.getAttribute('href')`；为空或非 `http(s):` 开头则**跳过**该条。
   - `createdAt` = `<A>.getAttribute('add_date')` 存在时解析为秒并 `* 1000`；失败则 `undefined`。
   - **忽略** `<A>.getAttribute('icon')`（Chrome 的 base64 data URI）。
5. `groupNames` = 按首次出现顺序去重收集的所有分组名。

### store 方法 `importBookmarksHtml`

```ts
importBookmarksHtml: (parsed: ParsedBookmarks) => Promise<{
  groupsCreated: number;
  linksCreated: number;
}>
```

1. `await db.transaction('rw', [db.groups, db.links], async () => { ... })`
2. 对每个 `parsed.groupNames`：
   - 若 `get().groups.find(g => g.name === name)` 存在，复用其 id。
   - 否则 `groupRepo.createGroup({ name, sort: maxSort+1, collapsed: false })`（每次 +1），并将 `groupsCreated` 计数 +1。
   - 在事务内维护 `nameToGroupId: Map<string, string>`。
   - `groupsCreated` = **新建**的分组数；复用的不计入。
3. 对每条 `parsed.links`：
   - `groupId = nameToGroupId.get(link.groupName)`
   - 计算该 group 当前最大 sort（查一次 `db.links.where('groupId').equals(groupId).toArray()`，取 `max(sort)+1`；事务内多次递增）。
   - `linkRepo.createLink({ groupId, title, url, sort, ...(createdAt ? { createdAt } : {}) })` —— 但 `createLink` 内部会自动设 `createdAt = Date.now()`，这里需要扩展：允许 caller 传 `createdAt`，若传入则使用传入值。**这是 `linkRepo.createLink` 的一个微调（+2 行代码）**，不破坏现有调用。
   - **不去重**：明确追加。重复由功能 3 处理。
4. 事务成功后刷新 store（重新拉 `groups` + `links`），返回计数。
5. 任一步失败 → 事务回滚 → 抛错。

### OptionsApp UI 装配

数据管理 Section 的按钮从 3 个扩到 5 个（同行 `flex-wrap gap-2`）：

1. 导出 JSON（已有）
2. 导入 JSON（已有）
3. **导入浏览器书签 (HTML)**（新）
4. **扫描重复链接**（新）
5. 清空全部数据（已有）

「导入浏览器书签 (HTML)」逻辑：

```ts
const handleImportHtml = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'text/html,.html,.htm';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const html = await file.text();
      const parsed = parseBookmarksHtml(html);
      if (parsed.links.length === 0) {
        toast.show({ message: '未找到书签', type: 'info' });
        return;
      }
      const { groupsCreated, linksCreated } = await importBookmarksHtml(parsed);
      toast.success(`已导入 ${linksCreated} 条链接，新增 ${groupsCreated} 个分组`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  input.click();
};
```

「扫描重复链接」逻辑：简单 `setDuplicatesOpen(true)`，面板挂载时自己跑 `findDuplicateGroups`。

## 数据流总览

```
deleteLinkWithUndo(id)
  ├─ snapshot = links.find(id)       // 内存
  ├─ deleteLink(id)                  // 真删（已有方法）
  └─ toast.show(10s, action=restore)
        └─ restore: db.links.put(snapshot) → store refresh

扫描重复
  DuplicatesPanel open
    ├─ findDuplicateGroups(store.links)  // 纯函数
    ├─ 用户勾选
    └─ bulkDeleteLinks(ids) → store refresh

HTML 导入
  file picker → file.text() → parseBookmarksHtml(html)
    → importBookmarksHtml(parsed)
      └─ transaction: groups 创建/复用 + links 追加 → store refresh
```

所有写入经 store，不绕过（符合既有约定）。

## 错误处理

| 场景 | 行为 |
|---|---|
| 撤销时 snapshot 的 groupId 已不存在 | 重定向到"临时"分组；"临时"也不存在时 toast.error |
| 撤销时 DB 写入失败 | toast.error；snapshot 丢失（可接受） |
| HTML 解析失败（无根 DL / 非法格式） | 抛 `Error('未识别的书签 HTML 格式')`，toast.error，不改 DB |
| HTML 解析成功但 0 条有效链接 | toast.info `未找到书签` |
| HTML 导入事务失败 | Dexie 事务回滚，toast.error |
| 归一化时 `new URL()` 抛异常 | fallback 到 trim 后原字符串作为 key，不抛 |
| 重复检测输入空 links | 返回 `[]`，面板显示空态 |
| 批量删除事务失败 | 回滚，toast.error；面板保持打开 |

### 安全

- `DOMParser.parseFromString(html, 'text/html')` 生成的文档为非 live、不执行脚本，`<script>` / `onerror` 等不会运行。
- 所有解析结果只以文本节点形式渲染（React 默认行为），不用 `innerHTML`。
- 不新增任何网络调用、不新增 permissions。

## 测试计划

### 单元测试（Vitest + jsdom + fake-indexeddb）

**`tests/utils/duplicateFinder.test.ts`**

- `normalizeUrl`：
  - 协议 / 路径大小写不变
  - Host 被小写化
  - 末尾 `/` 去除；根 `/` 保留
  - `?utm_source=x&a=1` → `?a=1`；全 utm 参数时无 `?`
  - hash 丢弃
  - 非法 URL 走 fallback，不抛
- `findDuplicateGroups`：
  - 空输入返回 `[]`
  - 单条无重复返回 `[]`
  - 两条相同 URL 返回一组长度 2
  - 带/不带 utm 被归为同组
  - 分组内按 createdAt 降序

**`tests/utils/bookmarksHtmlImporter.test.ts`**

夹具 `tests/fixtures/bookmarks-sample.html` 包含：根下散链、顶层文件夹 `工作`、嵌套 `工作/后端/*`、`ADD_DATE` 属性、`ICON` base64、无 title 的 `<A>`、非 http 协议的 `<A>`（例如 `javascript:` — 应跳过）。

- 根下散链 → 分组名 `书签栏`
- 嵌套子文件夹里的链接 → 仍挂到顶层 `工作`
- `ICON` 被丢弃（结果中无 data URI）
- `ADD_DATE` 秒 → ms；缺失时 `createdAt === undefined`
- 非法 HTML（无 `<DL>`）抛错
- `javascript:` 等非 http(s) 协议的链接被跳过
- 无 title 的 `<A>` 用 URL 作为 title

**`tests/store/useAppStore.test.ts`**（扩展）

- `deleteLinkWithUndo`：
  - 调用后 `links` 不再有该项
  - 随后 `put(snapshot)` 恢复：id/createdAt/groupId/sort 完全一致
  - snapshot.groupId 被删后，恢复会挂到"临时"
- `bulkDeleteLinks`：多条一次删，事务后 `links` 缺全部指定 id
- `importBookmarksHtml`：
  - 顶层名与现有分组同名 → 复用 id，不新建
  - 链接追加，不覆盖同 URL 现有项
  - 约 200 条链接的批量导入完成且不阻塞

### 手动验证清单

构建后在浏览器中加载 `dist/` 执行：

1. **备份警示条**：打开 Options 顶部能看到警示条；点「立即导出」触发 JSON 下载。
2. **撤销删除 - 成功路径**：新标签页删一条链接 → Toast 带「撤销」按钮出现 → 点击 → 链接回来，位置/分组/id 不变。
3. **撤销删除 - 超时**：删一条 → 等 12 秒 → Toast 消失 → 刷新新标签页确认不回来。
4. **撤销删除 - 组被删**：删 A 分组里的 X 链接 → 在 Toast 消失前把 A 分组也删掉（cascade 或 move-to-temp）→ 点撤销 → X 被恢复到"临时"分组，toast.info 说明。
5. **扫描重复 - 空态**：清空数据后重建 2 条不同链接 → 扫描 → 显示「没有发现重复链接」。
6. **扫描重复 - 正常**：手动造 3 条重复（含带 utm 的）→ 扫描 → 每组默认除最新外都勾 → 删除 → 列表剩最新。
7. **扫描重复 - 取消**：面板中取消 → 什么都没变。
8. **HTML 导入 - 正常**：用 Chrome 导出一份 bookmarks.html → 导入 → 顶层文件夹成为分组；嵌套书签挂到顶层分组；favicon 走 Naviory 自己的逻辑（不看到 data URI）。
9. **HTML 导入 - 同名合并**：已有「工作」分组 + HTML 顶层「工作」→ 导入后链接追加到已有「工作」分组，不新建。
10. **HTML 导入 - 非法文件**：选个 `.txt` 或空 HTML → toast.error，DB 无变化。
11. **HTML 导入 + 重复清理协作**：导入后运行扫描 → 能列出与已有库重复的链接。

### Manifest / 权限

不新增 permissions。

## 不包含（后续考虑）

- 回收站 / 软删除（启用 `deletedAt`）。
- 批量删除的 Toast 撤销。
- 备份提醒的「下次不再显示」开关。
- 导入 HTML 时按嵌套完整保留为「工作 / 后端」这种扁平命名分组。
- `DuplicatesPanel` 支持按 host 聚合概览。

## 文件清单（供实施参考）

**新增**：

- `src/utils/duplicateFinder.ts`
- `src/utils/bookmarksHtmlImporter.ts`
- `src/options/components/BackupNotice.tsx`
- `src/options/components/DuplicatesPanel.tsx`
- `tests/utils/duplicateFinder.test.ts`
- `tests/utils/bookmarksHtmlImporter.test.ts`
- `tests/fixtures/bookmarks-sample.html`

**修改**：

- `src/hooks/useToast.ts`
- `src/store/useAppStore.ts`
- `src/options/OptionsApp.tsx`
- `src/newtab/components/` 中调用 `deleteLink` 的文件
- `src/db/repositories/linkRepo.ts`（`createLink` 允许可选 `createdAt`）
- `tests/store/useAppStore.test.ts`
