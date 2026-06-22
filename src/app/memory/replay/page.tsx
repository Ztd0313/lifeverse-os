'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  ChevronDown,
  Sparkles,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMemoryStore } from '@/stores/memory-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/lib/i18n';
import { getEmotionMeta, getPlanetMeta } from '@/lib/mock-memories';
import type { MemoryItem } from '@/types';
import { cn } from '@/lib/utils';

/**
 * 记忆回放页面 Memory Replay
 *
 * 以垂直时间轴方式展示用户的所有记忆，配合 Framer Motion 动画。
 *
 * 功能：
 * 1. 从 memory-store 获取所有记忆，按时间从早到晚排序
 * 2. 垂直时间轴展示每条记忆：标题、日期、情感色调、内容摘要、星球标签
 * 3. 点击记忆卡片可展开查看完整内容
 * 4. Framer Motion 动画：记忆卡片依次淡入
 * 5. 底部"播放"按钮：自动滚动并依次高亮每条记忆（类似幻灯片播放）
 * 6. 空状态：引导用户去记录第一个瞬间
 *
 * 深色主题，金色点缀。
 */
export default function MemoryReplayPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const { memories, fetchFromServer } = useMemoryStore();

  // ===== 状态 =====
  /** 当前展开的记忆 ID */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** 是否正在播放（自动滚动高亮） */
  const [isPlaying, setIsPlaying] = useState(false);
  /** 当前高亮的记忆索引 */
  const [activeIndex, setActiveIndex] = useState(-1);

  /** 记忆卡片引用映射 */
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** 播放定时器引用 */
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 首次加载时校验登录态 */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /** 未登录时重定向到登录页 */
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent('/memory/replay')}`);
    }
  }, [isInitialized, isAuthenticated, router]);

  /** 首次加载时从服务器同步数据 */
  useEffect(() => {
    if (isAuthenticated) {
      fetchFromServer();
    }
  }, [fetchFromServer, isAuthenticated]);

  /** 按时间从早到晚排序的记忆列表 */
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return ta - tb;
    });
  }, [memories]);

  /** 清理播放定时器 */
  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
    };
  }, []);

  /**
   * 开始播放：自动滚动并依次高亮每条记忆
   */
  const handlePlay = () => {
    if (sortedMemories.length === 0) return;
    setIsPlaying(true);
    setActiveIndex(0);
  };

  /**
   * 暂停播放
   */
  const handlePause = () => {
    setIsPlaying(false);
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
  };

  /**
   * 播放逻辑：当 activeIndex 变化时，滚动到对应卡片，
   * 并在延迟后高亮下一条
   */
  useEffect(() => {
    if (!isPlaying) return;
    if (activeIndex < 0 || activeIndex >= sortedMemories.length) {
      setIsPlaying(false);
      setActiveIndex(-1);
      return;
    }

    const memory = sortedMemories[activeIndex];
    const el = cardRefs.current[memory.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 每条记忆停留 2.5 秒后切换到下一条
    playTimerRef.current = setTimeout(() => {
      if (activeIndex + 1 < sortedMemories.length) {
        setActiveIndex(activeIndex + 1);
      } else {
        // 播放完毕
        setIsPlaying(false);
        setActiveIndex(-1);
      }
    }, 2500);

    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
    };
  }, [isPlaying, activeIndex, sortedMemories]);

  /** 切换展开/折叠 */
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  /** 格式化日期 */
  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  /** 截取内容摘要 */
  const getSummary = (content: string): string => {
    if (content.length <= 80) return content;
    return content.slice(0, 80) + '...';
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
            <p className="text-sm">{t('memory.verifying')}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ParticleBackground />
      <Header />

      <main className="relative z-10 min-h-screen px-4 pb-32 pt-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* ===== 顶部标题区 ===== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/memory')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-gold"
                aria-label={t('memoryReplay.back')}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="font-serif text-2xl text-gradient-gold sm:text-3xl">
                  {t('memoryReplay.title')}
                </h1>
                <p className="mt-0.5 text-xs text-text-dim sm:text-sm">
                  {t('memoryReplay.subtitle')}
                </p>
              </div>
            </div>

            {sortedMemories.length > 0 && (
              <Badge variant="gold" className="shrink-0">
                {t('memoryReplay.memoryCount', {
                  count: sortedMemories.length,
                })}
              </Badge>
            )}
          </motion.div>

          {/* ===== 空状态 ===== */}
          {sortedMemories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-bg-card/40 py-20 text-center"
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft">
                <Sparkles size={24} className="text-gold" />
              </span>
              <p className="text-sm text-text-soft">
                {t('memoryReplay.empty')}
              </p>
              <Button
                asChild
                variant="gold"
                size="md"
                className="mt-5"
              >
                <Link href="/memory">
                  <Sparkles size={16} />
                  {t('memoryReplay.recordNow')}
                </Link>
              </Button>
            </motion.div>
          ) : (
            <>
              {/* ===== 垂直时间轴 ===== */}
              <div className="relative">
                {/* 时间轴竖线 */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-dim via-border to-transparent" />

                <motion.div
                  initial="initial"
                  animate="animate"
                  variants={{
                    animate: {
                      transition: {
                        staggerChildren: 0.08,
                      },
                    },
                  }}
                  className="space-y-5"
                >
                  {sortedMemories.map((memory, index) => (
                    <ReplayCard
                      key={memory.id}
                      memory={memory}
                      isExpanded={expandedId === memory.id}
                      isActive={activeIndex === index}
                      onToggle={() => toggleExpand(memory.id)}
                      formatDate={formatDate}
                      getSummary={getSummary}
                      cardRef={(el) => {
                        cardRefs.current[memory.id] = el;
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ===== 底部播放按钮 ===== */}
      {sortedMemories.length > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[rgba(6,7,16,0.85)] backdrop-blur-md"
          >
            <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-3">
              {isPlaying ? (
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={handlePause}
                  className="w-full max-w-xs"
                >
                  <Pause size={16} />
                  {t('memoryReplay.pause')}
                </Button>
              ) : (
                <Button
                  variant="gold"
                  size="md"
                  type="button"
                  onClick={handlePlay}
                  className="w-full max-w-xs"
                >
                  <Play size={16} />
                  {t('memoryReplay.play')}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}

// ===== 子组件：记忆回放卡片 =====

interface ReplayCardProps {
  memory: MemoryItem;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  formatDate: (iso: string) => string;
  getSummary: (content: string) => string;
  cardRef: (el: HTMLDivElement | null) => void;
}

function ReplayCard({
  memory,
  isExpanded,
  isActive,
  onToggle,
  formatDate,
  getSummary,
  cardRef,
}: ReplayCardProps) {
  const emotionMeta = getEmotionMeta(memory.emotion);
  const planetMeta = getPlanetMeta(memory.category);

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: 'easeOut' },
        },
      }}
      ref={cardRef}
      className="relative pl-12"
    >
      {/* 时间轴节点 */}
      <div
        className={cn(
          'absolute left-[11px] top-5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300',
          isActive
            ? 'border-gold bg-gold shadow-[0_0_16px_var(--shadow-gold)]'
            : 'border-gold-dim bg-bg-card'
        )}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: isActive ? '#060710' : emotionMeta?.color,
          }}
        />
      </div>

      {/* 卡片主体 */}
      <motion.div
        animate={{
          scale: isActive ? 1.02 : 1,
          boxShadow: isActive
            ? '0 0 30px var(--shadow-gold)'
            : '0 0 0px rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={onToggle}
        className={cn(
          'cursor-pointer rounded-[14px] border bg-bg-card/80 p-4 backdrop-blur-sm transition-colors',
          isActive
            ? 'border-gold-dim'
            : 'border-border hover:border-gold-dim'
        )}
      >
        {/* 情感色调条 */}
        <div
          className="mb-3 h-0.5 w-full rounded-full"
          style={{ backgroundColor: emotionMeta?.color ?? '#c9a84c' }}
        />

        {/* 标题行 */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-base text-text sm:text-lg">
            {memory.title}
          </h3>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-0.5 shrink-0 text-text-dim"
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>

        {/* 日期 + 星球标签 */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-text-dim">
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(memory.date)}
          </span>
          {planetMeta && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: planetMeta.color }}
                />
                {planetMeta.name}
              </span>
            </>
          )}
          {emotionMeta && (
            <>
              <span>·</span>
              <span
                className="inline-flex items-center gap-1"
                style={{ color: emotionMeta.color }}
              >
                {emotionMeta.label}
              </span>
            </>
          )}
        </div>

        {/* 内容摘要 / 完整内容 */}
        <div className="mt-3">
          <p
            className={cn(
              'text-sm leading-relaxed text-text-soft',
              !isExpanded && 'line-clamp-2'
            )}
          >
            {isExpanded ? memory.content : getSummary(memory.content)}
          </p>
        </div>

        {/* 展开后的标签 */}
        <AnimatePresence>
          {isExpanded && memory.tags && memory.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex flex-wrap gap-1.5 overflow-hidden"
            >
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-bg-soft px-2 py-0.5 text-[11px] text-text-dim"
                >
                  #{tag}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

