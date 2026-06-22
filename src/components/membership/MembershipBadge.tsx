'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { type MembershipTier, TIER_CONFIGS } from '@/types/membership';

/**
 * 会员标识 Badge 组件
 *
 * 根据会员等级显示不同的标识：
 * - free: 灰色"免费用户"
 * - basic: 金色"基础会员"
 * - pro: 紫金色"Pro 会员"
 */

interface MembershipBadgeProps {
  /** 会员等级 */
  tier: MembershipTier;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示英文 */
  showEn?: boolean;
  /** 自定义类名 */
  className?: string;
}

const SIZE_CONFIG = {
  sm: { text: 'text-[10px]', icon: 'text-xs', px: 'px-2', py: 'py-0.5', gap: 'gap-1' },
  md: { text: 'text-xs', icon: 'text-sm', px: 'px-2.5', py: 'py-1', gap: 'gap-1.5' },
  lg: { text: 'text-sm', icon: 'text-base', px: 'px-3', py: 'py-1.5', gap: 'gap-2' },
};

export function MembershipBadge({
  tier,
  size = 'md',
  showIcon = true,
  showEn = false,
  className,
}: MembershipBadgeProps) {
  const config = TIER_CONFIGS[tier];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border transition-all',
        sizeConfig.text,
        sizeConfig.px,
        sizeConfig.py,
        sizeConfig.gap,
        className
      )}
      style={{
        background: tier === 'free' ? 'var(--bg-card)' : `${config.color}15`,
        borderColor: tier === 'free' ? 'var(--border)' : `${config.color}40`,
        color: config.color,
      }}
    >
      {showIcon && <span className={sizeConfig.icon}>{config.icon}</span>}
      <span>{config.name}</span>
      {showEn && (
        <span className="opacity-60">{config.nameEn}</span>
      )}
    </span>
  );
}

export default MembershipBadge;
