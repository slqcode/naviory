# Pre-Launch Audit & Hardening — 设计文档

- **状态**：待实现
- **日期**：2026-05-12
- **范围**：纯加固和文档补齐；**不新增业务功能**、**不重构**、**不引入云同步**。

## 背景

MVP 已基本完成（含撤销删除、Toast、URL 校验、重复提示、HTML 导入、重复扫描）。本次目标是把当前 IndexedDB 本地版扩展打磨到"长期自用 + 未来可上 Chrome Web Store"的基础质量。

## 目标

1. 项目脚本完整（`typecheck` / `lint` 能直接跑）
2. Manifest 权限最小化，通过 Chrome Web Store 审核基线
3. 数据可靠性约束验证、不足处补齐
4. 关键破坏性操作有合适护栏
5. README 覆盖安装 / 构建 / 加载 / 备份 / 限制
6. 新增手动测试清单与隐私声明文档
7. 输出验收总结

## 非目标

- 云同步、账号体系
- 新业务功能
- 任何架构重构
- 引入 ESLint 等新工具链
- 单元测试新增（现有 91 个保持通过即可）
- DB schema 升级（schema v1 保持）

---

## 1. 脚本补齐

`package.json` 当前 `scripts`：`dev / build / preview / test / test:watch / test:ui`。新增：

```jsonc
"typecheck": "tsc --noEmit",
"lint": "tsc --noEmit"
```

`lint` 暂时与 `typecheck` 同义（不引入 ESLint，避免新依赖）。若后续选择引入 ESLint，再覆盖这一行。

## 2. Manifest 权限最小化

**审计结果（已执行 grep）：**
- `chrome.storage` 全仓 0 引用 → `storage` 权限可删
- `chrome.tabs.query({ active: true, currentWindow: true })` 仅出现在 popup → `activeTab` 已覆盖该用例 → `tabs` 权限可删
- `chrome.runtime.*`、`chrome.action.*` 不需要额外权限

**新 `public/manifest.json` 的 `permissions`：**

```json
"permissions": ["activeTab"]
```

无 `host_permissions`、无 `<all_urls>` 已是当前状态，保持。

## 3. 数据可靠性

**已具备**：
- Dexie schema `version(1)` 已设置
- `AppSettings.version: number` 字段存在，导入/导出会带上
- `initializeDefaultGroups` + `initializeDefaultSettings` 已在 `initialize()` 中调用
- 导入覆盖路径已用 `db.transaction([groups, links, settings])` 保证原子性

**需补**：
- 在 `ExportData` 顶层增加 `appVersion: string`（manifest 版本字符串），用于未来排查跨版本备份兼容性（向后兼容：导入时 `appVersion` 缺失不报错，仅用于诊断）。
- `importExport.ts` 的 `validateExportData` 已校验 `version / groups / links / settings`，无需改动。

## 4. 安全和体验护栏

**已具备（保持不动）**：
- 删除单链接 → 10s Toast 撤销
- 删除分组 → `ConfirmDialog` 二次确认
- 导入 JSON → `validateExportData` 校验 + `ConfirmDialog` 二次确认
- URL 合法性 → `isValidUrl`（编辑器、popup 已接入）
- 重复 URL → `checkUrlDuplicate` 提示

**需补 — 清空全部数据要求输入 `DELETE` 文案**：
- 新建 `src/newtab/components/TypedConfirmDialog.tsx`：在普通确认基础上，加一个文本输入框；用户必须输入指定字符串才能启用确认按钮。
- Props：`{ title, message, requireText, confirmLabel, danger, onConfirm, onCancel }`。
- 在 `OptionsApp.tsx` 的 `handleClearData` 中将 `ConfirmDialog` 替换为 `TypedConfirmDialog`，`requireText="DELETE"`，提示文案：`此操作将永久删除所有分组、链接和设置。请在下方输入 DELETE 以确认。`
- 其他 `ConfirmDialog` 用法不变。

## 5. README 补齐

