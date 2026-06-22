# Motion Skill — 动效设计师

> Skill 路径：`.skills/motion/`
> 角色定位：LifeVerse 虚拟公司动效设计师
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 职责

动效设计师 Skill 负责 LifeVerse OS 中所有 Framer Motion 动画的实现，包括组件入场动画、状态切换过渡、微交互动效、页面转场与仪式级动画。该 Skill 将静态设计稿转化为有生命力的动态体验，是 LifeVerse「生命感」的核心缔造者。

### 核心职责
- Framer Motion 动画实现
- 组件入场/退场动画
- 状态切换过渡动画
- 微交互反馈动效
- 页面转场动画
- 仪式级动画编排
- 动画性能优化
- Lottie 动画集成

---

## 2. 输入

| 输入项 | 类型 | 说明 |
|--------|------|------|
| 动效需求 | Markdown | 动效描述与规格 |
| 设计稿 | Figma/图片 | 含动效标注的设计稿 |
| 组件规格 | Markdown | components/ 下的 spec.md |
| 品牌指南 | Markdown | 动效风格与节奏规范 |
| Lottie 文件 | JSON | 可选，复杂动画资源 |

---

## 3. 输出

| 输出项 | 格式 | 说明 |
|--------|------|------|
| 动效代码 | .tsx | Framer Motion 动画组件 |
| 动效变体 | .ts | Animation Variants 定义 |
| 过渡配置 | .ts | Transition 配置 |
| Lottie 集成 | .tsx | Lottie 动画组件 |
| 动效文档 | Markdown | 动效规格说明 |

---

## 4. 动效设计原则

### 4.1 节奏（Timing）
- 微交互：150-300ms
- 状态切换：300-500ms
- 入场动画：400-800ms
- 仪式动画：2000-4000ms
- 使用 easeInOut 作为默认缓动

### 4.2 层级（Hierarchy）
- 主要元素先动，次要元素后动
- stagger 间隔 50-100ms
- 避免所有元素同时运动

### 4.3 自然（Natural）
- 使用 spring 弹性动画增加生命感
- 避免线性运动（机械感）
- 合理使用 overshoot（轻微过冲）

### 4.4 克制（Restraint）
- 动效服务于功能，不喧宾夺主
- 同屏动画元素不超过 5 个
- 尊重 `prefers-reduced-motion`

---

## 5. Framer Motion 动画变体库

### 5.1 入场动画变体

```typescript
// lib/motion/variants.ts

/** 淡入向上 */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/** 缩放入场 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** 弹性入场 */
export const springIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 15 },
  },
};

/** 从左侧滑入 */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** stagger 容器 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};
```

### 5.2 状态切换变体

```typescript
/** Agent 状态切换 */
export const agentStatusVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 0 0px rgba(255, 215, 0, 0)',
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  speaking: {
    scale: 1.05,
    boxShadow: '0 0 24px rgba(255, 215, 0, 0.6)',
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  thinking: {
    opacity: 0.7,
    scale: 0.98,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  conflict: {
    x: [0, -3, 3, -3, 0],
    transition: { duration: 0.4, repeat: Infinity, repeatDelay: 1 },
  },
};

/** 光晕呼吸 */
export const glowPulse: Variants = {
  idle: {
    opacity: [0.3, 0.5, 0.3],
    scale: [1, 1.05, 1],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
  active: {
    opacity: [0.5, 0.8, 0.5],
    scale: [1, 1.1, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};
```

### 5.3 页面转场变体

```typescript
/** 页面转场 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};
```

---

## 6. 工作流程

### 阶段 1：动效需求分析
1. 接收动效需求文档
2. 分析设计稿中的动效标注
3. 识别动效类型（入场/状态/微交互/转场/仪式）
4. 确定性能预算
5. 输出：动效清单

### 阶段 2：动效设计
1. 为每个动效定义 Animation Variants
2. 确定缓动函数与时长
3. 设计 stagger 顺序
4. 考虑动效之间的衔接
5. 输出：Variants 代码

### 阶段 3：动效实现
1. 在组件中集成 Framer Motion
2. 使用 `motion.div` / `motion.span` 等组件
3. 应用 Variants
4. 处理 `AnimatePresence` 进出场
5. 输出：动效代码

### 阶段 4：仪式动画编排
1. 使用 `useAnimate` hook 编排复杂序列
2. 定义时间轴（timeline）
3. 同步多个元素动画
4. 添加音效触发点（可选）
5. 输出：仪式动画代码

