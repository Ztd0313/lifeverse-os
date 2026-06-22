'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

export interface OrbitalIconProps {
  /** 中心展示的图标/内容 */
  children: ReactNode;
  /** 整体尺寸（px），默认 64 */
  size?: number;
  /** 轨道环颜色，默认使用品牌金色 */
  orbitColor?: string;
  /** 外圈轨道旋转一周的时长（秒），默认 20 */
  duration?: number;
}

/**
 * OrbitalIcon — 行星轨道图标
 *
 * 在中心内容外围渲染两层反向旋转的轨道环，外圈轨道上带有一颗
 * 沿轨道运行的小行星点，适用于模块入口、议会成员头像等场景，
 * 营造行星绕行的宇宙感。
 *
 * 使用方式：
 * ```tsx
 * <OrbitalIcon size={80} orbitColor="var(--gold)" duration={20}>
 *   <Sparkles size={24} />
 * </OrbitalIcon>
 * ```
 */
export function OrbitalIcon({
  children,
  size = 64,
  orbitColor = 'var(--gold)',
  duration = 20,
}: OrbitalIconProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 外圈轨道环（顺时针旋转，带行星点） */}
      <motion.div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: orbitColor, opacity: 0.3 }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {/* 轨道上的小行星点 */}
        <div
          className="absolute h-2 w-2 rounded-full"
          style={{
            background: orbitColor,
            top: -4,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </motion.div>

      {/* 内圈轨道环（逆时针旋转） */}
      <motion.div
        className="absolute inset-2 rounded-full border"
        style={{ borderColor: orbitColor, opacity: 0.15 }}
        animate={{ rotate: -360 }}
        transition={{ duration: duration * 1.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default OrbitalIcon;
