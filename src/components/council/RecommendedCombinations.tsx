'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  RECOMMENDED_COMBINATIONS,
  getCouncilMemberById,
  type RecommendedCombination,
} from '@/lib/ai/agent-templates';
import { getAgentById } from '@/lib/agents';
import { fadeInUp } from '@/lib/motion/variants';
import { useTranslation } from '@/lib/i18n';
import { useI18nStore } from '@/stores/i18n-store';

// ===== 成员信息查找 =====

/**
 * 成员简要信息
 */
interface MemberBrief {
  id: string;
  name: string;
  avatar: string;
}

/**
 * 根据 ID 查找成员简要信息
 *
 * 依次从 COUNCIL_MEMBERS 和 AGENTS 中查找，
 * 找不到时返回占位信息。
 */
function findMemberBrief(id: string): MemberBrief {
  // 先从 COUNCIL_MEMBERS 查找
  const councilMember = getCouncilMemberById(id);
  if (councilMember) {
    return {
      id: councilMember.id,
      name: councilMember.name,
      avatar: councilMember.avatar,
    };
  }

  // 再从 AGENTS 查找
  const agent = getAgentById(id);
  if (agent) {
    return {
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
    };
  }

  // 找不到时返回占位
  return {
    id,
    name: useI18nStore.getState().t('council.unknown'),
    avatar: '❓',
  };
}

// ===== 组合卡片组件 =====

/**
 * 推荐组合卡片 Props
 */
interface CombinationCardProps {
  combination: RecommendedCombination;
  index: number;
  onUse: (combination: RecommendedCombination) => void;
  isActive: boolean;
}

/**
 * 单个推荐组合卡片
 *
 * 展示组合名称、描述、适用场景、成员头像列表、特色标签。
 * 包含"一键使用"按钮。
 */
function CombinationCard({
  combination,
  index,
  onUse,
  isActive,
}: CombinationCardProps) {
  const { t } = useTranslation();
  const members = combination.memberIds.map(findMemberBrief);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative flex w-80 shrink-0 flex-col gap-4 rounded-[14px] border p-5 backdrop-blur-sm transition-all duration-300',
        isActive
          ? 'border-gold bg-gold-soft/20 glow-gold'
          : 'border-border bg-bg-card/80 hover:border-gold-dim hover:shadow-[0_8px_32px_var(--shadow-gold)]'
      )}
    >
      {/* 顶部：图标 + 名称 */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold-dim bg-gold-soft text-2xl">
          {combination.icon}
        </div>
        <div className="flex-1 pt-0.5">
          <h3 className="text-base font-semibold text-text">
            {combination.name}
          </h3>
          <p className="mt-0.5 text-xs text-text-dim">
            {t('council.memberCount', { count: combination.memberCount })}
          </p>
        </div>
      </div>

      {/* 描述 */}
      <p className="text-xs leading-relaxed text-text-soft">
        {combination.description}
      </p>

      {/* 适用场景 */}
      <div>
        <span className="text-[10px] font-medium tracking-wider text-text-dim">
          {t('council.applicableScenarios')}
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {combination.applicableScenarios.map((scenario) => (
            <span
              key={scenario}
              className="rounded-full border border-border bg-bg-soft px-2 py-0.5 text-[10px] text-text-soft"
            >
              {scenario}
            </span>
          ))}
        </div>
      </div>

      {/* 成员头像列表 */}
      <div>
        <span className="text-[10px] font-medium tracking-wider text-text-dim">
          {t('council.councilMembers')}
        </span>
        <div className="mt-2 flex items-center gap-1">
          {members.map((member, i) => (
            <div
              key={member.id}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-soft text-lg"
              style={{ marginLeft: i > 0 ? '-8px' : 0 }}
              title={member.name}
            >
              {member.avatar}
            </div>
          ))}
          <span className="ml-2 text-xs text-text-dim">
            {members.map((m) => m.name).join('、')}
          </span>
        </div>
      </div>

      {/* 特色标签 */}
      <div className="flex flex-wrap gap-1.5">
        {combination.tags.map((tag) => (
          <Badge key={tag} variant="gold">
            {tag}
          </Badge>
        ))}
      </div>

      {/* 一键使用按钮 */}
      <button
        type="button"
        onClick={() => onUse(combination)}
        className={cn(
          'mt-auto flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-gold text-bg hover:bg-[#d9b85e]'
            : 'border border-gold-dim bg-transparent text-gold hover:bg-gold-soft'
        )}
      >
        <Zap className="h-3.5 w-3.5" />
        {isActive ? t('council.combinationUsed') : t('council.useCombination')}
        {!isActive && <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    </motion.div>
  );
}

// ===== 主组件 Props =====

/**
 * RecommendedCombinations 组件 Props
 */
export interface RecommendedCombinationsProps {
  /** 一键使用回调，传入组合信息 */
  onUseCombination: (combination: RecommendedCombination) => void;
  /** 当前已选中的组合 ID（用于高亮显示） */
  activeCombinationId?: string | null;
}

// ===== 主组件 =====

/**
 * 推荐组合组件
 *
 * 横向滚动展示 10 种推荐组合，每个组合包含：
 * - 组合名称、描述、适用场景
 * - 成员头像列表
 * - 特色标签
 * - "一键使用"按钮
 *
 * 使用 framer-motion 动画，暗色 + 金色设计风格。
 */
export function RecommendedCombinations({
  onUseCombination,
  activeCombinationId,
}: RecommendedCombinationsProps) {
  const { t } = useTranslation();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      {/* 标题 */}
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-semibold text-text">
          {t('council.recommendedTitle')}
        </h2>
      </div>

      <p className="mb-4 text-sm text-text-soft">
        {t('council.recommendedDesc')}
      </p>

      {/* 横向滚动卡片 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {RECOMMENDED_COMBINATIONS.map((combination, index) => (
          <CombinationCard
            key={combination.id}
            combination={combination}
            index={index}
            onUse={onUseCombination}
            isActive={activeCombinationId === combination.id}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default RecommendedCombinations;