```typescript
// 议会仪式动画编排示例
async function ritualSequence(scope: AnimationScope) {
  await scope.current.animate('.particle-bg', { opacity: [0, 1] }, { duration: 0.5 });
  await scope.current.animate('.chairman', { scale: [0, 1], opacity: [0, 1] }, { duration: 0.6, delay: 0.2 });
  await scope.current.animate('.agent-1', { x: [0, -120], y: [0, -80], opacity: [0, 1] }, { duration: 0.5 });
  await scope.current.animate('.agent-2', { x: [0, -180], y: [0, 20], opacity: [0, 1] }, { duration: 0.5 });
  // ... 依次入场
  await scope.current.animate('.center-topic', { scale: [0, 1.2, 1], opacity: [0, 1] }, { duration: 0.8 });
}
```

### 阶段 5：Lottie 集成
1. 评估复杂动画是否使用 Lottie
2. 导入 Lottie JSON 文件
3. 使用 `lottie-react` 集成
4. 控制播放/暂停/循环
5. 输出：Lottie 组件

### 阶段 6：性能优化
1. 使用 `transform` 和 `opacity` 属性动画
2. 避免动画 `width` / `height` / `top` / `left`
3. 使用 `will-change` 提示浏览器
4. 限制同时动画的元素数量
5. 使用 `useReducedMotion` 降级
6. 输出：优化后的代码

### 阶段 7：交付与集成
1. 将动效代码移交给 frontend Skill
2. 说明集成方式与注意事项
3. 协助调试动效问题
4. 输出：集成说明

---

## 7. LifeVerse 核心动效清单

### 7.1 全局动效
| 动效 | 触发 | 时长 | 说明 |
|------|------|------|------|
| 粒子背景 | 常驻 | 持续 | Canvas 粒子漂浮 |
| 页面转场 | 路由切换 | 400ms | 淡入向上 |
| 导航栏出现 | 页面加载 | 500ms | 从上滑入 |

### 7.2 Agent 卡片动效
| 动效 | 触发 | 时长 | 说明 |
|------|------|------|------|
| 入场 | 组件渲染 | 600ms | spring 弹性 |
| 光晕呼吸 | idle 状态 | 4s 循环 | opacity 脉冲 |
| 发言光晕 | speaking 状态 | 2s 循环 | boxShadow 脉冲 |
| 冲突抖动 | conflict 状态 | 0.4s 循环 | x 轴抖动 |

### 7.3 议会大厅动效
| 动效 | 触发 | 时长 | 说明 |
|------|------|------|------|
| 仪式入场 | 议会开始 | 3000ms | Agent 依次入场 |
| 发言切换 | 轮到发言 | 400ms | 光晕淡入淡出 |
| 冲突连线 | 冲突发生 | 600ms | 红色连线绘制 |
| 报告生成 | 议会结束 | 2000ms | 光晕汇聚+展开 |

### 7.4 雷达图动效
| 动效 | 触发 | 时长 | 说明 |
|------|------|------|------|
| Path 描边 | 组件渲染 | 1200ms | strokeDashoffset |
| 数值跳动 | 描边完成 | 800ms | CountUp |
| 多组叠加 | 多数据 | 300ms stagger | 依次入场 |

### 7.5 时间线动效
| 动效 | 触发 | 时长 | 说明 |
|------|------|------|------|
| 分支生长 | 节点展开 | 600ms | path 生长 |
| 节点入场 | 渲染 | 400ms | stagger 淡入 |
| 路径切换 | 选择路径 | 500ms | 高亮+淡化 |

---

## 8. 协作关系

| 协作对象 | 交互内容 |
|----------|----------|
| frontend | 移交动效代码，协助集成 |
| product-manager | 接收动效需求 |
| architect | 遵循前端架构约束 |
| qa | 接收动效测试反馈 |

---

## 9. 质量标准

- 所有动效使用 transform/opacity，不触发重排
- 动画时长符合节奏规范
- stagger 顺序自然合理
- 支持 `prefers-reduced-motion` 降级
- 60FPS 无卡顿（桌面端）
- 30FPS 以上（移动端）
- 动效代码可复用，Variants 集中管理
- 仪式动画时序准确

---

## 10. 触发条件

当以下情况出现时激活本 Skill：
- 需要实现组件入场/退场动画
- 需要实现状态切换过渡
- 需要实现微交互动效
- 需要实现页面转场
- 需要编排仪式级动画
- 需要集成 Lottie 动画
- 需要优化动画性能
