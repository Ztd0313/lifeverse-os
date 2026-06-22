'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

/**
 * 光晕颜色配置
 *
 * 每种颜色对应一种情感基调的径向渐变：
 * - gold：暖意重逢（默认）
 * - blue：冷静回忆
 * - purple：神秘梦境
 */
const haloColors = {
  gold: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)',
  blue: 'radial-gradient(circle, rgba(93,160,232,0.3) 0%, transparent 70%)',
  purple: 'radial-gradient(circle, rgba(157,78,221,0.3) 0%, transparent 70%)',
} as const;

export interface ReunionHaloProps {
  /** 光晕包裹的内容 */
  children: ReactNode;
  /** 光晕颜色基调 */
  color?: keyof typeof haloColors;
  /** 光晕渐入延迟（秒），内容会在光晕之后 0.3s 渐入 */
  delay?: number;
}

/**
 * ReunionHalo — 重逢光晕渐入效果
 *
 * 用于重逢对话页面，在内容背后渲染一层径向渐变光晕，
 * 光晕先从中心放大渐入，随后内容从模糊状态清晰浮现，
 * 营造「重逢时刻」的仪式感。
 *
 * 使用方式：
 * ```tsx
 * <ReunionHalo color="gold" delay={0.2}>
 *   <重逢对话内容 />
 * </ReunionHalo>
 * ```
 */
export function ReunionHalo({ children, color = 'gold', delay = 0 }: ReunionHaloProps) {
  return (
    <div className="relative">
      {/* 背景光晕 */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ background: haloColors[color] }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 1.5, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* 前景内容 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default ReunionHalo;
