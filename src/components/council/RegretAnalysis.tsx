'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Sunrise, Heart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 后悔类型
 */
export type RegretType =
  | 'action' // 行动后悔
  | 'inaction' // 不行动后悔
  | 'speed' // 速度后悔
  | 'direction' // 方向后悔
  | 'relationship'; // 关系后悔

/**
 * 后悔类型标签配置
 */
interface RegretTypeConfig {
  type: RegretType;
  label: string;
  description: string;
  color: string;
}

const REGRET_TYPE_CONFIGS: RegretTypeConfig[] = [
  {
    type: 'action',
    label: '行动后悔',
    description: '做了之后觉得不该做',
    color: '#e8a05d',
  },
  {
    type: 'inaction',
    label: '不行动后悔',
    description: '没做之后觉得该做',
    color: '#5da0e8',
  },
  {
    type: 'speed',
    label: '速度后悔',
    description: '太快或太慢的节奏',
    color: '#b8a0c8',
  },
  {
    type: 'direction',
    label: '方向后悔',
    description: '走错了路而非走慢了',
    color: '#e85d5d',
  },
  {
    type: 'relationship',
    label: '关系后悔',
    description: '忽略了重要的人',
    color: '#5de8a0',
  },
];

/**
 * 单个选择的后悔数据
 */
export interface RegretOption {
  /** 选项标签（如 "接受" / "拒绝"） */
  label: string;
  /** 后悔概率 (0-100) */
  regretProb: number;
  /** 主要后悔类型 */
  primaryRegret: RegretType;
  /** 简短说明 */
  note: string;
}

/**
 * RegretAnalysis 组件 Props
 */
export interface RegretAnalysisProps {
  /** 80 岁自己的回望文字（打字机效果展示） */
  reflection: string;
  /** 两个选项的后悔数据对比 */
  options: [RegretOption, RegretOption];
  /** 自定义类名 */
  className?: string;
}

// ===== 动画变体 =====

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ===== 子组件：打字机文字 =====

interface ReflectionTypingProps {
  text: string;
  onDone?: () => void;
}

