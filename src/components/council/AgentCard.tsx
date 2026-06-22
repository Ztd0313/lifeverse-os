'use client';

import { memo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { Persona, AgentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { RadarChart } from '@/components/charts/RadarChart';
import { useTranslation } from '@/lib/i18n';

/**
 * Agent 卡片组件 Props
 */
export interface AgentCardProps {
  /** Agent 人格信息 */
  persona: Persona;
  /** 当前状态，默认 idle */
  status?: AgentStatus;
  /** 点击回调 */
  onClick?: () => void;
  /** 卡片尺寸，默认 md */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示雷达图，默认 false */
  showRadar?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 尺寸配置
 */
const SIZE_CONFIG = {
  sm: {
    card: 'w-full max-w-[160px]',
    padding: 'p-3',
    avatar: 'text-4xl',
    name: 'text-sm',
    philosophy: 'text-[10px]',
    radarSize: 100,
    gap: 'gap-1.5',
  },
  md: {
    card: 'w-full max-w-[208px]',
    padding: 'p-4',
    avatar: 'text-5xl',
    name: 'text-base',
    philosophy: 'text-xs',
    radarSize: 140,
    gap: 'gap-2',
  },
  lg: {
    card: 'w-full max-w-[256px]',
    padding: 'p-5',
    avatar: 'text-6xl',
    name: 'text-lg',
    philosophy: 'text-sm',
    radarSize: 180,
    gap: 'gap-2.5',
  },
} as const;

/**
 * 状态样式映射
 */
function getStatusStyles(status: AgentStatus): {
  border: string;
  glow?: CSSProperties;
  animation?: object;
} {
  switch (status) {
    case 'speaking':
      return {
        border: 'border-gold',
        glow: {
          boxShadow:
            '0 0 24px rgba(201, 168, 76, 0.4), 0 0 48px rgba(201, 168, 76, 0.15)',
        },
      };
    case 'thinking':
      return {
        border: 'border-blue/40',
        glow: {
          boxShadow: '0 0 16px rgba(93, 160, 232, 0.2)',
        },
      };
    case 'conflict':
      return {
        border: 'border-red/60',
        glow: {
          boxShadow: '0 0 20px rgba(232, 93, 93, 0.3)',
        },
      };
    case 'idle':
    default:
      return {
        border: 'border-border',
      };
  }
}

/**
 * 思考中三点动画
 */
function ThinkingDots() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1" aria-label={t('council.agentCard.thinking').replace('...', '')}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-blue"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * 发言中声波动画
 */
function SpeakingWaves() {
  return (
    <div className="flex items-end gap-0.5 h-3" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-0.5 rounded-full bg-gold"
          animate={{
            height: [4, 12, 4],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Agent 人格卡片组件
 *
 * 展示单个 Agent 的人格信息，包括头像 emoji、名称、哲学信条、
 * 关系标签和可选的价值雷达图。支持 4 种状态视觉表现：
 * - idle: 正常显示
 * - thinking: 显示「思考中...」+ 脉冲动画
 * - speaking: 金色边框 + 发光效果 + 声波动画
 * - conflict: 红色边框 + 震动动画
 *
 * @example
 * ```tsx
 * <AgentCard
 *   persona={agent}
 *   status="speaking"
 *   size="md"
 *   showRadar={true}
 *   onClick={() => console.log('clicked')}
 * />
 * ```
 */
function AgentCardComponent({
  persona,
  status = 'idle',
  onClick,
  size = 'md',
  showRadar = false,
  className,
}: AgentCardProps) {
  const { t } = useTranslation();
  const config = SIZE_CONFIG[size];
  const statusStyles = getStatusStyles(status);
  const isInteractive = !!onClick;

  // 震动动画（conflict 状态）
  const conflictAnimation = {
    x: [0, -2, 2, -2, 2, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatDelay: 1.5,
      ease: 'easeInOut' as const,
    },
  };

  // 脉冲动画（thinking 状态）
  const thinkingAnimation = {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-xl border bg-bg-card/80 backdrop-blur-sm',
        'transition-colors duration-300 cursor-default',
        config.card,
        config.padding,
        statusStyles.border,
        isInteractive && 'cursor-pointer',
        className
      )}
      style={statusStyles.glow}
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        ...(status === 'conflict' ? conflictAnimation : {}),
        ...(status === 'thinking' ? thinkingAnimation : {}),
      }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
      whileHover={
        isInteractive
          ? {
              y: -4,
              borderColor: 'rgba(201, 168, 76, 0.6)',
              boxShadow: '0 8px 32px rgba(201, 168, 76, 0.12)',
            }
          : {}
      }
      whileTap={isInteractive ? { scale: 0.98 } : {}}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={t('council.agentCard.ariaLabel', { name: persona.name, philosophy: persona.philosophy })}
    >
      {/* 头像区域 */}
      <div className={cn('flex flex-col items-center', config.gap)}>
        <div className="relative">
          {/* idle 状态呼吸光晕 */}
          {status === 'idle' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: '0 0 20px rgba(201, 168, 76, 0.15)',
              }}
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* speaking 状态脉冲光环 */}
          {status === 'speaking' && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-gold"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}

          {/* conflict 状态红色光环 */}
          {status === 'conflict' && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red"
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* 头像 emoji */}
          <motion.span
            className={cn('relative block leading-none', config.avatar)}
            animate={
              status === 'speaking'
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={{
              duration: 2,
              repeat: status === 'speaking' ? Infinity : 0,
              ease: 'easeInOut',
            }}
          >
            {persona.avatar}
          </motion.span>
        </div>

        {/* 名称 */}
        <div className="flex flex-col items-center gap-0.5">
          <h3
            className={cn(
              'font-semibold text-text text-center',
              config.name
            )}
          >
            {persona.name}
          </h3>

          {/* 关系标签 */}
          {persona.relationLabel && (
            <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] text-gold">
              {persona.relationLabel}
            </span>
          )}
        </div>

        {/* 哲学信条 */}
        <p
          className={cn(
            'text-text-soft text-center leading-relaxed',
            config.philosophy
          )}
        >
          {persona.philosophy}
        </p>

        {/* 状态指示器 */}
        {status === 'thinking' && (
          <div className="flex items-center gap-1.5">
            <ThinkingDots />
            <span className="text-[10px] text-blue">{t('council.agentCard.thinking')}</span>
          </div>
        )}

        {status === 'speaking' && (
          <div className="flex items-center gap-1.5">
            <SpeakingWaves />
            <span className="text-[10px] text-gold">{t('council.agentCard.speaking')}</span>
          </div>
        )}

        {status === 'conflict' && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-red">{t('council.agentCard.conflict')}</span>
          </div>
        )}

        {/* 雷达图 */}
        {showRadar && (
          <div className="mt-1">
            <RadarChart
              data={persona.radar}
              size={config.radarSize}
              showLabels={size !== 'sm'}
              showGrid={true}
              animated={true}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 使用 React.memo 优化性能，仅在 persona 或 status 变化时重渲染
 */
export const AgentCard = memo(AgentCardComponent);

export default AgentCard;
