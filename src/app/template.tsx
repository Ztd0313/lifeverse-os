'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

/**
 * App Router 模板组件
 *
 * Next.js 的 template.tsx 在每次路由切换时都会重新挂载，
 * 配合 AnimatePresence mode="wait" 实现宇宙穿越页面切换效果：
 * - 进入：从轻微缩放(0.98) + 模糊(blur 8px) + 透明度(0) → 清晰(1) + 不透明(1)
 * - 退出：向反方向缩放(1.02) + 模糊 + 淡出
 * - 缓动曲线与 Header 抽屉保持一致：[0.22, 1, 0.36, 1]
 */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
