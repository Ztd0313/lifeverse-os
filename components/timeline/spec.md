# Timeline 时间线组件规格说明

> 组件路径：`components/timeline/`
> 负责人：Sophia Zhang（设计总监）、Marcus Lee（UX 设计师）、Maya Guo（动效总监）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

Timeline 时间线组件用于可视化时间维度的分支与节点信息，主要服务于两大场景：
1. **Future Council 时间线**：展示 4 个时间 Agent（1年/5年/10年/25年）推演出的未来分支树，支持多路径对比。
2. **命运时间线**：在命运报告中展示用户人生关键节点与未来推演的纵向时间轴。

此外还可用于 History 模块的历史议会时间轴、Dream Archive 的梦想时间轴等场景。

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 时间线组件 Props
 */
export interface TimelineProps {
  /** 时间线唯一标识 */
  timelineId: string;
  /** 时间线类型 */
  type: 'future' | 'destiny' | 'history' | 'dream';
  /** 时间线方向 */
  orientation: 'horizontal' | 'vertical';
  /** 时间线根节点 */
  root: TimelineNode;
  /** 是否显示分支 */
  showBranches?: boolean;
  /** 是否启用动画 */
  animated?: boolean;
  /** 是否可交互（点击节点） */
  interactive?: boolean;
  /** 当前选中的节点 ID */
  selectedNodeId?: string;
  /** 时间线配置 */
  config?: TimelineConfig;
  /** 节点点击回调 */
  onNodeClick?: (node: TimelineNode) => void;
  /** 节点展开回调 */
  onNodeExpand?: (nodeId: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 时间线节点数据结构
 */
export interface TimelineNode {
  /** 节点唯一标识 */
  nodeId: string;
  /** 节点标题 */
  title: string;
  /** 节点描述 */
  description?: string;
  /** 时间标签，例如「2026年」「5年后」 */
  timeLabel: string;
  /** 节点类型 */
  type: TimelineNodeType;
  /** 节点状态 */
  status: TimelineNodeStatus;
  /** 子节点（分支） */
  children?: TimelineNode[];
  /** 节点元数据 */
  metadata?: TimelineNodeMetadata;
  /** 关联的 Agent ID（未来时间线） */
  agentId?: string;
  /** 关联的议会 ID */
  meetingId?: string;
  /** 节点在分支中的概率权重 0-1 */
  probability?: number;
}

/**
 * 节点类型
 */
export type TimelineNodeType =
  | 'root'        // 根节点（当前）
  | 'milestone'   // 里程碑
  | 'decision'    // 决策点
  | 'outcome'     // 结果
  | 'risk'        // 风险节点
  | 'opportunity' // 机会节点
  | 'memory'      // 记忆节点
  | 'dream';      // 梦想节点

/**
 * 节点状态
 */
export type TimelineNodeStatus =
  | 'pending'    // 待发生
  | 'active'     // 当前
  | 'completed'  // 已完成
  | 'abandoned'  // 已放弃
  | 'projected'; // 推演中

/**
 * 节点元数据
 */
export interface TimelineNodeMetadata {
  /** 关联图片 */
  image?: string;
  /** 关联标签 */
  tags?: string[];
  /** 重要性 1-5 */
  importance?: number;
  /** 情绪标记 */
  emotion?: 'joy' | 'sadness' | 'fear' | 'anger' | 'trust' | 'anticipation';
  /** 自定义数据 */
  custom?: Record<string, unknown>;
}

/**
 * 时间线配置
 */
export interface TimelineConfig {
  /** 节点间距，单位 px，默认 120 */
  nodeSpacing?: number;
  /** 分支间距，单位 px，默认 80 */
  branchSpacing?: number;
  /** 是否显示概率标签 */
  showProbability?: boolean;
  /** 是否显示时间标签 */
  showTimeLabel?: boolean;
  /** 最大展开层级，默认无限 */
  maxDepth?: number;
  /** 节点尺寸 */
  nodeSize?: 'small' | 'medium' | 'large';
  /** 主题色 */
  themeColor?: string;
}
```

---

## 3. 布局设计

### 3.1 横向分支树（Future Council）

```
                        ┌─────────┐
                        │ 5年-A   │
                        │ (积极)  │
                  ┌─────┴─────────┴─────┐
                  │                       │
            ┌─────────┐             ┌─────────┐
            │ 1年推演  │             │ 1年推演  │
            │ (基准)  │             │ (保守)  │
            └────┬────┘             └────┬────┘
                 │                       │
           ┌─────┴─────┐           ┌─────┴─────┐
           │           │           │           │
      ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
      │ 5年-B   │ │ 10年    │ │ 25年    │ │ 5年-C   │
      │ (平衡)  │ │ (远期)  │ │ (终身)  │ │ (风险)  │
      └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

- 根节点（当前）位于最左侧
- 时间向右延伸，分支向上/向下展开
- 每个分支代表一种可能的未来路径
- 节点之间用贝塞尔曲线连接

### 3.2 纵向时间轴（命运时间线）

```
      ●───── 2024 出生
      │
      │
      ●───── 2026 入学
      │
      │
      ○───── 2028 毕业（推演）
      │
      │
      ◇───── 2031 职业决策
     / \
    /   \
   ●     ●
  路径A  路径B
```

- 根节点位于顶部
- 时间向下延伸
- 决策点用菱形表示，分支向左右展开
- 已完成节点为实心圆，推演节点为空心圆

---

## 4. 节点数据结构示例

```typescript
const futureTimeline: TimelineNode = {
  nodeId: 'root',
  title: '当前',
  description: '2026年6月，人生十字路口',
  timeLabel: '2026',
  type: 'root',
  status: 'active',
  children: [
    {
      nodeId: '1y-base',
      title: '1年推演',
      description: '维持现状的基准路径',
      timeLabel: '2027',
      type: 'projected',
      status: 'projected',
      agentId: 'agent-1y',
      probability: 0.6,
      children: [
        {
          nodeId: '5y-positive',
          title: '5年-积极路径',
          description: '抓住机会，快速发展',
          timeLabel: '2031',
          type: 'opportunity',
          status: 'projected',
          agentId: 'agent-5y',
          probability: 0.4,
          metadata: {
            importance: 5,
            emotion: 'anticipation',
            tags: ['职业', '成长'],
          },
        },
        {
          nodeId: '5y-balanced',
          title: '5年-平衡路径',
          description: '稳健发展，兼顾生活',
          timeLabel: '2031',
          type: 'milestone',
          status: 'projected',
          agentId: 'agent-5y',
          probability: 0.4,
        },
      ],
    },
  ],
};
```

---

## 5. 动效设计

### 5.1 分支生长动画
- 触发时机：组件首次渲染 / 节点展开
- 根节点先出现（scale 0→1，duration 0.4s）
- 连接线从父节点向子节点「生长」，使用 SVG `pathLength` 动画
  - `strokeDasharray` 从 `0 100` 到 `100 0`
  - duration 0.6s，easeInOut
- 子节点在连接线生长完成后淡入（opacity 0→1，scale 0.8→1）
- 同层节点 stagger 间隔 100ms

### 5.2 节点状态动画
- `active` 节点：金色脉冲光晕，2s 循环
- `projected` 节点：半透明，轻微闪烁
- `completed` 节点：实心，稳定显示
- `pending` 节点：虚线边框

### 5.3 交互动画
- 鼠标悬停节点：scale 1.1，光晕增强，0.2s
- 点击节点：scale 弹性反馈（1→1.15→1），0.3s spring
- 选中节点：持续金色边框，相关分支高亮，无关分支降低透明度

### 5.4 路径对比动画
- 切换路径时，旧路径节点淡出（opacity→0.3）
- 新路径节点高亮（opacity→1，scale 1.05）
- 过渡时长 0.5s

---

## 6. 交互设计

### 6.1 节点点击
- 点击节点弹出详情卡片（Popover）
- 卡片内容：标题、描述、时间、概率、关联 Agent、关联议会
- 提供「跳转到议会」「查看详情」操作按钮

### 6.2 分支展开/折叠
- 有子节点的节点显示展开/折叠图标
- 点击图标切换展开状态
- 折叠时子节点缩回父节点，动画 0.4s

### 6.3 路径选择
- Future Council 场景下，可勾选多条路径进行对比
- 选中路径高亮显示，未选中路径降低透明度
- 最多同时对比 3 条路径

### 6.4 缩放与平移
- 支持鼠标滚轮缩放（0.5x - 2x）
- 支持拖拽平移
- 双击节点居中并放大
- 移动端支持双指缩放

---

## 7. SVG 实现方案

### 7.1 连接线绘制

```typescript
/**
 * 计算两个节点之间的贝塞尔曲线路径
 */
function getBranchPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  orientation: 'horizontal' | 'vertical'
): string {
  if (orientation === 'horizontal') {
    const midX = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  } else {
    const midY = (from.y + to.y) / 2;
    return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
  }
}
```

### 7.2 节点渲染
- 根节点：圆形，直径 48px，金色填充
- 里程碑：圆形，直径 40px，主题色填充
- 决策点：菱形，48×48px，橙色填充
- 风险节点：三角形，红色填充
- 机会节点：六边形，绿色填充

---

## 8. 响应式设计

| 断点 | 布局调整 |
|------|----------|
| `< 640px` | 强制纵向，节点间距缩小至 80px，支持横向滑动 |
| `640-1024px` | 横向布局，节点 small 尺寸 |
| `> 1024px` | 标准布局，节点 medium 尺寸 |
| `> 1440px` | 节点 large 尺寸，间距加大 |

---

## 9. 依赖关系

- 外部依赖：`framer-motion`、`d3-hierarchy`（布局计算）、`lucide-react`
- Shadcn UI：`Popover`、`Tooltip`、`Badge`

---

## 10. 性能优化

- 节点数量超过 50 时启用虚拟渲染
- SVG 使用 `React.memo` 按节点粒度缓存
- 连接线动画使用 `strokeDashoffset` 而非重绘 path
- 缩放平移使用 CSS `transform`，不触发重排
- 大型时间线支持懒加载子树

---

## 11. 验收标准

- [ ] 横向/纵向布局切换正确
- [ ] 分支生长动画流畅，无卡顿
- [ ] 节点点击弹出详情卡片
- [ ] 分支展开/折叠动画正常
- [ ] 缩放平移操作流畅
- [ ] 50+ 节点时性能不下降
- [ ] 移动端双指缩放可用
- [ ] 路径对比功能正常
