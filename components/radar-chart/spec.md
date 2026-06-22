# Radar Chart 雷达图组件规格说明

> 组件路径：`components/radar-chart/`
> 负责人：Sophia Zhang（设计总监）、Maya Guo（动效总监）、David Kim（技术总监）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

雷达图组件用于可视化展示 Agent 或用户的价值体系，包含 5 个维度：自由、财富、幸福、稳定、成长。组件采用纯 SVG 实现，支持动画描边、数值跳动、多人格叠加显示，是 Agent 卡片、命运报告、内心世界等模块的核心可视化组件。

典型使用场景：
- Agent 卡片中展示 Agent 人格价值倾向
- 命运报告中展示用户当前价值体系
- 议会冲突可视化中对比两个 Agent 的价值差异
- Inner World 中叠加显示 6 个内心人格的价值分布

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 雷达图组件 Props
 */
export interface RadarChartProps {
  /** 雷达图唯一标识 */
  chartId: string;
  /** 单组或多组数据（多人格叠加时传入多组） */
  data: RadarDataSet | RadarDataSet[];
  /** 5 个维度的标签，默认使用标准维度 */
  axes?: RadarAxis[];
  /** 雷达图尺寸，单位 px */
  size?: number;
  /** 最大值，默认 100 */
  maxValue?: number;
  /** 网格层数，默认 5 */
  gridLevels?: number;
  /** 是否显示数值标签 */
  showValues?: boolean;
  /** 是否显示网格 */
  showGrid?: boolean;
  /** 是否显示轴线 */
  showAxes?: boolean;
  /** 是否启用入场动画 */
  animated?: boolean;
  /** 动画时长，单位 ms，默认 1200 */
  animationDuration?: number;
  /** 多组数据时的叠加模式 */
  overlayMode?: 'stack' | 'compare';
  /** 主题配色方案 */
  colorScheme?: RadarColorScheme;
  /** 自定义类名 */
  className?: string;
}

/**
 * 单组雷达图数据
 */
