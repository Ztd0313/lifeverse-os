'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 统计卡片组件 Props
 */
export interface StatCardProps {
  /** 卡片标题 */
  title: string;
  /** 主数值 */
  value: string | number;
  /** 图标 */
  icon: LucideIcon;
  /** 同比变化百分比（正数表示上升，负数表示下降） */
  trend?: number;
  /** 趋势标签（如 "较昨日"） */
  trendLabel?: string;
  /** 主题色（gold / blue / green / orange / red） */
  color?: 'gold' | 'blue' | 'green' | 'orange' | 'red';
  /** 点击回调（可选） */
  onClick?: () => void;
}

const COLOR_MAP: Record<NonNullable<StatCardProps['color']>, string> = {
  gold: 'text-gold bg-gold-soft/30 border-gold-dim',
  blue: 'text-blue bg-[rgba(93,160,232,0.12)] border-[rgba(93,160,232,0.3)]',
  green: 'text-green bg-[rgba(93,232,160,0.12)] border-[rgba(93,232,160,0.3)]',
  orange: 'text-orange bg-[rgba(232,160,93,0.12)] border-[rgba(232,160,93,0.3)]',
  red: 'text-red bg-[rgba(232,93,93,0.12)] border-[rgba(232,93,93,0.3)]',
};

/**
 * 统计卡片组件
 *
 * 用于 Dashboard 仪表盘展示关键指标：
 * - 图标 + 标题 + 主数值 + 趋势
 * - 支持点击交互
 * - 5 种主题色
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'gold',
  onClick,
}: StatCardProps) {
  const isTrendUp = typeof trend === 'number' && trend >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-bg-card p-5 transition-all',
        onClick && 'cursor-pointer hover:border-gold-dim hover:shadow-[0_8px_32px_var(--shadow-gold)]'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-text-soft">{title}</p>
          <p className="font-serif text-2xl text-text">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border',
            COLOR_MAP[color]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {typeof trend === 'number' && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {isTrendUp ? (
            <TrendingUp className="h-3.5 w-3.5 text-green" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red" />
          )}
          <span className={isTrendUp ? 'text-green' : 'text-red'}>
            {isTrendUp ? '+' : ''}
            {trend}%
          </span>
          {trendLabel && <span className="text-text-dim">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
