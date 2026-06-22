'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 轮次指示器 Props
 */
interface RoundIndicatorProps {
  /** 当前轮次（1-based） */
  currentRound: number;
  /** 总轮次，默认 3 */
  totalRounds?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 轮次名称映射
 */
const ROUND_NAMES: Record<number, string> = {
  1: '表态',
  2: '质疑',
  3: '共识',
};

/**
 * 轮次指示器组件
 *
 * 显示议会进行中的轮次进度，以圆点 + 文字形式呈现。
 * 当前轮次高亮金色，已完成轮次显示为暗金色，未开始轮次为灰色。
 *
 * @example
 * ```tsx
 * <RoundIndicator currentRound={2} totalRounds={3} />
 * ```
 */
export function RoundIndicator({
  currentRound,
  totalRounds = 3,
  className,
}: RoundIndicatorProps) {
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 select-none',
        className
      )}
      role="progressbar"
      aria-valuenow={currentRound}
      aria-valuemin={1}
      aria-valuemax={totalRounds}
      aria-label={`第 ${currentRound} 轮，共 ${totalRounds} 轮`}
    >
      {rounds.map((round) => {
        const isActive = round === currentRound;
        const isDone = round < currentRound;
        const label = ROUND_NAMES[round] ?? `第${round}轮`;

        return (
          <div key={round} className="flex items-center gap-3">
            {/* 圆点 + 标签 */}
            <motion.div
              className="flex items-center gap-2"
              initial={false}
              animate={{
                opacity: isActive ? 1 : isDone ? 0.7 : 0.4,
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={cn(
                  'relative flex items-center justify-center rounded-full',
                  'h-3 w-3 transition-colors duration-300',
                  isActive
                    ? 'bg-gold'
                    : isDone
                      ? 'bg-gold-dim'
                      : 'bg-border'
                )}
                animate={
                  isActive
                    ? {
                        boxShadow: [
                          '0 0 0px rgba(201, 168, 76, 0)',
                          '0 0 12px rgba(201, 168, 76, 0.6)',
                          '0 0 0px rgba(201, 168, 76, 0)',
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: isActive ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              >
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-gold"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                )}
              </motion.div>

              <span
                className={cn(
                  'text-xs font-medium tracking-wide transition-colors duration-300',
                  isActive
                    ? 'text-gold'
                    : isDone
                      ? 'text-gold-dim'
                      : 'text-text-dim'
                )}
              >
                第{round}轮 · {label}
              </span>
            </motion.div>

            {/* 连接线 */}
            {round < totalRounds && (
              <div className="h-px w-8 bg-border" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RoundIndicator;
