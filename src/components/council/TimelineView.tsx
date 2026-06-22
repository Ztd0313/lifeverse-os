'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Circle,
} from 'lucide-react';
import type { TimelineBranch } from '@/types';
import { cn } from '@/lib/utils';

// ===== Node Time Labels =====

const NODE_LABELS: Record<TimelineBranch['node'], string> = {
  now: '现在',
  '3m': '3个月后',
  '1y': '1年后',
  '5y': '5年后',
  '10y': '10年后',
  '20y': '20年后',
};

const NODE_COLORS: Record<TimelineBranch['node'], string> = {
  now: '#c9a84c',
  '3m': '#5da0e8',
  '1y': '#5de8a0',
  '5y': '#e8a05d',
  '10y': '#b8a0c8',
  '20y': '#5de8e8',
};

// ===== Animation Variants =====

const branchVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

const lineVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};

// ===== Progress Bar Component =====

interface ProgressBarProps {
  value: number;
  color: string;
  label: string;
}

function ProgressBar({ value, color, label }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] text-text-dim">{label}</span>
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
        className="w-8 shrink-0 text-right text-[10px] font-medium"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  );
}

// ===== Metric Item Component =====

interface MetricItemProps {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  color?: string;
}

function MetricItem({ icon: Icon, label, value, color = '#9a9a9a' }: MetricItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
      <span className="text-[10px] text-text-dim">{label}</span>
      <span className="text-[10px] font-medium text-text-soft">{value}</span>
    </div>
  );
}

// ===== Branch Node Component =====

interface BranchNodeProps {
  branch: TimelineBranch;
  depth: number;
  isLast: boolean;
  index: number;
}

function BranchNode({ branch, depth, index }: BranchNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = branch.children && branch.children.length > 0;
  const nodeColor = NODE_COLORS[branch.node] || '#c9a84c';
  const isRoot = branch.node === 'now';

  return (
    <motion.div
      variants={branchVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      {/* Connecting line (vertical) */}
      {depth > 0 && (
        <svg
          className="absolute left-[19px] top-[-12px] h-[14px] w-[40px]"
          viewBox="0 0 40 14"
          fill="none"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M 20 0 Q 20 7 20 14"
            stroke={nodeColor}
            strokeWidth="2"
            strokeDasharray="4 4"
            variants={lineVariants}
            initial="hidden"
            animate="visible"
            opacity={0.4}
          />
        </svg>
      )}

      {/* Horizontal connector for children */}
      {hasChildren && expanded && (
        <svg
          className="absolute left-[19px] top-full h-full w-[2px]"
          style={{ minHeight: '20px' }}
          preserveAspectRatio="none"
        >
          <motion.line
            x1="1"
            y1="0"
            x2="1"
            y2="100%"
            stroke={nodeColor}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity={0.3}
            variants={lineVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>
      )}

      {/* Node content */}
      <div
        className={cn(
          'relative ml-10 rounded-lg border bg-bg-card p-4 card-hover',
          isRoot ? 'border-gold-dim glow-gold' : 'border-border'
        )}
        style={{
          borderColor: isRoot ? undefined : `${nodeColor}33`,
        }}
      >
        {/* Node dot */}
        <div
          className="absolute left-[-30px] top-5 flex h-4 w-4 items-center justify-center"
        >
          <motion.div
            className="h-3 w-3 rounded-full"
            style={{
              background: nodeColor,
              boxShadow: `0 0 12px ${nodeColor}80`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: 'backOut' }}
          />
        </div>

        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: `${nodeColor}20`,
                color: nodeColor,
              }}
            >
              {NODE_LABELS[branch.node]}
            </span>
            {isRoot && (
              <span className="rounded bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold">
                起点
              </span>
            )}
          </div>
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-text-dim transition-colors hover:text-gold"
              aria-label={expanded ? '折叠' : '展开'}
            >
              {expanded ? '折叠' : '展开'}
              <motion.div
                animate={{ rotate: expanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-3 w-3" />
              </motion.div>
            </button>
          )}
        </div>

        {/* Label & Description */}
        <h4 className="mb-1 text-sm font-semibold text-text">{branch.label}</h4>
        <p className="mb-3 text-xs leading-relaxed text-text-soft">
          {branch.description}
        </p>

        {/* Progress bars: happiness & regret */}
        <div className="mb-3 space-y-1.5">
          <ProgressBar
            value={branch.happinessProb}
            color="#5de8a0"
            label="幸福概率"
          />
          <ProgressBar
            value={branch.regretProb}
            color="#e85d5d"
            label="后悔概率"
          />
        </div>

        {/* Other metrics */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <MetricItem
            icon={DollarSign}
            label="收入"
            value={branch.incomeChange}
            color={
              branch.incomeChange.startsWith('+') ? '#5de8a0' : '#e85d5d'
            }
          />
          <MetricItem
            icon={branch.incomeChange.startsWith('+') ? TrendingUp : TrendingDown}
            label="成长"
            value={branch.growthRate}
            color="#5da0e8"
          />
        </div>
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && expanded && (
          <motion.div
            className="mt-3 space-y-3 border-l border-dashed pl-6"
            style={{ borderColor: `${nodeColor}30` }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {branch.children!.map((child, childIndex) => (
              <BranchNode
                key={`${child.node}-${childIndex}`}
                branch={child}
                depth={depth + 1}
                isLast={childIndex === branch.children!.length - 1}
                index={childIndex}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== Props =====

interface TimelineViewProps {
  branches: TimelineBranch[];
}

// ===== Main Component =====

export default function TimelineView({ branches }: TimelineViewProps) {
  const [allExpanded, setAllExpanded] = useState(true);

  const totalNodes = useMemo(() => {
    function count(nodes: TimelineBranch[]): number {
      return nodes.reduce((sum, node) => {
        return sum + 1 + (node.children ? count(node.children) : 0);
      }, 0);
    }
    return count(branches);
  }, [branches]);

  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Circle className="mb-4 h-12 w-12 text-text-dim" />
        <p className="text-sm text-text-dim">
          暂无时间线数据
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-text">
            <span className="text-gradient-gold">命运时间线</span>
          </h2>
          <p className="mt-1 text-xs text-text-dim">
            共 {totalNodes} 个节点 · 推演未来分支
          </p>
        </div>
        <button
          onClick={() => setAllExpanded(!allExpanded)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold"
        >
          <Zap className="h-3.5 w-3.5" />
          {allExpanded ? '全部折叠' : '全部展开'}
        </button>
      </div>

      {/* Timeline tree */}
      <div className="relative space-y-3">
        {branches.map((branch, index) => (
          <BranchNode
            key={`${branch.node}-${index}`}
            branch={branch}
            depth={0}
            isLast={index === branches.length - 1}
            index={index}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-bg-card/40 p-4">
        <span className="text-xs text-text-dim">图例:</span>
        {Object.entries(NODE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: NODE_COLORS[key as TimelineBranch['node']] }}
            />
            <span className="text-[10px] text-text-soft">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
