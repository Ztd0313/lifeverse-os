'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { RadarData } from '@/types';
import { cn, radarPoint } from '@/lib/utils';

/**
 * 雷达图组件 Props
 */
interface RadarChartProps {
  /** 单组或多组数据（多人格叠加时传入多组） */
  data: RadarData | RadarData[];
  /** 雷达图尺寸（px），默认 240 */
  size?: number;
  /** 5 个维度的标签，默认 ['自由', '财富', '幸福', '稳定', '成长'] */
  labels?: string[];
  /** 多个数据集的颜色，默认金色为主色 */
  colors?: string[];
  /** 是否启用入场动画，默认 true */
  animated?: boolean;
  /** 是否显示轴标签，默认 true */
  showLabels?: boolean;
  /** 是否显示网格，默认 true */
  showGrid?: boolean;
  /** 是否显示数值标签，默认 false */
  showValues?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否启用交互（hover tooltip、点击展开等），默认 true */
  interactive?: boolean;
  /** 点击维度时的回调 */
  onDimensionClick?: (dimension: string, value: number) => void;
}

/**
 * 5 个维度的 key，顺时针从顶部开始
 */
const DIMENSION_KEYS: (keyof RadarData)[] = [
  'freedom',
  'wealth',
  'happiness',
  'stability',
  'growth',
];

/**
 * 默认维度标签
 */
const DEFAULT_LABELS = ['自由', '财富', '幸福', '稳定', '成长'];

/**
 * 默认配色方案（多数据集叠加时循环使用）
 */
const DEFAULT_COLORS = [
  '#c9a84c', // gold
  '#5da0e8', // blue
  '#5de8a0', // green
  '#e8a05d', // orange
  '#b8a0c8', // purple
];

/**
 * 每个维度对应的角度（度），从顶部 0° 开始顺时针
 */
const DIMENSION_ANGLES = [0, 72, 144, 216, 288];

/**
 * 数值跳动 Hook（requestAnimationFrame 实现）
 */
function useCountUp(
  target: number,
  duration: number = 800,
  delay: number = 0,
  enabled: boolean = true
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    let rafId: number;
    const startTime = performance.now() + delay;

    const tick = (now: number) => {
      if (now < startTime) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, delay, enabled]);

  return value;
}

/**
 * 计算多边形周长（用于描边动画）
 */
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

/**
 * 将坐标点数组转换为 SVG polygon points 字符串
 */
function pointsToString(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/**
 * Tooltip 状态
 */
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  dimension: string;
  value: number;
  color: string;
}

/**
 * 单组数据集渲染
 */
interface DatasetRendererProps {
  dataset: RadarData;
  color: string;
  index: number;
  centerX: number;
  centerY: number;
  maxRadius: number;
  animated: boolean;
  showValues: boolean;
  showDots: boolean;
  interactive: boolean;
  reducedMotion: boolean;
  labels: string[];
  onPointHover: (
    dimension: string,
    value: number,
    color: string,
    clientX: number,
    clientY: number
  ) => void;
  onPointLeave: () => void;
  onPointClick: (dimension: string, value: number) => void;
}

