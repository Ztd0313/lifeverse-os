'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  BookHeart,
  Plus,
  Pencil,
  Trash2,
  MessageCircleHeart,
  X,
  Clock,
  Check,
  Target,
  Star,
} from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useDreamStore,
  type DreamEntry,
  type DreamCategory,
  type DreamStatus,
} from '@/stores/dream-store';
import { useTranslation } from '@/lib/i18n';
import { fadeInUp, staggerContainer, cardItem } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

// ===== 类别与状态配置 =====

/** 类别图标与配色 */
const CATEGORY_CONFIG: Record<
  DreamCategory,
  { icon: typeof Star; color: string }
> = {
  childhood: { icon: BookHeart, color: '#c9a84c' },
  career: { icon: Target, color: '#5da0e8' },
  life: { icon: Star, color: '#5de8a0' },
  creative: { icon: Sparkles, color: '#b8a0c8' },
  other: { icon: Clock, color: '#9a9a9a' },
};

/** 状态配色 */
const STATUS_CONFIG: Record<
  DreamStatus,
  { variant: 'gold' | 'blue' | 'green' | 'red' }
> = {
  dreaming: { variant: 'gold' },
  pursuing: { variant: 'blue' },
  achieved: { variant: 'green' },
  abandoned: { variant: 'red' },
};

/** 所有类别选项 */
const CATEGORY_OPTIONS: DreamCategory[] = [
  'childhood',
  'career',
  'life',
  'creative',
  'other',
];

/** 所有状态选项 */
const STATUS_OPTIONS: DreamStatus[] = [
  'dreaming',
  'pursuing',
  'achieved',
  'abandoned',
];

/** 状态可循环切换的顺序（点击状态标签时切换到下一个） */
const STATUS_CYCLE: DreamStatus[] = [
  'dreaming',
  'pursuing',
  'achieved',
  'abandoned',
];

// ===== 主页面 =====

/**
 * 梦想档案页面 Dream Archive
 *
 * 让用户记录童年梦想、人生目标，生成梦想时间轴，并可以与儿时的自己对话。
 *
 * 结构：
 * 1. ParticleBackground + Header
 * 2. Hero 区：标题 + 副标题 + "记录梦想"按钮 + "与儿时的自己对话"入口
 * 3. 梦想统计：总梦想数、已实现数、追梦中数
 * 4. 梦想时间轴：按时间排序展示所有梦想
 * 5. 添加/编辑梦想表单（弹窗）
 * 6. 空状态引导
 *
 * 深色主题，金色点缀，使用 Framer Motion 动画。
 */