function ReflectionTyping({ text, onDone }: ReflectionTypingProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayText('');
    setIsDone(false);

    if (!text) {
      setIsDone(true);
      onDoneRef.current?.();
      return;
    }

    const PAUSE_CHARS = ['，', '。', '！', '？', '；', '：', ',', '.', '!', '?'];

    const typeNext = () => {
      if (indexRef.current >= text.length) {
        setIsDone(true);
        onDoneRef.current?.();
        return;
      }
      const char = text[indexRef.current];
      setDisplayText(text.substring(0, indexRef.current + 1));
      indexRef.current += 1;
      const pause = PAUSE_CHARS.includes(char) ? 180 : 0;
      timerRef.current = setTimeout(typeNext, 55 + pause);
    };

    timerRef.current = setTimeout(typeNext, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  return (
    <p className="font-serif text-base leading-relaxed text-text-soft sm:text-lg">
      <span aria-hidden="true">{displayText}</span>
      {!isDone && (
        <span
          className="ml-0.5 inline-block animate-pulse font-bold text-gold"
          aria-hidden="true"
        >
          ▊
        </span>
      )}
    </p>
  );
}

// ===== 子组件：后悔概率对比条 =====

interface RegretBarProps {
  option: RegretOption;
  delay: number;
}

function RegretBar({ option, delay }: RegretBarProps) {
  const regretConfig = REGRET_TYPE_CONFIGS.find(
    (c) => c.type === option.primaryRegret
  );
  const barColor = regretConfig?.color ?? '#c9a84c';
  // 后悔概率越高，颜色越偏向警示色
  const isHigh = option.regretProb >= 60;

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-lg border border-border bg-bg-card/60 p-4"
    >
      {/* 选项标题 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{
              background: `${barColor}20`,
              color: barColor,
            }}
          >
            {option.label}
          </span>
          {regretConfig && (
            <span className="text-[10px] text-text-dim">
              {regretConfig.label}
            </span>
          )}
        </div>
        <span
          className="font-serif text-2xl font-bold tabular-nums"
          style={{ color: isHigh ? '#e85d5d' : barColor }}
        >
          {option.regretProb}
          <span className="text-xs">%</span>
        </span>
      </div>

      {/* 进度条 */}
      <div className="relative h-2 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isHigh
              ? 'linear-gradient(90deg, #e8a05d 0%, #e85d5d 100%)'
              : `linear-gradient(90deg, ${barColor}80 0%, ${barColor} 100%)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${option.regretProb}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay }}
        />
      </div>

      {/* 说明 */}
      <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
        {option.note}
      </p>
    </motion.div>
  );
}

// ===== 主组件 =====

/**
 * 后悔分析组件
 *
 * 展示 80 岁自己的回望文字（打字机效果），以及两个选择的后悔概率对比。
 * 同时列出 5 种后悔类型标签，便于用户识别自己最可能面临的后悔类型。
 *
 * 视觉风格温柔、克制，避免过度压抑。
 *
 * @example
 * ```tsx
 * <RegretAnalysis
 *   reflection="如果当年我接受了那份海外工作..."
 *   options={[
 *     { label: '接受', regretProb: 32, primaryRegret: 'speed', note: '可能错过家人重要时刻' },
 *     { label: '拒绝', regretProb: 68, primaryRegret: 'inaction', note: '可能一直遗憾未曾出去看看' },
 *   ]}
 * />
 * ```
 */
export function RegretAnalysis({
  reflection,
  options,
  className,
}: RegretAnalysisProps) {
  const [reflectionDone, setReflectionDone] = useState(false);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('w-full', className)}
    >
      {/* 标题 */}
      <motion.div variants={itemVariants} className="mb-5 flex items-center gap-2">
        <Sunrise className="h-5 w-5 text-gold" />
        <h3 className="font-serif text-xl text-text">
          <span className="text-gradient-gold">80 岁的回望</span>
        </h3>
      </motion.div>

      {/* 回望文字（打字机效果） */}
      <motion.div
        variants={itemVariants}
        className="relative mb-6 overflow-hidden rounded-xl border border-gold-dim/40 bg-gold-soft/10 p-5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gold-soft/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">🌅</span>
            <span className="text-xs text-text-dim">80 岁的自己说：</span>
          </div>
          <ReflectionTyping text={reflection} onDone={() => setReflectionDone(true)} />
        </div>
      </motion.div>

      {/* 后悔概率对比 */}
      <motion.div variants={itemVariants} className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-text-dim" />
          <h4 className="text-sm font-semibold text-text">两个选择的后悔概率</h4>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RegretBar option={options[0]} delay={0.3} />
          <RegretBar option={options[1]} delay={0.5} />
        </div>
      </motion.div>

      {/* 后悔类型标签 */}
      <motion.div variants={itemVariants}>
        <div className="mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-text-dim" />
          <h4 className="text-sm font-semibold text-text">可能的后悔类型</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {REGRET_TYPE_CONFIGS.map((config) => {
            // 高亮两个选项的主要后悔类型
            const isHighlighted = options.some(
              (o) => o.primaryRegret === config.type
            );
            return (
              <motion.div
                key={config.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: reflectionDone ? 1 : 0.5,
                  scale: 1,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'rounded-lg border px-3 py-2 transition-all',
                  isHighlighted
                    ? 'bg-bg-card'
                    : 'border-border bg-bg-card/40 opacity-60'
                )}
                style={
                  isHighlighted
                    ? { borderColor: `${config.color}66` }
                    : undefined
                }
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: config.color }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: isHighlighted ? config.color : '#9a9a9a' }}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-text-dim">
                  {config.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 温柔的结语 */}
      <motion.p
        variants={itemVariants}
        className="mt-6 text-center text-sm text-text-dim"
      >
        &ldquo;后悔不是失败，它是 80 岁的你给现在的你最温柔的提醒。&rdquo;
      </motion.p>
    </motion.div>
  );
}

export default RegretAnalysis;
