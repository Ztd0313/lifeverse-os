'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * 趋势线组件 Props
 */
interface TrendLineProps {
  /** 多条趋势线数据 */
  series: { name: string; data: number[]; color: string }[];
  /** X 轴标签 */
  labels: string[];
  /** 高度（px），默认 240 */
  height?: number;
  /** 是否显示图例，默认 true */
  showLegend?: boolean;
  /** 是否显示网格，默认 true */
  showGrid?: boolean;
}

/**
 * 独立趋势线组件（纯 SVG 实现）
 *
 * 支持：
 * - 多条线 + 渐变面积填充
 * - Framer Motion pathLength 绘制动画
 * - hover 十字线 + tooltip
 * - 响应式（ResizeObserver 动态宽度）
 * - 可选图例与网格
 * - prefers-reduced-motion 降级
 *
 * @example
 * ```tsx
 * <TrendLine
 *   series={[
 *     { name: '自由', data: [60, 65, 70, 68, 75], color: '#c9a84c' },
 *     { name: '财富', data: [40, 50, 55, 60, 65], color: '#5da0e8' },
 *   ]}
 *   labels={['1月', '2月', '3月', '4月', '5月']}
 * />
 * ```
 */
export function TrendLine({
  series,
  labels,
  height = 240,
  showLegend = true,
  showGrid = true,
}: TrendLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 响应式宽度
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // prefers-reduced-motion 检测
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const width = Math.max(containerWidth, 300);
  const padding = { top: 20, right: 20, bottom: 30, left: 44 };
  const chartWidth = Math.max(0, width - padding.left - padding.right);
  const chartHeight = height - padding.top - padding.bottom;

  // 计算所有数据的 min/max
  const { min, max } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;
    series.forEach((s) => {
      s.data.forEach((v) => {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      });
    });
    if (minVal === Infinity) return { min: 0, max: 1 };
    const range = maxVal - minVal || 1;
    return { min: minVal - range * 0.1, max: maxVal + range * 0.1 };
  }, [series]);

  // 计算每条线的点位和路径
  const seriesData = useMemo(() => {
    return series.map((s, idx) => {
      const dataCount = s.data.length;
      const points = s.data.map((v, i) => {
        const x =
          padding.left +
          (dataCount > 1 ? (i / (dataCount - 1)) * chartWidth : 0);
        const y =
          padding.top + chartHeight - ((v - min) / (max - min)) * chartHeight;
        return { x, y };
      });
      const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(' ');
      const areaPath =
        dataCount > 0
          ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(
              padding.top + chartHeight
            ).toFixed(2)} L ${points[0].x.toFixed(2)} ${(
              padding.top + chartHeight
            ).toFixed(2)} Z`
          : '';
      return { ...s, idx, points, linePath, areaPath };
    });
  }, [series, min, max, chartWidth, chartHeight, padding.left, padding.top]);

  // Y 轴刻度
  const yTicks = useMemo(() => {
    const tickCount = 5;
    return Array.from({ length: tickCount }, (_, i) => {
      const ratio = i / (tickCount - 1);
      const value = max - (max - min) * ratio;
      const y = padding.top + chartHeight * ratio;
      return { value, y };
    });
  }, [min, max, chartHeight, padding.top]);

  // 鼠标移动
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setMouseX(x);
      const dataCount = series[0]?.data.length ?? 0;
      if (dataCount === 0) return;
      const ratio =
        chartWidth > 0 ? (x - padding.left) / chartWidth : 0;
      const index = Math.round(ratio * (dataCount - 1));
      setHoverIndex(Math.max(0, Math.min(dataCount - 1, index)));
    },
    [series, chartWidth, padding.left]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  // 计算 hover 十字线的 x 坐标
  const crosshairX = useMemo(() => {
    if (hoverIndex === null || !series[0]) return 0;
    const dataCount = series[0].data.length;
    return (
      padding.left +
      (dataCount > 1 ? (hoverIndex / (dataCount - 1)) * chartWidth : 0)
    );
  }, [hoverIndex, series, chartWidth, padding.left]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {seriesData.map((s) => (
            <linearGradient
              key={s.idx}
              id={`trend-grad-${s.idx}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* 网格线 + Y 轴刻度 */}
        {showGrid &&
          yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="rgba(201, 168, 76, 0.08)"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={tick.y}
                fill="rgba(154, 154, 154, 0.6)"
                fontSize={10}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {Math.round(tick.value)}
              </text>
            </g>
          ))}

        {/* X 轴标签 */}
        {labels.map((label, i) => {
          const labelCount = labels.length;
          const x =
            padding.left +
            (labelCount > 1 ? (i / (labelCount - 1)) * chartWidth : 0);
          return (
            <text
              key={i}
              x={x}
              y={height - 10}
              fill="rgba(154, 154, 154, 0.6)"
              fontSize={10}
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* 趋势线 */}
        {seriesData.map((s) => (
          <g key={s.idx}>
            {/* 渐变面积填充 */}
            <motion.path
              d={s.areaPath}
              fill={`url(#trend-grad-${s.idx})`}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: reducedMotion ? 0 : 0.3 + s.idx * 0.1 }}
            />
            {/* 线条 */}
            <motion.path
              d={s.linePath}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={reducedMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: reducedMotion ? 0 : 1.2,
                delay: reducedMotion ? 0 : s.idx * 0.15,
                ease: 'easeInOut',
              }}
            />
          </g>
        ))}

        {/* Hover 十字线 + 数据点高亮 */}
        {hoverIndex !== null && series[0] && (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={crosshairX}
              y1={padding.top}
              x2={crosshairX}
              y2={padding.top + chartHeight}
              stroke="rgba(201, 168, 76, 0.3)"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            {seriesData.map((s) => {
              const point = s.points[hoverIndex];
              if (!point) return null;
              return (
                <circle
                  key={s.idx}
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={s.color}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Hover Tooltip */}
      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg bg-bg-soft border border-gold-dim shadow-lg whitespace-nowrap text-xs"
          style={{
            left: Math.min(Math.max(mouseX + 12, 0), width - 140),
            top: 8,
          }}
        >
          <div className="text-text-soft mb-1 font-medium">
            {labels[hoverIndex] ?? ''}
          </div>
          {seriesData.map((s) => (
            <div key={s.idx} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-text-soft">{s.name}:</span>
              <span className="font-bold" style={{ color: s.color }}>
                {s.data[hoverIndex]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 图例 */}
      {showLegend && (
        <div className="flex flex-wrap gap-3 mt-2">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-xs text-text-soft">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendLine;
