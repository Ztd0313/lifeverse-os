'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  HeartHandshake,
  Trash2,
  Compass,
  Sparkles,
  Lock,
  Zap,
} from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useMembershipStore, getTierConfig } from '@/stores/membership-store';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';

// ===== 常量 =====

/** localStorage 键名：保存对话历史（按时间点分别保存） */
const STORAGE_KEY_PREFIX = 'lifeverse-reunion-dialogue-history';

/** 当前年份 */
const CURRENT_YEAR = new Date().getFullYear();

// ===== 类型定义 =====

/** 时间方向 */
type TimeDirection = 'past' | 'future';

/** 时间点选项 */
interface TimeOption {
  /** 选项 ID */
  id: string;
  /** 显示标签 */
  label: string;
  /** 时间方向 */
  direction: TimeDirection;
  /** 年份偏移 */
  yearsOffset: number;
  /** 图标 emoji */
  icon: string;
}

/** 预设时间点选项 */
const PRESET_TIME_OPTIONS: TimeOption[] = [
  {
    id: 'past-10',
    label: '10 年前',
    direction: 'past',
    yearsOffset: 10,
    icon: '🕰️',
  },
  {
    id: 'past-5',
    label: '5 年前',
    direction: 'past',
    yearsOffset: 5,
    icon: '📷',
  },
  {
    id: 'future-5',
    label: '5 年后',
    direction: 'future',
    yearsOffset: 5,
    icon: '🌱',
  },
  {
    id: 'future-10',
    label: '10 年后',
    direction: 'future',
    yearsOffset: 10,
    icon: '🔮',
  },
];

/** 对话消息 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** AI 回复的情感标签 */
  emotionTag?: string;
  /** AI 回复的时间视角 */
  timePerspective?: string;
  /** AI 回复的建议或问题 */
  adviceOrQuestion?: string;
  /** 消息时间戳 */
  timestamp: number;
}

/** API 响应结构 */
interface ReunionDialogueApiResponse {
  success: boolean;
  reply?: {
    content: string;
    emotionTag: string;
    timePerspective: string;
    adviceOrQuestion: string;
  };
  error?: string;
  isMock?: boolean;
}

// ===== 工具函数 =====

/** 生成唯一 ID */
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 根据生日计算年龄
 */
function calculateAge(birthday?: string): number {
  if (!birthday) return 30;
  try {
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return 30;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age > 0 && age < 150 ? age : 30;
  } catch {
    return 30;
  }
}

/**
 * 获取 localStorage 键名（按时间点区分）
 */
function getStorageKey(optionId: string): string {
  return `${STORAGE_KEY_PREFIX}-${optionId}`;
}

/**
 * 从 localStorage 读取对话历史
 */
function loadHistory(optionId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(optionId));
    if (!raw) return [];
    const data = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * 保存对话历史到 localStorage
 */
function saveHistory(optionId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave = messages.slice(-50);
    window.localStorage.setItem(getStorageKey(optionId), JSON.stringify(toSave));
  } catch {
    // 忽略
  }
}

/**
 * 清空指定时间点的对话历史
 */
function clearHistory(optionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getStorageKey(optionId));
  } catch {
    // 忽略
  }
}

// ===== 主页面 =====

/**
 * 重逢对话页面
 *
 * 用户与"过去/未来的自己"对话的页面。
 *
 * 功能：
 * - 顶部：时间选择器（5 年前、10 年前、5 年后、10 年后、自定义年份）
 * - 对话区域：显示对话气泡
 * - 底部：输入框 + 发送按钮
 * - 首次进入：根据选择的时间点显示引导语
 *   - 过去的自己：怀旧、天真
 *   - 未来的自己：成熟、智慧
 * - AI 回复：调用 /api/reunion-dialogue 接口
 * - 时间视角标签：每条 AI 回复显示时间视角
 * - 对话历史：保存到 localStorage
 * - 使用 framer-motion 动画
 *
 * 设计风格：暗色 + 金色 + framer-motion
 */
