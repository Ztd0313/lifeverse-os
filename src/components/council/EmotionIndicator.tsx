'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 情感色彩指示器 Props
 */
export interface EmotionIndicatorProps {
  /** 情感分布数据 */
  emotions: { type: string; count: number; color: string }[];
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * 尺寸配置
 */
const SIZE_CONFIG = {
  sm: {
    height: 'h-1.5',
    text: 'text-[10px]',
    legendText: 'text-[10px]',
    gap: 'gap-1',
    padding: 'px-2 py-0.5',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    height: 'h-2.5',
    text: 'text-xs',
    legendText: 'text-[11px]',
    gap: 'gap-1.5',
    padding: 'px-2.5 py-1',
    dot: 'h-2 w-2',
  },
  lg: {
    height: 'h-3.5',
    text: 'text-sm',
    legendText: 'text-xs',
    gap: 'gap-2',
    padding: 'px-3 py-1.5',
    dot: 'h-2.5 w-2.5',
  },
} as const;

/**
 * 情感色彩指示器组件
 *
 * 以水平条形图展示当前对话的情感分布。每段代表一种情感的占比，
 * 颜色对应情感类型。hover 时显示情感名称和数量。
 *
 * 使用 Framer Motion 的 width 动画实现平滑过渡，圆角条形图总宽度 100%。
 *
 * @example
 * ```tsx
 * <EmotionIndicator
 *   emotions={[
 *     { type: 'positive', count: 5, color: '#5de8a0' },
 *     { type: 'negative', count: 2, color: '#e85d5d' },
 *     { type: 'passionate', count: 3, color: '#e8a05d' },
 *     { type: 'contemplative', count: 4, color: '#5da0e8' },
 *   ]}
 *   size="md"
 * />
 * ```
 */
export function EmotionIndicator({
  emotions,
  size = 'md',
  className,
}: EmotionIndicatorProps) {
  const config = SIZE_CONFIG[size];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 计算总数与各段占比
  const { total, segments } = useMemo(() => {
    const total = emotions.reduce((sum, e) => sum + e.count, 0);
    if (total === 0) {
      return {
        total: 0,
        segments: [] as { type: string; count: number; color: string; percent: number }[],
      };
    }
    const segments = emotions.map((e) => ({
      ...e,
      percent: (e.count / total) * 100,
    }));
    return { total, segments };
  }, [emotions]);

  // 空状态
  if (total === 0 || segments.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-bg-soft text-text-dim',
          config.height,
          config.text,
          config.padding,
          className
        )}
        role="status"
        aria-label="暂无情感数据"
      >
        暂无情感数据
      </div>
    );
  }

  // 计算当前 hover 段的累计偏移（用于 tooltip 定位）
  const hoveredOffset = useMemo(() => {
    if (hoveredIndex === null) return 0;
    let offset = 0;
    for (let i = 0; i < hoveredIndex; i++) {
      offset += segments[i]?.percent ?? 0;
    }
    offset += (segments[hoveredIndex]?.percent ?? 0) / 2;
    return offset;
  }, [hoveredIndex, segments]);

  return (
    <div className={cn('relative flex flex-col', config.gap, className)}>
      {/* 条形图 */}
      <div
        className={cn(
          'relative flex w-full overflow-hidden rounded-full bg-bg-soft',
          config.height
        )}
        role="img"
        aria-label={`情感分布，共 ${total} 条发言`}
      >
        {segments.map((seg, index) => (
          <motion.div
            key={`${seg.type}-${index}`}
            className="relative h-full cursor-default transition-[box-shadow] duration-200"
            style={{
              backgroundColor: seg.color,
              boxShadow:
                hoveredIndex === index ? `0 0 12px ${seg.color}80` : 'none',
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${seg.percent}%`, opacity: 1 }}
            transition={{
              width: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.3 },
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            tabIndex={0}
            role="progressbar"
            aria-valuenow={seg.count}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${seg.type}: ${seg.count} 条`}
          >
            {/* hover 高亮遮罩 */}
            <motion.div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        ))}
      </div>

      {/* 图例 */}
      <div className={cn('flex flex-wrap items-center', config.gap)}>
        {segments.map((seg, index) => (
          <motion.div
            key={`legend-${seg.type}-${index}`}
            className={cn(
              'flex items-center gap-1 rounded-full bg-bg-soft/60 transition-colors',
              config.padding,
              hoveredIndex === index && 'bg-bg-card'
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span
              className={cn('inline-block rounded-full', config.dot)}
              style={{ backgroundColor: seg.color }}
              aria-hidden="true"
            />
            <span className={cn('text-text-soft', config.legendText)}>
              {seg.type}
            </span>
            <span className={cn('font-medium text-text', config.legendText)}>
              {seg.count}
            </span>
            <span className={cn('text-text-dim', config.legendText)}>
              {seg.percent.toFixed(0)}%
            </span>
          </motion.div>
        ))}
      </div>

      {/* hover 提示气泡 */}
      {hoveredIndex !== null && segments[hoveredIndex] && (
        <motion.div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-border bg-bg-card/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            left: `${hoveredOffset}%`,
            top: 0,
          }}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: segments[hoveredIndex].color }}
            />
            <span className="text-xs font-medium text-text">
              {segments[hoveredIndex].type}
            </span>
            <span className="text-xs text-text-dim">
              {segments[hoveredIndex].count} 条 ·{' '}
              {segments[hoveredIndex].percent.toFixed(1)}%
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default EmotionIndicator;
