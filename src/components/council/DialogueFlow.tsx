'use client';

import {
  useMemo,
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
} from 'framer-motion';
import type { Variants, TargetAndTransition } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  fadeInUp,
  scaleIn,
  consensusConverge,
  galaxyConvergence,
} from '@/lib/motion/variants';
import { useIsMobile } from '@/hooks/useMediaQuery';

// ===== 类型定义 =====

/**
 * 情感类型
 */
export type Emotion = 'neutral' | 'positive' | 'negative' | 'passionate' | 'contemplative';

/**
 * 对话消息
 */
export interface DialogueMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerAvatar: string;
  content: string;
  /** 情感类型 */
  emotion?: Emotion;
  /** 立场值 -100(反对) ~ 100(支持) */
  stance?: number;
  /** 时间戳 */
  timestamp: number;
}

/**
 * DialogueFlow 组件 Props
 */
export interface DialogueFlowProps {
  /** 对话消息列表 */
  messages: DialogueMessage[];
  /** 当前活跃发言者 ID */
  activeSpeakerId?: string;
  /** 是否显示情感色彩 */
  showEmotionColors?: boolean;
  /** 布局模式 */
  mode?: 'stream' | 'spectrum' | 'consensus';
  /** 自定义类名 */
  className?: string;
}

// ===== 情感色彩映射 =====

/**
 * 情感 → 边框 Tailwind 类名
 */
const EMOTION_BORDER: Record<Emotion, string> = {
  positive: 'border-green',
  negative: 'border-red',
  passionate: 'border-orange',
  contemplative: 'border-blue',
  neutral: 'border-border',
};

/**
 * 情感 → 边框 hex 颜色（用于 SVG / 阴影）
 */
const EMOTION_COLOR: Record<Emotion, string> = {
  positive: '#5de8a0',
  negative: '#e85d5d',
  passionate: '#e8a05d',
  contemplative: '#5da0e8',
  neutral: '#1e2235',
};

/**
 * 情感 → 中文标签
 */
const EMOTION_LABEL: Record<Emotion, string> = {
  positive: '积极',
  negative: '消极',
  passionate: '激昂',
  contemplative: '沉思',
  neutral: '中立',
};

/**
 * 获取情感的边框类名
 */
function getEmotionBorder(emotion: Emotion | undefined, show: boolean): string {
  if (!show || !emotion) return 'border-border';
  return EMOTION_BORDER[emotion] ?? 'border-border';
}

/**
 * 获取情感的 hex 颜色
 */
function getEmotionColor(emotion: Emotion | undefined): string {
  if (!emotion) return EMOTION_COLOR.neutral;
  return EMOTION_COLOR[emotion] ?? EMOTION_COLOR.neutral;
}

// ===== 通用工具 =====

/**
 * 格式化时间戳为 HH:MM
 */
function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * 单个发言者的聚合统计
 */
interface SpeakerStats {
  speakerId: string;
  speakerName: string;
  speakerAvatar: string;
  /** 发言数量 */
  count: number;
  /** 最新立场值 */
  latestStance: number;
  /** 平均立场值 */
  avgStance: number;
  /** 最新情感 */
  latestEmotion: Emotion;
  /** 最后发言时间戳 */
  lastTimestamp: number;
}

/**
 * 按发言者聚合统计
 */
function aggregateSpeakers(messages: DialogueMessage[]): SpeakerStats[] {
  const map = new Map<string, SpeakerStats>();
  for (const msg of messages) {
    const existing = map.get(msg.speakerId);
    const stance = msg.stance ?? 0;
    const emotion: Emotion = msg.emotion ?? 'neutral';
    if (existing) {
      existing.count += 1;
      existing.avgStance += stance;
      if (msg.timestamp >= existing.lastTimestamp) {
        existing.lastTimestamp = msg.timestamp;
        existing.latestStance = stance;
        existing.latestEmotion = emotion;
      }
    } else {
      map.set(msg.speakerId, {
        speakerId: msg.speakerId,
        speakerName: msg.speakerName,
        speakerAvatar: msg.speakerAvatar,
        count: 1,
        latestStance: stance,
        avgStance: stance,
        latestEmotion: emotion,
        lastTimestamp: msg.timestamp,
      });
    }
  }
  // 计算平均立场
  const list = Array.from(map.values());
  for (const s of list) {
    s.avgStance = s.avgStance / s.count;
  }
  return list;
}

