import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * LifeVerse LOGO 组件
 *
 * 设计理念：
 * - 图标：圆形轨道 + 中心星核，象征"生命宇宙"——每个生命都是一个独立的宇宙
 * - 文字：Outfit 字体，简洁现代，不使用花体
 * - 配色：金色渐变，深色/浅色主题自适应
 *
 * 尺寸：
 * - sm: 图标 24px + 文字 18px（移动端抽屉、页脚移动端）
 * - md: 图标 28px + 文字 22px（导航栏默认）
 * - lg: 图标 36px + 文字 30px（页脚、登录页）
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { icon: 24, text: 'text-lg' },
  md: { icon: 28, text: 'text-xl' },
  lg: { icon: 36, text: 'text-2xl' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = SIZE_CONFIG[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {/* SVG 图标：生命宇宙 */}
      <svg
        width={config.icon}
        height={config.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 外圈轨道 */}
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="url(#logo-gold-gradient)"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* 中圈轨道 */}
        <circle
          cx="20"
          cy="20"
          r="12"
          stroke="url(#logo-gold-gradient)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        {/* 中心星核 */}
        <circle cx="20" cy="20" r="5" fill="url(#logo-gold-gradient)" />
        {/* 轨道上的小行星 - 右上 */}
        <circle cx="32" cy="12" r="2" fill="url(#logo-gold-gradient)" opacity="0.8" />
        {/* 轨道上的小行星 - 左下 */}
        <circle cx="8" cy="28" r="1.5" fill="url(#logo-gold-gradient)" opacity="0.6" />
        {/* 渐变定义 */}
        <defs>
          <linearGradient
            id="logo-gold-gradient"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--gold)" />
            <stop offset="0.5" stopColor="#e8d68a" />
            <stop offset="1" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
      </svg>

      {/* 文字 LOGO */}
      {showText && (
        <span
          className={cn(
            'font-serif font-semibold tracking-tight text-gradient-gold',
            config.text
          )}
        >
          LifeVerse
        </span>
      )}
    </span>
  );
}

export default Logo;
