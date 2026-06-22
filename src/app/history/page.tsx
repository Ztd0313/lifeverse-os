'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Star, MessageSquare, Sparkles } from 'lucide-react';
import HistoryList from '@/components/council/HistoryList';
import { Header } from '@/components/layout/Header';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { HistoryEntry } from '@/types';
import { useTranslation } from '@/lib/i18n';

// ===== Mock data for demo =====

const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: 'hist-1',
    userId: 'user-1',
    councilId: 'council-1',
    councilType: 'wisdom',
    question: '要不要辞职创业？',
    summary:
      '议会建议采取渐进式创业策略，保留主业现金流，用业余时间验证创业想法。设定6个月期限。',
    tags: ['职业', '创业', '决策'],
    favorited: true,
    createdAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'hist-2',
    userId: 'user-1',
    councilId: 'council-2',
    councilType: 'future',
    question: '5年后的我会是什么样子？',
    summary:
      '未来议会推演出3条可能路径：稳健发展、激进创业、平衡生活。每条路径的幸福概率各不相同。',
    tags: ['未来', '人生方向'],
    favorited: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'hist-3',
    userId: 'user-1',
    councilId: 'council-3',
    councilType: 'wisdom',
    question: '该不该接受这份新工作offer？',
    summary:
      '薪资提升30%但需要加班。议会建议评估长期成长性而非短期薪资，关注工作内容的匹配度。',
    tags: ['职业', '跳槽'],
    favorited: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'hist-4',
    userId: 'user-1',
    councilId: 'council-4',
    councilType: 'inner',
    question: '我真正想要的是什么？',
    summary:
      '内心议会揭示了野心与安全感的拉锯。理性建议设定阶段性目标，爱提醒关注情感需求。',
    tags: ['自我认知', '成长'],
    favorited: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'hist-5',
    userId: 'user-1',
    councilId: 'council-5',
    councilType: 'reunion',
    question: '如果父亲还在，他会怎么建议我？',
    summary:
      '重逢议会模拟了父亲的视角：稳重、保护、不善表达但深爱。建议在重大决定前想想家人的期望。',
    tags: ['家庭', '关系'],
    favorited: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
];

const STORAGE_KEY = 'lifeverse-history';

export default function HistoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null);

  // Load history from localStorage or use mock data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
        } else {
          setEntries(MOCK_HISTORY);
        }
      } else {
        // First visit: seed with mock data
        setEntries(MOCK_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_HISTORY));
      }
    } catch {
      setEntries(MOCK_HISTORY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage when entries change
  const saveToStorage = useCallback((updated: HistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage might be full or unavailable
    }
  }, []);

  const handleSelect = (entry: HistoryEntry) => {
    router.push(`/history/${entry.id}`);
  };

  const handleDelete = (entry: HistoryEntry) => {
    setDeleteTarget(entry);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = entries.filter((e) => e.id !== deleteTarget.id);
    setEntries(updated);
    saveToStorage(updated);
    setDeleteTarget(null);
  };

  const handleFavorite = (id: string) => {
    const updated = entries.map((e) =>
      e.id === id ? { ...e, favorited: !e.favorited } : e
    );
    setEntries(updated);
    saveToStorage(updated);
  };

  // Calculate stats
  const totalCouncils = entries.length;
  const favoriteCount = entries.filter((e) => e.favorited).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm text-text-dim"
        >
          {t('history.loading')}
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-bg pt-16">
      {/* Top bar */}
      <header className="sticky top-16 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-sm text-text-soft transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('history.backHome')}
          </button>
          <button
            onClick={() => router.push('/council')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold-soft px-3 py-1.5 text-sm text-gold transition-colors hover:bg-gold hover:text-bg"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t('history.newCouncil')}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-8">
        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-8 max-w-3xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-soft">
              <BookOpen className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-text">
                <span className="text-gradient-gold">{t('history.title')}</span>
              </h1>
              <p className="text-xs text-text-dim">
                {t('history.subtitle')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-bg-card p-4">
              <div className="flex items-center gap-2 text-text-dim">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{t('history.totalCouncils')}</span>
              </div>
              <p className="mt-1 font-serif text-2xl font-bold text-text">
                {totalCouncils}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-bg-card p-4">
              <div className="flex items-center gap-2 text-text-dim">
                <Star className="h-4 w-4" />
                <span className="text-xs">{t('history.favorites')}</span>
              </div>
              <p className="mt-1 font-serif text-2xl font-bold text-gold">
                {favoriteCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-bg-card p-4 sm:col-span-1">
              <div className="flex items-center gap-2 text-text-dim">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">{t('history.councilTypes')}</span>
              </div>
              <p className="mt-1 font-serif text-2xl font-bold text-text">
                {new Set(entries.map((e) => e.councilType)).size}
              </p>
            </div>
          </div>
        </motion.div>

        {/* History list */}
        <HistoryList
          entries={entries}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onFavorite={handleFavorite}
        />
      </main>
    </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('history.confirmDelete')}
        message={t('history.confirmDeleteDesc')}
        confirmText={t('history.delete')}
        cancelText={t('history.cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
