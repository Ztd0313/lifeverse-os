'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Baby,
  Trash2,
  Heart,
} from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useDreamStore } from '@/stores/dream-store';
import { useTranslation } from '@/lib/i18n';

// ===== 常量 =====

/** localStorage 键名：保存对话历史 */
const STORAGE_KEY = 'lifeverse-dream-dialogue-history';
/** localStorage 键名：保存儿时年龄选择 */
const AGE_KEY = 'lifeverse-dream-dialogue-age';

/** 默认儿时年龄 */
const DEFAULT_CHILD_AGE = 8;

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
interface DreamDialogueApiResponse {
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

/** 从 localStorage 读取对话历史 */
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

/** 保存对话历史到 localStorage */
function saveHistory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave = messages.slice(-50);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // 忽略
  }
}

/** 清空 localStorage 中的对话历史 */
function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}

/** 从 localStorage 读取儿时年龄 */
function loadChildAge(): number {
  if (typeof window === 'undefined') return DEFAULT_CHILD_AGE;
  try {
    const raw = window.localStorage.getItem(AGE_KEY);
    if (!raw) return DEFAULT_CHILD_AGE;
    const age = Number(raw);
    return age > 0 && age < 18 ? age : DEFAULT_CHILD_AGE;
  } catch {
    return DEFAULT_CHILD_AGE;
  }
}

/** 保存儿时年龄到 localStorage */
function saveChildAge(age: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AGE_KEY, String(age));
  } catch {
    // 忽略
  }
}

// ===== 主页面 =====

/**
 * 与儿时的自己对话页面
 *
 * 这是一个类似内心对话的聊天界面，但 AI 角色是"儿时的自己"。
 *
 * 功能：
 * - 全屏聊天界面，顶部显示"与儿时的自己对话"标题
 * - AI 角色设定为用户儿时的自己，充满好奇和纯真
 * - 调用 /api/dream-dialogue API
 * - 可选择儿时自己的年龄（默认 8 岁）
 * - 对话历史保存到 localStorage
 * - 欢迎语："嗨！我是X岁的你~你想聊聊什么呢？"
 *
 * 设计风格：暗色 + 金色 + framer-motion
 */
export default function DreamDialoguePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  const { isAuthenticated, isInitialized, checkAuth, token } = useAuthStore();
  const { dreams } = useDreamStore();

  // ===== 状态 =====
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);
  const [childAge, setChildAge] = React.useState(DEFAULT_CHILD_AGE);

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

  // ===== 加载历史记录和儿时年龄 =====
  React.useEffect(() => {
    if (isAuthenticated && !historyLoaded) {
      const age = loadChildAge();
      setChildAge(age);
      const saved = loadHistory();
      if (saved.length > 0) {
        setMessages(saved);
      } else {
        // 首次进入，显示欢迎语
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: t('dreamArchive.childGreeting', { age }),
            emotionTag: '好奇',
            timestamp: Date.now(),
          },
        ]);
      }
      setHistoryLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ===== 切换儿时年龄时更新欢迎语 =====
  const handleAgeChange = (age: number) => {
    setChildAge(age);
    saveChildAge(age);
    // 如果只有欢迎语，更新欢迎语中的年龄
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [
          {
            ...prev[0],
            content: t('dreamArchive.childGreeting', { age }),
          },
        ];
      }
      return prev;
    });
  };

  // ===== 发送消息 =====
  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

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

    // 收集发送前的历史（用于 API 调用，排除欢迎语和空消息）
    const historyForApi = messages
      .filter((m) => m.content && m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // 收集梦想列表作为 context
    const dreamsForApi = dreams.map((d) => ({
      title: d.title,
      description: d.description,
      category: d.category,
      status: d.status,
      ageAtDream: d.ageAtDream,
    }));

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/dream-dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userText.trim(),
          history: historyForApi,
          childAge,
          dreams: dreamsForApi,
          locale,
        }),
      });

      const data = (await response.json()) as DreamDialogueApiResponse;

      if (!response.ok || !data.success || !data.reply) {
        throw new Error(data.error || `请求失败: ${response.status}`);
      }

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
      console.error('[Dream Dialogue] send failed:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: t('innerDialogue.errorMessage'),
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
        content: t('dreamArchive.childGreeting', { age: childAge }),
        emotionTag: '好奇',
        timestamp: Date.now(),
      },
    ]);
  };

  // 登录态校验中，显示加载状态
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
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft">
                  <Baby size={18} className="text-gold" />
                </span>
                <div>
                  <h1 className="text-sm font-semibold text-text">
                    {t('dreamArchive.dialogueTitle')}
                  </h1>
                  <p className="text-[11px] text-text-dim">
                    {t('dreamArchive.dialogueSubtitle')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 儿时年龄选择器 */}
              <div className="flex items-center gap-1.5 rounded-full border border-gold-dim bg-gold-soft/50 px-2.5 py-1">
                <Baby size={12} className="text-gold" />
                <select
                  value={childAge}
                  onChange={(e) => handleAgeChange(Number(e.target.value))}
                  className="cursor-pointer bg-transparent text-xs font-medium text-gold focus:outline-none"
                  aria-label={t('dreamArchive.ageAtDream')}
                >
                  {Array.from({ length: 15 }, (_, i) => i + 3).map((age) => (
                    <option
                      key={age}
                      value={age}
                      className="bg-bg-card text-text"
                    >
                      {age}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gold">岁</span>
              </div>
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
                placeholder={t('dreamArchive.childPlaceholder')}
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

