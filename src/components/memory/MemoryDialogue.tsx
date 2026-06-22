'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TypingText } from '@/components/effects/TypingText';
import { cn } from '@/lib/utils';
import { scaleIn, fadeIn } from '@/lib/motion/variants';
import {
  getEmotionMeta,
  getPlanetMeta,
} from '@/lib/mock-memories';
import type { MemoryItem } from '@/types';
import { useTranslation } from '@/lib/i18n';

/**
 * 对话消息
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 是否正在打字（仅 assistant 消息使用） */
  typing?: boolean;
}

/**
 * 将 ISO 日期字符串格式化为中文长日期
 */
function formatMemoryDateLong(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * 生成开场白
 */
function buildOpening(memory: MemoryItem): string {
  const dateStr = formatMemoryDateLong(memory.date);
  return `这段记忆保存在${dateStr}，标题是"${memory.title}"。你想聊聊那天发生了什么吗？`;
}

/**
 * MemoryDialogue 组件 Props
 */
export interface MemoryDialogueProps {
  /** 当前对话的记忆（为 null 时不显示） */
  memory: MemoryItem | null;
  /** 关闭弹窗回调 */
  onClose: () => void;
}

/**
 * 记忆对话弹窗组件
 *
 * 特性：
 * - 左侧展示记忆信息（标题、日期、内容、地点、人物）
 * - 右侧是聊天界面（用户输入 + AI 回复）
 * - AI 角色设定：记忆守护者，温柔引导用户回忆
 * - 通过 /api/memory-dialogue 路由调用 DeepSeek API
 * - 首次打开时 AI 自动发送开场白
 * - 使用 TypingText 组件做打字机效果
 * - 使用 AnimatePresence 做弹窗动画
 * - 深色主题，金色点缀
 */
export function MemoryDialogue({ memory, onClose }: MemoryDialogueProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openingSentRef = useRef<string | null>(null);
  const { locale } = useTranslation();

  /** 自动滚动到最新消息 */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  /** 发送消息到 AI 并获取回复 */
  const sendMessage = useCallback(
    async (userText: string, currentMemory: MemoryItem) => {
      if (!userText.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userText.trim(),
      };

      const placeholderId = `assistant-${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        typing: true,
      };

      // 收集发送前的历史（用于 API 调用）
      const historyForApi = messages
        .filter((m) => !m.typing || m.content)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      setMessages((prev) => [...prev, userMsg, placeholderMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/memory-dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memory: currentMemory,
            message: userText.trim(),
            history: historyForApi,
            locale,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = (await response.json()) as {
          content: string;
          isMock: boolean;
        };

        // 替换占位消息为真实回复（保留 typing=true 以触发打字机效果）
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? { ...m, content: data.content, typing: true }
              : m
          )
        );
      } catch (error) {
        console.error('[MemoryDialogue] send failed:', error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  content:
                    '抱歉，我暂时无法回应你。请稍后再试，或者直接在心里和这段记忆对话——它一直都在。',
                  typing: true,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  /** 首次打开时自动发送开场白 */
  useEffect(() => {
    if (!memory) {
      setMessages([]);
      setInput('');
      openingSentRef.current = null;
      return;
    }

    // 仅在 memory 变化时发送一次开场白
    if (openingSentRef.current === memory.id) return;
    openingSentRef.current = memory.id;

    const opening = buildOpening(memory);
    const openingMsg: ChatMessage = {
      id: `assistant-opening-${memory.id}`,
      role: 'assistant',
      content: opening,
      typing: true,
    };
    setMessages([openingMsg]);
  }, [memory]);

  /** 消息变化时自动滚动 */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /** 处理发送 */
  const handleSend = () => {
    if (!memory || !input.trim() || isLoading) return;
    sendMessage(input, memory);
  };

  /** 处理键盘事件：Enter 发送，Shift+Enter 换行 */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** 标记某条消息打字完成 */
  const handleTypingComplete = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, typing: false } : m))
    );
  };

  return (
    <AnimatePresence>
      {memory && (
        <motion.div
          key="memory-dialogue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`记忆对话：${memory.title}`}
        >
          {/* 毛玻璃背景 */}
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-md" />

          {/* 弹窗主体 */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex h-[85vh] w-full max-w-4xl overflow-hidden rounded-[14px] border border-border bg-bg-card/95 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            {/* ===== 左侧：记忆信息 ===== */}
            <aside className="hidden w-[320px] shrink-0 flex-col border-r border-border bg-bg-soft/40 md:flex">
              {/* 顶部装饰条（情感色调） */}
              <div
                className="h-1 w-full"
                style={{
                  backgroundColor:
                    getEmotionMeta(memory.emotion)?.color ?? '#c9a84c',
                }}
              />

              <div className="flex-1 overflow-y-auto p-5">
                {/* 标题 */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles size={14} className="text-gold" />
                    <span className="text-[11px] font-medium text-gold">
                      记忆守护者
                    </span>
                  </div>
                  <h2 className="font-serif text-xl leading-tight text-text">
                    {memory.title}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-text-dim">
                    <span>{getPlanetMeta(memory.category)?.name}</span>
                    <span>·</span>
                    <Badge
                      variant={
                        memory.emotion === 'warm'
                          ? 'gold'
                          : memory.emotion === 'cool'
                            ? 'blue'
                            : 'orange'
                      }
                    >
                      <span
                        className="mr-1 inline-block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            getEmotionMeta(memory.emotion)?.color,
                        }}
                      />
                      {getEmotionMeta(memory.emotion)?.label}
                    </Badge>
                  </div>
                </div>

                {/* 日期 */}
                <div className="mb-3 flex items-start gap-2.5">
                  <Calendar
                    size={14}
                    className="mt-0.5 shrink-0 text-gold"
                  />
                  <div>
                    <p className="text-[10px] text-text-dim">日期</p>
                    <p className="text-xs text-text">
                      {formatMemoryDateLong(memory.date)}
                    </p>
                  </div>
                </div>

                {/* 地点 */}
                {memory.location && (
                  <div className="mb-3 flex items-start gap-2.5">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-gold"
                    />
                    <div>
                      <p className="text-[10px] text-text-dim">地点</p>
                      <p className="text-xs text-text">{memory.location}</p>
                    </div>
                  </div>
                )}

                {/* 人物 */}
                {memory.people && memory.people.length > 0 && (
                  <div className="mb-3 flex items-start gap-2.5">
                    <Users
                      size={14}
                      className="mt-0.5 shrink-0 text-gold"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-text-dim">人物</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {memory.people.map((person) => (
                          <span
                            key={person}
                            className="rounded-full bg-bg-card px-2 py-0.5 text-[11px] text-text-soft"
                          >
                            {person}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 记忆内容 */}
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  className="mt-4 rounded-lg border border-border bg-bg-soft/60 p-3"
                >
                  <p className="text-[10px] text-text-dim">记忆内容</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-soft">
                    {memory.content}
                  </p>
                </motion.div>

                {/* 标签 */}
                {memory.tags && memory.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {memory.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-bg-card px-2 py-0.5 text-[11px] text-text-soft"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部提示 */}
              <div className="border-t border-border p-4">
                <p className="text-[10px] leading-relaxed text-text-dim">
                  守护者会温柔地引导你回忆这段记忆。你可以问任何问题，或者只是聊聊你的感受。
                </p>
              </div>
            </aside>

            {/* ===== 右侧：聊天界面 ===== */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* 聊天头部 */}
              <header className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft">
                    <Sparkles size={16} className="text-gold" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text">
                      记忆对话
                    </p>
                    <p className="text-[10px] text-text-dim">
                      与「{memory.title}」的守护者对话
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="关闭"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-soft hover:text-gold"
                >
                  <X size={18} />
                </button>
              </header>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                          msg.role === 'user'
                            ? 'rounded-br-sm bg-gold text-bg'
                            : 'rounded-bl-sm border border-border bg-bg-soft text-text'
                        )}
                      >
                        {msg.role === 'assistant' && msg.typing ? (
                          <TypingText
                            text={msg.content}
                            speed={35}
                            showCursor={false}
                            onComplete={() => handleTypingComplete(msg.id)}
                            className="leading-relaxed"
                          />
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {msg.content}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* 加载占位（AI 思考中） */}
                  {isLoading &&
                    messages.length > 0 &&
                    !messages[messages.length - 1]?.content && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-bg-soft px-4 py-3 text-text-dim">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-xs">守护者正在回忆...</span>
                        </div>
                      </motion.div>
                    )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 输入区 */}
              <div className="border-t border-border p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="和这段记忆聊聊..."
                    rows={1}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 resize-none rounded-xl border border-border bg-bg-soft px-4 py-2.5 text-sm text-text placeholder:text-text-dim',
                      'focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim',
                      'disabled:opacity-50',
                      'max-h-32'
                    )}
                    style={{
                      minHeight: '42px',
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
                    aria-label="发送"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-[10px] text-text-dim">
                  Enter 发送 · Shift + Enter 换行
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MemoryDialogue;