export interface RadarDataSet {
  /** 数据集标识 */
  id: string;
  /** 数据集名称（图例标签） */
  label: string;
  /** 5 维数据 */
  values: RadarData;
  /** 填充颜色 */
  color: string;
  /** 填充透明度 0-1 */
  fillOpacity?: number;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 是否显示数据点 */
  showDots?: boolean;
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
 * 雷达图维度轴定义
 */
export interface RadarAxis {
  /** 维度标识 */
  key: keyof RadarData;
  /** 维度显示名称 */
  label: string;
  /** 维度图标 */
  icon?: string;
  /** 维度颜色 */
  color?: string;
}

/**
 * 配色方案
 */
export interface RadarColorScheme {
  /** 网格颜色 */
  grid: string;
  /** 轴线颜色 */
  axis: string;
  /** 标签颜色 */
  label: string;
  /** 背景颜色 */
  background: string;
}
```

---

## 3. 维度定义

| 维度 | 标识 | 含义 | 默认颜色 |
|------|------|------|----------|
| 自由 | freedom | 人生选择自由度、时间自由、地点自由 | #3498DB 蓝 |
| 财富 | wealth | 物质积累、财务安全、资源获取能力 | #F1C40F 金 |
| 幸福 | happiness | 主观幸福感、情绪状态、生活满意度 | #E74C3C 红 |
| 稳定 | stability | 生活稳定性、安全感、可预测性 | #2ECC71 绿 |
| 成长 | growth | 个人成长、学习进步、能力提升 | #9B59B6 紫 |

5 个维度在雷达图上的排列顺序（顺时针，从顶部开始）：
```
       自由
      /    \
  成长      财富
      \    /
       幸福
        |
       稳定
```

---

## 4. SVG 实现方案

### 4.1 坐标计算

```typescript
/**
 * 计算雷达图各维度顶点坐标
 * @param center 中心点 { x, y }
 * @param radius 最大半径
 * @param valueCount 维度数（固定为 5）
 * @returns 各维度的坐标数组
 */
function calcVertices(
  center: { x: number; y: number },
  radius: number,
  valueCount: number = 5
): { x: number; y: number }[] {
  const vertices: { x: number; y: number }[] = [];
  // 从顶部（-90°）开始，顺时针排列
  const startAngle = -Math.PI / 2;
  const angleStep = (Math.PI * 2) / valueCount;

  for (let i = 0; i < valueCount; i++) {
    const angle = startAngle + i * angleStep;
    vertices.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return vertices;
}

/**
 * 根据数据值计算实际顶点坐标
 * @param vertices 基准顶点坐标
 * @param center 中心点
 * @param values 数据值
 * @param maxValue 最大值
 */
function calcDataPoints(
  vertices: { x: number; y: number }[],
  center: { x: number; y: number },
  values: number[],
  maxValue: number
): { x: number; y: number }[] {
  return vertices.map((v, i) => {
    const ratio = values[i] / maxValue;
    return {
      x: center.x + (v.x - center.x) * ratio,
      y: center.y + (v.y - center.y) * ratio,
    };
  });
}

/**
 * 将坐标点数组转换为 SVG polygon points 字符串
 */
function pointsToString(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}
```

### 4.2 SVG 结构

```svg
<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
  <!-- 背景圆 -->
  <circle cx={center} cy={center} r={radius} fill="url(#bgGradient)" />

  <!-- 网格层（同心五边形） -->
  <g className="grid">
    {levels.map((level) => (
      <polygon points={gridPoints} fill="none" stroke={gridColor} strokeWidth="1" />
    ))}
  </g>

  <!-- 轴线（从中心到各顶点） -->
  <g className="axes">
    {vertices.map((v) => (
      <line x1={center.x} y1={center.y} x2={v.x} y2={v.y} stroke={axisColor} strokeWidth="1" />
    ))}
  </g>

  <!-- 数据多边形（可多组叠加） -->
  <g className="data">
    {dataSets.map((set) => (
      <>
        <polygon
          points={dataPoints}
          fill={set.color}
          fillOpacity={set.fillOpacity}
          stroke={set.color}
          strokeWidth={set.strokeWidth}
          className="data-polygon"
        />
        {/* 数据点 */}
        {set.showDots && dataPoints.map((p) => (
          <circle cx={p.x} cy={p.y} r="3" fill={set.color} />
        ))}
      </>
    ))}
  </g>

  <!-- 维度标签 -->
  <g className="labels">
    {axes.map((axis, i) => (
      <text x={labelPositions[i].x} y={labelPositions[i].y} textAnchor="middle">
        {axis.label}
      </text>
    ))}
  </g>

  <!-- 数值标签 -->
  {showValues && (
    <g className="values">
      {dataSets.map((set) => (
        dataPoints.map((p, i) => (
          <text x={p.x} y={p.y - 8} textAnchor="middle" className="value-label">
            {set.values[i]}
          </text>
        ))
      ))}
    </g>
  )}
</svg>
```

---

## 5. 动效设计

### 5.1 Path 描边动画
- 数据多边形使用 `stroke-dasharray` + `stroke-dashoffset` 实现描边动画
- 初始：`strokeDasharray = perimeter`，`strokeDashoffset = perimeter`
- 结束：`strokeDashoffset = 0`
- duration: 1.2s，easeInOut
- 填充透明度同步从 0 过渡到目标值

```typescript
// 计算多边形周长
function getPolygonPerimeter(points: { x: number; y: number }[]): number {
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    const dx = points[next].x - points[i].x;
    const dy = points[next].y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}
```

### 5.2 数值跳动动画
- 各维度的数值标签使用 CountUp 效果
- 从 0 跳动到目标值，duration 0.8s
- 5 个维度依次跳动，stagger 间隔 100ms
- 使用 `requestAnimationFrame` 实现，避免 setInterval 性能问题

```typescript
function useCountUp(target: number, duration: number, delay: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const startTime = performance.now() + delay;
    let rafId: number;
    const tick = (now: number) => {
      if (now < startTime) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, delay]);
  return value;
}
```

### 5.3 多组数据叠加动画
- 多组数据依次入场，每组间隔 300ms
- 后入组在上层，填充透明度递减（0.3 / 0.2 / 0.15）
- compare 模式下，两组数据从左右两侧分别展开

### 5.4 交互动画
- 鼠标悬停某个维度：该维度轴线高亮，数值放大
- 鼠标悬停数据点：显示 Tooltip，含维度名和具体数值
- 多组数据时，悬停图例可高亮/淡化对应数据组

---

## 6. 多人格叠加显示

### 6.1 stack 模式
- 多组数据以半透明叠加显示
- 适合展示多个 Agent 的价值倾向对比
- 最多叠加 5 组数据
- 填充透明度自动计算：`opacity = 0.4 / dataSetCount`

### 6.2 compare 模式
- 两组数据左右对比
- 左侧数据正向显示，右侧数据镜像显示
- 中间显示差异值
- 适合冲突可视化场景

### 6.3 图例
- 多组数据时显示图例
- 图例位于雷达图下方或右侧
- 点击图例可切换该组数据的显示/隐藏
- 隐藏动画：opacity → 0，scale → 0.8

---

## 7. 尺寸规格

| 尺寸场景 | 组件尺寸 | 雷达半径 | 标签字号 | 数值字号 |
|----------|----------|----------|----------|----------|
| Agent 卡片（small） | 80×80px | 30px | 8px | 8px |
| Agent 卡片（medium） | 120×120px | 45px | 10px | 10px |
| Agent 卡片（large） | 160×160px | 60px | 12px | 12px |
| 命运报告 | 280×280px | 110px | 14px | 13px |
| 全屏对比 | 400×400px | 160px | 16px | 14px |

---

## 8. 响应式设计

| 断点 | 默认尺寸 |
|------|----------|
| `< 640px` | 200×200px |
| `640-1024px` | 260×260px |
| `> 1024px` | 280×280px |
| `> 1440px` | 320×320px |

支持通过 `size` prop 自定义尺寸，组件内部自适应缩放所有元素。

---

## 9. 依赖关系

- 外部依赖：`framer-motion`（用于交互动画）、`lucide-react`（维度图标）
- 无内部依赖，为叶子组件
- 兼容 SSR（服务端渲染时不执行动画）

---

## 10. 性能优化

- 纯 SVG 实现，无 Canvas 重绘开销
- `React.memo` 包裹，仅在 data 或 size 变化时重渲染
- 动画使用 CSS `stroke-dashoffset` 和 `requestAnimationFrame`，不触发 React 重渲染
- 多组数据时使用 `<g>` 分组，减少 DOM 操作
- 数值跳动使用 `useMemo` 缓存计算结果
- SVG 设置 `shape-rendering="geometricPrecision"` 提升渲染质量

---

## 11. 无障碍设计

- SVG 添加 `<title>` 和 `<desc>` 标签描述图表内容
- 各维度标签使用 `<text>` 元素，屏幕阅读器可读
- 数值标签提供 `aria-label`
- 颜色不仅是唯一区分手段，辅以不同形状的数据点
- 满足 WCAG AA 颜色对比度标准

---

## 12. 验收标准

- [ ] 5 个维度正确排列，顶点在正五边形位置
- [ ] 网格层、轴线、标签渲染正确
- [ ] Path 描边动画在 1.2s 内完成
- [ ] 数值跳动动画流畅，5 维依次跳动
- [ ] 多组数据叠加显示正确，透明度合理
- [ ] compare 模式左右对比正常
- [ ] 鼠标悬停 Tooltip 显示正确
- [ ] 图例点击可切换数据组显示
- [ ] 不同尺寸下元素自适应缩放
- [ ] SSR 环境下不报错
