'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  MapPin,
  Calendar,
  Users,
  Tag,
  Play,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { scaleIn, fadeIn } from '@/lib/motion/variants';
import { getEmotionMeta, getPlanetMeta } from '@/lib/mock-memories';
import type { MemoryItem, MemoryType } from '@/types';

/**
 * 记忆类型图标映射
 */
const TYPE_ICONS: Record<MemoryType, typeof ImageIcon> = {
  photo: ImageIcon,
  text: FileText,
  voice: Mic,
  video: Video,
};

/**
 * 记忆类型中文标签
 */
const TYPE_LABELS: Record<MemoryType, string> = {
  photo: '照片',
  text: '文字',
  voice: '语音',
  video: '视频',
};

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
      weekday: 'long',
    });
  } catch {
    return iso;
  }
}

/**
 * MemoryDetail 组件 Props
 */
export interface MemoryDetailProps {
  /** 当前查看的记忆（为 null 时不显示） */
  memory: MemoryItem | null;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 打开记忆对话回调（点击"记忆对话"按钮时触发） */
  onOpenDialogue?: (memory: MemoryItem) => void;
}

/**
 * 记忆详情弹窗组件
 *
 * 特性：
 * - Modal 弹窗，毛玻璃背景
 * - 展示记忆完整信息：标题、类型、日期、地点、人物、标签、情感、重要度
 * - "记忆回放"按钮（mock，点击显示提示）
 * - "记忆对话"按钮（打开 MemoryDialogue 组件）
 * - 关闭按钮
 * - 使用 AnimatePresence 做弹窗动画
 */
export function MemoryDetail({
  memory,
  onClose,
  onOpenDialogue,
}: MemoryDetailProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  /** 显示 mock 提示（自动消失） */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /** 处理"记忆对话"按钮点击 */
  const handleOpenDialogue = () => {
    if (!memory) return;
    if (onOpenDialogue) {
      onOpenDialogue(memory);
    } else {
      showToast('记忆对话功能需要从记忆星球页面打开');
    }
  };

  /** 处理"记忆回放"按钮点击：关闭详情弹窗后跳转到回放页面 */
  const handleReplay = () => {
    onClose();
    router.push('/memory/replay');
  };

  return (
    <AnimatePresence>
      {memory && (
        <motion.div
          key="memory-detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`记忆详情：${memory.title}`}
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
            className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[14px] border border-border bg-bg-card/90 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            {/* 顶部装饰条（情感色调） */}
            <div
              className="h-1 w-full rounded-t-[14px]"
              style={{
                backgroundColor:
                  getEmotionMeta(memory.emotion)?.color ?? '#c9a84c',
              }}
            />

            {/* 头部 */}
            <div className="flex items-start justify-between gap-4 p-6 pb-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft"
                  style={{
                    color: getEmotionMeta(memory.emotion)?.color,
                  }}
                >
                  {(() => {
                    const Icon = TYPE_ICONS[memory.type];
                    return <Icon size={20} />;
                  })()}
                </span>
                <div>
                  <h2 className="font-serif text-2xl text-text">
                    {memory.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-dim">
                    <span>{TYPE_LABELS[memory.type]}</span>
                    <span>·</span>
                    <span>{getPlanetMeta(memory.category)?.name}</span>
                  </div>
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-soft hover:text-gold"
              >
                <X size={18} />
              </button>
            </div>

            {/* 内容主体 */}
            <div className="space-y-5 px-6 pb-6">
              {/* 记忆内容 */}
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="rounded-lg border border-border bg-bg-soft/60 p-4"
              >
                <p className="text-sm leading-relaxed text-text-soft">
                  {memory.content}
                </p>
              </motion.div>

              {/* 元信息网格 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* 日期 */}
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-soft/40 p-3">
                  <Calendar size={16} className="shrink-0 text-gold" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-dim">日期</p>
                    <p className="truncate text-xs text-text">
                      {formatMemoryDateLong(memory.date)}
                    </p>
                  </div>
                </div>

                {/* 地点 */}
                {memory.location && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-soft/40 p-3">
                    <MapPin size={16} className="shrink-0 text-gold" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-dim">地点</p>
                      <p className="truncate text-xs text-text">
                        {memory.location}
                      </p>
                    </div>
                  </div>
                )}

                {/* 人物 */}
                {memory.people && memory.people.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-bg-soft/40 p-3 sm:col-span-2">
                    <Users size={16} className="mt-0.5 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-text-dim">人物</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
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

                {/* 标签 */}
                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-bg-soft/40 p-3 sm:col-span-2">
                    <Tag size={16} className="mt-0.5 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-text-dim">标签</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {memory.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-bg-card px-2 py-0.5 text-[11px] text-text-soft"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 情感 + 重要度 */}
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-soft/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-dim">情感色调</span>
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

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-dim">重要度</span>
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-card">
                    <span
                      className="block h-full rounded-full bg-gold"
                      style={{
                        width: `${Math.round(memory.importance * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="text-[11px] text-text-soft">
                    {Math.round(memory.importance * 100)}%
                  </span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="gold"
                  size="md"
                  type="button"
                  onClick={handleReplay}
                >
                  <Play size={16} />
                  记忆回放
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={handleOpenDialogue}
                >
                  <MessageCircle size={16} />
                  记忆对话
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  type="button"
                  onClick={() => showToast('已加入收藏（mock）')}
                >
                  <Heart size={16} />
                  收藏
                </Button>
              </div>
            </div>

            {/* Toast 提示 */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={cn(
                    'pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2',
                    'rounded-full border border-gold-dim bg-bg-card/95 px-4 py-2 text-xs text-gold shadow-[0_4px_20px_var(--shadow-gold)]'
                  )}
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MemoryDetail;