/**
 * 根据发言者列表计算共识度（0-100）
 *
 * 共识度 = 100 - 立场标准差。
 * 所有人立场一致时 stdDev=0 → 共识 100；
 * 立场分散在全范围时 stdDev 较大 → 共识较低。
 */
function computeConsensus(speakers: SpeakerStats[]): number {
  if (speakers.length === 0) return 0;
  if (speakers.length === 1) return 100;
  const stances = speakers.map((s) => s.avgStance);
  const avg = stances.reduce((a, b) => a + b, 0) / stances.length;
  const variance =
    stances.reduce((acc, v) => acc + (v - avg) ** 2, 0) / stances.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, Math.min(100, Math.round(100 - stdDev)));
}

// ===================================================================
// mode='stream' — 流式展示
// ===================================================================

/**
 * 流式消息气泡 Props
 */
interface StreamBubbleProps {
  message: DialogueMessage;
  isActive: boolean;
  showEmotionColors: boolean;
  index: number;
}

/**
 * 流式消息入场变体
 *
 * 组合 `fadeInUp`（从下方淡入）+ `scaleIn`（缩放入场），
 * 实现新消息入场时的「上浮 + 放大」复合动效。
 */
const streamEntry: Variants = {
  initial: {
    ...(fadeInUp.initial as TargetAndTransition),
    ...(scaleIn.initial as TargetAndTransition),
  },
  animate: {
    ...(fadeInUp.animate as TargetAndTransition),
    ...(scaleIn.animate as TargetAndTransition),
  },
};

/**
 * 单条流式消息气泡
 *
 * 新消息入场使用 fadeInUp + scaleIn 组合（streamEntry 变体），
 * 通过 whileInView 实现滚动触发。
 */
function StreamBubble({
  message,
  isActive,
  showEmotionColors,
  index,
}: StreamBubbleProps) {
  const emotion = message.emotion ?? 'neutral';
  const borderClass = getEmotionBorder(message.emotion, showEmotionColors);
  const emotionColor = getEmotionColor(message.emotion);

  return (
    <motion.div
      layout
      variants={streamEntry}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-40px' }}
      className={cn(
        'relative flex max-w-[85%] flex-col gap-1 rounded-2xl border bg-bg-card/70 px-3.5 py-2.5 backdrop-blur-sm sm:max-w-[70%] md:max-w-[60%]',
        borderClass,
        isActive && 'border-gold'
      )}
      style={
        isActive
          ? ({
              boxShadow:
                '0 0 0 1px var(--gold), 0 0 24px rgba(201, 168, 76, 0.35)',
            } as CSSProperties)
          : showEmotionColors && message.emotion
            ? ({ boxShadow: `0 0 16px ${emotionColor}25` } as CSSProperties)
            : undefined
      }
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.03, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* 当前发言者脉冲光环 */}
      {isActive && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-2xl border border-gold"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.04 }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* 头部：头像 + 名称 + 情感标签 + 时间 */}
      <div className="flex items-center gap-2">
        <span className="text-base leading-none sm:text-lg">
          {message.speakerAvatar}
        </span>
        <span className="text-xs font-medium text-text">
          {message.speakerName}
        </span>
        {showEmotionColors && message.emotion && message.emotion !== 'neutral' && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              color: emotionColor,
              backgroundColor: `${emotionColor}1a`,
            }}
          >
            {EMOTION_LABEL[emotion]}
          </span>
        )}
        <span className="ml-auto text-[10px] text-text-dim tabular-nums">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* 内容 */}
      <p className="text-sm leading-relaxed text-text-soft whitespace-pre-wrap break-words">
        {message.content}
      </p>

      {/* 立场指示（如有） */}
      {typeof message.stance === 'number' && (
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[10px] text-text-dim">立场</span>
          <div className="relative h-1 w-16 overflow-hidden rounded-full bg-bg-soft sm:w-24">
            <div
              className="absolute top-1/2 h-full -translate-y-1/2 rounded-full"
              style={{
                left: '50%',
                width: `${Math.abs(message.stance) / 2}%`,
                backgroundColor:
                  message.stance >= 0 ? EMOTION_COLOR.positive : EMOTION_COLOR.negative,
              }}
            />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-text-dim/40" />
          </div>
          <span
            className="text-[10px] tabular-nums"
            style={{
              color:
                message.stance >= 0 ? EMOTION_COLOR.positive : EMOTION_COLOR.negative,
            }}
          >
            {message.stance > 0 ? '+' : ''}
            {message.stance}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * 流式展示模式
 *
 * 消息从左到右流动展示，每条消息是一个气泡，宽度根据内容自适应。
 */
function StreamMode({
  messages,
  activeSpeakerId,
  showEmotionColors,
}: {
  messages: DialogueMessage[];
  activeSpeakerId?: string;
  showEmotionColors: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="text-xs text-text-dim">等待议会发言…</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex max-h-[480px] flex-col gap-2.5 overflow-y-auto rounded-xl border border-border bg-bg/40 p-3 sm:p-4"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {messages.map((msg, index) => (
          <StreamBubble
            key={msg.id}
            message={msg}
            isActive={msg.speakerId === activeSpeakerId}
            showEmotionColors={showEmotionColors}
            index={index}
          />
        ))}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}

