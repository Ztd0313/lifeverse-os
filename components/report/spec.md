# Report 命运报告组件规格说明

> 组件路径：`components/report/`
> 负责人：Sophia Zhang（设计总监）、Marcus Lee（UX 设计师）、Maya Guo（动效总监）
> 版本：v1.0.0
> 最后更新：2026-06-06

---

## 1. 用途

命运报告组件用于在议会结束后展示完整的命运分析报告，整合 6 个维度卡片、5 个核心指数、价值雷达图与时间线摘要，是 Wisdom Council 与 Future Council 模块的核心输出界面。报告支持展开/折叠、分享、保存、导出等操作，是用户获取议会价值的关键载体。

典型使用场景：
- Wisdom Council 议会结束后自动生成
- Future Council 未来推演结束后生成
- History 模块中查看历史报告
- 首页 Dashboard 中展示最近报告摘要

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 命运报告组件 Props
 */
export interface ReportProps {
  /** 报告唯一标识 */
  reportId: string;
  /** 关联的议会 ID */
  meetingId: string;
  /** 报告标题 */
  title: string;
  /** 报告生成时间 */
  generatedAt: number;
  /** 议会议题 */
  topic: string;
  /** 报告摘要 */
  summary: string;
  /** 6 个维度卡片数据 */
  dimensions: ReportDimension[];
  /** 5 个核心指数 */
  indices: ReportIndex[];
  /** 价值雷达图数据 */
  radar: RadarData;
  /** 时间线摘要 */
  timelineSummary: ReportTimelineSummary;
  /** 参与议会的 Agent 列表 */
  participants: ReportParticipant[];
  /** 冲突记录 */
  conflicts: ConflictRecord[];
  /** 共识列表 */
  consensus: string[];
  /** 报告状态 */
  status?: ReportStatus;
  /** 是否默认展开全部 */
  defaultExpanded?: boolean;
  /** 是否可分享 */
  shareable?: boolean;
  /** 是否可导出 */
  exportable?: boolean;
  /** 分享回调 */
  onShare?: (reportId: string) => void;
  /** 保存回调 */
  onSave?: (reportId: string) => void;
  /** 导出回调 */
  onExport?: (reportId: string, format: ExportFormat) => void;
  /** 跳转到完整时间线 */
  onViewTimeline?: (reportId: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 报告维度（6 个）
 * 对应：自我认知、关系网络、职业发展、财务状况、健康状况、精神成长
 */
export interface ReportDimension {
  /** 维度标识 */
  dimensionId: string;
  /** 维度名称 */
  name: string;
  /** 维度图标 */
  icon: string;
  /** 维度评分 0-100 */
  score: number;
  /** 维度评级 */
  level: 'S' | 'A' | 'B' | 'C' | 'D';
  /** 维度分析文本 */
  analysis: string;
  /** 改进建议 */
  suggestions: string[];
  /** 趋势：相比上次报告 */
  trend: 'up' | 'down' | 'stable';
  /** 趋势变化值 */
  trendValue?: number;
}

/**
 * 核心指数（5 个）
 * 对应：生命自由指数、幸福指数、稳定指数、成长指数、命运指数
 */
export interface ReportIndex {
  /** 指数标识 */
  indexId: string;
  /** 指数名称 */
  name: string;
  /** 指数值 0-100 */
  value: number;
  /** 指数描述 */
  description: string;
  /** 历史趋势数据（最近 5 次） */
  history?: number[];
  /** 指数颜色 */
  color?: string;
}

/**
 * 时间线摘要
 */
export interface ReportTimelineSummary {
  /** 关键节点列表 */
  milestones: ReportMilestone[];
  /** 推荐路径 */
  recommendedPath?: string;
  /** 风险提示 */
  risks: string[];
  /** 机会提示 */
  opportunities: string[];
}

/**
 * 报告中的里程碑节点
 */
export interface ReportMilestone {
  title: string;
  timeLabel: string;
  description: string;
  type: 'past' | 'present' | 'future';
  importance: number;
}

/**
 * 报告参与者
 */
export interface ReportParticipant {
  agentId: string;
  name: string;
  avatar: string;
  role: string;
  /** 该 Agent 在议会中的发言数 */
  speechCount: number;
  /** 该 Agent 的核心观点摘要 */
  keyViewpoint: string;
}

/**
 * 冲突记录
 */
export interface ConflictRecord {
  conflictId: string;
  /** 冲突双方 Agent ID */
  agentIds: [string, string];
  /** 冲突维度 */
  dimension: string;
  /** 冲突描述 */
  description: string;
  /** 解决方案 */
  resolution: string;
  /** 是否已解决 */
  resolved: boolean;
}

/**
 * 报告状态
 */
export type ReportStatus = 'generating' | 'ready' | 'archived';

/**
 * 导出格式
 */
export type ExportFormat = 'pdf' | 'image' | 'markdown' | 'json';
```

---

## 3. 布局设计

### 3.1 整体布局

```
┌──────────────────────────────────────────────────┐
│  [报告头部]                                       │
│  报告标题 | 生成时间 | 议会议题                    │
│  [分享] [保存] [导出▼] [查看时间线]                │
├──────────────────────────────────────────────────┤
│                                                  │
│  [报告摘要]                                       │
│  一段文字概述议会结论与核心建议...                  │
│                                                  │
├─────────────────────────┬────────────────────────┤
│                         │                        │
│   [价值雷达图]           │   [5 大核心指数]        │
│   (Radar Chart)         │   自由指数  ████ 85    │
│                         │   幸福指数  ████ 72    │
│        自由              │   稳定指数  ████ 68    │
│       /    \             │   成长指数  ████ 90    │
│  成长 ────── 财富         │   命运指数  ████ 78    │
│       \    /             │                        │
│        幸福              │                        │
│         |                │                        │
│        稳定              │                        │
│                         │                        │
├─────────────────────────┴────────────────────────┤
│                                                  │
│  [6 维度卡片网格]                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐                │
│  │自我认知 │ │关系网络 │ │职业发展 │                │
│  │ A 85分  │ │ B 72分  │ │ S 92分  │                │
│  │ ▲ +5   │ │ ▼ -3   │ │ ▲ +8   │                │
│  └────────┘ └────────┘ └────────┘                │
│  ┌────────┐ ┌────────┐ ┌────────┐                │
│  │财务状况 │ │健康状况 │ │精神成长 │                │
│  │ C 65分  │ │ B 78分  │ │ A 88分  │                │
│  │ → 0    │ │ ▲ +2   │ │ ▲ +6   │                │
│  └────────┘ └────────┘ └────────┘                │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [时间线摘要]                                     │
│  ●─── ●─── ○─── ◇─── ●─── ○───                   │
│  过去  现在  近期  决策  中期  远期                 │
│                                                  │
│  风险提示：⚠ ...                                  │
│  机会提示：✨ ...                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [参与 Agent 观点]                                │
│  ┌──────────────────────────────────────────┐    │
│  │ [头像] 哲学家 | 发言 12 次                 │    │
│  │ 核心观点：...                              │    │
│  └──────────────────────────────────────────┘    │
│  ...                                             │
│                                                  │
├──────────────────────────────────────────────────┤
│  [冲突与共识]                                     │
│  冲突：哲学家 vs 战略家（自由 vs 稳定）            │
│  解决：在 3 年内逐步过渡...                        │
│                                                  │
│  共识：                                           │
│  1. 优先提升职业能力                              │
│  2. 兼顾健康投资                                  │
│  3. ...                                          │
└──────────────────────────────────────────────────┘
```

### 3.2 维度卡片设计

每张维度卡片包含：
- 顶部：图标 + 维度名称
- 中部：大号评分数字 + 评级徽章（S/A/B/C/D）
- 趋势箭头：上升绿色 / 下降红色 / 持平灰色
- 底部：折叠的分析文本（点击展开）
- 展开后：详细分析 + 改进建议列表

---

## 4. 交互设计

### 4.1 展开/折叠
- 报告分为 5 个可折叠区块：摘要、雷达图+指数、维度卡片、时间线摘要、参与者观点
- 每个区块右上角有展开/折叠按钮
- `defaultExpanded` 为 true 时默认全部展开
- 折叠动画：height auto ↔ 0，duration 0.3s，easeInOut

### 4.2 维度卡片展开
- 点击维度卡片展开详细分析
- 展开内容：分析文本 + 改进建议列表
- 同一时间只展开一张卡片（手风琴模式）
- 展开动画：maxHeight 过渡，duration 0.4s

### 4.3 分享
- 点击分享按钮弹出分享面板
- 分享选项：生成链接、分享到社交媒体、复制摘要
- 分享链接为只读报告页面
- 分享前可选择分享范围（完整报告 / 仅摘要）

### 4.4 保存
- 点击保存按钮将报告存入 Memory Planet
- 保存成功后按钮变为「已保存」状态
- 支持添加个人备注

### 4.5 导出
- 导出格式：PDF / 图片 / Markdown / JSON
- PDF：完整报告，含所有图表
- 图片：报告摘要截图
- Markdown：纯文本报告
- JSON：结构化数据，供二次分析

### 4.6 查看时间线
- 点击「查看时间线」跳转到 Timeline 组件
- 传递报告中的时间线摘要数据
- 支持在时间线中继续推演

---

## 5. 动效设计

### 5.1 报告生成动画
- 状态为 `generating` 时显示加载动画
- 加载动画：雷达图轮廓逐步描绘 + 指数条逐步填充
- 生成完成后，报告内容从上到下依次淡入
- stagger 间隔 100ms，duration 0.5s

### 5.2 雷达图入场
- SVG path 描边动画，duration 1.2s
- 5 个维度的数值标签依次跳动（CountUp 效果）
- 跳动动画 duration 0.8s，stagger 100ms

### 5.3 指数条动画
- 从 0 填充到目标值，duration 1s，easeOut
- 数值同步 CountUp
- 历史趋势线在填充完成后绘制

### 5.4 维度卡片入场
- 6 张卡片网格布局，stagger 入场
- 每张卡片从 opacity:0、y:20 过渡到 opacity:1、y:0
- duration 0.4s，stagger 80ms

### 5.5 时间线摘要
- 节点依次出现，连接线逐步绘制
- 风险/机会提示从右侧滑入

---

## 6. 评级标准

| 评级 | 分数范围 | 颜色 | 含义 |
|------|----------|------|------|
| S | 90-100 | 金色 #FFD700 | 卓越 |
| A | 80-89 | 紫色 #9B59B6 | 优秀 |
| B | 70-79 | 蓝色 #3498DB | 良好 |
| C | 60-69 | 橙色 #E67E22 | 及格 |
| D | 0-59 | 红色 #E74C3C | 待改善 |

---

## 7. 响应式设计

| 断点 | 布局调整 |
|------|----------|
| `< 640px` | 维度卡片单列，雷达图与指数上下排列 |
| `640-1024px` | 维度卡片 2 列，雷达图与指数左右排列 |
| `> 1024px` | 维度卡片 3 列，标准布局 |
| `> 1440px` | 维度卡片 3 列，内容区最大宽度 1200px 居中 |

---

## 8. 依赖关系

- 内部依赖：`radar-chart`、`timeline`
- 外部依赖：`framer-motion`、`html2canvas`（导出图片）、`jspdf`（导出 PDF）
- Shadcn UI：`Card`、`Collapsible`、`Button`、`Badge`、`Tooltip`、`DropdownMenu`

---

## 9. 性能优化

- 报告内容分段渲染，优先渲染摘要和雷达图
- 雷达图和指数条使用 `React.memo` 缓存
- 导出操作在 Web Worker 中执行，避免阻塞 UI
- 长文本使用 `react-truncate-markup` 截断，点击展开
- 图片资源懒加载

---

## 10. 验收标准

- [ ] 6 个维度卡片数据展示正确
- [ ] 5 个核心指数条动画流畅
- [ ] 雷达图正确渲染并支持动画
- [ ] 时间线摘要节点显示正确
- [ ] 展开/折叠动画正常
- [ ] 分享功能可生成链接
- [ ] 保存功能可存入 Memory Planet
- [ ] 支持 PDF / 图片 / Markdown / JSON 四种导出
- [ ] 报告生成动画在 2s 内完成
- [ ] 移动端布局自适应
