'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Search,
  Star,
  Trash2,
  Clock,
  Tag,
  MessageSquare,
  X,
  Sparkles,
} from 'lucide-react';
import type { HistoryEntry, CouncilType } from '@/types';
import { cn, formatDate, truncate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// ===== Council Type Labels =====

const COUNCIL_TYPE_LABELS: Record<CouncilType, string> = {
  wisdom: 'council.historyList.typeWisdom',
  future: 'council.historyList.typeFuture',
  inner: 'council.historyList.typeInner',
  reunion: 'council.historyList.typeReunion',
};

const COUNCIL_TYPE_COLORS: Record<CouncilType, string> = {
  wisdom: '#c9a84c',
  future: '#5da0e8',
  inner: '#b8a0c8',
  reunion: '#5de8a0',
};

// ===== Animation Variants =====

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ===== Props =====

interface HistoryListProps {
  entries: HistoryEntry[];
  onSelect?: (entry: HistoryEntry) => void;
  onDelete?: (id: string) => void;
  onFavorite?: (id: string) => void;
}

// ===== History Card Component =====

interface HistoryCardProps {
  entry: HistoryEntry;
  onSelect?: (entry: HistoryEntry) => void;
  onDelete?: (id: string) => void;
  onFavorite?: (id: string) => void;
}

function HistoryCard({ entry, onSelect, onDelete, onFavorite }: HistoryCardProps) {
  const { t } = useTranslation();
  const typeColor = COUNCIL_TYPE_COLORS[entry.councilType];
  const typeLabel = t(COUNCIL_TYPE_LABELS[entry.councilType]);

  return (
    <motion.div
      layout
      variants={itemVariants}
      exit="exit"
      className="group relative"
    >
      {/* Timeline dot */}
      <div className="absolute left-[-20px] sm:left-[-28px] top-6 z-10">
        <motion.div
          className="h-3 w-3 rounded-full border-2 border-bg"
          style={{ background: typeColor }}
          whileHover={{ scale: 1.3 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
        <div
          className="absolute inset-0 rounded-full opacity-50 blur-sm"
          style={{ background: typeColor }}
        />
      </div>

      {/* Card */}
      <div
        className="cursor-pointer rounded-lg border border-border bg-bg-card p-4 card-hover"
        onClick={() => onSelect?.(entry)}
      >
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: `${typeColor}20`,
                color: typeColor,
              }}
            >
              {typeLabel}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-text-dim">
              <Clock className="h-3 w-3" />
              {formatDate(entry.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.(entry.id);
              }}
              className="rounded p-1 transition-colors hover:bg-gold-soft"
              aria-label={entry.favorited ? t('council.historyList.unfavorite') : t('council.historyList.favorite')}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={entry.favorited ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Star
                  className={cn(
                    'h-4 w-4 transition-colors',
                    entry.favorited
                      ? 'fill-gold text-gold'
                      : 'text-text-dim hover:text-gold'
                  )}
                />
              </motion.div>
            </button>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(entry.id);
              }}
              className="rounded p-1 transition-colors hover:bg-red/10"
              aria-label={t('council.historyList.delete')}
            >
              <Trash2 className="h-4 w-4 text-text-dim transition-colors hover:text-red" />
            </button>
          </div>
        </div>

        {/* Question */}
        <h3 className="mb-1 text-sm font-medium text-text">
          {truncate(entry.question, 60)}
        </h3>

        {/* Summary */}
        {entry.summary && (
          <p className="mb-3 text-xs leading-relaxed text-text-soft">
            {truncate(entry.summary, 120)}
          </p>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 text-text-dim" />
            {entry.tags.map((tag, index) => (
              <span
                key={index}
                className="rounded bg-bg-soft px-1.5 py-0.5 text-[10px] text-text-dim"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== Main Component =====

export default function HistoryList({
  entries,
  onSelect,
  onDelete,
  onFavorite,
}: HistoryListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          entry.question.toLowerCase().includes(query) ||
          entry.summary.toLowerCase().includes(query) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Tag filter
      if (activeTag && !entry.tags.includes(activeTag)) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, activeTag]);

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative mb-6"
        >
          {/* 装饰性 SVG 插画：星空中的空卷轴 */}
          <svg
            width="160"
            height="120"
            viewBox="0 0 160 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="opacity-80"
          >
            {/* 星点 */}
            <circle cx="20" cy="20" r="1.5" fill="#c9a84c" opacity="0.6" />
            <circle cx="140" cy="30" r="1" fill="#c9a84c" opacity="0.4" />
            <circle cx="30" cy="90" r="1.2" fill="#c9a84c" opacity="0.5" />
            <circle cx="130" cy="100" r="1.5" fill="#c9a84c" opacity="0.6" />
            <circle cx="80" cy="15" r="1" fill="#c9a84c" opacity="0.3" />

            {/* 卷轴主体 */}
            <rect
              x="50"
              y="35"
              width="60"
              height="60"
              rx="6"
              stroke="#c9a84c"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.5"
            />
            {/* 卷轴内的空行 */}
            <line x1="62" y1="50" x2="98" y2="50" stroke="#c9a84c" strokeWidth="1" opacity="0.3" />
            <line x1="62" y1="62" x2="90" y2="62" stroke="#c9a84c" strokeWidth="1" opacity="0.3" />
            <line x1="62" y1="74" x2="95" y2="74" stroke="#c9a84c" strokeWidth="1" opacity="0.3" />

            {/* 中心收件箱图标（SVG path） */}
            <path
              d="M75 58 h10 v6 h-10 z M75 64 h10 M80 58 v6"
              stroke="#c9a84c"
              strokeWidth="1.2"
              fill="none"
              opacity="0.6"
            />
          </svg>

          {/* 光晕 */}
          <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
        </motion.div>

        <h3 className="mb-2 h-title text-xl text-text">
          {t('council.historyList.emptyTitle')}
        </h3>
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-text-dim">
          {t('council.historyList.emptyDesc')}
        </p>

        {/* CTA 按钮组 */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/council/wisdom"
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-gold px-6 py-2.5 text-sm font-medium text-bg transition-all hover:shadow-[0_0_20px_var(--shadow-gold-strong)]"
          >
            <Sparkles className="h-4 w-4" />
            {t('council.historyList.startWisdom')}
          </Link>
          <Link
            href="/council/future"
            className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-border bg-bg-card px-6 py-2.5 text-sm font-medium text-text-soft transition-all hover:border-gold-dim hover:text-gold"
          >
            <Clock className="h-4 w-4" />
            {t('council.historyList.startFuture')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* Search & Filter Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('council.historyList.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-bg-card py-2.5 pl-10 pr-10 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
              aria-label={t('council.historyList.clearSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                'rounded-full px-3 py-1 text-xs transition-colors',
                activeTag === null
                  ? 'bg-gold text-bg'
                  : 'border border-border bg-bg-card text-text-dim hover:text-gold'
              )}
            >
              {t('council.historyList.all')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  activeTag === tag
                    ? 'bg-gold text-bg'
                    : 'border border-border bg-bg-card text-text-dim hover:text-gold'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs text-text-dim">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>
          {t('council.historyList.recordCount', { filtered: filteredEntries.length, total: entries.length })}
        </span>
      </div>

      {/* Timeline list */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-text-dim" />
          <p className="text-sm text-text-dim">
            {t('council.historyList.noMatch', { query: searchQuery })}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTag(null);
            }}
            className="mt-3 text-xs text-gold hover:underline"
          >
            {t('council.historyList.clearFilter')}
          </button>
        </div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="relative space-y-3 border-l border-dashed border-border pl-4 sm:pl-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onSelect={onSelect}
                onDelete={onDelete}
                onFavorite={onFavorite}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
