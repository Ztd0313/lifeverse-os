'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton 形状变体
 *
 * - text: 单行文本占位
 * - card: 卡片占位（带圆角与内边距感）
 * - table-row: 表格行占位（横向条状）
 * - circle: 圆形头像占位
 * - rect: 通用矩形占位
 */
type SkeletonShape = 'text' | 'card' | 'table-row' | 'circle' | 'rect';

/**
 * Skeleton 组件 Props
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 形状变体，默认 'text' */
  shape?: SkeletonShape;
  /** 宽度（CSS 值，如 "100%" / "120px"） */
  width?: string;
  /** 高度（CSS 值，如 "16px" / "1rem"） */
  height?: string;
  /** 是否启用 shimmer 动画（默认 true） */
  animated?: boolean;
  /** 圆角（CSS 值，覆盖默认） */
  radius?: string;
}

/**
 * 根据形状返回默认尺寸
 */
function getDefaultSize(shape: SkeletonShape): {
  width: string;
  height: string;
  radius: string;
} {
  switch (shape) {
    case 'text':
      return { width: '100%', height: '14px', radius: '4px' };
    case 'card':
      return { width: '100%', height: '120px', radius: '14px' };
    case 'table-row':
      return { width: '100%', height: '48px', radius: '8px' };
    case 'circle':
      return { width: '40px', height: '40px', radius: '9999px' };
    case 'rect':
    default:
      return { width: '100%', height: '80px', radius: '8px' };
  }
}

/**
 * 骨架屏组件
 *
 * 用于数据加载时的占位。使用 shimmer 动画营造"加载中"的视觉反馈。
 *
 * 支持形状：
 * - text: 单行文本占位
 * - card: 卡片占位
 * - table-row: 表格行占位
 * - circle: 圆形头像占位
 * - rect: 通用矩形占位
 *
 * 使用方式：
 * ```tsx
 * <Skeleton shape="text" width="60%" />
 * <Skeleton shape="card" />
 * <Skeleton shape="circle" width="48px" height="48px" />
 * ```
 */
export function Skeleton({
  shape = 'text',
  width,
  height,
  animated = true,
  radius,
  className,
  style,
  ...props
}: SkeletonProps) {
  const defaults = getDefaultSize(shape);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'inline-block bg-bg-card',
        animated && 'shimmer',
        className
      )}
      style={{
        width: width ?? defaults.width,
        height: height ?? defaults.height,
        borderRadius: radius ?? defaults.radius,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * 文本骨架组（多行）
 *
 * 渲染多行文本占位，最后一行宽度较短，模拟段落加载效果。
 */
export interface SkeletonTextProps {
  /** 行数，默认 3 */
  lines?: number;
  /** 最后一行的宽度百分比，默认 60 */
  lastLineWidth?: number;
  /** 单行高度，默认 14px */
  lineHeight?: string;
  /** 行间距，默认 8px */
  gap?: string;
  /** 是否启用动画 */
  animated?: boolean;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = 60,
  lineHeight = '14px',
  gap = '8px',
  animated = true,
  className,
}: SkeletonTextProps) {
  return (
    <div
      className={cn('flex flex-col', className)}
      style={{ gap }}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          shape="text"
          animated={animated}
          height={lineHeight}
          width={
            idx === lines - 1 ? `${lastLineWidth}%` : '100%'
          }
        />
      ))}
    </div>
  );
}

/**
 * 卡片骨架组
 *
 * 渲染指定数量的卡片骨架，用于卡片网格的加载占位。
 */
export interface SkeletonCardGridProps {
  /** 卡片数量，默认 6 */
  count?: number;
  /** 每张卡片高度，默认 200px */
  cardHeight?: string;
  /** 是否启用动画 */
  animated?: boolean;
  className?: string;
}

export function SkeletonCardGrid({
  count = 6,
  cardHeight = '200px',
  animated = true,
  className,
}: SkeletonCardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton
          key={idx}
          shape="card"
          animated={animated}
          height={cardHeight}
        />
      ))}
    </div>
  );
}

/**
 * 表格行骨架组
 *
 * 渲染指定数量的表格行骨架，用于 DataTable 加载占位。
 */
export interface SkeletonTableProps {
  /** 行数，默认 5 */
  rows?: number;
  /** 是否启用动画 */
  animated?: boolean;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  animated = true,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton
          key={idx}
          shape="table-row"
          animated={animated}
        />
      ))}
    </div>
  );
}

export default Skeleton;