export default function ReunionDialoguePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, isAuthenticated, isInitialized, checkAuth, token } = useAuthStore();
  const { canInnerDialogue, recordReunionDialogue, membership } =
    useMembershipStore();
  const dialogueCheck = canInnerDialogue();

  // ===== 状态 =====
  const [selectedOptionId, setSelectedOptionId] = React.useState<string>(
    'past-5'
  );
  const [customYear, setCustomYear] = React.useState<number | ''>('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // ===== 首次加载时校验登录态 =====
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ===== 未登录时重定向到登录页 =====
  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  // ===== 计算当前时间选项 =====
  const currentTimeOption = React.useMemo<TimeOption>(() => {
    // 自定义年份
    if (selectedOptionId === 'custom' && customYear) {
      const currentAge = calculateAge(user?.birthday);
      const targetAge = CURRENT_YEAR - customYear + currentAge;
      const direction: TimeDirection =
        targetAge < currentAge ? 'past' : 'future';
      const yearsOffset = Math.abs(targetAge - currentAge);
      return {
        id: 'custom',
        label: t('reunionDialogue.customYearLabel', { year: customYear }),
        direction,
        yearsOffset,
        icon: direction === 'past' ? '🕰️' : '🔮',
      };
    }

    // 预设选项
    const preset = PRESET_TIME_OPTIONS.find((o) => o.id === selectedOptionId);
    return preset || PRESET_TIME_OPTIONS[1];
  }, [selectedOptionId, customYear, user]);

  // ===== 加载历史记录（时间点变化时） =====
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const saved = loadHistory(currentTimeOption.id);
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      // 首次进入该时间点，显示引导语
      const currentAge = calculateAge(user?.birthday);
      const targetAge =
        currentTimeOption.direction === 'past' ? currentAge - currentTimeOption.yearsOffset : currentAge + currentTimeOption.yearsOffset;
      const welcome = currentTimeOption.direction === 'past'
        ? t('reunionDialogue.welcomePast', { years: currentTimeOption.yearsOffset, age: targetAge })
        : t('reunionDialogue.welcomeFuture', { years: currentTimeOption.yearsOffset, age: targetAge });
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcome,
          emotionTag: currentTimeOption.direction === 'past' ? '怀念' : '释然',
          timePerspective:
            currentTimeOption.direction === 'past'
              ? '回望过去的温柔'
              : '来自未来的期许',
          timestamp: Date.now(),
        },
      ]);
    }
    setHistoryLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentTimeOption.id]);

  // ===== 自动滚动到最新消息 =====
  React.useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages]);

  // ===== 保存历史记录 =====
  React.useEffect(() => {
    if (historyLoaded && messages.length > 0) {
      saveHistory(currentTimeOption.id, messages);
    }
  }, [messages, historyLoaded, currentTimeOption.id]);

  // ===== 发送消息 =====
  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;
    if (currentTimeOption.yearsOffset <= 0) return;
    if (!dialogueCheck.allowed) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: userText.trim(),
      timestamp: Date.now(),
    };

    const placeholderId = genId();
    const placeholderMsg: ChatMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // 收集发送前的历史（排除引导语和空消息）
    const historyForApi = messages
      .filter((m) => m.content && m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/reunion-dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userText.trim(),
          history: historyForApi,
          timeDirection: currentTimeOption.direction,
          yearsOffset: currentTimeOption.yearsOffset,
        }),
      });

      const data = (await response.json()) as ReunionDialogueApiResponse;

      if (!response.ok || !data.success || !data.reply) {
        throw new Error(data.error || `请求失败: ${response.status}`);
      }

      // 记录今日对话用量
      recordReunionDialogue();

      // 替换占位消息为真实回复
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: data.reply!.content,
                emotionTag: data.reply!.emotionTag,
                timePerspective: data.reply!.timePerspective,
                adviceOrQuestion: data.reply!.adviceOrQuestion,
                timestamp: Date.now(),
              }
            : m
        )
      );
    } catch (error) {
      console.error('[Reunion Dialogue] send failed:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content:
                  t('reunionDialogue.errorMessage'),
                emotionTag: '感伤',
                timePerspective: '时间暂时模糊',
                timestamp: Date.now(),
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 处理发送 =====
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
  };

  // ===== 键盘事件 =====
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ===== 选择时间点 =====
  const handleSelectOption = (optionId: string) => {
    if (optionId === 'custom') {
      setShowCustomInput(true);
      setSelectedOptionId('custom');
    } else {
      setShowCustomInput(false);
      setSelectedOptionId(optionId);
    }
    setHistoryLoaded(false);
  };

  // ===== 清空对话 =====
  const handleClear = () => {
    clearHistory(currentTimeOption.id);
    const currentAge = calculateAge(user?.birthday);
    const targetAge =
      currentTimeOption.direction === 'past' ? currentAge - currentTimeOption.yearsOffset : currentAge + currentTimeOption.yearsOffset;
    const welcome = currentTimeOption.direction === 'past'
      ? t('reunionDialogue.welcomePast', { years: currentTimeOption.yearsOffset, age: targetAge })
      : t('reunionDialogue.welcomeFuture', { years: currentTimeOption.yearsOffset, age: targetAge });
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcome,
        emotionTag: currentTimeOption.direction === 'past' ? '怀念' : '释然',
        timePerspective:
          currentTimeOption.direction === 'past'
            ? '回望过去的温柔'
            : '来自未来的期许',
        timestamp: Date.now(),
      },
    ]);
  };

  // ===== 登录态校验中，显示加载状态 =====
  if (!isInitialized || !isAuthenticated) {
    return (
      <>
        <ParticleBackground />
        <Header />
        <main className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-text-soft">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="text-sm">{t('reunionDialogue.verifying')}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ParticleBackground />
      <Header />

      <main className="relative z-10 flex h-screen flex-col bg-[#060710] pt-16">
        {/* ===== 顶部标题区 ===== */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 border-b border-border bg-[rgba(6,7,16,0.6)] backdrop-blur-md"
        >
          <div className="mx-auto max-w-3xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-gold"
                  aria-label={t('reunionDialogue.backHome')}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft">
                    <HeartHandshake size={18} className="text-gold" />
                  </span>
                  <div>
                    <h1 className="text-sm font-semibold text-text">
                      {t('reunionDialogue.title')}
                    </h1>
                    <p className="text-[11px] text-text-dim">
                      {t('reunionDialogue.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* ===== 用量指示器 ===== */}
                {dialogueCheck.remaining === -1 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(184,160,200,0.3)] bg-[rgba(184,160,200,0.12)] px-2.5 py-1 text-[11px] font-medium text-[#b8a0c8]">
                    <Zap size={11} />
                    {t('reunionDialogue.unlimited')}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                      dialogueCheck.remaining === 0
                        ? 'border-[rgba(232,93,93,0.3)] bg-[rgba(232,93,93,0.12)] text-red'
                        : 'border-gold-dim bg-gold-soft text-gold'
                    )}
                  >
                    {dialogueCheck.remaining === 0 ? (
                      <>
                        <Lock size={11} />
                        {t('reunionDialogue.usedUp')}
                      </>
                    ) : (
                      <>{t('reunionDialogue.remaining', { count: dialogueCheck.remaining })}</>
                    )}
                  </span>
                )}
                {dialogueCheck.remaining === 0 && (
                  <Link
                    href="/membership"
                    className="interactive inline-flex items-center gap-1 rounded-full border border-gold-dim bg-gold-soft/50 px-2.5 py-1 text-[11px] font-medium text-gold transition-colors hover:bg-gold-soft"
                  >
                    <Zap size={11} />
                    {t('reunionDialogue.upgrade')}
                  </Link>
                )}
                <button
                  onClick={handleClear}
                  disabled={isLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-red disabled:opacity-50"
                  aria-label={t('reunionDialogue.clearChat')}
                  title={t('reunionDialogue.clearChatTitle')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* ===== 时间选择器 ===== */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {PRESET_TIME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
                    selectedOptionId === option.id
                      ? 'border-gold bg-gold-soft/30 text-gold'
                      : 'border-border bg-bg-card text-text-soft hover:border-gold-dim'
                  )}
                >
                  <span aria-hidden="true">{option.icon}</span>
                  {t(`reunionDialogue.timeOptions.${option.id}` as const)}
                </button>
              ))}

              {/* 自定义年份按钮 */}
              <button
                type="button"
                onClick={() => handleSelectOption('custom')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
                  selectedOptionId === 'custom'
                    ? 'border-gold bg-gold-soft/30 text-gold'
                    : 'border-border bg-bg-card text-text-soft hover:border-gold-dim'
                )}
              >
                <Compass size={12} />
                {t('reunionDialogue.customYear')}
              </button>
            </div>

            {/* ===== 自定义年份输入 ===== */}
            <AnimatePresence>
              {showCustomInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex items-center gap-2"
                >
                  <Clock size={14} className="text-gold" />
                  <input
                    type="number"
                    min={1940}
                    max={CURRENT_YEAR + 50}
                    value={customYear}
                    onChange={(e) => {
                      const val = e.target.value
                        ? parseInt(e.target.value, 10)
                        : '';
                      setCustomYear(val);
                      setHistoryLoaded(false);
                    }}
                    placeholder={t('reunionDialogue.yearPlaceholder', { maxYear: CURRENT_YEAR + 50 })}
                    className="h-9 w-40 rounded-lg border border-border bg-bg-card px-3 text-xs text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
                  />
                  {customYear && (
                    <span className="text-xs text-text-dim">
                      {currentTimeOption.direction === 'past'
                        ? t('reunionDialogue.yearsAgoSelf', { years: currentTimeOption.yearsOffset })
                        : t('reunionDialogue.yearsLaterSelf', { years: currentTimeOption.yearsOffset })}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>

        {/* ===== 次数用尽提示条 ===== */}
        <AnimatePresence>
          {dialogueCheck.remaining === 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden border-b border-border bg-[rgba(232,93,93,0.08)]"
            >
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="shrink-0 text-red" />
                  <div>
                    <p className="text-xs font-medium text-text">
                      {t('reunionDialogue.quotaExhausted')}
                    </p>
                    <p className="text-[10px] text-text-dim">
                      {t('reunionDialogue.quotaDetail', { tier: getTierConfig(membership.tier).name, limit: dialogueCheck.limit })}
                    </p>
                  </div>
                </div>
                <Link
                  href="/membership"
                  className="interactive inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-bg transition-colors hover:bg-gold-dim"
                >
                  <Zap size={12} />
                  {t('reunionDialogue.upgrade')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== 对话区域 ===== */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'flex max-w-[85%] flex-col gap-1.5',
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  {/* 消息气泡 */}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-gold text-bg'
                        : 'rounded-bl-sm border border-border bg-bg-card text-text'
                    )}
                  >
                    {/* 加载状态 */}
                    {msg.role === 'assistant' && !msg.content && isLoading && (
                      <div className="flex items-center gap-2 py-1 text-text-dim">
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          {currentTimeOption.direction === 'past'
                            ? t('reunionDialogue.pastListening')
                            : t('reunionDialogue.futureListening')}
                        </motion.span>
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 0.2,
                          }}
                        >
                          ...
                        </motion.span>
                      </div>
                    )}

                    {/* 消息内容 */}
                    {msg.content && (
                      <span className="whitespace-pre-wrap">
                        {msg.content}
                      </span>
                    )}
                  </div>

                  {/* AI 回复的元信息：时间视角 + 情感标签 + 建议 */}
                  {msg.role === 'assistant' && msg.content && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col gap-1.5 px-1"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {msg.timePerspective && (
                          <Badge variant="blue" className="text-[10px]">
                            <Clock size={10} className="mr-1" />
                            {msg.timePerspective}
                          </Badge>
                        )}
                        {msg.emotionTag && (
                          <Badge variant="gold" className="text-[10px]">
                            <Sparkles size={10} className="mr-1" />
                            {msg.emotionTag}
                          </Badge>
                        )}
                      </div>
                      {msg.adviceOrQuestion && (
                        <p className="text-xs italic text-text-dim">
                          {msg.adviceOrQuestion}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ===== 输入区域 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 border-t border-border bg-[rgba(6,7,16,0.8)] backdrop-blur-md"
        >
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('reunionDialogue.inputPlaceholder', { label: currentTimeOption.label })}
                rows={1}
                disabled={isLoading || currentTimeOption.yearsOffset <= 0}
                className={cn(
                  'flex-1 resize-none rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text placeholder:text-text-dim',
                  'focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim',
                  'disabled:opacity-50',
                  'max-h-32'
                )}
                style={{
                  minHeight: '46px',
                  height: 'auto',
                }}
              />
              <Button
                variant="gold"
                size="md"
                type="button"
                onClick={handleSend}
                disabled={
                  !input.trim() ||
                  isLoading ||
                  currentTimeOption.yearsOffset <= 0
                }
                className="shrink-0"
                aria-label={t('reunionDialogue.send')}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-text-dim">
              {t('reunionDialogue.inputHint')}
            </p>
          </div>
        </motion.div>
      </main>
    </>
  );
}
