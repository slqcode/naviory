# 上线前验收与质量加固 — 总结报告

**日期：2026-05-12**
**对应 spec：** [docs/superpowers/specs/2026-05-12-pre-launch-audit-design.md](../specs/2026-05-12-pre-launch-audit-design.md)

## 全量验证结果

| 检查 | 结果 |
|---|---|
| `pnpm install` | ✅ 通过（之前已装） |
| `pnpm typecheck` | ✅ 0 错 |
| `pnpm lint` | ✅ 0 错（当前等价 tsc --noEmit） |
| `pnpm test` | ✅ 91/91 |
| `pnpm build` | ✅ `dist/` 生成 |

## 已修复的问题

### 1. 项目脚本

- `package.json` 新增 `typecheck` 和 `lint` 脚本，两者都映射到 `tsc --noEmit`
- 不引入 ESLint，避免给 MVP 加新依赖；如未来需要再扩展即可
- 现在用户可以 `pnpm typecheck` / `pnpm lint` 满足"上线前能跑通"的要求

### 2. Manifest 权限最小化

- `permissions` 从 `["storage", "tabs", "activeTab"]` 收紧为 `["activeTab"]`
- `chrome.storage` 全仓 0 引用，已删除
- `chrome.tabs.query({active, currentWindow})` 的用例由 `activeTab` 完全覆盖，可删除 `tabs` 权限
- 无 `host_permissions`、无 `<all_urls>`（始终保持）
- Chrome Web Store 审核基线达标

### 3. 数据可靠性

- `ExportData` 新增可选 `appVersion` 字段，记录导出时的 manifest 版本号
- `validateExportData` 不强制要求 `appVersion`，确保旧备份依然能导入
- 配合 `version: 1` 字段，未来跨版本数据兼容性诊断有了基础

### 4. 安全与体验护栏

| 操作 | 护栏 | 状态 |
|---|---|---|
| 删除单链接 | 10 秒 Toast 撤销 | ✅ 之前已实现 |
| 删除分组 | `ConfirmDialog` 二次确认（含级联提示） | ✅ 之前已实现 |
| 导入 JSON | 格式校验 + `ConfirmDialog` 二次确认 | ✅ 之前已实现 |
| **清空全部数据** | **`TypedConfirmDialog`，必须输入 `DELETE`** | ✅ 本次新增 |
| URL 合法性 | `isValidUrl` 编辑器和 popup 都接入 | ✅ 之前已实现 |
| 重复 URL | `checkUrlDuplicate` 编辑器和 popup 都接入 | ✅ 之前已实现 |

新增组件：`src/newtab/components/TypedConfirmDialog.tsx`

### 5. 文档

| 文档 | 状态 |
|---|---|
| `README.md` | ✅ 补齐 Chrome / Edge 加载、数据存储、备份与恢复、限制章节 |
| `docs/test-plan.md` | ✅ 新增手动测试清单，覆盖 New Tab / CRUD / Search / Drag / Popup / Options / Import-Export / Dark Mode / Chrome+Edge 加载 |
| `docs/privacy.md` | ✅ 新增隐私声明，明确数据范围、不传输、不出售、用户权利、当前无云同步 |

## 本次改动 commit 列表

```
4adf0bf docs: 新增上线前验收与质量加固设计文档
13835d8 chore: 添加 typecheck/lint 脚本并最小化 manifest 权限
64e5dc2 feat: 导出数据附带 appVersion 用于跨版本备份诊断
a10f5e4 feat: 清空全部数据要求输入 DELETE 二次确认
d3d2686 docs(readme): 补充 Edge 加载、备份恢复、数据存储与限制章节
0edd967 docs: 新增 test-plan.md 与 privacy.md
```

## 仍然存在的风险

### 数据相关

- **浏览器清理 = 数据丢失**：用户在浏览器设置里"清除浏览数据"会一并删除 IndexedDB；扩展无法阻止
- **配额上限**：IndexedDB 是动态配额，正常使用不会触顶，但用户大量缓存其他网站数据时可能被驱逐；当前无配额监控
- **多设备数据漂移**：用户在两台机器上分别操作 → 各自一份数据；导出导入是唯一"同步"手段，可能在合并时丢链接

### 体验相关

- **拖拽误触**：移动设备上长按可能触发拖拽，干扰滚动；MVP 仅做桌面端，不在风险范围
- **dnd-kit 跨分组拖拽未支持**：目前只能在分组内拖拽链接，跨分组只能通过编辑器改 `groupId`

### 上架相关

- **图标尺寸/质量**：当前 16/48/128 已存在，但未做 Chrome Web Store 商店截图、宣传图、详情页
- **隐私声明 URL**：上架时需要把 `docs/privacy.md` 发布为可访问的 URL（GitHub raw 或 GitHub Pages），manifest 描述需要更新
- **i18n**：当前界面文案是中文 + 个别英文；如果要触达国际用户，需要 `_locales/` 多语言

### 测试相关

- **测试范围**：现有 91 个 vitest 用例聚焦工具函数和 store，**UI 组件没有自动化测试**；上架前的回归只能靠 `docs/test-plan.md` 手动跑
- **未做兼容性测试**：浏览器版本下限未明确（Chrome MV3 要求 88+，Edge 89+）

## 推荐下一阶段开发计划

按价值密度排序：

### 短期（1-2 周）

1. **手动跑一遍 `docs/test-plan.md`**，确认 Chrome / Edge 加载无报错
2. **添加扩展 i18n 基础**（至少 manifest 的 `default_locale`），即使先只做 zh_CN，为以后扩展铺底
3. **跨分组拖拽**：链接卡片从 A 组拖到 B 组，dnd-kit 已经能撑，只需要扩展 `onDragEnd` 处理

### 中期（1-2 月）

4. **导入"合并"模式**：现在导入是覆盖式；增加合并模式（按 URL 去重）
5. **回收站 / 软删除**：`QuickLink.deletedAt` 字段已预留，启用回收站给删除分组也加撤销
6. **导出 favicon 缓存**：当前 favicon 走外部 `s2/favicons` 服务，离线就失效；导出时打包 base64 是个选项

### 长期（视用户量决定）

7. **云同步（如果决定做）**：先做最小可行同步（端到端加密 + 用户密钥），不引入账号体系
8. **Chrome Web Store 上架**：准备宣传图、商店描述、隐私声明 URL、隐私权限说明
9. **自动化 UI 测试**：Playwright 跑 `dist/` 扩展，至少覆盖核心路径回归
10. **第三方同步桥接（备选）**：把 JSON 导入导出做成定时备份到用户的 GitHub gist / Gitea / 本地 sync 目录

## 结论

当前项目已具备：

- ✅ 通过类型检查与构建
- ✅ Manifest V3 权限最小化
- ✅ 数据可靠性（事务、版本号、备份/恢复闭环）
- ✅ 关键破坏性操作有合适护栏
- ✅ 文档完备（README / 测试清单 / 隐私声明）

**当前状态：可以长期自用，可以作为开源项目对外分发，距离 Chrome Web Store 正式上架还差宣传素材、可公开访问的隐私声明 URL、以及完整一次手动验收。**
