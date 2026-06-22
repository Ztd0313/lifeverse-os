'use client';

import { motion } from 'framer-motion';
import { Image, FileText, Mic, Video, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { cardItem } from '@/lib/motion/variants';
import { getEmotionMeta, getPlanetMeta } from '@/lib/mock-memories';
import type { MemoryItem, MemoryType } from '@/types';

/**
 * 记忆类型图标映射
 */
const TYPE_ICONS: Record<MemoryType, typeof Image> = {
  photo: Image,
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
 * 将 ISO 日期字符串格式化为中文短日期
 */
function formatMemoryDate(iso: string): string {
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
 * MemoryCard 组件 Props
 */
export interface MemoryCardProps {
  /** 记忆数据 */
  memory: MemoryItem;
  /** 点击卡片回调（打开详情弹窗） */
  onClick?: (memory: MemoryItem) => void;
}

/**
 * 记忆卡片组件
 *
 * 展示一条记忆的概要信息：
 * - 标题
 * - 类型图标
 * - 日期
 * - 地点
 * - 情感色调（用边框颜色表示：暖=金色，冷=蓝色，中性=灰色）
 * - 重要度（用底部进度条表示）
 *
 * 鼠标悬停时上浮 + 金色光晕，点击触发详情弹窗。
 */
export function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const TypeIcon = TYPE_ICONS[memory.type];
  const emotion = getEmotionMeta(memory.emotion);
  const planet = getPlanetMeta(memory.category);

  /** 情感色调对应的边框样式 */
  const emotionBorderClass =
    memory.emotion === 'warm'
      ? 'border-gold'
      : memory.emotion === 'cool'
        ? 'border-blue'
        : 'border-border';

  /** 情感色调对应的徽章变体 */
  const emotionBadgeVariant =
    memory.emotion === 'warm'
      ? 'gold'
      : memory.emotion === 'cool'
        ? 'blue'
        : ('orange' as const);

  return (
    <motion.div variants={cardItem}>
      <Card
        hover={false}
        onClick={() => onClick?.(memory)}
        className={cn(
          'group relative cursor-pointer overflow-hidden border-l-2 p-5 transition-all duration-300',
          'hover:-translate-y-1 hover:shadow-[0_8px_32px_var(--shadow-gold)]',
          emotionBorderClass
        )}
      >
        {/* 顶部：类型图标 + 情感徽章 */}
        <div className="mb-3 flex items-start justify-between">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-soft text-text-soft transition-colors group-hover:bg-gold-soft group-hover:text-gold"
            aria-label={`记忆类型：${TYPE_LABELS[memory.type]}`}
          >
            <TypeIcon size={16} />
          </span>

          <div className="flex items-center gap-1.5">
            {emotion && (
              <Badge variant={emotionBadgeVariant}>
                {emotion.label}
              </Badge>
            )}
          </div>
        </div>

        {/* 标题 */}
        <h3 className="mb-2 line-clamp-2 font-serif text-lg text-text transition-colors group-hover:text-gold">
          {memory.title}
        </h3>

        {/* 内容摘要 */}
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-text-soft">
          {memory.content}
        </p>

        {/* 元信息：日期 + 地点 */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-dim">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            {formatMemoryDate(memory.date)}
          </span>
          {memory.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {memory.location}
            </span>
          )}
        </div>

        {/* 标签 */}
        {memory.tags && memory.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {memory.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-bg-soft px-2 py-0.5 text-[10px] text-text-dim"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部：星球归属 + 重要度 */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-text-dim">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: planet?.color }}
              aria-hidden
            />
            {planet?.name}
          </span>

          {/* 重要度进度条 */}
          <span
            className="inline-flex items-center gap-1.5"
            title={`重要度 ${Math.round(memory.importance * 100)}%`}
          >
            <span className="text-[10px] text-text-dim">重要度</span>
            <span className="h-1 w-12 overflow-hidden rounded-full bg-bg-soft">
              <span
                className="block h-full rounded-full bg-gold"
                style={{ width: `${Math.round(memory.importance * 100)}%` }}
              />
            </span>
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

export default MemoryCard;
