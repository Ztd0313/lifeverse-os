'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate, type Variants } from 'framer-motion';
import {
  Share2,
  Save,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Heart,
  Lightbulb,
  Handshake,
  RotateCcw,
} from 'lucide-react';
import type { DestinyReport, ReportIndices } from '@/types';
import { cn, formatDate } from '@/lib/utils';

// ===== Index Configuration =====

interface IndexConfig {
  key: keyof ReportIndices;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const INDEX_CONFIG: IndexConfig[] = [
  {
    key: 'conflict',
    label: '冲突值',
    color: '#e85d5d',
    bgColor: 'rgba(232, 93, 93, 0.12)',
    description: '议会内部的分歧程度',
  },
  {
    key: 'growth',
    label: '成长值',
    color: '#5de8a0',
    bgColor: 'rgba(93, 232, 160, 0.12)',
    description: '个人成长潜力',
  },
  {
    key: 'happiness',
    label: '幸福值',
    color: '#c9a84c',
    bgColor: 'rgba(201, 168, 76, 0.12)',
    description: '预期幸福水平',
  },
  {
    key: 'freedom',
    label: '自由值',
    color: '#5da0e8',
    bgColor: 'rgba(93, 160, 232, 0.12)',
    description: '选择自由度',
  },
  {
    key: 'stability',
    label: '稳定值',
    color: '#e8a05d',
    bgColor: 'rgba(232, 160, 93, 0.12)',
    description: '生活稳定性',
  },
];

// ===== Dimension Icon Mapping =====

const DIMENSION_ICONS: Record<string, typeof AlertTriangle> = {
  风险分析: AlertTriangle,
  后悔概率: RotateCcw,
  长期收益: TrendingUp,
  幸福指数: Heart,
  建议行动: Lightbulb,
  各方共识: Handshake,
};

// ===== CountUp Component =====

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

function CountUp({ value, duration = 1.2, className }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });
    const unsubscribe = motionValue.on('change', (latest) => {
      setDisplay(Math.round(latest));
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, motionValue]);

  return <span className={className}>{display}</span>;
}

// ===== Animation Variants =====

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

// ===== Props =====

interface DestinyReportProps {
  report: DestinyReport;
  onShare?: () => void;
  onSave?: () => void;
  onNewCouncil?: () => void;
}

// ===== Main Component =====

export default function DestinyReport({
  report,
  onShare,
  onSave,
  onNewCouncil,
}: DestinyReportProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full max-w-4xl space-y-8"
    >
      {/* ===== Header ===== */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold-dim bg-gold-soft px-4 py-1.5 text-xs font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>命运报告</span>
        </div>
        <h1 className="font-serif text-4xl text-text md:text-5xl">
          <span className="text-gradient-gold">人生命运报告</span>
        </h1>
        <p className="mt-3 text-sm text-text-dim">
          生成于 {formatDate(report.timestamp)}
        </p>
      </motion.div>

      {/* ===== Question Block ===== */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded border-l-2 border-gold bg-bg-card/60 p-6">
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-gold via-gold-dim to-transparent" />
          <p className="mb-1 text-xs uppercase tracking-wider text-text-dim">
            议题
          </p>
          <blockquote className="font-serif text-xl text-text md:text-2xl">
            &ldquo;{report.question}&rdquo;
          </blockquote>
        </div>
      </motion.div>

      {/* ===== Summary ===== */}
      {report.summary && (
        <motion.div variants={itemVariants} className="rounded-lg bg-bg-card/40 p-5">
          <p className="text-sm leading-relaxed text-text-soft">
            {report.summary}
          </p>
        </motion.div>
      )}

      {/* ===== 5 Index Cards ===== */}
      <motion.div variants={itemVariants}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-dim">
          核心指数
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {INDEX_CONFIG.map((config) => {
            const value = report.indices[config.key];
            return (
              <motion.div
                key={config.key}
                variants={cardVariants}
                className="relative overflow-hidden rounded-lg border border-border bg-bg-card p-4 card-hover"
                style={{ borderColor: `${config.color}33` }}
              >
                <div
                  className="absolute inset-0 opacity-40"
                  style={{ background: config.bgColor }}
                />
                <div className="relative">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-text-soft">
                      {config.label}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: config.color }}
                    />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <CountUp
                      value={value}
                      className="font-serif text-3xl font-bold"
                    />
                    <span
                      className="text-xs"
                      style={{ color: config.color }}
                    >
                      /100
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: config.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-text-dim">
                    {config.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ===== 6 Dimension Cards ===== */}
      {report.dimensions.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-dim">
            维度分析
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {report.dimensions.map((dim, index) => {
              const Icon = DIMENSION_ICONS[dim.title] || Sparkles;
              return (
                <motion.div
                  key={`${dim.title}-${index}`}
                  variants={cardVariants}
                  className="group relative overflow-hidden rounded-lg border border-border bg-bg-card p-5 card-hover"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text">
                        {dim.title}
                      </h3>
                      {dim.icon && (
                        <span className="text-xs text-text-dim">
                          {dim.icon}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-text-soft">
                    {dim.content}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ===== Consensus Points ===== */}
      {report.consensusPoints.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-dim">
            各方共识
          </h2>
          <div className="space-y-2">
            {report.consensusPoints.map((point, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-start gap-3 rounded-lg border border-border bg-bg-card/60 p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-gold">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-text-soft">
                  {point}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ===== Disclaimer ===== */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-lg border border-gold-dim/50 bg-gold-soft/30 p-6 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gold-soft/20 via-transparent to-transparent" />
        <p className="relative text-base font-medium text-gold md:text-lg">
          {report.disclaimer ||
            '最终决定权，属于你。议会只提供视角，不替你做选择。'}
        </p>
      </motion.div>

      {/* ===== Action Buttons ===== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        {onShare && (
          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-soft transition-colors hover:border-gold-dim hover:text-gold card-hover"
          >
            <Share2 className="h-4 w-4" />
            分享
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-soft transition-colors hover:border-gold-dim hover:text-gold card-hover"
          >
            <Save className="h-4 w-4" />
            保存
          </button>
        )}
        {onNewCouncil && (
          <button
            onClick={onNewCouncil}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-gold-dim glow-gold"
          >
            <Sparkles className="h-4 w-4" />
            新建议会
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
