'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Persona,
  Message,
  ConflictPair,
  CouncilPhase,
} from '@/types';
import { cn, getConflictLevel, formatSessionNumber } from '@/lib/utils';
import { useCouncilStore } from '@/stores/council-store';
import { useTranslation } from '@/lib/i18n';
import { AgentCard } from './AgentCard';
import { TypingText } from './TypingText';
import { RoundIndicator } from './RoundIndicator';
import { ConflictVisualization } from './ConflictVisualization';

/**
 * 议会大厅组件 Props
 */
interface MeetingRoomProps {
  /** 参与议会的 Agent 列表 */
  personas: Persona[];
  /** 对话流消息列表 */
  messages: Message[];
  /** 当前发言者索引（-1 表示无发言者） */
  currentSpeakerIndex: number;
  /** 议会当前阶段 */
  phase: CouncilPhase;
  /** 冲突对列表 */
  conflicts: ConflictPair[];
  /** 点击 Agent 回调 */
  onAgentClick?: (persona: Persona) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 阶段对应的翻译 key 映射
 */
const PHASE_TRANSLATION_KEYS: Partial<Record<CouncilPhase, string>> = {
  ritual: 'council.meetingRoom.phaseRitual',
  r1: 'council.meetingRoom.phaseR1',
  r2: 'council.meetingRoom.phaseR2',
  r3: 'council.meetingRoom.phaseR3',
  report: 'council.meetingRoom.phaseReport',
  idle: 'council.meetingRoom.phaseIdle',
  matching: 'council.meetingRoom.phaseMatching',
  timeline: 'council.meetingRoom.phaseTimeline',
  done: 'council.meetingRoom.phaseDone',
};

/**
 * 阶段对应的轮次编号
 */
function phaseToRound(phase: CouncilPhase): number {
  switch (phase) {
    case 'r1':
      return 1;
    case 'r2':
      return 2;
    case 'r3':
      return 3;
    default:
      return 0;
  }
}

/**
 * 计算 Agent 在环形布局中的坐标
 * @param index Agent 索引
 * @param total Agent 总数
 * @param radius 环形半径
 * @returns { x, y } 相对中心点的坐标
 */
function calcAgentPosition(
  index: number,
  total: number,
  radius: number
): { x: number; y: number } {
  // 从顶部 (-90°) 开始，顺时针均匀分布
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/**
 * 根据冲突值获取连线颜色
 */
function getConflictColor(value: number): string {
  return getConflictLevel(value).color;
}

/**
 * 仪式动画组件
 */
function RitualAnimation() {
  const { t } = useTranslation();
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 扩散光环 */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-gold"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{ width: 100, height: 100 }}
        />
      ))}

      {/* 中心文字 */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="text-2xl font-serif text-gradient-gold"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {t('council.meetingRoom.ritualTitle')}
        </motion.div>
        <div className="mt-2 text-xs text-text-dim tracking-widest">
          {t('council.meetingRoom.ritualSubtitle')}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * 单条消息渲染
 */
interface MessageItemProps {
  message: Message;
  persona?: Persona;
  isLatest: boolean;
  isCurrentlySpeaking: boolean;
}

function MessageItem({
  message,
  persona,
  isLatest,
  isCurrentlySpeaking,
}: MessageItemProps) {
  const { t } = useTranslation();
  const isSystem = message.role === 'system';
  const isUser = message.role === 'user';
  const isConflict = message.isConflict;

  // 系统消息居中
  if (isSystem) {
    return (
      <motion.div
        className="flex justify-center py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="rounded-full bg-bg-soft px-3 py-1 text-xs text-text-dim">
          {message.content}
        </span>
      </motion.div>
    );
  }

  // 用户消息右对齐
  if (isUser) {
    return (
      <motion.div
        className="flex justify-end py-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-gold/10 border border-gold-dim px-3 py-2">
          <p className="text-sm text-text leading-relaxed">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  // Agent 消息
  const avatar = persona?.avatar ?? '◈';
  const nameColor = persona?.type === 'sage'
    ? 'text-gold'
    : persona?.type === 'time'
      ? 'text-blue'
      : persona?.type === 'relation'
        ? 'text-green'
        : 'text-purple';

  // 最新消息且当前正在发言时使用打字机效果
  const useTyping = isLatest && isCurrentlySpeaking;

  return (
    <motion.div
      className={cn(
        'flex gap-2.5 py-2',
        isConflict && 'border-l-2 border-red/50 pl-3'
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 头像 */}
      <div className="flex-shrink-0 text-xl leading-none mt-0.5">
        {avatar}
      </div>

      {/* 消息内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn('text-xs font-medium', nameColor)}>
            {message.personaName}
          </span>
          {isConflict && (
            <span className="text-[10px] text-red">{t('council.meetingRoom.conflictTag')}</span>
          )}
          <span className="text-[10px] text-text-dim">
            R{message.round}
          </span>
        </div>
        <div
          className={cn(
            'rounded-lg rounded-tl-sm px-3 py-2',
            'bg-bg-card/60 border border-border',
            isConflict && 'border-red/30'
          )}
        >
          {useTyping ? (
            <TypingText
              text={message.content}
              speed={35}
              className="text-sm text-text leading-relaxed"
            />
          ) : (
            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 议会大厅组件（核心交互界面）
 *
 * 承载多 Agent 对话场景，包含环形排列的 Agent 卡片、
 * 冲突连线可视化、实时对话流和议会仪式流程。
 *
 * 布局结构：
 * - 顶部：议会标题 + 议题
 * - 中部：Agent 环形排列 + 冲突 SVG 连线
 * - 底部：对话流（消息列表，打字机效果）
 *
 * @example
 * ```tsx
 * <MeetingRoom
 *   personas={personas}
 *   messages={messages}
 *   currentSpeakerIndex={2}
 *   phase="r1"
 *   conflicts={conflicts}
 *   onAgentClick={(p) => console.log(p)}
 * />
 * ```
 */
export function MeetingRoom({
  personas,
  messages,
  currentSpeakerIndex,
  phase,
  conflicts,
  onAgentClick,
  className,
}: MeetingRoomProps) {
  const { t } = useTranslation();
  // 从 store 获取 sessionNumber 和 question（props 中未包含）
  const sessionNumber = useCouncilStore((s) => s.sessionNumber);
  const storeQuestion = useCouncilStore((s) => s.question);

  // 从消息中提取议题（优先使用 store 中的 question）
  const question = useMemo(() => {
    if (storeQuestion) return storeQuestion;
    const userMsg = messages.find((m) => m.role === 'user');
    return userMsg?.content ?? '';
  }, [storeQuestion, messages]);

  // 构建 persona 查找表
  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    personas.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  // 对话流自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages.length]);

  // 环形布局参数
  const agentCount = personas.length;
  const [containerSize, setContainerSize] = useState(520);
  useEffect(() => {
    const updateSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 380) {
        setContainerSize(Math.min(screenWidth - 32, 300));
      } else if (screenWidth < 640) {
        setContainerSize(Math.min(screenWidth - 48, 360));
      } else if (screenWidth < 1024) {
        setContainerSize(420);
      } else {
        setContainerSize(520);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  const radius = Math.min(containerSize / 2 - 60, 120 + agentCount * 2);
  const center = containerSize / 2;

  // 计算 Agent 位置
  const agentPositions = useMemo(() => {
    return personas.map((_, index) =>
      calcAgentPosition(index, agentCount, radius)
    );
  }, [personas, agentCount, radius]);

  // 计算冲突连线
  const conflictLines = useMemo(() => {
    return conflicts
      .map((conflict) => {
        const indexA = personas.findIndex((p) => p.id === conflict.personaA);
        const indexB = personas.findIndex((p) => p.id === conflict.personaB);
        if (indexA === -1 || indexB === -1) return null;
        const posA = agentPositions[indexA];
        const posB = agentPositions[indexB];
        return {
          id: `${conflict.personaA}-${conflict.personaB}`,
          x1: center + posA.x,
          y1: center + posA.y,
          x2: center + posB.x,
          y2: center + posB.y,
          value: conflict.value,
          color: getConflictColor(conflict.value),
          label: conflict.label,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [conflicts, personas, agentPositions, center]);

  // 获取 Agent 状态
  const getAgentStatus = useCallback(
    (index: number): 'idle' | 'thinking' | 'speaking' | 'conflict' => {
      // 检查是否在冲突中
      const persona = personas[index];
      if (persona) {
        const inConflict = conflicts.some(
          (c) =>
            c.personaA === persona.id || c.personaB === persona.id
        );
        if (inConflict && phase !== 'report') return 'conflict';
      }

      // 当前发言者
      if (index === currentSpeakerIndex) {
        return 'speaking';
      }

      return 'idle';
    },
    [personas, conflicts, currentSpeakerIndex, phase]
  );

  // 当前轮次
  const currentRound = phaseToRound(phase);
  const isRitual = phase === 'ritual';
  const isReport = phase === 'report';

  // 最新消息
  const latestMessage = messages[messages.length - 1];
  const isCurrentlySpeaking =
    currentSpeakerIndex >= 0 && phase !== 'idle' && phase !== 'report';

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]',
        'bg-bg/50 backdrop-blur-sm',
        className
      )}
    >
      {/* ===== 顶部：议会标题 + 议题 ===== */}
      <header className="flex-shrink-0 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <motion.h2
              className="font-serif text-lg text-gradient-gold"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {formatSessionNumber(sessionNumber)}
            </motion.h2>
            <span className="text-text-dim text-xs">|</span>
            <span className="text-xs text-text-soft">
              {t(PHASE_TRANSLATION_KEYS[phase] ?? '')}
            </span>
          </div>

          {/* 轮次指示器 */}
          {currentRound > 0 && (
            <RoundIndicator currentRound={currentRound} totalRounds={3} />
          )}
        </div>

        {/* 议题 */}
        {question && (
          <motion.div
            className="mt-3 flex items-start gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="text-gold text-xs font-medium mt-0.5">{t('council.meetingRoom.topicLabel')}</span>
            <p className="text-sm text-text-soft leading-relaxed flex-1">
              {question}
            </p>
          </motion.div>
        )}
      </header>

      {/* ===== 中部：Agent 环形排列 + 冲突连线 ===== */}
      <div className="flex-shrink-0 flex items-center justify-center py-6">
        <div
          className="relative"
          style={{ width: containerSize, height: containerSize }}
        >
          {/* 仪式动画 */}
          <AnimatePresence>
            {isRitual && <RitualAnimation />}
          </AnimatePresence>

          {/* 冲突连线 SVG */}
          {conflictLines.length > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={containerSize}
              height={containerSize}
              viewBox={`0 0 ${containerSize} ${containerSize}`}
            >
              {conflictLines.map((line) => {
                const midX = (line.x1 + line.x2) / 2;
                const midY = (line.y1 + line.y2) / 2;

                return (
                  <g key={line.id}>
                    {/* 连线 */}
                    <motion.line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={line.color}
                      strokeWidth={2}
                      strokeDasharray="6,4"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.7 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-20"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </motion.line>

                    {/* 冲突值标签背景 */}
                    <motion.circle
                      cx={midX}
                      cy={midY}
                      r={14}
                      fill="rgba(6, 7, 16, 0.9)"
                      stroke={line.color}
                      strokeWidth={1}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    />

                    {/* 冲突值数字 */}
                    <motion.text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={line.color}
                      fontSize={11}
                      fontWeight={700}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      {line.value}
                    </motion.text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* 中心议题区 */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-gold-dim/30 bg-bg-card/40 backdrop-blur-sm">
              {isReport ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="text-2xl"
                >
                  ✦
                </motion.div>
              ) : isRitual ? (
                <div className="text-2xl">🏛️</div>
              ) : (
                <>
                  <div className="text-[10px] text-text-dim tracking-widest">
                    {currentRound > 0 ? `ROUND ${currentRound}` : 'COUNCIL'}
                  </div>
                  <div className="text-xs text-gold font-medium mt-1">
                    {currentRound > 0 ? t('council.meetingRoom.roundLabel', { round: currentRound }) : t('council.meetingRoom.councilLabel')}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Agent 卡片环形排列 */}
          {personas.map((persona, index) => {
            const pos = agentPositions[index];
            const status = getAgentStatus(index);
            const isSpeaking = index === currentSpeakerIndex;

            return (
              <motion.div
                key={persona.id}
                className="absolute top-1/2 left-1/2"
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: pos.x,
                  y: pos.y,
                }}
                transition={{
                  duration: 0.5,
                  delay: isRitual ? 0.3 + index * 0.15 : 0,
                  ease: 'easeOut',
                }}
                style={
                  {
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSpeaking ? 20 : 10,
                  } as CSSProperties
                }
              >
                <AgentCard
                  persona={persona}
                  status={status}
                  size={containerSize < 400 ? 'sm' : 'sm'}
                  onClick={() => onAgentClick?.(persona)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ===== 冲突可视化列表（紧凑模式） ===== */}
      {conflicts.length > 0 && (
        <div className="flex-shrink-0 px-4 sm:px-6 pb-2">
          <ConflictVisualization
            conflicts={conflicts}
            personas={personas}
          />
        </div>
      )}

      {/* ===== 底部：对话流 ===== */}
      <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-text-soft font-medium">{t('council.meetingRoom.dialogFlow')}</span>
          <span className="text-[10px] text-text-dim">
            {t('council.meetingRoom.messageCount', { count: messages.length })}
          </span>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-bg-card/30 p-3"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-text-dim">
                {phase === 'idle'
                  ? t('council.meetingRoom.submitTopicHint')
                  : t('council.meetingRoom.waitingAgent')}
              </span>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    persona={personaMap.get(message.personaId)}
                    isLatest={index === messages.length - 1}
                    isCurrentlySpeaking={isCurrentlySpeaking}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingRoom;
