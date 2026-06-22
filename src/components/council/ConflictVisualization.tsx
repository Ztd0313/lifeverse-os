'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConflictPair, Persona } from '@/types';
import { cn, getConflictLevel } from '@/lib/utils';

/**
 * 冲突可视化组件 Props
 */
interface ConflictVisualizationProps {
  /** 冲突对列表 */
  conflicts: ConflictPair[];
  /** 参与议会的 Agent 列表（用于查找名字） */
  personas: Persona[];
  /** 自定义类名 */
  className?: string;
}

/**
 * 数值滚动 Hook
 */
function useCountUp(
  target: number,
  duration: number = 1000,
  enabled: boolean = true
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, enabled]);

  return value;
}

/**
 * 单个冲突项
 */
interface ConflictItemProps {
  conflict: ConflictPair;
  personaA?: Persona;
  personaB?: Persona;
  index: number;
}

function ConflictItem({
  conflict,
  personaA,
  personaB,
  index,
}: ConflictItemProps) {
  const { label, color } = getConflictLevel(conflict.value);
  const displayValue = useCountUp(conflict.value, 800 + index * 100);

  const nameA = personaA?.name ?? conflict.personaA;
  const nameB = personaB?.name ?? conflict.personaB;
  const avatarA = personaA?.avatar ?? '◈';
  const avatarB = personaB?.avatar ?? '◈';

  return (
    <motion.div
      className={cn(
        'relative rounded-lg border bg-bg-card/60 p-3',
        'transition-colors duration-300'
      )}
      style={{ borderColor: `${color}40` }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
    >
      {/* Agent 对 */}
      <div className="flex items-center justify-between gap-2">
        {/* Agent A */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{avatarA}</span>
          <span className="text-xs text-text-soft truncate">{nameA}</span>
        </div>

        {/* 冲突连线图标 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <motion.div
            className="h-px"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: 24 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          />
          <motion.span
            className="text-xs"
            style={{ color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          >
            ⚡
          </motion.span>
          <motion.div
            className="h-px"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: 24 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          />
        </div>

        {/* Agent B */}
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="text-xs text-text-soft truncate">{nameB}</span>
          <span className="text-lg flex-shrink-0">{avatarB}</span>
        </div>
      </div>

      {/* 冲突值 + 进度条 */}
      <div className="mt-2.5 flex items-center gap-3">
        {/* 冲突值数字 */}
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <motion.span
            className="text-lg font-bold tabular-nums"
            style={{ color }}
          >
            {displayValue}
          </motion.span>
          <span className="text-[10px] text-text-dim">/100</span>
        </div>

        {/* 进度条 */}
        <div className="flex-1 h-1.5 rounded-full bg-bg-soft overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}80`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${conflict.value}%` }}
            transition={{
              duration: 0.8,
              delay: 0.3 + index * 0.1,
              ease: 'easeOut',
            }}
          />
        </div>

        {/* 冲突标签 */}
        <span
          className="text-[10px] font-medium flex-shrink-0"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      {/* 冲突描述 */}
      {conflict.label && (
        <p className="mt-1.5 text-[11px] text-text-dim leading-relaxed">
          {conflict.label}
        </p>
      )}
    </motion.div>
  );
}

/**
 * 冲突可视化组件
 *
 * 显示 Agent 之间的冲突关系，包含冲突双方名称、冲突值数字滚动、
 * 进度条填充动画和冲突等级颜色标识。
 *
 * 冲突值颜色规则：
 * - ≥80 红色（激烈冲突）
 * - ≥60 橙色（明显分歧）
 * - ≥40 金色（温和讨论）
 * - <40 绿色（基本一致）
 *
 * @example
 * ```tsx
 * <ConflictVisualization
 *   conflicts={conflicts}
 *   personas={personas}
 * />
 * ```
 */
export function ConflictVisualization({
  conflicts,
  personas,
  className,
}: ConflictVisualizationProps) {
  // 构建 persona 查找表
  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    personas.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  // 按冲突值降序排列
  const sortedConflicts = useMemo(() => {
    return [...conflicts].sort((a, b) => b.value - a.value);
  }, [conflicts]);

  if (conflicts.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-bg-card/40 px-4 py-3',
          className
        )}
      >
        <span className="text-xs text-text-dim">
          暂无冲突 · 议会进行中
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-soft">
            价值冲突
          </span>
          <span className="rounded-full bg-bg-soft px-2 py-0.5 text-[10px] text-text-dim">
            {conflicts.length} 对
          </span>
        </div>
        <span className="text-[10px] text-text-dim">
          冲突值越高，分歧越大
        </span>
      </div>

      {/* 冲突列表 */}
      <AnimatePresence mode="popLayout">
        {sortedConflicts.map((conflict, index) => (
          <ConflictItem
            key={`${conflict.personaA}-${conflict.personaB}`}
            conflict={conflict}
            personaA={personaMap.get(conflict.personaA)}
            personaB={personaMap.get(conflict.personaB)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ConflictVisualization;
