'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Tag,
  Users,
  MessageSquare,
  FileText,
  GitBranch,
  FileX,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { cn, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type {
  HistoryEntry,
  CouncilType,
  DestinyReport,
  ReportDimension,
  Persona,
  Message,
  TimelineBranch,
} from '@/types';

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

const HISTORY_STORAGE_KEY = 'lifeverse-history';

/**
 * 灵活报告数据类型
 *
 * localStorage 中保存的命运报告可能包含比 DestinyReport 更丰富的字段
 * （如 personas、messages、timeline），这里做兼容处理。
 */
interface MeetingReportData extends Partial<DestinyReport> {
  personas?: Persona[];
  messages?: Message[];
  timeline?: TimelineBranch[];
}

// ===== Page Component =====

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [report, setReport] = useState<MeetingReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const recordId = params?.id as string;

  useEffect(() => {
    if (!recordId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let foundEntry: HistoryEntry | null = null;

    try {
      // 1. 从历史记录中查找对应条目
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory) as HistoryEntry[];
        if (Array.isArray(parsed)) {
          foundEntry = parsed.find((e) => e.id === recordId) ?? null;
        }
      }
    } catch {
      // ignore parse errors
    }

    if (!foundEntry) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setEntry(foundEntry);

    // 2. 读取命运报告（可能包含 personas / messages / timeline）
    let reportData: MeetingReportData | null = null;
    try {
      const storedReport = localStorage.getItem(`lifeverse-report-${recordId}`);
      if (storedReport) {
        reportData = JSON.parse(storedReport) as MeetingReportData;
      }
    } catch {
      // ignore parse errors
    }

    // 3. 读取独立保存的时间线（如果报告里没有）
    if (reportData && !reportData.timeline) {
      try {
        const storedTimeline = localStorage.getItem(
          `lifeverse-timeline-${recordId}`
        );
        if (storedTimeline) {
          const timeline = JSON.parse(storedTimeline) as TimelineBranch[];
          if (Array.isArray(timeline)) {
            reportData.timeline = timeline;
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    // 4. 尝试从 council-store 读取 personas / messages（当前会话）
    if (reportData && (!reportData.personas || !reportData.messages)) {
      try {
        const storedCouncil = localStorage.getItem('lifeverse-council');
        if (storedCouncil) {
          const parsed = JSON.parse(storedCouncil) as {
            state?: {
              councilId?: string;
              personas?: Persona[];
              messages?: Message[];
            };
          };
          const state = parsed?.state;
          if (state && state.councilId === foundEntry.councilId) {
            if (!reportData.personas && state.personas) {
              reportData.personas = state.personas;
            }
            if (!reportData.messages && state.messages) {
              reportData.messages = state.messages;
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    setReport(reportData);
    setLoading(false);
  }, [recordId]);

  // ===== 加载中 =====
  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center bg-bg pt-16">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-sm text-text-dim"
          >
            {t('history.loading')}
          </motion.div>
        </div>
      </>
    );
  }

  // ===== 记录不存在 =====
  if (notFound || !entry) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg pt-16">
          <FileX className="mb-4 h-16 w-16 text-text-dim" />
          <p className="mb-6 text-lg text-text-soft">
            {t('history.recordNotFound')}
          </p>
          <button
            onClick={() => router.push('/history')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-5 py-2 text-sm font-medium text-bg transition-colors hover:bg-gold-dim"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('history.backToHistory')}
          </button>
        </div>
      </>
    );
  }

  const typeColor = COUNCIL_TYPE_COLORS[entry.councilType];
  const typeLabel = t(COUNCIL_TYPE_LABELS[entry.councilType]);

  const personas = report?.personas ?? [];
  const messages = report?.messages ?? [];
  const dimensions: ReportDimension[] = report?.dimensions ?? [];
  const timeline: TimelineBranch[] = report?.timeline ?? [];
  const consensusPoints = report?.consensusPoints ?? [];
  const summary = report?.summary ?? entry.summary;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-bg pt-16">
        {/* Top bar */}
        <header className="sticky top-16 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <button
              onClick={() => router.push('/history')}
              className="inline-flex items-center gap-1.5 text-sm text-text-soft transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('history.backToHistory')}
            </button>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              {t('history.meetingRecord')}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl space-y-6"
          >
            {/* ===== 会议基本信息 ===== */}
            <section className="relative overflow-hidden rounded-lg border border-border bg-bg-card p-5">
              <div
                className="absolute left-0 top-0 h-full w-1"
                style={{ background: typeColor }}
              />
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${typeColor}20`, color: typeColor }}
                >
                  {typeLabel}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-text-dim">
                  <Clock className="h-3 w-3" />
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <h1 className="font-serif text-2xl text-text">
                <span className="text-gradient-gold">{entry.question}</span>
              </h1>
              {entry.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
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
            </section>

            {/* ===== 参与者列表 ===== */}
            {personas.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-dim">
                  <Users className="h-4 w-4" />
                  {t('history.participants')}
                  <span className="text-text-dim">({personas.length})</span>
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {personas.map((persona, index) => (
                    <motion.div
                      key={persona.id ?? index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-bg-card p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-sm font-bold text-gold">
                        {persona.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">
                          {persona.name}
                        </p>
                        {persona.philosophy && (
                          <p className="truncate text-xs text-text-dim">
                            {persona.philosophy}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* ===== 会议对话记录 ===== */}
            {messages.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-dim">
                  <MessageSquare className="h-4 w-4" />
                  {t('history.dialogueRecord')}
                  <span className="text-text-dim">({messages.length})</span>
                </h2>
                <div className="space-y-3">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const isSystem = msg.role === 'system';
                    return (
                      <motion.div
                        key={msg.id ?? index}
                        initial={{ opacity: 0, x: isUser ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        className={cn(
                          'flex flex-col gap-1 rounded-lg border p-3',
                          isUser
                            ? 'border-gold-dim/40 bg-gold-soft/10'
                            : isSystem
                              ? 'border-border bg-bg-soft/40'
                              : 'border-border bg-bg-card'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-xs font-medium',
                              isUser
                                ? 'text-gold'
                                : isSystem
                                  ? 'text-text-dim'
                                  : 'text-text-soft'
                            )}
                          >
                            {msg.personaName || (isUser ? 'You' : 'System')}
                          </span>
                          {msg.round > 0 && (
                            <span className="text-[10px] text-text-dim">
                              R{msg.round}
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-text-soft">
                          {msg.content}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ===== 命运报告摘要 ===== */}
            {(summary || dimensions.length > 0 || consensusPoints.length > 0) && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-dim">
                  <FileText className="h-4 w-4" />
                  {t('history.reportSummary')}
                </h2>

                {summary && (
                  <div className="mb-4 rounded-lg bg-bg-card/40 p-5">
                    <p className="text-sm leading-relaxed text-text-soft">
                      {summary}
                    </p>
                  </div>
                )}

                {dimensions.length > 0 && (
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {dimensions.map((dim, index) => (
                      <div
                        key={`${dim.title}-${index}`}
                        className="rounded-lg border border-border bg-bg-card p-4"
                      >
                        <h3 className="mb-2 text-sm font-semibold text-text">
                          {dim.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-text-soft">
                          {dim.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {consensusPoints.length > 0 && (
                  <div className="space-y-2">
                    {consensusPoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-border bg-bg-card/60 p-3"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <p className="text-sm leading-relaxed text-text-soft">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ===== 时间线分支 ===== */}
            {timeline.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-dim">
                  <GitBranch className="h-4 w-4" />
                  {t('history.timelineBranches')}
                </h2>
                <div className="relative space-y-3 border-l border-dashed border-border pl-4">
                  {timeline.map((branch, index) => (
                    <motion.div
                      key={`${branch.node}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                    >
                      <div className="absolute -left-[21px] top-2 h-3 w-3 rounded-full border-2 border-bg bg-gold" />
                      <div className="rounded-lg border border-border bg-bg-card p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gold">
                            {branch.label}
                          </span>
                          <div className="flex shrink-0 items-center gap-3 text-[10px]">
                            <span
                              className="flex items-center gap-1"
                              style={{ color: '#5de8a0' }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#5de8a0]" />
                              {t('council.destinyReport.indexHappiness')} {branch.happinessProb}%
                            </span>
                            <span
                              className="flex items-center gap-1"
                              style={{ color: '#e85d5d' }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#e85d5d]" />
                              {branch.regretProb}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-text-soft">
                          {branch.description}
                        </p>
                        {(branch.incomeChange || branch.growthRate) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {branch.incomeChange && (
                              <span className="rounded bg-bg-soft px-1.5 py-0.5 text-[10px] text-text-dim">
                                {branch.incomeChange}
                              </span>
                            )}
                            {branch.growthRate && (
                              <span className="rounded bg-bg-soft px-1.5 py-0.5 text-[10px] text-text-dim">
                                {branch.growthRate}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* ===== 底部操作 ===== */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push('/history')}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-soft transition-colors hover:border-gold-dim hover:text-gold card-hover"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('history.backToHistory')}
              </button>
              <button
                onClick={() => router.push('/council')}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-gold-dim glow-gold"
              >
                <Sparkles className="h-4 w-4" />
                {t('history.newCouncil')}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}
