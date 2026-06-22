/**
 * Framer Motion 动画变体库
 *
 * 统一管理项目中所有可复用的动画变体（Variants）。
 * 所有组件应优先使用这些变体，保证视觉一致性。
 *
 * 使用方式：
 * ```tsx
 * import { pageTransition, staggerContainer, cardItem } from '@/lib/motion/variants';
 *
 * <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
 *   <motion.div variants={staggerContainer} initial="initial" animate="animate">
 *     <motion.div variants={cardItem}>卡片内容</motion.div>
 *   </motion.div>
 * </motion.div>
 * ```
 */

import type { Variants } from 'framer-motion';
import { EASE, STAGGER_CHILDREN, STAGGER_SLOW } from './transitions';

// ===== 页面转场 =====

/**
 * 页面转场动画
 *
 * 用于 App Router 页面级 transition（配合 AnimatePresence）。
 * 入场：从下方淡入上移，退场：向上淡出。
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// ===== 卡片入场（stagger）=====

/**
 * Stagger 容器
 *
 * 父级容器使用，子元素会依次入场。
 * 配合 cardItem 使用。
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * 慢速 stagger 容器
 *
 * 用于仪式感入场（如议会成员逐一亮相）。
 */
export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * 卡片子项
 *
 * 配合 staggerContainer 使用，子元素从下方淡入。
 */
export const cardItem: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ===== 淡入 =====

/**
 * 纯淡入
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

/**
 * 从下方淡入
 */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

/**
 * 从上方淡入
 */
export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// ===== 缩放 =====

/**
 * 缩放入场
 *
 * 从 0.9 缩放到 1.0，同时淡入。
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// ===== 仪式入场（特殊动画）=====

/**
 * 仪式感入场
 *
 * 带模糊到清晰的过渡 + 缩放，适用于议会开启、命运报告揭晓等
 * 仪式性场景。
 */
export const ritualEntry: Variants = {
  initial: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(6px)',
    transition: { duration: 0.4, ease: 'easeIn' },
  },
};

// ===== Agent 发言动画 =====

/**
 * Agent 发言脉冲
 *
 * 发言中的 Agent 卡片使用，轻微缩放 + 透明度呼吸。
 */
export const speakingPulse: Variants = {
  idle: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  speaking: {
    scale: [1, 1.03, 1],
    opacity: [1, 0.95, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  thinking: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ===== 冲突震动 =====

/**
 * 冲突震动
 *
 * Agent 之间发生价值冲突时，卡片震动。
 */
export const conflictShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -3, 3, -3, 3, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatDelay: 1.5,
      ease: 'easeInOut',
    },
  },
};

// ===== 打字机光标 =====

/**
 * 打字机光标闪烁
 *
 * 用于 TypingText 组件的光标动画。
 */
export const cursorBlink: Variants = {
  blinking: {
    opacity: [1, 0, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  done: {
    opacity: [1, 0, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ===== 雷达图描边 =====

/**
 * 雷达图描边动画
 *
 * 用于 RadarChart 组件，SVG path 从 0 描到完整。
 * 需配合 pathLength 属性使用。
 */
export const radarDraw: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.2, ease: 'easeInOut' },
      opacity: { duration: 0.3, ease: 'easeOut' },
    },
  },
};

/**
 * 雷达图填充淡入
 *
 * 雷达图填充区域在描边完成后淡入。
 */
export const radarFill: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 0.3,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.8 },
  },
};

// ===== 时间线生长 =====

/**
 * 时间线生长
 *
 * 用于 TimelineView 组件，时间线从左到右生长。
 */
export const timelineGrow: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

/**
 * 时间线节点弹出
 *
 * 时间线上的节点依次弹出。
 */
export const timelineNode: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// ===== 工具函数 =====

/**
 * 创建带自定义 delay 的淡入变体
 *
 * @param delay 延迟时间（秒）
 * @returns fadeInUp 变体，带指定 delay
 */
export function createDelayedFadeInUp(delay: number): Variants {
  return {
    initial: { opacity: 0, y: 24 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut', delay },
    },
  };
}

/**
 * 创建带自定义 delay 的缩放变体
 *
 * @param delay 延迟时间（秒）
 * @returns scaleIn 变体，带指定 delay
 */
export function createDelayedScaleIn(delay: number): Variants {
  return {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut', delay },
    },
  };
}

// Re-export transitions for convenience
export { EASE, STAGGER_CHILDREN, STAGGER_SLOW };
