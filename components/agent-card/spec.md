# Agent Card 组件规格说明

> 组件路径：`components/agent-card/`
> 负责人：Sophia Zhang（设计总监）、Marcus Lee（UX 设计师）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

Agent 卡片组件用于在议会大厅、内心世界、重逢议会等场景中展示单个 Agent 的人格信息，包括头像、名字、哲学信条、价值雷达图与当前状态。它是 LifeVerse 中复用频率最高的展示型组件之一。

典型使用场景：
- Wisdom Council 议会大厅中环形排列的 7 个 Agent
- Inner World 中 6 个内心人格的卡片墙
- Reunion 私人议会中 AI 亲人的展示
- History 详情页中参与议会的 Agent 列表

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * Agent 卡片组件 Props
 */
export interface AgentCardProps {
  /** Agent 唯一标识 */
  agentId: string;
  /** Agent 显示名称 */
  name: string;
  /** Agent 头像 URL（支持图片或 Lottie 动画） */
  avatar: string;
  /** Agent 角色标签，例如「哲学家」「战略家」 */
  role: string;
  /** Agent 哲学信条，一句话描述 */
  philosophy: string;
  /** 价值雷达图 5 维数据，0-100 */
  radar: RadarData;
  /** 当前状态，默认 idle */
  status?: AgentStatus;
  /** 卡片尺寸，默认 medium */
  size?: AgentCardSize;
  /** 主题色，用于光晕和边框，默认取 Agent 配置 */
  themeColor?: string;
  /** 是否显示雷达图，默认 true */
  showRadar?: boolean;
  /** 是否显示哲学信条，默认 true */
  showPhilosophy?: boolean;
  /** 是否可点击展开详情，默认 true */
  interactive?: boolean;
  /** 入场动画延迟，单位 ms，默认 0 */
  enterDelay?: number;
  /** 点击 Agent 回调 */
  onClick?: (agentId: string) => void;
  /** 状态变化回调 */
  onStatusChange?: (status: AgentStatus) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 雷达图 5 维数据
 */
export interface RadarData {
  /** 自由 */
  freedom: number;
  /** 财富 */
  wealth: number;
  /** 幸福 */
  happiness: number;
  /** 稳定 */
  stability: number;
  /** 成长 */
  growth: number;
}

/**
 * Agent 状态枚举
 */
export type AgentStatus =
  | 'idle'      // 静默待命
  | 'speaking'  // 正在发言
  | 'thinking'  // 思考中
  | 'conflict'; // 冲突状态

/**
 * 卡片尺寸
 */
export type AgentCardSize = 'small' | 'medium' | 'large';
```

---

## 3. 状态定义

| 状态 | 视觉表现 | 触发条件 |
|------|----------|----------|
| `idle` | 卡片静态显示，头像轻微呼吸光晕 | 默认状态，未轮到发言 |
| `speaking` | 头像放大 1.05 倍，外圈金色光晕脉冲，底部出现声波条 | 轮到该 Agent 发言 |
| `thinking` | 头像上方出现三点加载动画，整体降低 30% 透明度 | Agent 正在生成回复 |
| `conflict` | 边框变为红色脉冲，头像轻微抖动，出现冲突图标 | 与其他 Agent 价值冲突 |

状态机转换规则：
```
idle ──(轮到发言)──> speaking
idle ──(开始思考)──> thinking
speaking ──(发言结束)──> idle
thinking ──(思考完成)──> speaking
speaking ──(检测到冲突)──> conflict
conflict ──(冲突解决)──> idle
```

---

## 4. 动效设计

由 Maya Guo（动效总监）负责实现，基于 Framer Motion。

### 4.1 入场动画
- 类型：spring 弹性入场
- 从 opacity:0、scale:0.8、y:20 过渡到 opacity:1、scale:1、y:0
- duration: 0.6s，staggerChildren 支持
- 支持 `enterDelay` 参数错峰入场

### 4.2 发言动画
- 头像 scale: 1 → 1.05，duration 0.3s
- 外圈光晕：boxShadow 从 0 0 0px 扩散到 0 0 24px 主题色
- 光晕脉冲：无限循环，2s 周期，easeInOut
- 底部声波条：3-5 根竖条高度随机变化，0.4s 循环

### 4.3 光晕动画
- idle 状态：轻微呼吸光晕，4s 周期，opacity 0.3 ↔ 0.5
- speaking 状态：强脉冲光晕，2s 周期
- conflict 状态：红色警示光晕，0.8s 快速脉冲

### 4.4 状态切换过渡
- 所有状态切换使用 `transition: { duration: 0.3, ease: 'easeInOut' }`
- 避免硬切，保证视觉连续性

---

## 5. 尺寸规格

| 尺寸 | 卡片宽度 | 卡片高度 | 头像直径 | 雷达图尺寸 | 字号 |
|------|----------|----------|----------|------------|------|
| `small` | 160px | 200px | 64px | 80×80px | 12px |
| `medium` | 220px | 280px | 88px | 120×120px | 14px |
| `large` | 300px | 380px | 120px | 160×160px | 16px |

响应式断点：
- `< 640px`（移动端）：强制使用 `small`
- `640px - 1024px`（平板）：默认 `medium`
- `> 1024px`（桌面）：默认 `medium`，议会大厅使用 `large`

---

## 6. 布局结构

```
┌─────────────────────────┐
│      [光晕外圈]          │
│    ┌───────────┐        │
│    │  头像区域  │        │
│    │  (Avatar)  │        │
│    └───────────┘        │
│                         │
│       Agent 名称         │
│       角色标签           │
│                         │
│    ┌─────────────┐      │
│    │  雷达图      │      │
│    │  (Radar)     │      │
│    └─────────────┘      │
│                         │
│   "哲学信条文字..."      │
│                         │
│   [状态指示器]           │
└─────────────────────────┘
```

---

## 7. 无障碍设计

- 卡片整体使用 `role="button"`，支持键盘聚焦
- `tabIndex={0}`，支持 Tab 导航
- Enter / Space 触发 `onClick`
- 状态变化通过 `aria-live="polite"` 播报
- 头像提供 `alt` 文本：`{name} 的头像`
- 颜色对比度满足 WCAG AA 标准（4.5:1）

---

## 8. 性能优化

- 头像使用 `next/image` 优化加载
- 雷达图使用 SVG，避免重绘开销
- 光晕动画使用 `transform` 和 `opacity`，避免触发重排
- `React.memo` 包裹组件，仅在 `agentId` 或 `status` 变化时重渲染
- 粒子光晕使用 CSS `will-change: transform`

---

## 9. 依赖关系

- 内部依赖：`radar-chart` 组件
- 外部依赖：`framer-motion`、`next/image`、`lucide-react`
- Shadcn UI：`Card`、`Badge`、`Avatar`

---

## 10. 验收标准

- [ ] 所有 Props 类型定义完整且通过 TypeScript 严格检查
- [ ] 4 种状态视觉表现符合设计稿
- [ ] 入场动画在 0.6s 内完成，无卡顿
- [ ] 移动端尺寸自适应正确
- [ ] 键盘导航可用，屏幕阅读器可读
- [ ] Lighthouse 性能评分 ≥ 90