function DatasetRenderer({
  dataset,
  color,
  index,
  centerX,
  centerY,
  maxRadius,
  animated,
  showValues,
  showDots,
  interactive,
  reducedMotion,
  labels,
  onPointHover,
  onPointLeave,
  onPointClick,
}: DatasetRendererProps) {
  const dataPoints = useMemo(() => {
    return DIMENSION_KEYS.map((key, i) =>
      radarPoint(dataset[key], DIMENSION_ANGLES[i], centerX, centerY, maxRadius)
    );
  }, [dataset, centerX, centerY, maxRadius]);

  const pointsStr = pointsToString(dataPoints);
  const perimeter = useMemo(
    () => getPolygonPerimeter(dataPoints),
    [dataPoints]
  );

  const fillOpacity = 0.18 + index * 0.0;
  const baseRadius = interactive ? 4 : 3;
  const hoverRadius = 7;
  const enterDelay = animated && !reducedMotion ? 0.3 + index * 0.2 : 0;
  const dotDelay = animated && !reducedMotion ? 0.8 + index * 0.2 : 0;

  return (
    <g>
      {/* 数据多边形填充 */}
      <motion.polygon
        initial={
          animated && !reducedMotion
            ? { fillOpacity: 0, opacity: 0, points: pointsStr }
            : false
        }
        animate={{ points: pointsStr, fillOpacity, opacity: 1 }}
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        transition={{
          fillOpacity: { duration: 0.8, delay: enterDelay, ease: 'easeOut' },
          opacity: { duration: 0.8, delay: enterDelay, ease: 'easeOut' },
          points: { duration: 0.6, ease: 'easeInOut' },
        }}
        style={
          animated && !reducedMotion
            ? ({
                strokeDasharray: perimeter,
                strokeDashoffset: perimeter,
                animation: `radar-stroke-${index} 1.2s ease-out ${index * 0.2}s forwards`,
              } as CSSProperties)
            : undefined
        }
      />

      {/* 描边动画的 keyframes */}
      {animated && !reducedMotion && (
        <style>{`
          @keyframes radar-stroke-${index} {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      )}

      {/* 数据点 */}
      {showDots &&
        dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            fill={color}
            stroke="var(--bg-card)"
            strokeWidth={1.5}
            initial={
              animated && !reducedMotion
                ? { scale: 0, opacity: 0, cx: p.x, cy: p.y, r: baseRadius }
                : false
            }
            animate={{ scale: 1, opacity: 1, cx: p.x, cy: p.y, r: baseRadius }}
            whileHover={interactive ? { r: hoverRadius } : undefined}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }}
            transition={{
              scale: {
                duration: 0.3,
                delay: dotDelay + i * 0.05,
                ease: 'backOut',
              },
              opacity: {
                duration: 0.3,
                delay: dotDelay + i * 0.05,
                ease: 'easeOut',
              },
              cx: { duration: 0.6, ease: 'easeOut' },
              cy: { duration: 0.6, ease: 'easeOut' },
              r: { duration: 0.2, ease: 'easeOut' },
            }}
            onMouseMove={
              interactive
                ? (e) => {
                    onPointHover(
                      labels[i] ?? DEFAULT_LABELS[i],
                      dataset[DIMENSION_KEYS[i]],
                      color,
                      e.clientX,
                      e.clientY
                    );
                  }
                : undefined
            }
            onMouseLeave={interactive ? onPointLeave : undefined}
            onClick={
              interactive
                ? (e) => {
                    e.stopPropagation();
                    onPointClick(
                      labels[i] ?? DEFAULT_LABELS[i],
                      dataset[DIMENSION_KEYS[i]]
                    );
                  }
                : undefined
            }
          />
        ))}

      {/* 数值标签 */}
      {showValues &&
        dataPoints.map((p, i) => (
          <ValueLabel
            key={i}
            point={p}
            value={dataset[DIMENSION_KEYS[i]]}
            color={color}
            delay={animated ? 0.9 + index * 0.2 + i * 0.05 : 0}
            animated={animated && !reducedMotion}
          />
        ))}
    </g>
  );
}

/**
 * 数值标签（带 count-up 动画）
 */
interface ValueLabelProps {
  point: { x: number; y: number };
  value: number;
  color: string;
  delay: number;
  animated: boolean;
}

function ValueLabel({ point, value, color, delay, animated }: ValueLabelProps) {
  const displayValue = useCountUp(value, 600, delay, animated);

  return (
    <text
      x={point.x}
      y={point.y - 6}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={color}
      fontSize={10}
      fontWeight={600}
      style={{ pointerEvents: 'none' }}
    >
      {displayValue}
    </text>
  );
}

/**
 * 5 维价值雷达图（纯 SVG 实现）
 *
 * 支持：
 * - 多数据集叠加对比
 * - 入场动画（描边 + 淡入 + 数据点弹出）
 * - hover tooltip（交互模式）
 * - 点击展开/收起（交互模式）
 * - 多数据集切换时多边形顶点平滑过渡
 * - prefers-reduced-motion 降级
 *
 * @example
 * ```tsx
 * <RadarChart data={persona.radar} size={240} />
 * <RadarChart data={[persona1.radar, persona2.radar]} interactive />
 * ```
 */
export function RadarChart({
  data,
  size = 240,
  labels = DEFAULT_LABELS,
  colors = DEFAULT_COLORS,
  animated = true,
  showLabels = true,
  showGrid = true,
  showValues = false,
  className,
  interactive = true,
  onDimensionClick,
}: RadarChartProps) {
  const datasets = useMemo<RadarData[]>(
    () => (Array.isArray(data) ? data : [data]),
    [data]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    dimension: '',
    value: 0,
    color: '',
  });

  // prefers-reduced-motion 检测
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 清理 leave timeout
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  // 几何参数（基于 size，不随 expanded 变化）
  const effectiveSize = expanded ? Math.round(size * 1.5) : size;
  const padding = showLabels ? size * 0.18 : size * 0.06;
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - padding;
  const gridLevels = expanded ? 10 : 5;

  // 网格刻度值
  const tickValues = expanded
    ? [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    : [20, 40, 60, 80, 100];

  // 计算网格层顶点
  const gridPolygons = useMemo(() => {
    const polygons: string[] = [];
    for (let level = 1; level <= gridLevels; level++) {
      const ratio = level / gridLevels;
      const points = DIMENSION_ANGLES.map((angle) =>
        radarPoint(ratio * 100, angle, centerX, centerY, maxRadius)
      );
      polygons.push(pointsToString(points));
    }
    return polygons;
  }, [centerX, centerY, maxRadius, gridLevels]);

  // 计算轴线
  const axisLines = useMemo(() => {
    return DIMENSION_ANGLES.map((angle) => {
      const end = radarPoint(100, angle, centerX, centerY, maxRadius);
      return { x1: centerX, y1: centerY, x2: end.x, y2: end.y };
    });
  }, [centerX, centerY, maxRadius]);

  // 计算标签位置
  const labelPositions = useMemo(() => {
    return DIMENSION_ANGLES.map((angle, i) => {
      const pos = radarPoint(118, angle, centerX, centerY, maxRadius);
      return { x: pos.x, y: pos.y, label: labels[i] ?? DEFAULT_LABELS[i] };
    });
  }, [centerX, centerY, maxRadius, labels]);

  // Tooltip handlers
  const handlePointHover = useCallback(
    (
      dimension: string,
      value: number,
      color: string,
      clientX: number,
      clientY: number
    ) => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: clientX - rect.left,
        y: clientY - rect.top,
        dimension,
        value,
        color,
      });
    },
    []
  );

  const handlePointLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 50);
  }, []);

  const handlePointClick = useCallback(
    (dimension: string, value: number) => {
      onDimensionClick?.(dimension, value);
    },
    [onDimensionClick]
  );

  const handleSvgClick = useCallback(() => {
    if (interactive) {
      setExpanded((prev) => !prev);
    }
  }, [interactive]);

  const effectiveShowValues = showValues || (interactive && expanded);

  return (
    <motion.div
      layout
      className={cn('relative inline-block', className)}
      style={{ width: effectiveSize, height: effectiveSize }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* 展开/收起按钮 */}
      {interactive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className="absolute top-1 right-1 z-10 p-1.5 rounded-lg bg-bg-card/80 hover:bg-bg-card-hover text-text-soft hover:text-gold transition-colors"
          aria-label={expanded ? '收起雷达图' : '展开雷达图'}
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      )}

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="geometricPrecision"
        onClick={handleSvgClick}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        role="img"
        aria-label="价值雷达图"
      >
        <title>价值雷达图</title>
        <desc>5 维价值雷达图，维度包括：{labels.join('、')}</desc>

        {/* 背景渐变圆 */}
        <defs>
          <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201, 168, 76, 0.04)" />
            <stop offset="100%" stopColor="rgba(201, 168, 76, 0)" />
          </radialGradient>
        </defs>
        <circle
          cx={centerX}
          cy={centerY}
          r={maxRadius}
          fill="url(#radar-bg)"
        />

        {/* 网格层 */}
        {showGrid && (
          <g className="radar-grid">
            {gridPolygons.map((points, level) => (
              <polygon
                key={level}
                points={points}
                fill="none"
                stroke="rgba(201, 168, 76, 0.12)"
                strokeWidth={1}
                strokeDasharray={level === gridLevels ? '0' : '2,3'}
              />
            ))}
            {/* 网格刻度数值 */}
            {tickValues.map((val) => {
              const pos = radarPoint(
                val,
                DIMENSION_ANGLES[0],
                centerX,
                centerY,
                maxRadius
              );
              return (
                <text
                  key={val}
                  x={pos.x + 4}
                  y={pos.y}
                  fill="rgba(154, 154, 154, 0.5)"
                  fontSize={8}
                  dominantBaseline="middle"
                >
                  {val}
                </text>
              );
            })}
          </g>
        )}

        {/* 轴线 */}
        <g className="radar-axes">
          {axisLines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(201, 168, 76, 0.15)"
              strokeWidth={1}
            />
          ))}
        </g>

        {/* 数据多边形 */}
        <g className="radar-data">
          {datasets.map((dataset, index) => (
            <DatasetRenderer
              key={index}
              dataset={dataset}
              color={colors[index % colors.length]}
              index={index}
              centerX={centerX}
              centerY={centerY}
              maxRadius={maxRadius}
              animated={animated}
              showValues={effectiveShowValues}
              showDots={true}
              interactive={interactive}
              reducedMotion={reducedMotion}
              labels={labels}
              onPointHover={handlePointHover}
              onPointLeave={handlePointLeave}
              onPointClick={handlePointClick}
            />
          ))}
        </g>

        {/* 轴标签 */}
        {showLabels && (
          <g className="radar-labels">
            {labelPositions.map((pos, i) => (
              <text
                key={i}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(234, 232, 227, 0.7)"
                fontSize={size > 200 ? 12 : 10}
                fontWeight={500}
              >
                {pos.label}
              </text>
            ))}
          </g>
        )}

        {/* 中心点 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={2}
          fill="rgba(201, 168, 76, 0.4)"
        />
      </svg>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {tooltip.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg bg-bg-soft border border-gold-dim shadow-lg whitespace-nowrap"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 8,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="text-xs text-text-soft mb-0.5">
              {tooltip.dimension}
            </div>
            <div
              className="text-sm font-bold"
              style={{ color: tooltip.color }}
            >
              {tooltip.value}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default RadarChart;