当前 164 行 README 已覆盖大部分，需补：
- **Edge 加载**：现有"安装到浏览器"小节用的是 Chrome 路径（`chrome://extensions/`），补充 Edge 的 `edge://extensions/` 步骤（与 Chrome 几乎一致）。
- **备份和恢复**：在"使用说明 → Options 设置"后追加一节，说明：
  - 何时备份（更换电脑、清理浏览器数据、卸载扩展前）
  - 备份操作（设置页"导出 JSON"按钮）
  - 恢复操作（设置页"导入 JSON"按钮 + 覆盖确认）
  - 备份文件路径（浏览器下载目录，文件名 `naviory-backup-YYYY-MM-DD.json`）
- **当前限制**：把 README 末尾的 "限制与非目标" 小节内容明确：
  - 无云同步
  - 无账号体系
  - 数据只在本机浏览器 IndexedDB
  - 卸载扩展或清理浏览器数据会丢失数据，请定期导出

## 6. 新增 `docs/test-plan.md`

手动测试清单，分章节：
- 准备：构建 + 加载扩展（Chrome、Edge 各一遍）
- New Tab：首次打开 → 默认 7 个分组、设置默认值正确
- Links CRUD：新增 / 编辑 / 删除（含 Toast 撤销）/ 重复 URL 提示 / 非法 URL 阻止
- Groups CRUD：新增 / 编辑 / 删除（空组、有链接组两种路径）/ 拖拽排序
- Search：本地链接模糊匹配、前缀搜索（g/b/bd/gh/npm）、Enter 行为
- Drag Sort：组内链接拖拽、跨页面刷新后顺序保留
- Popup：弹窗读取当前页 / 分组下拉 / 重复 URL 提示 / 保存后自动关闭
- Options：主题三态、默认搜索引擎、打开方式、导出 JSON、导入 JSON（覆盖确认）、扫描重复、导入浏览器书签 HTML、清空数据（DELETE 文案确认）
- Dark Mode：跟随系统切换、强制浅 / 深色
- Chrome / Edge 加载：dist 加载、新标签页覆盖生效、popup / options / service worker 全部加载无控制台报错
- 数据持久性：刷新页面、重启浏览器后数据仍在

每条用 checkbox 列表形式，便于实际跑测时勾选。

## 7. 新增 `docs/privacy.md`

简短隐私声明，便于未来上架 Chrome Web Store 时使用。包含：
- 数据范围：仅保存于本地浏览器 IndexedDB（数据库名 `naviory`）
- 传输：扩展不向任何服务器发起网络请求
- 不出售、不共享、不分析、不追踪
- 用户权利：随时通过设置页导出 / 清空数据
- 当前版本无云同步
- 联系方式：留 issue 链接（GitHub repo）

## 8. 验收总结输出

实施完成后，在 `docs/superpowers/plans/2026-05-12-pre-launch-audit-summary.md` 输出一份执行报告：
- 已修复问题（脚本、权限、清空数据护栏、文档）
- 仍存在的风险（IndexedDB 浏览器配额、卸载丢数据、无云同步）
- 推荐下一阶段开发计划（若要做云同步、若要做账号、若要做插件市场上架）

---

## 文件清单

**新增**：
- `src/newtab/components/TypedConfirmDialog.tsx`
- `docs/test-plan.md`
- `docs/privacy.md`
- `docs/superpowers/plans/2026-05-12-pre-launch-audit-summary.md`（实施末尾产出）

**修改**：
- `package.json`：加 `typecheck` / `lint` 脚本
- `public/manifest.json`：`permissions` → `["activeTab"]`
- `src/types/index.ts`：`ExportData` 增加 `appVersion?: string`
- `src/utils/importExport.ts`：导出时填充 `appVersion`
- `src/store/useAppStore.ts`：`exportData()` 返回值携带 `appVersion`
- `src/options/OptionsApp.tsx`：`handleClearData` 改用 `TypedConfirmDialog`
- `README.md`：补 Edge / 备份恢复 / 限制章节

**不动**：
- 所有现有 `ConfirmDialog` 调用（除清空数据外）
- DB schema、Repository 层
- 测试代码

## 测试策略

- 自动：`pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` 全部 0 报错；现有 91 测试保持通过。
- 手动：按新 `docs/test-plan.md` 至少在 Chrome 跑一遍核心路径（Edge 可后续补充）。

## 错误处理

- 输入 `DELETE` 框：错字时确认按钮 disabled；空串、含前后空格的视为不匹配；区分大小写。
- 导出附加 `appVersion`：失败时回退到不带该字段（导出本身不能因取 manifest 失败而失败）。
