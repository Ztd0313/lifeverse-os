/**
 * Framer Motion 过渡配置
 *
 * 统一管理项目中所有动画的 easing、spring 和 stagger 配置，
 * 保证视觉一致性。所有组件应优先使用这些常量，而非内联硬编码。
 */

import type { Transition } from 'framer-motion';

/**
 * Material Design 标准缓动曲线
 *
 * cubic-bezier(0.4, 0, 0.2, 1)
 * 适用于大多数 UI 过渡：入场、退场、状态切换。
 */
export const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * 标准弹簧过渡
 *
 * stiffness: 300, damping: 30
 * 适用于卡片悬停、按钮点击、小幅位移。
 */
export const SPRING: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * 慢速弹簧过渡
 *
 * stiffness: 100, damping: 20
 * 适用于仪式感入场、大型卡片、页面级元素。
 */
export const SLOW_SPRING: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
};

/**
 * 快速弹性过渡（更活泼）
 *
 * 适用于微交互、图标跳动、状态切换反馈。
 */
export const BOUNCY_SPRING: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
};

/**
 * 标准 stagger 配置
 *
 * staggerChildren: 0.05s
 * 适用于列表、卡片网格的依次入场。
 */
export const STAGGER_CHILDREN = {
  staggerChildren: 0.05,
} as const;

/**
 * 慢速 stagger 配置
 *
 * staggerChildren: 0.1s
 * 适用于仪式感入场、议会成员逐一亮相。
 */
export const STAGGER_SLOW = {
  staggerChildren: 0.1,
} as const;

/**
 * 快速 stagger 配置
 *
 * staggerChildren: 0.02s
 * 适用于密集列表、快速展开。
 */
export const STAGGER_FAST = {
  staggerChildren: 0.02,
} as const;

/**
 * 常用 duration 配置（秒）
 */
export const DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.4,
  ritual: 0.8,
} as const;

/**
 * 常用 delay 配置（秒）
 */
export const DELAY = {
  none: 0,
  short: 0.1,
  medium: 0.3,
  long: 0.5,
} as const;
