'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * LoadingSpinner 尺寸
 */
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * LoadingSpinner 组件 Props
 */
export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** 尺寸，默认 'md' */
  size?: SpinnerSize;
  /** 是否显示文字标签 */
  label?: string;
  /** 是否全屏覆盖（用于页面级加载） */
  fullscreen?: boolean;
  /** 自定义颜色（CSS 颜色值），默认金色 */
  color?: string;
}

/**
 * 尺寸映射
 */
const SIZE_MAP: Record<SpinnerSize, { box: number; border: number; text: string }> = {
  sm: { box: 16, border: 2, text: 'text-xs' },
  md: { box: 24, border: 2.5, text: 'text-sm' },
  lg: { box: 40, border: 3, text: 'text-base' },
  xl: { box: 64, border: 4, text: 'text-lg' },
};

/**
 * 加载旋转器组件
 *
 * 金色主题的旋转加载指示器，支持 4 种尺寸与可选文字标签。
 * 可作为内联组件使用，也可通过 `fullscreen` 属性作为全屏加载遮罩。
 *
 * 使用方式：
 * ```tsx
 * <LoadingSpinner size="md" />
 * <LoadingSpinner size="lg" label="正在召集议会..." />
 * <LoadingSpinner fullscreen label="加载中..." />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  label,
  fullscreen = false,
  color,
  className,
  ...props
}: LoadingSpinnerProps) {
  const dims = SIZE_MAP[size];
  const spinnerColor = color ?? 'var(--gold, #c9a84c)';

  const spinner = (
    <div
      className={cn('inline-flex flex-col items-center gap-3', className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? '加载中'}
      {...props}
    >
      <div
        className="animate-spin rounded-full"
        style={{
          width: dims.box,
          height: dims.box,
          borderWidth: dims.border,
          borderStyle: 'solid',
          borderColor: 'rgba(201, 168, 76, 0.2)',
          borderTopColor: spinnerColor,
        }}
      />
      {label && (
        <span className={cn('text-text-soft', dims.text)}>{label}</span>
      )}
      <span className="sr-only">加载中...</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