export default function DreamPage() {
  const { t } = useTranslation();
  const {
    dreams,
    isFormOpen,
    editingDream,
    addDream,
    updateDream,
    deleteDream,
    openForm,
    openEditForm,
    closeForm,
  } = useDreamStore();

  /** 按时间排序的梦想列表（从早到晚） */
  const sortedDreams = React.useMemo(() => {
    return [...dreams].sort((a, b) => {
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, [dreams]);

  /** 统计数据 */
  const stats = React.useMemo(() => {
    const achieved = dreams.filter((d) => d.status === 'achieved').length;
    const pursuing = dreams.filter((d) => d.status === 'pursuing').length;
    return { total: dreams.length, achieved, pursuing };
  }, [dreams]);

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

  /** 删除梦想（带确认） */
  const handleDelete = (dream: DreamEntry) => {
    if (
      window.confirm(
        `${t('dreamArchive.delete')}：${dream.title}？`
      )
    ) {
      deleteDream(dream.id);
    }
  };

  /** 循环切换梦想状态 */
  const handleCycleStatus = (dream: DreamEntry) => {
    const currentIndex = STATUS_CYCLE.indexOf(dream.status);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    updateDream(dream.id, { status: nextStatus });
  };

  return (
    <>
      <ParticleBackground />
      <Header />

      <main className="relative z-10 min-h-screen bg-[#060710] px-4 pb-24 pt-24 sm:px-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-4xl space-y-8"
        >
          {/* ===== Hero 区域 ===== */}
          <motion.section
            variants={fadeInUp}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-dim bg-gold-soft/30 px-4 py-1.5">
              <BookHeart size={14} className="text-gold" />
              <span className="text-xs font-medium text-gold">
                Dream Archive
              </span>
            </div>

            <h1 className="font-serif text-3xl text-gradient-gold sm:text-4xl md:text-5xl">
              {t('dreamArchive.title')}
            </h1>
            <p className="max-w-2xl text-sm text-text-soft sm:text-base">
              {t('dreamArchive.subtitle')}
            </p>

            {/* 操作按钮组 */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="gold"
                size="md"
                type="button"
                onClick={openForm}
              >
                <Plus size={16} />
                {t('dreamArchive.recordDream')}
              </Button>
              <Button asChild variant="secondary" size="md">
                <Link href="/dream/dialogue">
                  <MessageCircleHeart size={16} />
                  {t('dreamArchive.dialogueWithChild')}
                </Link>
              </Button>
            </div>
          </motion.section>

          {/* ===== 梦想统计 ===== */}
          {dreams.length > 0 && (
            <motion.section
              variants={fadeInUp}
              className="grid grid-cols-3 gap-3"
            >
              <StatCard
                icon={Star}
                label={t('dreamArchive.totalDreams')}
                value={stats.total}
                color="#c9a84c"
              />
              <StatCard
                icon={Check}
                label={t('dreamArchive.achieved')}
                value={stats.achieved}
                color="#5de8a0"
              />
              <StatCard
                icon={Target}
                label={t('dreamArchive.pursuing')}
                value={stats.pursuing}
                color="#5da0e8"
              />
            </motion.section>
          )}

          {/* ===== 梦想时间轴 / 空状态 ===== */}
          {dreams.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-bg-card/40 py-20 text-center"
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft">
                <BookHeart size={24} className="text-gold" />
              </span>
              <p className="text-sm text-text-soft">
                {t('dreamArchive.emptyDream')}
              </p>
              <Button
                variant="gold"
                size="md"
                type="button"
                onClick={openForm}
                className="mt-5"
              >
                <Plus size={16} />
                {t('dreamArchive.recordDream')}
              </Button>
            </motion.div>
          ) : (
            <motion.section variants={fadeInUp}>
              <h2 className="mb-5 flex items-center gap-2 font-serif text-xl text-text">
                <Clock size={18} className="text-gold" />
                {t('dreamArchive.dreamTimeline')}
              </h2>

              <div className="relative">
                {/* 时间轴竖线 */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-dim via-border to-transparent" />

                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-5"
                >
                  {sortedDreams.map((dream) => (
                    <DreamTimelineCard
                      key={dream.id}
                      dream={dream}
                      formatDate={formatDate}
                      onEdit={() => openEditForm(dream)}
                      onDelete={() => handleDelete(dream)}
                      onCycleStatus={() => handleCycleStatus(dream)}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* ===== 返回首页 ===== */}
          <motion.div variants={fadeInUp} className="flex justify-center">
            <Button asChild variant="ghost" size="md">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                {t('innerDialogue.backHome')}
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* ===== 添加/编辑梦想表单弹窗 ===== */}
      <AnimatePresence>
        {isFormOpen && (
          <DreamFormModal
            editingDream={editingDream}
            onClose={closeForm}
            onSubmit={(data) => {
              if (editingDream) {
                updateDream(editingDream.id, data);
              } else {
                addDream(data);
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ===== 子组件：统计卡片 =====

interface StatCardProps {
  icon: typeof Star;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card className="flex flex-col items-center gap-1.5 py-4 text-center">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={18} />
      </span>
      <span className="font-serif text-2xl text-text">{value}</span>
      <span className="text-[11px] text-text-dim">{label}</span>
    </Card>
  );
}

// ===== 子组件：梦想时间轴卡片 =====

interface DreamTimelineCardProps {
  dream: DreamEntry;
  formatDate: (iso: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: () => void;
}

function DreamTimelineCard({
  dream,
  formatDate,
  onEdit,
  onDelete,
  onCycleStatus,
}: DreamTimelineCardProps) {
  const { t } = useTranslation();
  const catConfig = CATEGORY_CONFIG[dream.category];
  const statusConfig = STATUS_CONFIG[dream.status];
  const CatIcon = catConfig.icon;

  /** 状态翻译 key 映射 */
  const statusLabelKey: Record<DreamStatus, string> = {
    dreaming: 'dreamArchive.dreaming',
    pursuing: 'dreamArchive.pursuingStatus',
    achieved: 'dreamArchive.achievedStatus',
    abandoned: 'dreamArchive.abandoned',
  };

  /** 类别翻译 key 映射 */
  const categoryLabelKey: Record<DreamCategory, string> = {
    childhood: 'dreamArchive.childhood',
    career: 'dreamArchive.career',
    life: 'dreamArchive.life',
    creative: 'dreamArchive.creative',
    other: 'dreamArchive.other',
  };

  return (
    <motion.div variants={cardItem} className="relative pl-12">
      {/* 时间轴节点 */}
      <div
        className="absolute left-[11px] top-5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gold-dim bg-bg-card"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: catConfig.color }}
        />
      </div>

      <Card className="group">
        {/* 标题行 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${catConfig.color}20`,
                color: catConfig.color,
              }}
            >
              <CatIcon size={16} />
            </span>
            <div>
              <h3 className="font-serif text-base text-text sm:text-lg">
                {dream.title}
              </h3>
              {dream.ageAtDream != null && (
                <p className="mt-0.5 text-[11px] text-gold">
                  {dream.ageAtDream} · {t('dreamArchive.ageAtDream')}
                </p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={t('dreamArchive.edit')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-bg-soft hover:text-gold"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={t('dreamArchive.delete')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-bg-soft hover:text-red"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* 描述 */}
        <p className="mt-3 text-sm leading-relaxed text-text-soft">
          {dream.description}
        </p>

        {/* 标签行 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* 类别标签 */}
          <Badge variant="gold" className="text-[11px]">
            {t(categoryLabelKey[dream.category])}
          </Badge>

          {/* 状态标签（可点击切换） */}
          <button
            type="button"
            onClick={onCycleStatus}
            title={t('dreamArchive.status')}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <Badge
              variant={statusConfig.variant}
              className="text-[11px]"
            >
              {t(statusLabelKey[dream.status])}
            </Badge>
          </button>

          {/* 创建时间 */}
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-text-dim">
            <Clock size={11} />
            {formatDate(dream.createdAt)}
          </span>
        </div>

        {/* 实现时间 */}
        {dream.status === 'achieved' && dream.achievedAt && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green">
            <Check size={11} />
            {formatDate(dream.achievedAt)}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ===== 子组件：梦想表单弹窗 =====

interface DreamFormModalProps {
  editingDream: DreamEntry | null;
  onClose: () => void;
  onSubmit: (data: Omit<DreamEntry, 'id' | 'createdAt'>) => void;
}

function DreamFormModal({
  editingDream,
  onClose,
  onSubmit,
}: DreamFormModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = React.useState(editingDream?.title ?? '');
  const [description, setDescription] = React.useState(
    editingDream?.description ?? ''
  );
  const [category, setCategory] = React.useState<DreamCategory>(
    editingDream?.category ?? 'childhood'
  );
  const [status, setStatus] = React.useState<DreamStatus>(
    editingDream?.status ?? 'dreaming'
  );
  const [ageAtDream, setAgeAtDream] = React.useState<string>(
    editingDream?.ageAtDream != null ? String(editingDream.ageAtDream) : ''
  );

  /** 状态翻译 key 映射 */
  const statusLabelKey: Record<DreamStatus, string> = {
    dreaming: 'dreamArchive.dreaming',
    pursuing: 'dreamArchive.pursuingStatus',
    achieved: 'dreamArchive.achievedStatus',
    abandoned: 'dreamArchive.abandoned',
  };

  /** 类别翻译 key 映射 */
  const categoryLabelKey: Record<DreamCategory, string> = {
    childhood: 'dreamArchive.childhood',
    career: 'dreamArchive.career',
    life: 'dreamArchive.life',
    creative: 'dreamArchive.creative',
    other: 'dreamArchive.other',
  };

  /** 提交表单 */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const ageNum = ageAtDream.trim()
      ? Number(ageAtDream.trim())
      : undefined;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      ageAtDream:
        ageNum != null && !isNaN(ageNum) && ageNum > 0 ? ageNum : undefined,
    });
  };

  return (
    <motion.div
      key="dream-form-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* 毛玻璃背景 */}
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-md" />

      {/* 弹窗主体 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[14px] border border-border bg-bg-card/90 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        {/* 顶部装饰条 */}
        <div className="h-1 w-full rounded-t-[14px] bg-gradient-to-r from-gold-dim via-gold to-gold-dim" />

        {/* 头部 */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-serif text-xl text-text">
            {editingDream
              ? t('dreamArchive.edit')
              : t('dreamArchive.recordDream')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('dreamArchive.cancel')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-soft hover:text-gold"
          >
            <X size={18} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          {/* 梦想标题 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-soft">
              {t('dreamArchive.dreamTitle')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={50}
              className="w-full rounded-lg border border-border bg-bg-soft/60 px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
              placeholder={t('dreamArchive.dreamTitle')}
            />
          </div>

          {/* 梦想描述 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-soft">
              {t('dreamArchive.dreamDescription')} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-bg-soft/60 px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
              placeholder={t('dreamArchive.dreamDescription')}
            />
          </div>

          {/* 类别选择 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-soft">
              {t('dreamArchive.category')}
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    category === cat
                      ? 'border-gold-dim bg-gold-soft text-gold'
                      : 'border-border bg-bg-soft/40 text-text-dim hover:border-gold-dim'
                  )}
                >
                  {t(categoryLabelKey[cat])}
                </button>
              ))}
            </div>
          </div>

          {/* 状态选择 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-soft">
              {t('dreamArchive.status')}
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    status === st
                      ? 'border-gold-dim bg-gold-soft text-gold'
                      : 'border-border bg-bg-soft/40 text-text-dim hover:border-gold-dim'
                  )}
                >
                  {t(statusLabelKey[st])}
                </button>
              ))}
            </div>
          </div>

          {/* 做梦想时的年龄 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-soft">
              {t('dreamArchive.ageAtDream')}
            </label>
            <input
              type="number"
              value={ageAtDream}
              onChange={(e) => setAgeAtDream(e.target.value)}
              min={1}
              max={120}
              className="w-full rounded-lg border border-border bg-bg-soft/60 px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
              placeholder={t('dreamArchive.ageAtDream')}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={onClose}
            >
              {t('dreamArchive.cancel')}
            </Button>
            <Button
              variant="gold"
              size="md"
              type="submit"
              disabled={!title.trim() || !description.trim()}
            >
              {t('dreamArchive.save')}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

