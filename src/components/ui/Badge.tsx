'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge 变体样式定义
 *
 * - gold: 金色标签（智者 / 重要标记）
 * - red: 红色标签（冲突 / 警告）
 * - blue: 蓝色标签（信息 / 时间）
 * - green: 绿色标签（共识 / 成功）
 * - orange: 橙色标签（提醒 / 中性）
 */
const badgeVariants = cva(
  // 基础样式：小尺寸、圆角、inline-flex
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        gold: 'bg-gold-soft text-gold border border-gold-dim',
        red: 'bg-[rgba(232,93,93,0.12)] text-red border border-[rgba(232,93,93,0.3)]',
        blue: 'bg-[rgba(93,160,232,0.12)] text-blue border border-[rgba(93,160,232,0.3)]',
        green:
          'bg-[rgba(93,232,160,0.12)] text-green border border-[rgba(93,232,160,0.3)]',
        orange:
          'bg-[rgba(232,160,93,0.12)] text-orange border border-[rgba(232,160,93,0.3)]',
      },
    },
    defaultVariants: {
      variant: 'gold',
    },
  }
);

/**
 * Badge 组件 Props
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * 标签组件
 *
 * 小尺寸圆角标签，用于状态、分类、角色等标记。
 * 支持 5 种颜色变体：gold / red / blue / green / orange。
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export default Badge;
