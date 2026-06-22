# History 历史记录组件规格说明

> 组件路径：`components/history/`
> 负责人：Sophia Zhang（设计总监）、Marcus Lee（UX 设计师）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

历史记录组件是 History 模块的主界面，用于展示和管理用户所有的议会记录、命运报告与人生事件。组件整合时间轴导航、卡片列表、搜索筛选等功能，支持查看、续议、删除、收藏、导出等操作，是用户回顾人生决策历程的核心入口。

典型使用场景：
- History 模块主页面
- 首页 Dashboard 中的最近活动摘要
- Memory Planet 中关联的议会历史
- 用户个人中心的 activity log

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 历史记录组件 Props
 */
export interface HistoryProps {
  /** 历史记录列表 */
  records: HistoryRecord[];
  /** 当前视图模式 */
  viewMode?: HistoryViewMode;
  /** 默认筛选条件 */
  defaultFilter?: HistoryFilter;
  /** 默认排序方式 */
  defaultSort?: HistorySort;
  /** 是否启用搜索 */
  searchable?: boolean;
  /** 是否启用筛选 */
  filterable?: boolean;
  /** 是否启用批量操作 */
  batchEnabled?: boolean;
  /** 是否启用导出 */
  exportable?: boolean;
  /** 每页数量，默认 20 */
  pageSize?: number;
  /** 加载状态 */
  loading?: boolean;
  /** 是否还有更多 */
  hasMore?: boolean;
  /** 查看记录回调 */
  onView?: (record: HistoryRecord) => void;
  /** 续议回调 */
  onContinue?: (record: HistoryRecord) => void;
  /** 删除回调 */
  onDelete?: (recordIds: string[]) => void;
  /** 收藏回调 */
  onFavorite?: (recordId: string, favorite: boolean) => void;
  /** 导出回调 */
  onExport?: (recordIds: string[], format: ExportFormat) => void;
  /** 加载更多回调 */
  onLoadMore?: () => void;
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 筛选回调 */
  onFilter?: (filter: HistoryFilter) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 历史记录数据结构
 */
export interface HistoryRecord {
  /** 记录唯一标识 */
  recordId: string;
  /** 记录类型 */
  type: HistoryRecordType;
  /** 记录标题 */
  title: string;
  /** 记录摘要 */
  summary: string;
  /** 创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
  /** 关联的议会 ID */
  meetingId?: string;
  /** 关联的报告 ID */
  reportId?: string;
  /** 参与的 Agent 列表 */
  participants?: HistoryParticipant[];
  /** 标签 */
  tags: string[];
  /** 是否收藏 */
  favorite: boolean;
  /** 议题分类 */
  category?: HistoryCategory;
  /** 议会状态 */
  status: 'completed' | 'ongoing' | 'abandoned';
  /** 关联的记忆 ID */
  memoryIds?: string[];
  /** 缩略图 */
  thumbnail?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 历史记录类型
 */
export type HistoryRecordType =
  | 'meeting'    // 议会记录
  | 'report'     // 命运报告
  | 'event'      // 人生事件
  | 'dream'      // 梦想记录
  | 'reunion';   // 重逢记录

/**
 * 历史记录参与者
 */
export interface HistoryParticipant {
  agentId: string;
  name: string;
  avatar: string;
  role: string;
}

/**
 * 议题分类
 */
export type HistoryCategory =
  | 'career'       // 职业
  | 'relationship' // 关系
  | 'health'       // 健康
  | 'finance'      // 财务
  | 'growth'       // 成长
  | 'family'       // 家庭
  | 'other';       // 其他

/**
 * 视图模式
 */
export type HistoryViewMode =
  | 'timeline'  // 时间轴视图
  | 'list'      // 列表视图
  | 'grid';     // 网格视图

/**
 * 筛选条件
 */
export interface HistoryFilter {
  /** 类型筛选 */
  types?: HistoryRecordType[];
  /** 分类筛选 */
  categories?: HistoryCategory[];
  /** 仅显示收藏 */
  favoriteOnly?: boolean;
  /** 时间范围 */
  dateRange?: {
    start: number;
    end: number;
  };
  /** 标签筛选 */
  tags?: string[];
  /** 状态筛选 */
  status?: ('completed' | 'ongoing' | 'abandoned')[];
}

/**
 * 排序方式
 */
export type HistorySort =
  | 'newest'      // 最新优先
  | 'oldest'      // 最早优先
  | 'title'       // 标题字母序
  | 'category'    // 按分类
  | 'favorite';   // 收藏优先

/**
 * 导出格式
 */
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'markdown';
```

---

## 3. 布局设计

### 3.1 整体布局

```
┌──────────────────────────────────────────────────┐
│  [头部工具栏]                                     │
│  History | [搜索框] | [筛选▼] | [排序▼] | [视图切换]│
├──────────┬───────────────────────────────────────┤
│          │                                       │
│  [时间轴  │  [记录列表/网格]                       │
│  导航侧栏]│                                       │
│          │  ┌─────────────────────────────┐      │
│  2026    │  │ [卡片] 议会标题              │      │
│  ● 6月   │  │ 摘要文字...                  │      │
│  ● 5月   │  │ [Agent头像组] [标签] [时间]   │      │
│  ● 4月   │  │ [查看] [续议] [收藏] [更多▼]  │      │
│  ● 3月   │  └─────────────────────────────┘      │
│          │                                       │
│  2025    │  ┌─────────────────────────────┐      │
│  ● 12月  │  │ [卡片] ...                   │      │
│  ● 11月  │  └─────────────────────────────┘      │
│  ...     │                                       │
│          │  [加载更多]                            │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│  [批量操作栏（选中时显示）]                         │
│  已选 3 项 | [删除] [导出] [收藏]                  │
└──────────────────────────────────────────────────┘
```

### 3.2 时间轴侧栏

- 宽度：200px，固定在左侧
- 按年份分组，年份下按月份列出
- 每个月份节点显示记录数量
- 点击月份跳转到对应记录
- 当前查看的月份高亮
- 支持折叠/展开年份

### 3.3 记录卡片

```
┌─────────────────────────────────────────────┐
│  [类型图标] 议会标题                    [⭐]  │
│                                             │
│  摘要文字，最多显示 2 行，超出省略...          │
│                                             │
│  [Agent1] [Agent2] [Agent3] +4              │
│                                             │
│  [职业] [成长] [决策]    2026-06-15 14:30   │
│                                             │
│  [查看详情]  [续议]  [收藏]  [更多 ▼]        │
└─────────────────────────────────────────────┘
```

### 3.4 视图模式

#### timeline（时间轴视图）
- 记录按时间排列在中央时间轴上
- 左右交替展示卡片
- 时间轴节点用圆点标记
- 适合回顾时间脉络

#### list（列表视图）
- 卡片纵向排列，全宽
- 信息密度高
- 适合快速浏览

#### grid（网格视图）
- 卡片网格排列，2-3 列
- 每张卡片尺寸固定
- 适合视觉浏览

---

## 4. 交互设计

### 4.1 查看
- 点击卡片或「查看详情」按钮跳转到记录详情页
- 议会记录跳转到议会回放界面
- 报告记录跳转到命运报告组件
- 支持键盘 Enter 打开

### 4.2 续议
- 点击「续议」按钮基于历史记录发起新议会
- 新议会继承原议题和参与 Agent
- 原始记录保留，新议会生成新记录
- 续议前弹出确认对话框，说明将创建新议会

### 4.3 删除
- 单条删除：卡片「更多」菜单中选择删除
- 批量删除：勾选多条后点击批量删除
- 删除前弹出确认对话框，提示不可恢复
- 删除后显示 Toast 提示，提供 5 秒撤销窗口

### 4.4 收藏
- 点击星标图标切换收藏状态
- 收藏后星标变为金色填充
- 收藏记录在筛选「仅收藏」时显示
- 支持批量收藏

### 4.5 导出
- 单条导出：卡片「更多」菜单中选择导出
- 批量导出：勾选多条后点击批量导出
- 导出格式：PDF / CSV / JSON / Markdown
- PDF：格式化报告，适合打印
- CSV：表格数据，适合数据分析
- JSON：结构化数据，适合导入
- Markdown：纯文本，适合笔记

### 4.6 搜索
- 搜索框支持实时搜索（debounce 300ms）
- 搜索范围：标题、摘要、标签、Agent 名
- 搜索关键词高亮显示
- 无结果时显示空状态

### 4.7 筛选
- 筛选面板从右侧滑入
- 支持多维度筛选：类型、分类、标签、时间范围、状态
- 筛选条件可组合
- 清空筛选按钮一键重置
- 筛选结果数量实时显示

### 4.8 排序
- 排序下拉菜单：最新/最早/标题/分类/收藏优先
- 排序即时生效，无需刷新

---

## 5. 批量操作

### 5.1 选择机制
- 卡片左上角显示复选框（hover 或批量模式时）
- 点击复选框选中/取消
- 支持 Shift + 点击多选
- 全选/取消全选按钮

### 5.2 批量操作栏
- 选中记录后底部出现批量操作栏
- 显示已选数量
- 操作按钮：删除、导出、收藏、取消收藏
- 操作完成后自动取消选择

---

## 6. 动效设计

### 6.1 卡片入场
- 列表加载时卡片 stagger 入场
- 每张卡片从 opacity:0、y:20 过渡到 opacity:1、y:0
- duration 0.3s，stagger 50ms

### 6.2 卡片交互
- hover：卡片轻微上浮（y: -4px），阴影增强
- 点击：scale 弹性反馈（0.98 → 1）
- 收藏：星标弹跳动画（scale 1 → 1.3 → 1），金色粒子爆发

### 6.3 视图切换
- 切换视图模式时使用 layout 动画
- 卡片位置平滑过渡，duration 0.4s
- 使用 Framer Motion `layoutId` 实现

### 6.4 时间轴导航
- 点击月份时，列表平滑滚动到对应位置
- 滚动过程中时间轴节点同步高亮
- 使用 `scrollIntoView({ behavior: 'smooth' })`

### 6.5 删除动画
- 删除时卡片向左滑出 + 淡出
- 后续卡片上移填补空位（layout 动画）
- duration 0.3s

---

## 7. 空状态设计

### 7.1 无记录
- 显示插画：空白的议会大厅
- 文案：「还没有历史记录，开启你的第一次议会吧」
- 按钮：「前往 Wisdom Council」

### 7.2 无搜索结果
- 显示插画：放大镜
- 文案：「未找到匹配 "{query}" 的记录」
- 按钮：「清空搜索」

### 7.3 无筛选结果
- 显示插画：筛选器
- 文案：「当前筛选条件下无记录」
- 按钮：「清空筛选」

---

## 8. 响应式设计

| 断点 | 布局调整 |
|------|----------|
| `< 640px` | 时间轴侧栏隐藏（改为顶部下拉选择），卡片单列，网格视图不可用 |
| `640-1024px` | 时间轴侧栏 160px，卡片单列，网格视图 2 列 |
| `> 1024px` | 时间轴侧栏 200px，列表视图全宽，网格视图 3 列 |
| `> 1440px` | 内容区最大宽度 1400px 居中 |

---

## 9. 虚拟滚动

记录数量超过 100 条时启用虚拟滚动：

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualRecordList({
  records,
  height,
}: {
  records: HistoryRecord[];
  height: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // 每张卡片预估高度
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              top: item.start,
              width: '100%',
            }}
          >
            <HistoryCard record={records[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 10. 依赖关系

- 外部依赖：`framer-motion`、`@tanstack/react-virtual`、`lucide-react`、`date-fns`
- Shadcn UI：`Card`、`Input`、`Button`、`Badge`、`Checkbox`、`DropdownMenu`、`Dialog`、`Tooltip`、`Select`

---

## 11. 性能优化

- 虚拟滚动：超过 100 条记录时启用
- 搜索 debounce 300ms，避免频繁过滤
- 卡片使用 `React.memo`，仅 record 变化时重渲染
- 时间轴导航使用 `IntersectionObserver` 检测当前可见月份
- 图片缩略图使用 `next/image` 懒加载
- 导出操作在 Web Worker 中执行

---

## 12. 无障碍设计

- 列表使用 `role="list"`，卡片使用 `role="listitem"`
- 所有操作按钮提供 `aria-label`
- 批量选择使用 `aria-checked`
- 搜索框提供 `aria-label="搜索历史记录"`
- 筛选面板使用 `aria-expanded`
- 键盘导航：Tab 切换卡片，Enter 查看，Space 选中
- 颜色对比度满足 WCAG AA 标准

---

## 13. 验收标准

- [ ] 时间轴侧栏正确显示年份和月份
- [ ] 三种视图模式切换正常
- [ ] 搜索功能实时响应，关键词高亮
- [ ] 筛选功能多维度组合正确
- [ ] 排序功能即时生效
- [ ] 查看/续议/删除/收藏/导出操作正常
- [ ] 批量操作功能正常
- [ ] 虚拟滚动在 100+ 记录时流畅
- [ ] 空状态三种场景正确显示
- [ ] 移动端布局自适应
- [ ] 键盘导航可用
- [ ] 删除后 5 秒撤销窗口正常
