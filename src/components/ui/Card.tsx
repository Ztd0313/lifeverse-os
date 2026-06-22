'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card 组件 Props
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 是否启用 hover 效果。
   * 启用后，鼠标悬停时边框变为金色并轻微上浮。
   * 默认 true。
   */
  hover?: boolean;
}

/**
 * 通用卡片组件
 *
 * 特性：
 * - 毛玻璃效果（glass）
 * - hover 时边框变金色 + 轻微上浮 + 金色阴影
 * - 圆角与内边距统一
 *
 * 作为容器组件，可包裹任意内容。
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 基础毛玻璃样式
          'glass rounded-[14px] p-6 transition-all duration-300',
          // hover 效果
          hover &&
            'hover:border-gold-dim hover:-translate-y-1 hover:shadow-[0_8px_32px_var(--shadow-gold)]',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export { Card };
export default Card;
