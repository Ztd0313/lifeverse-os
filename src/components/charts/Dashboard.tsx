'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendLine } from './TrendLine';
import { cn } from '@/lib/utils';

/**
 * 仪表盘指标数据
 */
interface DashboardMetric {
  /** 指标名称 */
  name: string;
  /** 当前值 */
  current: number;
  /** 历史趋势值（用于趋势线） */
  trend: number[];
  /** 最大值 */
  max: number;
  /** 单位 */
  unit?: string;
  /** 颜色 */
  color?: string;
}

/**
 * 仪表盘组件 Props
 */
interface DashboardProps {
  /** 仪表盘指标数据 */
  metrics: DashboardMetric[];
  /** 时间范围标签 */
  timeLabels: string[];
  /** 标题 */
  title?: string;
  /** 主题色 */
  accentColor?: 'gold' | 'blue' | 'purple' | 'green';
}

/**
 * 主题强调色映射
 */
const ACCENT_COLORS: Record<NonNullable<DashboardProps['accentColor']>, string> = {
  gold: '#c9a84c',
  blue: '#5da0e8',
  purple: '#9d4edd',
  green: '#5de8a0',
};

/**
 * 数值跳动 Hook（requestAnimationFrame 实现）
 */
function useCountUp(
  target: number,
  duration: number = 800,
  enabled: boolean = true
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
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
  }, [target, duration, enabled]);

  return value;
}

/**
 * CountUp 组件（包裹 useCountUp）
 */
function CountUp({
  value,
  duration = 800,
  enabled = true,
}: {
  value: number;
  duration?: number;
  enabled?: boolean;
}) {
  const displayValue = useCountUp(value, duration, enabled);
  return <>{displayValue}</>;
}

/**
 * 迷你趋势线（纯 SVG sparkline）
 *
 * 使用 motion.path + pathLength 动画绘制。
 */
function Sparkline({
  data,
  color,
  width = 100,
  height = 30,
  animated = true,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  animated?: boolean;
}) {
  const path = useMemo(() => {
    if (data.length === 0) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((v, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [data, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={animated ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/**
 * 动态仪表盘组件
 *
 * 包含：
 * - 指标卡片网格（响应式 1/2/4 列）
 * - 每张卡片：名称 + CountUp 当前值 + 迷你 sparkline + 变化百分比
 * - 底部大趋势线图（使用 TrendLine 组件）
 * - 深色卡片背景 + 强调色 + 圆角
 *
 * @example
 * ```tsx
 * <Dashboard
 *   metrics={[
 *     { name: '自由', current: 75, trend: [60, 65, 70, 68, 75], max: 100, unit: '%' },
 *     { name: '财富', current: 50, trend: [40, 45, 48, 50, 50], max: 100, unit: '%' },
 *   ]}
 *   timeLabels={['1月', '2月', '3月', '4月', '5月']}
 *   title="人生指标仪表盘"
 *   accentColor="gold"
 * />
 * ```
 */
export function Dashboard({
  metrics,
  timeLabels,
  title,
  accentColor = 'gold',
}: DashboardProps) {
  const accent = ACCENT_COLORS[accentColor];
  const [reducedMotion, setReducedMotion] = useState(false);

  // prefers-reduced-motion 检测
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 将 metrics 转换为 TrendLine series
  const series = useMemo(() => {
    return metrics.map((m) => ({
      name: m.name,
      data: m.trend,
      color: m.color || accent,
    }));
  }, [metrics, accent]);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-text mb-4">{title}</h3>
      )}

      {/* 指标卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {metrics.map((metric, i) => {
          const change =
            metric.trend.length >= 2
              ? ((metric.current - metric.trend[0]) /
                  (metric.trend[0] || 1)) *
                100
              : 0;
          const isPositive = change >= 0;
          const color = metric.color || accent;

          return (
            <motion.div
              key={i}
              className="bg-bg-card border border-border rounded-[14px] p-4"
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.4,
                delay: reducedMotion ? 0 : i * 0.1,
              }}
            >
              {/* 指标名称 */}
              <div className="text-xs text-text-soft mb-1">{metric.name}</div>

              {/* 当前值 + 单位 */}
              <div className="flex items-baseline gap-1 mb-2">
                <span
                  className="text-2xl font-bold"
                  style={{ color }}
                >
                  <CountUp
                    value={metric.current}
                    enabled={!reducedMotion}
                  />
                </span>
                {metric.unit && (
                  <span className="text-xs text-text-dim">{metric.unit}</span>
                )}
              </div>

              {/* 迷你趋势线 */}
              <Sparkline
                data={metric.trend}
                color={color}
                animated={!reducedMotion}
              />

              {/* 变化百分比 */}
              <div
                className={cn(
                  'text-xs mt-1',
                  isPositive ? 'text-green' : 'text-red'
                )}
              >
                {isPositive ? '\u2191' : '\u2193'} {Math.abs(change).toFixed(1)}%
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 底部大趋势线图 */}
      <div className="bg-bg-card border border-border rounded-[14px] p-4">
        <TrendLine series={series} labels={timeLabels} />
      </div>
    </div>
  );
}

export default Dashboard;
