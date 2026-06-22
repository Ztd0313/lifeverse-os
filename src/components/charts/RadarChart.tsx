'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
} from 'react';
import { motion } from 'framer-motion';
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
 * radarPoint 内部已处理 -90° 偏移，所以这里传入 0 表示正上方
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
      // easeOutCubic
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
}: DatasetRendererProps) {
  // 计算数据多边形顶点
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

  // 填充透明度：多组数据时递减
  const fillOpacity = 0.18 + index * 0.0;

  return (
    <g>
      {/* 数据多边形填充 */}
      <motion.polygon
        points={pointsStr}
        fill={color}
        fillOpacity={fillOpacity}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        initial={animated ? { fillOpacity: 0, opacity: 0 } : false}
        animate={{ fillOpacity, opacity: 1 }}
        transition={{
          duration: 0.8,
          delay: animated ? 0.3 + index * 0.2 : 0,
          ease: 'easeOut',
        }}
        style={
          animated
            ? ({
                strokeDasharray: perimeter,
                strokeDashoffset: perimeter,
                animation: `radar-stroke-${index} 1.2s ease-out ${index * 0.2}s forwards`,
              } as CSSProperties)
            : undefined
        }
      />

      {/* 描边动画的 keyframes */}
      {animated && (
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
            cx={p.x}
            cy={p.y}
            r={3}
            fill={color}
            initial={animated ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: animated ? 0.8 + index * 0.2 + i * 0.05 : 0,
              ease: 'backOut',
            }}
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
            animated={animated}
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
 * 支持 5 个维度（自由、财富、幸福、稳定、成长）的可视化，
 * 包含 5 层五边形网格、数据多边形描边动画、数值跳动动画，
 * 支持单组或多组数据叠加显示。
 *
 * @example
 * ```tsx
 * // 单组数据
 * <RadarChart data={{ freedom: 80, wealth: 60, happiness: 90, stability: 70, growth: 85 }} />
 *
 * // 多组叠加
 * <RadarChart
 *   data={[agent1.radar, agent2.radar]}
 *   colors={['#c9a84c', '#5da0e8']}
 *   size={280}
 * />
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
}: RadarChartProps) {
  // 标准化为数组
  const datasets = useMemo<RadarData[]>(
    () => (Array.isArray(data) ? data : [data]),
    [data]
  );

  const svgRef = useRef<SVGSVGElement>(null);

  // 几何参数
  const padding = showLabels ? size * 0.18 : size * 0.06;
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - padding;
  const gridLevels = 5;

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

  // 计算轴线（从中心到各顶点）
  const axisLines = useMemo(() => {
    return DIMENSION_ANGLES.map((angle) => {
      const end = radarPoint(100, angle, centerX, centerY, maxRadius);
      return { x1: centerX, y1: centerY, x2: end.x, y2: end.y };
    });
  }, [centerX, centerY, maxRadius]);

  // 计算标签位置（顶点外侧）
  const labelPositions = useMemo(() => {
    return DIMENSION_ANGLES.map((angle, i) => {
      const pos = radarPoint(118, angle, centerX, centerY, maxRadius);
      return { x: pos.x, y: pos.y, label: labels[i] ?? DEFAULT_LABELS[i] };
    });
  }, [centerX, centerY, maxRadius, labels]);

  // 网格刻度数值（20, 40, 60, 80, 100）
  const gridScaleValues = useMemo(() => {
    return DIMENSION_ANGLES.map((angle) => {
      const pos = radarPoint(100, angle, centerX, centerY, maxRadius);
      return pos;
    });
  }, [centerX, centerY, maxRadius]);

  const handleMouseEnter = useCallback(() => {}, []);

  return (
    <div
      className={cn('inline-block', className)}
      style={{ width: size, height: size }}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="geometricPrecision"
        onMouseEnter={handleMouseEnter}
        role="img"
        aria-label="价值雷达图"
      >
        <title>价值雷达图</title>
        <desc>
          5 维价值雷达图，维度包括：{labels.join('、')}
        </desc>

        {/* 背景渐变圆 */}
        <defs>
          <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201, 168, 76, 0.04)" />
            <stop offset="100%" stopColor="rgba(201, 168, 76, 0)" />
          </radialGradient>
        </defs>
        <circle cx={centerX} cy={centerY} r={maxRadius} fill="url(#radar-bg)" />

        {/* 网格层（同心五边形） */}
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
            {[20, 40, 60, 80, 100].map((val, idx) => {
              const pos = radarPoint(
                (val / 100) * 100,
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

        {/* 数据多边形（可多组叠加） */}
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
              showValues={showValues}
              showDots={true}
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
    </div>
  );
}

export default RadarChart;
