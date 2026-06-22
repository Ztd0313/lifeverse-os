'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 折线图数据点
 */
export interface LineChartPoint {
  /** X 轴标签 */
  label: string;
  /** Y 轴数值 */
  value: number;
}

/**
 * 折线图组件 Props
 */
export interface LineChartProps {
  /** 数据点 */
  data: LineChartPoint[];
  /** 宽度（默认 600） */
  width?: number;
  /** 高度（默认 240） */
  height?: number;
  /** 线条颜色（默认金色） */
  color?: string;
  /** 是否填充面积（默认 true） */
  fill?: boolean;
  /** Y 轴标签（可选） */
  yLabel?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 简单 SVG 折线图组件
 *
 * 特性：
 * - 纯 SVG 绘制，无第三方依赖
 * - 自动计算坐标系
 * - 支持面积填充渐变
 * - 支持悬停 tooltip
 * - 响应式：通过 viewBox 自适应容器宽度
 */
export function LineChart({
  data,
  width = 600,
  height = 240,
  color = '#c9a84c',
  fill = true,
  yLabel,
  className,
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 32, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-text-dim', className)}
        style={{ height }}
      >
        暂无数据
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const valueRange = maxValue - minValue || 1;

  // 计算 X 坐标
  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  const getX = (index: number) => padding.left + index * xStep;
  // 计算 Y 坐标
  const getY = (value: number) =>
    padding.top + innerHeight - ((value - minValue) / valueRange) * innerHeight;

  // 折线路径
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
    .join(' ');

  // 面积路径
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${padding.top + innerHeight} Z`;

  // Y 轴刻度（4 等分）
  const yTicks = Array.from({ length: 5 }, (_, i) => minValue + (valueRange * i) / 4);

  // 渐变 ID（唯一化避免冲突）
  const gradientId = React.useId();

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y 轴刻度线 */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={getY(tick)}
              x2={width - padding.right}
              y2={getY(tick)}
              stroke="#1e2235"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={getY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[#6a6a6a]"
              style={{ fontSize: '10px' }}
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {/* Y 轴标签 */}
        {yLabel && (
          <text
            x={12}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 12, ${height / 2})`}
            className="fill-[#6a6a6a]"
            style={{ fontSize: '11px' }}
          >
            {yLabel}
          </text>
        )}

        {/* 面积填充 */}
        {fill && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {/* 折线 */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />

        {/* 数据点 + 悬停 */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY(d.value)}
              r={hoverIndex === i ? 5 : 3}
              fill={color}
              stroke="#060710"
              strokeWidth={2}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
            {/* X 轴标签 */}
            <text
              x={getX(i)}
              y={height - 10}
              textAnchor="middle"
              className="fill-[#6a6a6a]"
              style={{ fontSize: '10px' }}
            >
              {d.label}
            </text>
            {/* Tooltip */}
            {hoverIndex === i && (
              <g>
                <rect
                  x={getX(i) - 30}
                  y={getY(d.value) - 28}
                  width={60}
                  height={20}
                  rx={4}
                  fill="#12141f"
                  stroke={color}
                />
                <text
                  x={getX(i)}
                  y={getY(d.value) - 14}
                  textAnchor="middle"
                  className="fill-[#eae8e3]"
                  style={{ fontSize: '11px' }}
                >
                  {d.value}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * 柱状图数据项
 */
export interface BarChartItem {
  /** 标签 */
  label: string;
  /** 数值 */
  value: number;
  /** 颜色（可选，默认金色） */
  color?: string;
}

/**
 * 柱状图组件 Props
 */
export interface BarChartProps {
  /** 数据 */
  data: BarChartItem[];
  /** 宽度（默认 600） */
  width?: number;
  /** 高度（默认 240） */
  height?: number;
  /** 默认颜色 */
  color?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 简单 SVG 柱状图组件
 *
 * 特性：
 * - 纯 SVG 绘制
 * - 自动计算坐标系
 * - 悬停高亮
 */
export function BarChart({
  data,
  width = 600,
  height = 240,
  color = '#c9a84c',
  className,
}: BarChartProps) {
  const padding = { top: 20, right: 20, bottom: 32, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-text-dim', className)}
        style={{ height }}
      >
        暂无数据
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (innerWidth / data.length) * 0.6;
  const barGap = (innerWidth / data.length) * 0.4;

  const yTicks = Array.from({ length: 5 }, (_, i) => (maxValue * i) / 4);

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        {/* Y 轴刻度线 */}
        {yTicks.map((tick, i) => {
          const y = padding.top + innerHeight - (tick / maxValue) * innerHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e2235"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-[#6a6a6a]"
                style={{ fontSize: '10px' }}
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {/* 柱子 */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * innerHeight;
          const x = padding.left + i * (barWidth + barGap) + barGap / 2;
          const y = padding.top + innerHeight - barHeight;
          const barColor = d.color ?? color;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                opacity={hoverIndex === null || hoverIndex === i ? 0.85 : 0.4}
                rx={2}
                className="transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className="fill-[#6a6a6a]"
                style={{ fontSize: '10px' }}
              >
                {d.label}
              </text>
              {hoverIndex === i && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-[#eae8e3]"
                  style={{ fontSize: '11px' }}
                >
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default LineChart;
