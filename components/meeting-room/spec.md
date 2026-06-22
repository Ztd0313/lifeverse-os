# Meeting Room 议会大厅组件规格说明

> 组件路径：`components/meeting-room/`
> 负责人：Sophia Zhang（设计总监）、Marcus Lee（UX 设计师）、Maya Guo（动效总监）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

议会大厅是 LifeVerse 的核心交互界面，用于承载 Wisdom Council、Reunion 等模块的多 Agent 对话场景。组件将多个 Agent 以环形排列于舞台之上，中央展示当前议题，底部展示实时对话流，支持完整的议会仪式流程。

典型使用场景：
- Wisdom Council：7 个 Agent 围绕用户的人生议题展开辩论
- Reunion：用户与 AI 重生的亲人进行私人议会
- History 续议：回放历史议会并继续讨论

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 议会大厅组件 Props
 */
export interface MeetingRoomProps {
  /** 议会唯一标识 */
  meetingId: string;
  /** 议会类型 */
  meetingType: 'wisdom' | 'reunion' | 'replay';
  /** 参与议会的 Agent 列表 */
  agents: MeetingAgent[];
  /** 当前议题 */
  topic: MeetingTopic;
  /** 议会当前状态 */
  state: MeetingState;
  /** 当前轮次（R1/R2/R3） */
  currentRound?: MeetingRound;
  /** 对话流消息列表 */
  messages: MeetingMessage[];
  /** Chairman Agent ID（主持人） */
  chairmanId?: string;
  /** 是否为只读模式（回放） */
  readonly?: boolean;
  /** 议会配置 */
  config?: MeetingRoomConfig;
  /** 议题提交回调 */
  onTopicSubmit?: (topic: string) => void;
  /** 议会开始回调 */
  onMeetingStart?: () => void;
  /** 议会结束回调 */
  onMeetingEnd?: (report: MeetingReport) => void;
  /** 点击 Agent 回调 */
  onAgentClick?: (agentId: string) => void;
  /** 发送消息回调 */
  onSendMessage?: (message: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 议会中的 Agent 信息
 */
export interface MeetingAgent {
  agentId: string;
  name: string;
  avatar: string;
  role: string;
  radar: RadarData;
  status: AgentStatus;
  /** 在环形布局中的位置索引 */
  position: number;
}

/**
 * 议会议题
 */
export interface MeetingTopic {
  title: string;
  description: string;
  category: 'career' | 'relationship' | 'health' | 'finance' | 'growth' | 'other';
  /** 用户提供的背景信息 */
  context?: string;
}

/**
 * 议会状态机
 */
export type MeetingState =
  | 'idle'     // 待命，等待用户输入议题
  | 'ritual'   // 仪式启动，Agent 入场
  | 'r1'       // 第一轮：各抒己见
  | 'r2'       // 第二轮：交叉质询
  | 'r3'       // 第三轮：共识凝聚
  | 'report';  // 报告生成

/**
 * 议会轮次
 */
export type MeetingRound = 'R1' | 'R2' | 'R3';

/**
 * 对话流消息
 */
export interface MeetingMessage {
  messageId: string;
  agentId: string;
  agentName: string;
  avatar: string;
  content: string;
  timestamp: number;
  round: MeetingRound;
  /** 消息类型 */
  type: 'speech' | 'question' | 'conflict' | 'consensus' | 'system';
  /** 关联的冲突 ID（如有） */
  conflictId?: string;
}

/**
 * 议会大厅配置
 */
export interface MeetingRoomConfig {
  /** 环形半径，单位 px，默认 280 */
  radius?: number;
  /** 是否启用语音播报 */
  voiceEnabled?: boolean;
  /** 是否启用粒子背景 */
  particleEnabled?: boolean;
  /** 对话流自动滚动 */
  autoScroll?: boolean;
  /** 议会仪式时长，单位 ms，默认 3000 */
  ritualDuration?: number;
}

/**
 * 议会报告
 */
export interface MeetingReport {
  meetingId: string;
  topic: MeetingTopic;
  summary: string;
  dimensions: ReportDimension[];
  indices: ReportIndex[];
  conflicts: ConflictRecord[];
  consensus: string[];
  timestamp: number;
}
```

---

## 3. 布局设计

### 3.1 整体布局

```
┌──────────────────────────────────────────────────┐
│                  [粒子背景层]                      │
│                                                  │
│         Agent3        Agent4                     │
│    Agent2     ┌─────────┐     Agent5             │
│               │  议题区  │                       │
│    Agent1     │ 中央舞台 │     Agent6            │
│               └─────────┘                        │
│         Agent0 (Chairman)    Agent7              │
│                                                  │
│  [状态指示器: R1 → R2 → R3 → Report]              │
├──────────────────────────────────────────────────┤
│                                                  │
│  [对话流区域 - 可滚动]                             │
│  ┌────────────────────────────────────────┐      │
│  │ Agent名: 发言内容...                    │      │
│  │ Agent名: 发言内容...                    │      │
│  │ > 用户输入框                            │      │
│  └────────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
```

### 3.2 Agent 环形排列算法

```typescript
/**
 * 计算 Agent 在环形布局中的坐标
 * @param index Agent 索引
 * @param total Agent 总数
 * @param radius 环形半径
 * @returns { x, y } 相对中心点的坐标
 */
function calcAgentPosition(
  index: number,
  total: number,
  radius: number
): { x: number; y: number } {
  // Chairman 固定在正下方
  if (index === 0) {
    return { x: 0, y: radius };
  }
  // 其余 Agent 均匀分布在上方 240° 弧形上
  const angleSpan = Math.PI * (4 / 3); // 240°
  const startAngle = Math.PI * (7 / 6); // 从左下开始
  const angle = startAngle + ((index - 1) / (total - 1)) * angleSpan;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}
```

### 3.3 中央议题区

- 圆形容器，直径 200px（medium）/ 280px（large）
- 显示当前议题标题（最多 2 行，超出省略）
- 议题下方显示当前轮次标签
- 议会进行中显示「正在讨论...」加载状态

### 3.4 底部对话流

- 高度：40vh，可滚动
- 消息卡片：头像 + Agent 名 + 时间 + 内容
- 系统消息居中显示，灰色背景
- 冲突消息红色边框，共识消息金色边框
- 底部固定用户输入框（仅非只读模式）

---

## 4. 状态机

### 4.1 状态流转图

```
                    ┌──────────┐
         用户提交议题 │  idle    │
              ┌─────>│ (待命)   │
              │      └────┬─────┘
              │           │ 点击「开启议会」
              │           ▼
              │      ┌──────────┐
              │      │  ritual  │
              │      │ (仪式)   │ 3s 入场动画
              │      └────┬─────┘
              │           │ 仪式结束
              │           ▼
              │      ┌──────────┐
              │      │   r1     │
              │      │ (各抒己见)│ 7 Agent 依次发言
              │      └────┬─────┘
              │           │ R1 完成
              │           ▼
              │      ┌──────────┐
              │      │   r2     │
              │      │ (交叉质询)│ Agent 互相提问
              │      └────┬─────┘
              │           │ R2 完成
              │           ▼
              │      ┌──────────┐
              │      │   r3     │
              │      │ (共识凝聚)│ 解决冲突，形成共识
              │      └────┬─────┘
              │           │ R3 完成
              │           ▼
              │      ┌──────────┐
              │      │  report  │
              └──────│ (报告)    │ 生成命运报告
                     └──────────┘
```

### 4.2 各状态行为

| 状态 | Agent 行为 | 中央区域 | 对话流 | UI 元素 |
|------|-----------|----------|--------|---------|
| `idle` | 全部 idle | 显示议题输入框 | 空 | 「开启议会」按钮 |
| `ritual` | 依次入场（fade+scale） | 显示仪式动画 | 系统消息：议会开启 | 进度条 |
| `r1` | 依次 speaking | 显示议题 + R1 标签 | 实时追加发言 | R1 高亮指示器 |
| `r2` | 交叉 speaking + conflict | 显示议题 + R2 标签 | 追加质询和冲突 | R2 高亮，冲突标记 |
| `r3` | speaking → idle | 显示议题 + R3 标签 | 追加共识发言 | R3 高亮，共识标记 |
| `report` | 全部 idle | 显示报告摘要 | 系统消息：议会结束 | 「查看完整报告」按钮 |

---

## 5. 交互设计

### 5.1 点击 Agent 查看详情
- 点击任意 Agent 卡片，弹出侧边抽屉（Drawer）
- 抽屉内容：Agent 完整信息、本次议会发言历史、价值雷达图对比
- 抽屉宽度：400px，从右侧滑入
- 议会进行中点击不影响流程

### 5.2 议题输入
- idle 状态下，中央区域显示议题输入框
- 支持多行文本，最多 500 字
- 提供议题分类选择（职业/关系/健康/财务/成长/其他）
- 可附加背景信息（可选）
- 点击「开启议会」提交

### 5.3 对话流交互
- 自动滚动到最新消息（可配置关闭）
- 鼠标悬停消息显示时间戳
- 点击消息中的 Agent 名跳转到 Agent 详情
- 用户可在底部输入框追加问题（R2/R3 阶段）

### 5.4 议会控制
- 右上角控制栏：暂停 / 继续 / 结束
- 暂停时所有 Agent 进入 idle，对话流停止追加
- 结束时直接跳转到 report 状态

---

## 6. 动效设计

### 6.1 仪式入场动画（ritual 状态）
- 总时长 3s
- 粒子背景从中心向外扩散
- Agent 按 position 顺序依次入场，每个间隔 200ms
- 入场动画：从中心点飞向各自位置，opacity 0→1，scale 0→1
- Chairman 最后入场，伴随金色光柱效果

### 6.2 发言切换动画
- 当前 speaking Agent 光晕增强
- 切换到下一个 Agent 时，前一个光晕淡出，下一个淡入
- 过渡时长 0.4s，easeInOut

### 6.3 冲突可视化
- 冲突发生时，两个冲突 Agent 之间出现红色连线
- 连线带有电流脉冲动画
- 冲突解决后，红色连线变为金色，然后淡出

### 6.4 报告生成动画
- 所有 Agent 光晕汇聚到中央
- 中央议题区旋转 360°，变换为报告卡片
- 报告卡片从中心展开，各维度依次显现

---

## 7. 响应式设计

| 断点 | 布局调整 |
|------|----------|
| `< 640px` | Agent 环形改为水平滚动列表，对话流占 60vh |
| `640-1024px` | 环形半径缩小至 200px，Agent 使用 small 尺寸 |
| `> 1024px` | 标准环形布局，半径 280px，Agent 使用 medium 尺寸 |
| `> 1440px` | 环形半径 320px，Agent 可使用 large 尺寸 |

---

## 8. 依赖关系

- 内部依赖：`agent-card`、`typing`、`particle`、`radar-chart`
- 外部依赖：`framer-motion`、`@radix-ui/react-dialog`、`lucide-react`
- Shadcn UI：`Drawer`、`ScrollArea`、`Input`、`Button`、`Badge`

---

## 9. 性能优化

- Agent 卡片使用 `React.memo`，仅 status 变化时重渲染
- 对话流使用虚拟滚动（`react-virtual`），支持长列表
- 粒子背景独立 Canvas，不触发 React 重渲染
- 状态机使用 `useReducer` 集中管理，避免 prop drilling
- 非可视区域 Agent 降级为静态展示

---

## 10. 验收标准

- [ ] 7 个 Agent 环形排列位置正确，无重叠
- [ ] 状态机 6 个状态切换流畅，无卡顿
- [ ] 仪式入场动画在 3s 内完成
- [ ] 对话流实时追加消息，自动滚动正常
- [ ] 点击 Agent 弹出详情抽屉
- [ ] 移动端布局自适应
- [ ] 议会可暂停/继续/结束
- [ ] 报告生成后可跳转查看完整报告