// ===================================================================
// mode='spectrum' — 分歧光谱
// ===================================================================

/**
 * 分歧光谱模式
 *
 * Agent 头像按立场值（-100~100）水平排列。
 * 左侧反对（红），右侧支持（绿），中间中立。
 * 背景为红→橙→金→绿渐变色带。
 */
function SpectrumMode({
  messages,
  activeSpeakerId,
  showEmotionColors,
}: {
  messages: DialogueMessage[];
  activeSpeakerId?: string;
  showEmotionColors: boolean;
}) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-60px' });

  const speakers = useMemo(() => aggregateSpeakers(messages), [messages]);

  // 头像尺寸根据发言数量缩放
  const maxCount = Math.max(1, ...speakers.map((s) => s.count));
  const baseAvatarSize = isMobile ? 36 : 48;
  const maxAvatarSize = isMobile ? 56 : 72;

  function getAvatarSize(count: number): number {
    const ratio = count / maxCount;
    return Math.round(baseAvatarSize + (maxAvatarSize - baseAvatarSize) * ratio);
  }

  // 立场值 → 水平百分比位置（-100 → 0%，0 → 50%，100 → 100%）
  function stanceToPercent(stance: number): number {
    return ((stance + 100) / 200) * 100;
  }

  if (speakers.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="text-xs text-text-dim">等待议会发言…</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-border bg-bg/40 p-4 sm:p-6"
    >
      {/* 标签：反对 / 中立 / 支持 */}
      <div className="mb-3 flex items-center justify-between text-[10px] font-medium sm:text-xs">
        <span className="text-red">◀ 反对</span>
        <span className="text-text-dim">中立</span>
        <span className="text-green">支持 ▶</span>
      </div>

      {/* 渐变色带背景 */}
      <div
        className="relative h-32 rounded-lg sm:h-40"
        style={{
          background:
            'linear-gradient(90deg, rgba(232,93,93,0.25) 0%, rgba(232,160,93,0.18) 35%, rgba(201,168,76,0.18) 50%, rgba(232,160,93,0.18) 65%, rgba(93,232,160,0.25) 100%)',
        }}
      >
        {/* 中线 */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-text-dim/30" />

        {/* SVG 连接线层 */}
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          {speakers.map((speaker) => {
            const x = stanceToPercent(speaker.avgStance);
            return (
              <line
                key={`line-${speaker.speakerId}`}
                x1="50%"
                y1="100%"
                x2={`${x}%`}
                y2="50%"
                stroke={getEmotionColor(speaker.latestEmotion)}
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.4}
              />
            );
          })}
        </svg>

        {/* 头像层 */}
        {speakers.map((speaker, index) => {
          const x = stanceToPercent(speaker.avgStance);
          const size = getAvatarSize(speaker.count);
          const isActive = speaker.speakerId === activeSpeakerId;
          const emotionColor = getEmotionColor(speaker.latestEmotion);

          return (
            <motion.div
              key={speaker.speakerId}
              className="absolute"
              style={{ top: '50%', left: `${x}%` }}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={{
                opacity: { duration: 0.4, delay: index * 0.08 },
                layout: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              }}
            >
              {/* 居中容器（纯 div，避免与 motion 的 transform 冲突） */}
              <div style={{ transform: 'translate(-50%, -50%)' }}>
                {/* consensusConverge 入场效果（内层） */}
                <motion.div
                  variants={consensusConverge}
                  custom={index}
                  initial="initial"
                  animate={inView ? 'animate' : 'initial'}
                >
                  <div className="flex flex-col items-center gap-1">
                    {/* 头像 */}
                    <motion.div
                      className="relative flex items-center justify-center rounded-full border-2 bg-bg-card/90 backdrop-blur-sm"
                      style={{
                        width: size,
                        height: size,
                        borderColor: isActive
                          ? 'var(--gold)'
                          : showEmotionColors
                            ? emotionColor
                            : 'var(--border)',
                        boxShadow: isActive
                          ? '0 0 20px rgba(201,168,76,0.5)'
                          : `0 0 12px ${emotionColor}40`,
                      }}
                      animate={
                        isActive
                          ? { scale: [1, 1.08, 1] }
                          : { scale: 1 }
                      }
                      transition={{
                        duration: 1.8,
                        repeat: isActive ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                    >
                      <span
                        className="leading-none"
                        style={{ fontSize: size * 0.5 }}
                      >
                        {speaker.speakerAvatar}
                      </span>

                      {/* 发言数量徽标 */}
                      <span
                        className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-bg"
                        style={{ fontSize: Math.max(8, size * 0.18) }}
                      >
                        {speaker.count}
                      </span>
                    </motion.div>

                    {/* 名称 */}
                    <span
                      className="max-w-[64px] truncate text-center text-text-soft sm:max-w-[80px]"
                      style={{ fontSize: isMobile ? 9 : 11 }}
                    >
                      {speaker.speakerName}
                    </span>

                    {/* 立场值 */}
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-medium tabular-nums sm:text-[10px]"
                      style={{
                        color: emotionColor,
                        backgroundColor: `${emotionColor}1a`,
                      }}
                    >
                      {speaker.avgStance > 0 ? '+' : ''}
                      {Math.round(speaker.avgStance)}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 底部刻度 */}
      <div className="mt-2 flex items-center justify-between text-[9px] text-text-dim tabular-nums sm:text-[10px]">
        {[-100, -50, 0, 50, 100].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
    </div>
  );
}

// ===================================================================
// mode='consensus' — 共识聚拢
// ===================================================================

/**
 * 共识聚拢模式
 *
 * 所有 Agent 头像从屏幕边缘向中心聚拢，随着共识增加越来越靠近中心。
 * 中心有发光核心圆（金色径向渐变），头像到达中心时触发汇聚动画。
 */
function ConsensusMode({
  messages,
  activeSpeakerId,
  showEmotionColors,
}: {
  messages: DialogueMessage[];
  activeSpeakerId?: string;
  showEmotionColors: boolean;
}) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-60px' });

  const speakers = useMemo(() => aggregateSpeakers(messages), [messages]);
  const consensus = useMemo(() => computeConsensus(speakers), [speakers]);

  // 容器尺寸
  const containerSize = isMobile ? 280 : 360;
  const center = containerSize / 2;

  // 最大半径（头像起始/最远位置）
  const maxRadius = containerSize / 2 - (isMobile ? 28 : 36);
  // 当前半径：共识越高，半径越小（越聚拢）
  // consensus=0 → radius=maxRadius, consensus=100 → radius=minRadius
  const minRadius = isMobile ? 24 : 32;
  const currentRadius =
    maxRadius - (maxRadius - minRadius) * (consensus / 100);

  // 头像尺寸
  const baseAvatarSize = isMobile ? 32 : 44;

  // 计算每个发言者的圆周位置
  const positions = useMemo(() => {
    const total = speakers.length;
    return speakers.map((speaker, index) => {
      // 从顶部 (-90°) 开始顺时针均匀分布
      const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2;
      return {
        ...speaker,
        x: center + Math.cos(angle) * currentRadius,
        y: center + Math.sin(angle) * currentRadius,
        angle,
      };
    });
  }, [speakers, center, currentRadius]);

  if (speakers.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="text-xs text-text-dim">等待议会发言…</span>
      </div>
    );
  }

  // 核心圆尺寸
  const coreSize = isMobile ? 48 : 64;

  return (
    <div
      ref={containerRef}
      className="relative flex w-full flex-col items-center rounded-xl border border-border bg-bg/40 p-4 sm:p-6"
    >
      {/* 共识度标签 */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-text-soft">共识度</span>
        <motion.span
          key={consensus}
          className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-bold text-gold tabular-nums"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {consensus}%
        </motion.span>
      </div>

      {/* 聚拢可视化区域 */}
      <div
        className="relative"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* SVG 连线层（从各头像指向中心） */}
        <svg
          className="absolute inset-0"
          width={containerSize}
          height={containerSize}
          viewBox={`0 0 ${containerSize} ${containerSize}`}
        >
          {positions.map((p) => {
            const isActive = p.speakerId === activeSpeakerId;
            const emotionColor = getEmotionColor(p.latestEmotion);
            // 透明度随距离递减（距离越近越亮）
            const distance = currentRadius;
            const opacity = Math.max(0.15, 1 - distance / maxRadius) * 0.7;
            return (
              <motion.line
                key={`line-${p.speakerId}`}
                x1={p.x}
                y1={p.y}
                x2={center}
                y2={center}
                stroke={isActive ? 'var(--gold)' : emotionColor}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray="4,3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: inView ? 1 : 0,
                  opacity: inView ? opacity : 0,
                }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            );
          })}
        </svg>

        {/* 中心发光核心圆（金色径向渐变） */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: coreSize,
            height: coreSize,
            background:
              'radial-gradient(circle, rgba(255,215,0,0.9) 0%, rgba(201,168,76,0.6) 40%, rgba(201,168,76,0) 70%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            inView
              ? {
                  scale: [1, 1.15, 1],
                  opacity: 1,
                }
              : { scale: 0, opacity: 0 }
          }
          transition={{
            scale: {
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            opacity: { duration: 0.6 },
          }}
        >
          {/* 核心内圆 */}
          <div
            className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/60 bg-bg-card/80 backdrop-blur-sm"
            style={{ width: coreSize * 0.5, height: coreSize * 0.5 }}
          >
            <span className="text-xs font-bold text-gold tabular-nums">
              {consensus}
            </span>
          </div>
        </motion.div>

        {/* 头像层 */}
        {positions.map((p, index) => {
          const isActive = p.speakerId === activeSpeakerId;
          const emotionColor = getEmotionColor(p.latestEmotion);
          // 是否已汇聚（共识很高且接近中心）
          const isConverged = consensus >= 80;
          const size = baseAvatarSize;

          return (
            <motion.div
              key={p.speakerId}
              className="absolute"
              style={{ top: 0, left: 0 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: inView ? 1 : 0,
                scale: 1,
                x: p.x - size / 2,
                y: p.y - size / 2,
              }}
              transition={{
                opacity: { duration: 0.5, delay: index * 0.08 },
                scale: { duration: 0.5, delay: index * 0.08 },
                x: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
              }}
            >
              {/* galaxyConvergence 入场效果（内层） */}
              <motion.div
                variants={galaxyConvergence}
                initial="initial"
                animate={inView ? 'animate' : 'initial'}
              >
                <motion.div
                  className="relative flex items-center justify-center rounded-full border-2 bg-bg-card/90 backdrop-blur-sm"
                  style={{
                    width: size,
                    height: size,
                    borderColor: isActive
                      ? 'var(--gold)'
                      : showEmotionColors
                        ? emotionColor
                        : 'var(--border)',
                    boxShadow: isActive
                      ? '0 0 20px rgba(201,168,76,0.6)'
                      : `0 0 12px ${emotionColor}50`,
                  }}
                  // 汇聚动画：到达中心时 scale + opacity 脉冲
                  animate={
                    isConverged
                      ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }
                      : isActive
                        ? { scale: [1, 1.08, 1] }
                        : { scale: 1 }
                  }
                  transition={{
                    duration: isConverged ? 1.2 : 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.1,
                  }}
                >
                  <span
                    className="leading-none"
                    style={{ fontSize: size * 0.5 }}
                  >
                    {p.speakerAvatar}
                  </span>

                  {/* 发言数量徽标 */}
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-0.5 text-[8px] font-bold text-bg">
                    {p.count}
                  </span>
                </motion.div>

                {/* 名称 */}
                <span
                  className="mt-1 block max-w-[60px] truncate text-center text-text-soft sm:max-w-[72px]"
                  style={{ fontSize: isMobile ? 9 : 10 }}
                >
                  {p.speakerName}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* 底部说明 */}
      <p className="mt-3 text-center text-[10px] text-text-dim sm:text-xs">
        {consensus >= 80
          ? '议会已达成高度共识，意见正在汇聚'
          : consensus >= 50
            ? '讨论进行中，共识正在形成'
            : '各方观点分歧较大，尚在探索'}
      </p>
    </div>
  );
}

// ===================================================================
// 主组件
// ===================================================================

/**
 * 议会对话流可视化组件
 *
 * 在议会讨论进行时，可视化展示各 Agent 的发言流：
 * - 用颜色编码情感（positive=绿 / negative=红 / passionate=橙 / contemplative=蓝）
 * - 用动画展示分歧（spectrum 光谱）和共识（consensus 聚拢）
 *
 * 三种布局模式：
 * - `stream`：流式气泡展示，当前发言者金色脉冲边框
 * - `spectrum`：分歧光谱，头像按立场值水平排列，渐变背景
 * - `consensus`：共识聚拢，头像从边缘向中心汇聚，金色发光核心
 *
 * 技术实现：
 * - Framer Motion `layout` + `AnimatePresence` 实现平滑过渡
 * - `useInView` 实现滚动触发
 * - 纯 SVG + div 实现，不依赖额外库
 * - 响应式：移动端头像缩小、间距减少
 *
 * @example
 * ```tsx
 * <DialogueFlow
 *   messages={messages}
 *   activeSpeakerId="socrates"
 *   showEmotionColors
 *   mode="spectrum"
 * />
 * ```
 */
export function DialogueFlow({
  messages,
  activeSpeakerId,
  showEmotionColors = true,
  mode = 'stream',
  className,
}: DialogueFlowProps) {
  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {mode === 'stream' && (
            <StreamMode
              messages={messages}
              activeSpeakerId={activeSpeakerId}
              showEmotionColors={showEmotionColors}
            />
          )}
          {mode === 'spectrum' && (
            <SpectrumMode
              messages={messages}
              activeSpeakerId={activeSpeakerId}
              showEmotionColors={showEmotionColors}
            />
          )}
          {mode === 'consensus' && (
            <ConsensusMode
              messages={messages}
              activeSpeakerId={activeSpeakerId}
              showEmotionColors={showEmotionColors}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default DialogueFlow;
