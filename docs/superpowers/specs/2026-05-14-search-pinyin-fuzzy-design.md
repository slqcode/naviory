# 命令面板增强 + 主区域实时过滤 + 拼音模糊匹配

**日期：2026-05-14**

## 目标

应对「分组多 / 链接多」（400+ 条）的查找压力，把搜索体验升级到 IDE / Raycast 级，
同时支持中文拼音首字母匹配（输入 `xf` 命中「讯飞」）。

**严格边界：** 不动 IndexedDB schema、不重写 Zustand、不引入大型 UI 库、不改 JSON 导入导出。

## 一、核心架构

### Query 状态提升
SearchBox 当前自持 `query`。重构为 controlled — 由 [App.tsx](../../../src/newtab/App.tsx) 持有，
向下传给 SearchBox（输入控件）和 GroupSection（实时过滤）。

### 新增搜索引擎层
新文件 [src/utils/searchIndex.ts](../../../src/utils/searchIndex.ts)：

```ts
interface SearchEntry {
  linkId: string;
  raw: string;        // 原 title
  lower: string;      // title 小写
  pinyinFull: string; // 'xunfei kaiyuan'
  pinyinAbbr: string; // 'xfky'
  host: string;
  tags: string[];
  description: string;
  groupId: string;
}

buildSearchIndex(links: QuickLink[]): Map<string, SearchEntry>
scoreMatch(query: string, entry: SearchEntry): number  // 0 = 不命中
rankMatches(query: string, links: QuickLink[]): QuickLink[]  // 已排序
```

按 `useMemo(() => buildSearchIndex(links), [links])` 在 App 层构建一次，
传给 SearchBox 与过滤逻辑共用。

## 二、拼音匹配

**库：`pinyin-pro`** — 业界最成熟的中文拼音库，支持多音字、声母韵母可控、
gzipped ~30KB（按需引用单字典更小）。

每条 link 在 indexing 时缓存：
- `pinyinFull = 'xunfei kaiyuan'`（空格分词）
- `pinyinAbbr = 'xfky'`（首字母）

不持久化到 IndexedDB（schema 不动）— 进程内 Map 缓存，启动时构建一次。
1000 条估算 < 50ms，可接受。

## 三、评分规则

匹配分级（高到低）：

| 类型 | 分数 |
|---|---|
| title 前缀精确（lower starts with query） | 100 |
| title 包含 | 60 |
| 拼音首字母前缀（pinyinAbbr starts with） | 50 |
| 拼音全拼包含（pinyinFull includes） | 40 |
| host 包含 | 30 |
| tag 命中 | 25 |
| description 包含 | 15 |

返回 0 = 不命中。同分时按 `createdAt` 倒序（recent 上浮）。

## 四、命令面板增强（SearchBox）

下拉面板改造：

1. **键盘导航**：↑/↓ 切换 highlightIndex，Enter 打开高亮项，Esc 清空+失焦
2. **高亮态**：选中行 `bg-accent/10 text-accent`
3. **来源标签**：每条结果右侧 `# group-name`（mono 小字 muted）
4. **容量扩容**：8 → 30 条 + `max-h-[70vh] overflow-y-auto`
5. **快捷键**：`Cmd+K` / `Ctrl+K` 等同于 `/`（聚焦搜索框）

`autoFocus` 保留。Esc 行为分两步：先清空 query，第二次 Esc 才 blur。

## 五、主区域实时过滤（GroupSection）

App 计算 `matchedLinkIds: Set<string>`（rankMatches 结果取 id），传入 GroupSection。

GroupSection 接收新 props：
- `query: string`
- `matchedLinkIds: Set<string>`

行为：
- query 非空时：未命中的 LinkCard 加 `dimmed=true` → `opacity-30 pointer-events-none`
- 整组 0 命中：视图层 collapsed（不写库），标题加 `· 0 matches`（mono、muted）
- query 空时：恢复持久化 `group.collapsed`

避免「视图折叠态」覆盖「持久折叠态」：App 维护
`viewCollapsed: Set<string>`，仅在 query 非空时生效，
GroupSection 用 `effectiveCollapsed = query ? viewCollapsed.has(id) : group.collapsed`。

## 六、不做的事

- 不加 schema（`clickCount` / `lastUsedAt` 留作下一阶段，本期先观察）
- 不做全屏 modal palette（保持 inline 下拉氛围；将来要做再加开关）
- 不改任何写入路径（addLink / updateLink / reorderXxx 不变）
- 不改 useAppStore 的接口

## 七、文件触达

**新增：**
- [src/utils/searchIndex.ts](../../../src/utils/searchIndex.ts)

**修改：**
- [src/newtab/App.tsx](../../../src/newtab/App.tsx) — query state、indexed memo、viewCollapsed
- [src/newtab/components/SearchBox.tsx](../../../src/newtab/components/SearchBox.tsx) — controlled、键盘导航、Cmd+K、group hint、滚动
- [src/newtab/components/GroupSection.tsx](../../../src/newtab/components/GroupSection.tsx) — 接收 query / matchedLinkIds、视图折叠
- [src/newtab/components/LinkCard.tsx](../../../src/newtab/components/LinkCard.tsx) — 加 `dimmed` prop
- [package.json](../../../package.json) — 加 `pinyin-pro` 依赖

## 八、验收

- 输入 `xf` → 「讯飞」「讯飞开放平台」上浮且高亮
- 输入 `gh` → 「GitHub」（首字母 / 全拼都可能命中，都算正常）
- ↑/↓ Enter 全程键盘
- 主区域命中外的链接淡化，0 命中分组自动收起
- query 清空后立即恢复全貌
- `pnpm typecheck` / `pnpm test`（92） / `pnpm build` 全过
