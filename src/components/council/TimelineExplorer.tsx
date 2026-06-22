'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Heart,
  AlertCircle,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 时间线分支类型
 */
export type TimelineStrategy = 'conservative' | 'balanced' | 'aggressive';

/**
 * 时间节点类型
 */
export type TimelineHorizon = '1y' | '5y' | '10y';

/**
 * 单个时间节点的快照数据
 */
export interface TimelineSnapshot {
  /** 时间跨度 */
  horizon: TimelineHorizon;
  /** 节点标题 */
  label: string;
  /** 节点描述 */
  description: string;
  /** 幸福概率 (0-100) */
  happinessProb: number;
  /** 后悔概率 (0-100) */
  regretProb: number;
  /** 收入变化（如 "+30%" / "-20%"） */
  incomeChange: string;
}

/**
 * 一条时间线分支
 */
export interface TimelineBranchData {
  /** 分支策略 */
  strategy: TimelineStrategy;
  /** 分支标题（如 "选择接受"） */
  title: string;
  /** 分支副标题 */
  subtitle: string;
  /** 分支主题色 */
  color: string;
  /** 3 个时间节点快照 */
  snapshots: TimelineSnapshot[];
}

/**
 * TimelineExplorer 组件 Props
 */
export interface TimelineExplorerProps {
  /** 时间线分支列表（通常 3 条） */
  branches: TimelineBranchData[];
  /** 自定义类名 */
  className?: string;
}

// ===== 常量映射 =====

const STRATEGY_LABELS: Record<TimelineStrategy, string> = {
  conservative: '保守',
  balanced: '平衡',
  aggressive: '激进',
};

const HORIZON_LABELS: Record<TimelineHorizon, string> = {
  '1y': '1 年后',
  '5y': '5 年后',
  '10y': '10 年后',
};

// ===== 动画变体 =====

const branchVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const snapshotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ===== 子组件：指标条 =====

interface MetricBarProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

function MetricBar({ icon: Icon, label, value, color, suffix = '%' }: MetricBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
      <span className="w-14 shrink-0 text-[10px] text-text-dim">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <span
        className="w-10 shrink-0 text-right text-[10px] font-medium tabular-nums"
        style={{ color }}
      >
        {value}
        {suffix}
      </span>
    </div>
  );
}

// ===== 子组件：单个时间节点 =====

interface SnapshotCardProps {
  snapshot: TimelineSnapshot;
  color: string;
  index: number;
}

function SnapshotCard({ snapshot, color, index }: SnapshotCardProps) {
  const isPositiveIncome = snapshot.incomeChange.trim().startsWith('+');
  return (
    <motion.div
      variants={snapshotVariants}
      className="relative rounded-lg border bg-bg-card/80 p-3"
      style={{ borderColor: `${color}33` }}
    >
      {/* 时间标签 */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: `${color}20`,
            color,
          }}
        >
          {HORIZON_LABELS[snapshot.horizon]}
        </span>
        <span className="text-[10px] text-text-dim">#{index + 1}</span>
      </div>

      {/* 标题与描述 */}
      <h5 className="mb-1 text-xs font-semibold text-text">{snapshot.label}</h5>
      <p className="mb-3 text-[11px] leading-relaxed text-text-soft">
        {snapshot.description}
      </p>

      {/* 指标条 */}
      <div className="space-y-1.5">
        <MetricBar
          icon={Heart}
          label="幸福"
          value={snapshot.happinessProb}
          color="#5de8a0"
        />
        <MetricBar
          icon={AlertCircle}
          label="后悔"
          value={snapshot.regretProb}
          color="#e85d5d"
        />
        <div className="flex items-center gap-2 pt-0.5">
          {isPositiveIncome ? (
            <TrendingUp className="h-3 w-3 shrink-0 text-green" />
          ) : (
            <TrendingDown className="h-3 w-3 shrink-0 text-red" />
          )}
          <span className="w-14 shrink-0 text-[10px] text-text-dim">收入</span>
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: isPositiveIncome ? '#5de8a0' : '#e85d5d' }}
          >
            <DollarSign className="mr-0.5 inline h-3 w-3" />
            {snapshot.incomeChange}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ===== 子组件：单条分支 =====

interface BranchRowProps {
  branch: TimelineBranchData;
  defaultExpanded?: boolean;
}

function BranchRow({ branch, defaultExpanded = false }: BranchRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      variants={branchVariants}
      className="overflow-hidden rounded-xl border bg-bg-card/40"
      style={{ borderColor: `${branch.color}40` }}
    >
      {/* 分支头部（可点击展开） */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-bg-card-hover/40"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {/* 色块标识 */}
          <span
            className="h-10 w-1.5 rounded-full"
            style={{ background: branch.color }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text">{branch.title}</h4>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  background: `${branch.color}20`,
                  color: branch.color,
                }}
              >
                {STRATEGY_LABELS[branch.strategy]}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-text-dim">{branch.subtitle}</p>
          </div>
        </div>

        {/* 展开图标 */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-text-dim"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* 展开内容：3 个时间节点 */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-3">
              {branch.snapshots.map((snapshot, idx) => (
                <SnapshotCard
                  key={`${snapshot.horizon}-${idx}`}
                  snapshot={snapshot}
                  color={branch.color}
                  index={idx}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== 主组件 =====

/**
 * 时间线探索器
 *
 * 展示 3 条时间线分支（保守 / 平衡 / 激进），每条分支用不同颜色
 * （蓝 / 金 / 红）区分。每条分支包含 3 个时间节点（1 年 / 5 年 / 10 年），
 * 每个节点显示幸福概率、后悔概率与收入变化。
 *
 * 交互：
 * - 点击分支头部可展开 / 折叠
 * - 展开/折叠使用 Framer Motion 动画
 *
 * @example
 * ```tsx
 * <TimelineExplorer branches={MOCK_BRANCHES} />
 * ```
 */
export function TimelineExplorer({
  branches,
  className,
}: TimelineExplorerProps) {
  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-text-dim" />
        <p className="text-sm text-text-dim">暂无时间线推演数据</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* 标题 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl text-text">
            <span className="text-gradient-gold">时间线推演</span>
          </h3>
          <p className="mt-1 text-xs text-text-dim">
            3 条分支 · 9 个时间节点 · 点击展开详情
          </p>
        </div>
      </div>

      {/* 分支列表 */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {branches.map((branch, idx) => (
          <BranchRow
            key={`${branch.strategy}-${idx}`}
            branch={branch}
            defaultExpanded={idx === 1}
          />
        ))}
      </motion.div>

      {/* 图例 */}
      <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-bg-card/40 p-3">
        <span className="text-xs text-text-dim">图例:</span>
        {branches.map((b) => (
          <div key={b.strategy} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: b.color }}
            />
            <span className="text-[10px] text-text-soft">
              {STRATEGY_LABELS[b.strategy]}：{b.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Stagger 容器（局部定义以避免与外部依赖耦合）=====

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default TimelineExplorer;
