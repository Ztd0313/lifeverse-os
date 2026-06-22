'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * 按钮变体样式定义
 *
 * - primary: 金色背景按钮（主要操作）
 * - secondary: 次级按钮（深色背景 + 边框）
 * - ghost: 幽灵按钮（无边框，hover 显示背景）
 * - gold: 金色边框 + 发光效果（仪式感按钮）
 */
const buttonVariants = cva(
  // 基础样式：inline-flex 居中、圆角、过渡、focus 可见、禁用态
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        // 主要按钮：金色背景，使用 CSS 变量适配深色/浅色主题
        primary:
          'btn-primary',
        // 次级按钮：卡片背景 + 边框
        secondary:
          'btn-secondary',
        // 幽灵按钮：透明背景，hover 显示
        ghost:
          'btn-ghost',
        // 仪式感按钮：金色边框 + 发光
        gold:
          'btn-gold',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

/**
 * Button 组件 Props
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * 是否将 props 合并到子元素上（而非渲染 button 标签）。
   * 用于将按钮样式应用到 Link 等元素。
   */
  asChild?: boolean;
}

/**
 * 通用按钮组件
 *
 * 使用 class-variance-authority 管理变体样式。
 * 支持 4 种 variant（primary / secondary / ghost / gold）与 3 种 size（sm / md / lg）。
 * 通过 asChild 可将样式应用到子元素（如 Next.js Link）。
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
