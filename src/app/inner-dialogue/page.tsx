'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Loader2,
  Brain,
  Trash2,
  Heart,
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

/** localStorage 键名：保存对话历史 */
const STORAGE_KEY = 'lifeverse-inner-dialogue-history';

// ===== 类型定义 =====

/** 对话消息 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** AI 回复的情感标签 */
  emotionTag?: string;
  /** AI 回复的引导问题 */
  guidingQuestion?: string;
  /** 消息时间戳 */
  timestamp: number;
}

/** API 响应结构 */
interface InnerDialogueApiResponse {
  success: boolean;
  reply?: {
    content: string;
    emotionTag: string;
    guidingQuestion: string;
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
 * 从 localStorage 读取对话历史
 */
function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
function saveHistory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    // 最多保存 50 条，避免 localStorage 溢出
    const toSave = messages.slice(-50);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // localStorage 写入失败，忽略
  }
}

/**
 * 清空 localStorage 中的对话历史
 */
function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}

// ===== 主页面 =====

/**
 * 内心对话页面
 *
 * 用户与"内心的自己"对话的页面。
 *
 * 功能：
 * - 全屏聊天界面，顶部显示"内心对话"标题和简介
 * - 对话区域：显示用户和内心自己的对话气泡（左右排列）
 * - 输入区域：底部输入框 + 发送按钮
 * - AI 回复：调用 /api/inner-dialogue 接口
 * - 首次进入：显示引导语
 * - 情感标签：AI 回复时显示情感标签
 * - 对话历史：保存到 localStorage，下次进入可恢复
 * - 加载状态：AI 思考时显示"内心正在倾听..."动画
 * - 使用 framer-motion 做消息出现动画
 *
 * 设计风格：暗色 + 金色 + framer-motion
 */
export default function InnerDialoguePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isAuthenticated, isInitialized, checkAuth, token } = useAuthStore();
  const { canInnerDialogue, recordInnerDialogue, membership } =
    useMembershipStore();
  const dialogueCheck = canInnerDialogue();

  // ===== 状态 =====
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

  // ===== 加载历史记录 =====
  React.useEffect(() => {
    if (isAuthenticated && !historyLoaded) {
      const saved = loadHistory();
      if (saved.length > 0) {
        setMessages(saved);
      } else {
        // 首次进入，显示引导语
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: t('innerDialogue.welcomeMessage'),
            emotionTag: '温暖',
            timestamp: Date.now(),
          },
        ]);
      }
      setHistoryLoaded(true);
    }
  }, [isAuthenticated, historyLoaded]);

  // ===== 自动滚动到最新消息 =====
  React.useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages]);

  // ===== 保存历史记录 =====
  React.useEffect(() => {
    if (historyLoaded && messages.length > 0) {
      saveHistory(messages);
    }
  }, [messages, historyLoaded]);

  // ===== 发送消息 =====
  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;
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

    // 收集发送前的历史（用于 API 调用，排除引导语和空消息）
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
      const response = await fetch('/api/inner-dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userText.trim(),
          history: historyForApi,
        }),
      });

      const data = (await response.json()) as InnerDialogueApiResponse;

      if (!response.ok || !data.success || !data.reply) {
        throw new Error(data.error || `请求失败: ${response.status}`);
      }

      // 记录今日对话用量
      recordInnerDialogue();

      // 替换占位消息为真实回复
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: data.reply!.content,
                emotionTag: data.reply!.emotionTag,
                guidingQuestion: data.reply!.guidingQuestion,
                timestamp: Date.now(),
              }
            : m
        )
      );
    } catch (error) {
      console.error('[Inner Dialogue] send failed:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content:
                  t('innerDialogue.errorMessage'),
                emotionTag: '感伤',
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

  // ===== 键盘事件：Enter 发送，Shift+Enter 换行 =====
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ===== 清空对话 =====
  const handleClear = () => {
    clearHistory();
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t('innerDialogue.welcomeMessage'),
        emotionTag: '温暖',
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
            <p className="text-sm">{t('innerDialogue.verifying')}</p>
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
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-gold"
                aria-label={t('innerDialogue.backHome')}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft">
                  <Brain size={18} className="text-gold" />
                </span>
                <div>
                  <h1 className="text-sm font-semibold text-text">
                    {t('innerDialogue.title')}
                  </h1>
                  <p className="text-[11px] text-text-dim">
                    {t('innerDialogue.subtitle')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* ===== 用量指示器 ===== */}
              {dialogueCheck.remaining === -1 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(184,160,200,0.3)] bg-[rgba(184,160,200,0.12)] px-2.5 py-1 text-xs font-medium text-[#b8a0c8]">
                  <Zap size={11} />
                  {t('innerDialogue.unlimited')}
                </span>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                    dialogueCheck.remaining === 0
                      ? 'border-[rgba(232,93,93,0.3)] bg-[rgba(232,93,93,0.12)] text-red'
                      : 'border-gold-dim bg-gold-soft text-gold'
                  )}
                >
                  {dialogueCheck.remaining === 0 ? (
                    <>
                        <Lock size={11} />
                        {t('innerDialogue.usedUp')}
                      </>
                    ) : (
                      <>{t('innerDialogue.remaining', { count: dialogueCheck.remaining })}</>
                  )}
                </span>
              )}
              {dialogueCheck.remaining === 0 && (
                <Link
                  href="/membership"
                  className="interactive inline-flex items-center gap-1 rounded-full border border-gold-dim bg-gold-soft/50 px-2.5 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold-soft"
                >
                  <Zap size={11} />
                  {t('innerDialogue.upgrade')}
                </Link>
              )}
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-red disabled:opacity-50"
                aria-label={t('innerDialogue.clearChat')}
                title={t('innerDialogue.clearChatTitle')}
              >
                <Trash2 size={16} />
              </button>
            </div>
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
                      {t('innerDialogue.quotaExhausted')}
                    </p>
                    <p className="text-xs text-text-dim">
                      {getTierConfig(membership.tier).name} · {t('innerDialogue.quotaDetail', { tier: getTierConfig(membership.tier).name, limit: dialogueCheck.limit })}
                    </p>
                  </div>
                </div>
                <Link
                  href="/membership"
                  className="interactive inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-bg transition-colors hover:bg-gold-dim"
                >
                  <Zap size={12} />
                  {t('innerDialogue.upgrade')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== 对话区域 ===== */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
            {messages.map((msg, index) => (
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
                    {/* 加载状态：内心正在倾听 */}
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
                          {t('innerDialogue.listening')}
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

                  {/* AI 回复的元信息：情感标签 + 引导问题 */}
                  {msg.role === 'assistant' && msg.content && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col gap-1.5 px-1"
                    >
                      {msg.emotionTag && (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="gold" className="text-[10px]">
                            <Heart size={10} className="mr-1" />
                            {msg.emotionTag}
                          </Badge>
                        </div>
                      )}
                      {msg.guidingQuestion && (
                        <p className="text-xs italic text-text-dim">
                          {msg.guidingQuestion}
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
                placeholder={t('innerDialogue.placeholder')}
                rows={1}
                disabled={isLoading}
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
                disabled={!input.trim() || isLoading}
                className="shrink-0"
                aria-label={t('innerDialogue.send')}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-text-dim">
              {t('innerDialogue.inputHint')}
            </p>
          </div>
        </motion.div>
      </main>
    </>
  );
}
