# Group 瀑布流布局

## 背景

当前 group 卡片使用标准 CSS grid 3 列布局（`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`），每行卡片高度由最高的那个决定，导致内容少的 group 底部留白明显，视觉上参差不齐。

## 目标

采用瀑布流（masonry）布局，让 group 卡片紧密排列，消除行内高度差异造成的空白。

## 设计

### 布局算法

自行实现列分配，不引入第三方 masonry 库：

1. 响应式列数保持不变：1 列（mobile）/ 2 列（md）/ 3 列（lg）
2. 按 groups 数组的逻辑顺序，逐个分配到当前累计高度最小的列
3. 使用 `ResizeObserver` 监听每个 group card 的实际渲染高度，高度变化时重新计算布局

### 渲染方式

- 新建 `MasonryGrid` 组件，替换当前 `GroupGrid` 中的 `grid grid-cols-3` 容器
- 容器：`position: relative`，高度 = 最高列的累计高度
- 每个 item：`position: absolute`，通过 `transform: translate(x, y)` 定位
- 列宽 = (容器宽度 - (列数-1) * gap) / 列数
- gap 保持当前的 16px（`gap-4`）

### 动画

位置变化时使用 CSS `transition: transform 200ms ease` 平滑过渡，避免重排跳动。

### 与 dnd-kit 集成

- 拖拽排序仍然操作逻辑数组顺序（与现有行为一致）
- 拖拽结束后，新的数组顺序触发重新计算列分配
- 拖拽策略从 `rectSortingStrategy` 改为 `closestCenter`，因为瀑布流中卡片不再对齐规则网格
- `DragOverlay` 保持不变

### 组件结构

```
GroupGrid (existing, modified)
└── MasonryGrid (new)
    ├── SortableContext (existing)
    │   ├── GroupSection (absolute positioned)
    │   ├── GroupSection (absolute positioned)
    │   └── ...
    └── DragOverlay (existing)
```

### 响应式行为

- 窗口 resize 时重新计算列数和位置
- 列数变化时所有卡片重新分配，带过渡动画

## 不做的事

- 不引入第三方 masonry 库（react-masonry-css 等），自行实现更可控
- 不改变拖拽的语义（仍然是改变逻辑顺序）
- 不做"固定列归属"模式

## 涉及文件

- `src/newtab/App.tsx` — 修改 GroupGrid，引入 MasonryGrid
- `src/newtab/components/MasonryGrid.tsx` — 新建，瀑布流布局核心逻辑
- 可能微调 `GroupSection.tsx` 的外层样式（去掉 grid item 相关类）
