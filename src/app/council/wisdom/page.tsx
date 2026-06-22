'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Check,
  Loader2,
  MessageCircle,
  Users,
  Eye,
  ScrollText,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import { useCouncilStore } from '@/stores/council-store';
import { useAuthStore } from '@/stores/auth-store';
import { useAgentStore } from '@/stores/agent-store';
import { cn, formatSessionNumber } from '@/lib/utils';
import type {
  Persona,
  Message,
  DestinyReport,
  TimelineBranch,
  QuestionType,
} from '@/types';
import {
  getUnifiedMembers,
  filterAndSearchMembers,
  getMembersByIds,
  CATEGORY_FILTER_OPTIONS,
  type UnifiedCouncilMember,
} from '@/lib/council-members';
import type { RecommendedCombination } from '@/lib/ai/agent-templates';
import type { CouncilResult } from '@/lib/ai/mock-data';
import { RecommendedCombinations } from '@/components/council/RecommendedCombinations';
import DestinyReportComponent from '@/components/council/DestinyReport';
import TimelineView from '@/components/council/TimelineView';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

// ===== 常量 =====

/** 最少选择成员数 */
const MIN_MEMBERS = 3;
/** 最多选择成员数 */
const MAX_MEMBERS = 6;

// ===== Mock Data =====

const MOCK_MESSAGES: Omit<Message, 'id' | 'timestamp'>[] = [
  // Round 1: 表态
  {
    personaId: 'musk',
    personaName: '马斯克',
    role: 'agent',
    content: '辞职创业？这是唯一正确的选择。留在舒适区等于慢性死亡。第一性原理告诉我们，如果你相信一件事，就全力以赴。',
    round: 1,
  },
  {
    personaId: 'buffett',
    personaName: '巴菲特',
    role: 'agent',
    content: '别急。创业的失败率是90%。你有多少储蓄？你的护城河在哪里？如果没有清晰的商业模式，先别辞职。',
    round: 1,
  },
  {
    personaId: 'jobs',
    personaName: '乔布斯',
    role: 'agent',
    content: '听从你的内心。如果你每天都在想这件事，那就是答案。但记住，创业不是为了钱，是为了创造价值。',
    round: 1,
  },
  {
    personaId: 'munger',
    personaName: '芒格',
    role: 'agent',
    content: '反过来想：什么会让你后悔？65岁的人很少后悔创业失败，但很多人后悔从未尝试。',
    round: 1,
  },
  // Round 2: 质疑
  {
    personaId: 'socrates',
    personaName: '苏格拉底',
    role: 'agent',
    content: '你说你想创业，但你真正想要的是什么？是自由？是成就？还是逃避现在的工作？请先回答这个问题。',
    round: 2,
  },
  {
    personaId: 'wangyangming',
    personaName: '王阳明',
    role: 'agent',
    content: '知行合一。如果你真的想清楚了，就不会来问我们。你的犹豫本身就是答案的一部分。',
    round: 2,
  },
  {
    personaId: 'zhuangzi',
    personaName: '庄子',
    role: 'agent',
    content: '辞职或不辞职，都是路。蝴蝶梦为庄周，庄周梦为蝴蝶。何必执着于哪一个是真实的呢？',
    round: 2,
  },
  // Round 3: 共识
  {
    personaId: 'musk',
    personaName: '马斯克',
    role: 'agent',
    content: '好吧，折中方案：先兼职创业，验证想法后再全职。但给自己设一个期限，6个月内必须有进展。',
    round: 3,
  },
  {
    personaId: 'buffett',
    personaName: '巴菲特',
    role: 'agent',
    content: '同意。保留主业的现金流，用业余时间试错。当你的副业收入达到主业的50%时，再考虑全职。',
    round: 3,
  },
  {
    personaId: 'jobs',
    personaName: '乔布斯',
    role: 'agent',
    content: '可以。但不要让"兼职"成为拖延的借口。每周至少投入20小时，否则就是在自欺欺人。',
    round: 3,
  },
];

function createMockReport(question: string): DestinyReport {
  return {
    id: `report-${Date.now()}`,
    councilId: `council-${Date.now()}`,
    question,
    summary:
      '议会建议采取"渐进式创业"策略：保留主业现金流，用业余时间验证创业想法。设定6个月期限，当副业收入达到主业50%时再考虑全职转型。同时注意心理健康和家庭关系的平衡。',
    dimensions: [
      {
        title: '风险分析',
        content:
          '直接辞职创业的风险极高，90%的初创企业在3年内失败。主要风险包括：资金链断裂、市场验证不足、心理压力过大。建议通过兼职创业降低风险，保留稳定收入来源。',
        icon: 'warning',
      },
      {
        title: '后悔概率',
        content:
          '从未尝试的后悔概率（78%）显著高于尝试后失败的后悔概率（35%）。65岁以上人群的调查显示，最常见的遗憾是"过于保守，未追求梦想"。',
        icon: 'rewind',
      },
      {
        title: '长期收益',
        content:
          '即使创业失败，获得的经验、人脉和抗压能力将在未来5-10年持续产生价值。成功创业的长期财务回报可达当前收入的3-10倍，但概率约为10-15%。',
        icon: 'trending-up',
      },
      {
        title: '幸福指数',
        content:
          '追求热爱的事业能显著提升主观幸福感，但财务压力会抵消部分收益。建议确保6个月以上的生活储备金后再启动，以维持心理安全感。',
        icon: 'heart',
      },
      {
        title: '建议行动',
        content:
          '1. 保留主业，每周投入20+小时验证想法；2. 6个月内完成MVP并获得首批付费用户；3. 储备12个月生活费；4. 与家人充分沟通，获得支持；5. 设定明确的退出标准。',
        icon: 'lightbulb',
      },
      {
        title: '各方共识',
        content:
          '7位智者中6位同意"渐进式创业"方案。马斯克和乔布斯强调行动力，巴菲特和芒格强调风险控制，苏格拉底和王阳明强调内心觉察，庄子提醒保持心态灵活。',
        icon: 'handshake',
      },
    ],
    indices: {
      conflict: 72,
      growth: 85,
      happiness: 68,
      freedom: 90,
      stability: 42,
    },
    radar: { freedom: 90, wealth: 55, happiness: 68, stability: 42, growth: 85 },
    consensusPoints: [
      '采取渐进式创业策略，而非直接辞职',
      '设定6个月验证期限，有明确进展再全职',
      '储备12个月生活费作为安全网',
      '每周至少投入20小时在创业项目上',
      '与家人充分沟通，获得情感支持',
    ],
    disclaimer: '最终决定权，属于你。议会只提供视角，不替你做选择。',
    timestamp: Date.now(),
  };
}

const MOCK_TIMELINE: TimelineBranch[] = [
  {
    node: 'now',
    label: '当前状态',
    description: '你站在人生的十字路口，考虑是否辞职创业。',
    happinessProb: 60,
    regretProb: 40,
    incomeChange: '+0%',
    growthRate: '中等',
    children: [
      {
        node: '3m',
        label: '渐进式创业',
        description: '保留主业，业余时间启动项目。开始验证想法，搭建MVP。',
        happinessProb: 70,
        regretProb: 20,
        incomeChange: '+5%',
        growthRate: '快速',
        children: [
          {
            node: '1y',
            label: '获得首批用户',
            description: 'MVP上线，获得首批100名付费用户。副业收入达到主业的30%。',
            happinessProb: 78,
            regretProb: 15,
            incomeChange: '+30%',
            growthRate: '快速',
            children: [
              {
                node: '5y',
                label: '全职创业成功',
                description: '副业收入超过主业，辞职全职创业。公司进入快速增长期。',
                happinessProb: 85,
                regretProb: 10,
                incomeChange: '+200%',
                growthRate: '爆发',
              },
              {
                node: '5y',
                label: '维持平衡',
                description: '项目稳定但未爆发，继续双轨并行。生活平衡，收入稳步增长。',
                happinessProb: 75,
                regretProb: 25,
                incomeChange: '+50%',
                growthRate: '稳定',
              },
            ],
          },
          {
            node: '1y',
            label: '项目失败',
            description: 'MVP未获市场认可，项目终止。但获得了宝贵经验和新的人脉。',
            happinessProb: 55,
            regretProb: 30,
            incomeChange: '+0%',
            growthRate: '中等',
            children: [
              {
                node: '5y',
                label: '经验转化',
                description: '创业经验帮助你在主业中获得晋升，成为团队负责人。',
                happinessProb: 72,
                regretProb: 15,
                incomeChange: '+80%',
                growthRate: '稳定',
              },
            ],
          },
        ],
      },
      {
        node: '3m',
        label: '直接辞职',
        description: '辞职全力投入创业。背水一战，压力巨大但专注度最高。',
        happinessProb: 50,
        regretProb: 55,
        incomeChange: '-100%',
        growthRate: '爆发',
        children: [
          {
            node: '1y',
            label: '融资成功',
            description: '获得天使轮融资，项目快速推进。但股权稀释，控制权下降。',
            happinessProb: 80,
            regretProb: 20,
            incomeChange: '+50%',
            growthRate: '爆发',
            children: [
              {
                node: '10y',
                label: '公司上市',
                description: '公司成功IPO，财务自由。但工作强度极大，健康受损。',
                happinessProb: 75,
                regretProb: 25,
                incomeChange: '+1000%',
                growthRate: '爆发',
              },
            ],
          },
          {
            node: '1y',
            label: '资金耗尽',
            description: '未能融资，储蓄耗尽。被迫找工作，心理受挫严重。',
            happinessProb: 30,
            regretProb: 70,
            incomeChange: '-50%',
            growthRate: '停滞',
            children: [
              {
                node: '10y',
                label: '重新崛起',
                description: '经历低谷后重新振作，带着教训再次出发，稳步前行。',
                happinessProb: 65,
                regretProb: 35,
                incomeChange: '+40%',
                growthRate: '稳定',
              },
            ],
          },
        ],
      },
    ],
  },
];

// ===== Animation Variants =====

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

// ===== 工具函数 =====

/**
 * 将统一成员转换为 Persona 类型
 *
 * 用于将选中的议会成员传入 council-store，
 * 以便 MeetingRoom 等组件使用。
 */
function unifiedMemberToPersona(member: UnifiedCouncilMember): Persona {
  // 如果原始数据已经是 Persona（智者型 AGENTS），直接返回
  if (
    member.source === 'system' &&
    member.raw &&
    typeof member.raw === 'object' &&
    'type' in member.raw &&
    'radar' in member.raw
  ) {
    return member.raw as Persona;
  }

  // 否则构造 Persona
  return {
    id: member.id,
    name: member.name,
    nameEn: member.nameEn,
    type: 'sage',
    philosophy: member.personality,
    speakingStyle: member.speakingStyle,
    avatar: member.avatar,
    model: 'gpt-4o',
    radar: { freedom: 70, wealth: 60, happiness: 70, stability: 60, growth: 75 },
  };
}

// ===== Toast Component =====

/**
 * 轻量级提示组件
 *
 * 用于在用户操作未满足条件时给出即时反馈，
 * 避免按钮"静默无反应"的体验问题。
 */
interface ToastProps {
  message: string;
  type: 'warning' | 'success';
}

function Toast({ message, type }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      transition={{ duration: 0.25 }}
      className={cn(
        'fixed left-1/2 top-20 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md',
        type === 'warning'
          ? 'border border-amber-400/50 bg-amber-500/15 text-amber-200'
          : 'border border-gold-dim bg-gold-soft/20 text-gold'
      )}
    >
      {type === 'warning' ? (
        <AlertCircle className="h-4 w-4 shrink-0" />
      ) : (
        <Check className="h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </motion.div>
  );
}

// ===== Question Input Component =====

interface QuestionInputProps {
  question: string;
  setQuestion: (q: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

const QUESTION_SUGGESTIONS: { text: string; type: QuestionType }[] = [
  { text: '要不要辞职创业？', type: 'career' },
  { text: '该不该接受这份新工作offer？', type: 'career' },
  { text: '是否应该结束这段关系？', type: 'relationship' },
  { text: '该不该买房还是继续租房？', type: 'finance' },
  { text: '要不要出国留学？', type: 'education' },
  { text: '人生下一步该往哪走？', type: 'life_direction' },
];

function QuestionInput({ question, setQuestion, onSubmit, canSubmit }: QuestionInputProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft glow-gold"
        >
          <Sparkles className="h-8 w-8 text-gold" />
        </motion.div>
        <h1 className="font-serif text-2xl sm:text-3xl text-text md:text-4xl">
          <span className="text-gradient-gold">{t('council.askDestiny')}</span>
        </h1>
        <p className="mt-2 text-sm text-text-soft">
          {t('council.wisdomSubtitle')}
        </p>
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('council.questionPlaceholder')}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-bg-card p-4 text-base text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
              onSubmit();
            }
          }}
        />
      </div>

      {/* Suggestions */}
      <div>
        <p className="mb-3 text-xs text-text-dim">{t('council.tryQuestions')}</p>
        <div className="flex flex-wrap gap-2">
          {QUESTION_SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setQuestion(suggestion.text)}
              className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold card-hover"
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ===== Member Selection Component =====

/**
 * 议会成员选择组件
 *
 * 功能：
 * - 展示所有可选成员（系统 + 自定义）
 * - 支持分类筛选
 * - 支持搜索
 * - 点击成员卡片选中/取消选中（最多6个，最少3个）
 * - 选中的成员在顶部显示
 * - 底部显示"开始议会"按钮
 */
interface MemberSelectionProps {
  members: UnifiedCouncilMember[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onStart: () => void;
  canStart: boolean;
}

function MemberSelection({
  members,
  selectedIds,
  onToggle,
  onStart,
  canStart,
}: MemberSelectionProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<
    (typeof CATEGORY_FILTER_OPTIONS)[number]['value']
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  /** 筛选后的成员列表 */
  const filteredMembers = filterAndSearchMembers(members, category, searchQuery);

  /** 选中的成员列表 */
  const selectedMembers = getMembersByIds(members, selectedIds);

  /** 切换分类 */
  const handleCategoryChange = (
    value: (typeof CATEGORY_FILTER_OPTIONS)[number]['value']
  ) => {
    setCategory(value);
  };

  /** 清除搜索 */
  const handleClearSearch = () => {
    setSearchQuery('');
    setCategory('all');
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-5xl"
    >
      {/* 已选成员区域 */}
      {selectedMembers.length > 0 && (
        <div className="mb-6 rounded-lg border border-gold-dim bg-gold-soft/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-text">
                {t('council.selectedMembers')}（{selectedMembers.length}/{MAX_MEMBERS}）
              </span>
            </div>
            <span className="text-xs text-text-dim">
              {selectedMembers.length < MIN_MEMBERS
                ? t('council.needMore', { count: MIN_MEMBERS - selectedMembers.length })
                : selectedMembers.length >= MIN_MEMBERS
                  ? t('council.enoughMembers')
                  : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1.5 rounded-full border border-gold bg-gold-soft/30 px-2.5 py-1"
              >
                <span className="text-base">{member.avatar}</span>
                <span className="text-xs font-medium text-text">
                  {member.name}
                </span>
                <button
                  onClick={() => onToggle(member.id)}
                  className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-text-dim hover:bg-bg-card hover:text-red"
                  aria-label={`取消选择 ${member.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('council.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-bg-card py-2 pl-10 pr-4 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORY_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleCategoryChange(opt.value)}
            className={cn(
              'interactive rounded-full border px-3 py-1 text-xs transition-all',
              category === opt.value
                ? 'border-gold bg-gold-soft/30 text-gold'
                : 'border-border bg-bg-card text-text-soft hover:border-gold-dim hover:text-text'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 成员网格 */}
      <div className="mb-6 min-h-[200px]">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-dim">
            <Users className="mb-2 h-8 w-8" />
            <p className="text-sm">{t('council.noMembersFound')}</p>
            <button
              onClick={handleClearSearch}
              className="mt-2 text-xs text-gold hover:underline"
            >
              {t('council.clearFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredMembers.map((member, index) => {
              const isSelected = selectedIds.includes(member.id);
              const isMaxed = selectedIds.length >= MAX_MEMBERS && !isSelected;
              return (
                <motion.button
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  onClick={() => !isMaxed && onToggle(member.id)}
                  disabled={isMaxed}
                  className={cn(
                    'relative flex flex-col items-center rounded-lg border p-4 text-center transition-all card-hover',
                    isSelected
                      ? 'border-gold bg-gold-soft/30 glow-gold'
                      : isMaxed
                        ? 'cursor-not-allowed border-border bg-bg-card opacity-40'
                        : 'border-border bg-bg-card hover:border-gold-dim'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold"
                    >
                      <Check className="h-3 w-3 text-bg" />
                    </motion.div>
                  )}
                  <span className="mb-2 text-3xl">{member.avatar}</span>
                  <span className="text-sm font-medium text-text">
                    {member.name}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-xs text-text-dim">
                    {member.identity}
                  </span>
                  {member.expertise.length > 0 && (
                    <span className="mt-1 line-clamp-1 text-xs text-gold">
                      {member.expertise.slice(0, 2).join(' · ')}
                    </span>
                  )}
                  {member.source === 'custom' && (
                    <span className="mt-1 rounded-full bg-gold-soft px-1.5 py-0.5 text-[11px] text-gold">
                      {t('council.custom')}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 开始议会按钮 */}
      <div className="sticky bottom-4 flex justify-center">
        <button
          onClick={onStart}
          disabled={!canStart}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold transition-all',
            canStart
              ? 'bg-gold text-bg hover:bg-[#d9b85e] glow-gold-strong'
              : 'cursor-not-allowed bg-border text-text-dim'
          )}
        >
          <Sparkles className="h-4 w-4" />
          {canStart
            ? t('council.conveneCouncil', { count: selectedIds.length })
            : t('council.selectMembers', { min: MIN_MEMBERS, max: MAX_MEMBERS })}
        </button>
      </div>
    </motion.div>
  );
}

// ===== Ritual Animation Component =====

function RitualAnimation({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex min-h-[60vh] flex-col items-center justify-center"
    >
      <motion.div
        className="relative flex h-32 w-32 items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        {/* Pulsing rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-gold"
            animate={{
              scale: [1, 1.5, 1.5],
              opacity: [0.6, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
        {/* Center icon */}
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-soft glow-gold-strong"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="h-10 w-10 text-gold" />
        </motion.div>
      </motion.div>

      <motion.h2
        className="mt-8 font-serif text-2xl text-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-gradient-gold">{t('council.councilConvening')}</span>
      </motion.h2>
      <motion.p
        className="mt-2 text-sm text-text-dim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {t('council.sagesGathering')}
      </motion.p>
    </motion.div>
  );
}

// ===== Meeting Room Component =====

interface MeetingRoomProps {
  messages: Message[];
  currentRound: number;
  personas: Persona[];
  roundTitle: string;
  onNextRound: () => void;
  isLastRound: boolean;
}

const ROUND_TITLES: Record<number, string> = {
  1: '第一轮 · 表态',
  2: '第二轮 · 质疑',
  3: '第三轮 · 共识',
};

function MeetingRoom({
  messages,
  currentRound,
  personas,
  onNextRound,
  isLastRound,
}: MeetingRoomProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const roundMessages = messages.filter((m) => m.round === currentRound);

  // Animate messages appearing one by one
  useEffect(() => {
    setVisibleCount(0);
    setIsTyping(true);

    const showNext = (index: number) => {
      if (index >= roundMessages.length) {
        setIsTyping(false);
        return;
      }
      setIsTyping(true);
      setTimeout(() => {
        setVisibleCount(index + 1);
        setIsTyping(false);
        setTimeout(() => showNext(index + 1), 500);
      }, 1500);
    };

    const startTimer = setTimeout(() => showNext(0), 800);
    return () => clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, isTyping]);

  const allShown = visibleCount >= roundMessages.length && !isTyping;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-3xl"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-semibold text-text">
            {currentRound === 1 ? t('council.round1') : currentRound === 2 ? t('council.round2') : currentRound === 3 ? t('council.round3') : t('council.round', { round: currentRound })}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className={cn(
                'h-1.5 w-8 rounded-full transition-colors',
                r <= currentRound ? 'bg-gold' : 'bg-border'
              )}
            />
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {personas.map((p) => {
          const isSpeaking =
            isTyping &&
            roundMessages[visibleCount]?.personaId === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all',
                isSpeaking
                  ? 'border-gold bg-gold-soft/30 glow-gold'
                  : 'border-border bg-bg-card'
              )}
            >
              <span className="text-base">{p.avatar}</span>
              <span className={isSpeaking ? 'text-gold' : 'text-text-soft'}>
                {p.name}
              </span>
              {isSpeaking && (
                <Loader2 className="h-3 w-3 animate-spin text-gold" />
              )}
            </div>
          );
        })}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-[50vh] space-y-3 overflow-y-auto rounded-lg border border-border bg-bg-card/40 p-4"
      >
        <AnimatePresence>
          {roundMessages.slice(0, visibleCount).map((msg, index) => {
            const persona = personas.find((p) => p.id === msg.personaId);
            return (
              <motion.div
                key={`${msg.personaId}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-soft text-lg">
                  {persona?.avatar || '?'}
                </div>
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-xs font-medium text-text">
                      {msg.personaName}
                    </span>
                    <span className="text-xs text-text-dim">
                      {persona?.philosophy}
                    </span>
                  </div>
                  <div className="rounded-lg rounded-tl-none border border-border bg-bg-card p-3">
                    <p className="text-sm leading-relaxed text-text-soft">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-soft text-lg">
              {roundMessages[visibleCount]?.personaId
                ? personas.find(
                    (p) => p.id === roundMessages[visibleCount].personaId
                  )?.avatar || '?'
                : '?'}
            </div>
            <div className="flex items-center gap-1 rounded-lg rounded-tl-none border border-border bg-bg-card p-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-text-dim"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Next button */}
      {allShown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-center"
        >
          <button
            onClick={onNextRound}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-gold-dim glow-gold"
          >
            {isLastRound ? (
              <>
                <ScrollText className="h-4 w-4" />
                {t('council.generateReport')}
              </>
            ) : (
              <>
                {t('council.nextRound')}
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== Main Page =====

export default function WisdomCouncilPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const { t, locale } = useTranslation();
  const { customAgents, loadFromStorage } = useAgentStore();
  const {
    phase,
    sessionNumber,
    currentRound,
    question,
    personas,
    messages,
    report,
    timeline,
    setQuestion,
    setPersonas,
    setPhase,
    nextRound,
    addMessage,
    setReport,
    setTimeline,
    reset,
    incrementSession,
  } = useCouncilStore();

  const [questionInput, setQuestionInput] = useState(question || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCombinationId, setActiveCombinationId] = useState<string | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: 'warning' | 'success';
  } | null>(null);

  /** 议会 API 调用结果（来自 /api/council） */
  const [councilResult, setCouncilResult] = useState<CouncilResult | null>(null);
  /** 是否正在调用议会 API */
  const [isLoading, setIsLoading] = useState(false);
  /** 议会 API 调用错误信息 */
  const [loadError, setLoadError] = useState<string | null>(null);

  /** 问题输入区域 ref（用于滚动定位） */
  const questionInputRef = useRef<HTMLDivElement>(null);
  /** 成员选择区域 ref（用于滚动定位） */
  const memberSelectionRef = useRef<HTMLDivElement>(null);

  /** 合并后的所有可选成员 */
  const unifiedMembers = getUnifiedMembers(customAgents);

  /** 显示提示信息（3 秒后自动消失） */
  const showToast = useCallback(
    (message: string, type: 'warning' | 'success' = 'warning') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  /** 首次加载时校验登录态 */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /** 已登录时加载自定义 Agent */
  useEffect(() => {
    if (isAuthenticated) {
      loadFromStorage();
    }
  }, [isAuthenticated, loadFromStorage]);

  /** 未登录时重定向到登录页 */
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  // Initialize messages when entering r1
  // 优先使用 API 返回的消息；若 API 未返回或失败，降级到 MOCK_MESSAGES
  const initializeMessages = useCallback(() => {
    if (messages.length === 0) {
      if (councilResult?.messages && councilResult.messages.length > 0) {
        councilResult.messages.forEach((msg) => {
          addMessage({
            personaId: msg.personaId,
            personaName: msg.personaName,
            role: msg.role,
            content: msg.content,
            round: msg.round,
          });
        });
      } else {
        MOCK_MESSAGES.forEach((msg) => {
          addMessage(msg);
        });
      }
    }
  }, [messages.length, addMessage, councilResult]);

  useEffect(() => {
    if (phase === 'r1' || phase === 'r2' || phase === 'r3') {
      initializeMessages();
    }
  }, [phase, initializeMessages]);

  /** 切换成员选中状态 */
  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((a) => a !== id);
      }
      if (prev.length >= MAX_MEMBERS) {
        return prev;
      }
      return [...prev, id];
    });
    // 用户手动调整后，清除组合高亮
    setActiveCombinationId(null);
  };

  /** 一键使用推荐组合 */
  const handleUseCombination = (combination: RecommendedCombination) => {
    // 找出组合中存在于统一成员列表的成员 ID
    const validIds = combination.memberIds
      .map((mid) => unifiedMembers.find((m) => m.id === mid)?.id)
      .filter((id): id is string => Boolean(id));

    // 截取到最大成员数
    let finalIds = validIds.slice(0, MAX_MEMBERS);

    // 如果有效成员不足 MIN_MEMBERS，从其他可用成员中补充
    if (finalIds.length < MIN_MEMBERS) {
      const supplementIds = unifiedMembers
        .filter((m) => !finalIds.includes(m.id))
        .map((m) => m.id);
      finalIds = [...finalIds, ...supplementIds].slice(0, MAX_MEMBERS);
    }

    setSelectedIds(finalIds);
    setActiveCombinationId(combination.id);
    showToast(
      `已应用「${combination.name}」，选中 ${finalIds.length} 位成员`,
      'success'
    );

    // 滚动到成员选择区域，给出视觉反馈
    setTimeout(() => {
      memberSelectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  /** 是否可以开始议会 */
  const canStart =
    selectedIds.length >= MIN_MEMBERS && selectedIds.length <= MAX_MEMBERS;

  /** 是否可以提交问题 */
  const canSubmit = questionInput.trim().length > 0 && canStart;

  /** 处理开始议会 */
  const handleStartCouncil = async () => {
    if (!canStart) {
      showToast('请先选择 3-6 位议会成员', 'warning');
      memberSelectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }
    if (!questionInput.trim()) {
      showToast('请先输入你的问题', 'warning');
      questionInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }
    setQuestion(questionInput, 'career');
    const selectedMembers = getMembersByIds(unifiedMembers, selectedIds);
    const selectedPersonas = selectedMembers.map(unifiedMemberToPersona);
    setPersonas(selectedPersonas);

    // 调用 AI 议会 API
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionInput,
          agentIds: selectedIds,
          councilType: 'wisdom',
          rounds: 2,
          locale,
        }),
      });
      if (!response.ok) throw new Error('Council API failed');
      const result = (await response.json()) as CouncilResult;
      setCouncilResult(result);
    } catch (error) {
      console.error('Council API error:', error);
      setLoadError('议会召唤失败，请重试');
      showToast('议会召唤失败，请重试', 'warning');
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setPhase('ritual');
  };

  // Handle ritual complete
  const handleRitualComplete = () => {
    nextRound();
    setPhase('r1');
  };

  // Handle next round
  const handleNextRound = () => {
    if (currentRound < 3) {
      nextRound();
      setPhase(`r${currentRound + 1}` as 'r2' | 'r3');
    } else {
      // 生成报告：优先使用 API 返回的报告和时间线，降级到 Mock
      if (councilResult?.report) {
        setReport(councilResult.report);
      } else {
        setReport(createMockReport(question || questionInput));
      }
      if (councilResult?.timeline) {
        setTimeline(councilResult.timeline);
      } else {
        setTimeline(MOCK_TIMELINE);
      }
      setPhase('report');
    }
  };

  // Handle new council
  const handleNewCouncil = () => {
    reset();
    incrementSession();
    setQuestionInput('');
    setSelectedIds([]);
    setActiveCombinationId(null);
    setCouncilResult(null);
    setIsLoading(false);
    setLoadError(null);
    setPhase('idle');
  };

  // Handle share
  const handleShare = () => {
    if (report) {
      router.push(`/report/${report.id}`);
    }
  };

  // Handle view timeline
  const handleViewTimeline = () => {
    setPhase('timeline');
  };

  // 登录态校验中，显示加载状态
  if (!isInitialized || !isAuthenticated) {
    return (
      <>
        <ParticleBackground />
        <Header />
        <main className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-text-soft">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="text-sm">{t('council.verifying')}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/council')}
            className="inline-flex items-center gap-1.5 text-sm text-text-soft transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('council.backCouncil')}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text">
              {t('council.wisdomCouncil')}
            </span>
            <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] text-gold">
              {formatSessionNumber(sessionNumber)}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-8">
        <AnimatePresence mode="wait">
          {/* IDLE: Question input + Recommended combinations + Member selection */}
          {phase === 'idle' && (
            <motion.div key="idle" className="space-y-10">
              {isLoading ? (
                // 议会 API 调用中：显示加载动画
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-gold" />
                  <p className="mt-4 text-sm text-text-soft">
                    正在召唤议会成员...
                  </p>
                  <p className="mt-1 text-xs text-text-dim">
                    AI 智者正在集结，请稍候
                  </p>
                </motion.div>
              ) : (
                <>
                  <div ref={questionInputRef}>
                    <QuestionInput
                      question={questionInput}
                      setQuestion={setQuestionInput}
                      onSubmit={handleStartCouncil}
                      canSubmit={canSubmit}
                    />
                  </div>

                  {/* 推荐组合区域 */}
                  <RecommendedCombinations
                    onUseCombination={handleUseCombination}
                    activeCombinationId={activeCombinationId}
                  />

                  {/* 成员选择区域 */}
                  <div ref={memberSelectionRef}>
                    <MemberSelection
                      members={unifiedMembers}
                      selectedIds={selectedIds}
                      onToggle={toggleMember}
                      onStart={handleStartCouncil}
                      canStart={canStart}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* RITUAL: Animation */}
          {phase === 'ritual' && (
            <RitualAnimation key="ritual" onComplete={handleRitualComplete} />
          )}

          {/* R1/R2/R3: Meeting room */}
          {(phase === 'r1' || phase === 'r2' || phase === 'r3') && (
            <MeetingRoom
              key="meeting"
              messages={messages}
              currentRound={currentRound}
              personas={personas}
              roundTitle={ROUND_TITLES[currentRound] || ''}
              onNextRound={handleNextRound}
              isLastRound={currentRound >= 3}
            />
          )}

          {/* REPORT: Destiny report */}
          {phase === 'report' && report && (
            <motion.div key="report" className="space-y-6">
              {/* 演示数据提示：当 API 返回 isMock 为 true 时显示 */}
              {councilResult?.isMock && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>演示数据（未接入AI）</span>
                </motion.div>
              )}
              <DestinyReportComponent
                report={report}
                onShare={handleShare}
                onSave={() => {}}
                onNewCouncil={handleNewCouncil}
              />
              <div className="flex justify-center">
                <button
                  onClick={handleViewTimeline}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-soft transition-colors hover:border-gold-dim hover:text-gold card-hover"
                >
                  <Eye className="h-4 w-4" />
                  {t('council.viewTimeline')}
                </button>
              </div>
            </motion.div>
          )}

          {/* TIMELINE: Timeline view */}
          {phase === 'timeline' && timeline && (
            <motion.div key="timeline" className="space-y-6">
              <TimelineView branches={timeline} />
              <div className="flex justify-center">
                <button
                  onClick={() => setPhase('report')}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-soft transition-colors hover:border-gold-dim hover:text-gold card-hover"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('council.backReport')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 全局提示 */}
      <AnimatePresence>
        {toast && (
          <Toast key="toast" message={toast.message} type={toast.type} />
        )}
      </AnimatePresence>
    </div>
  );
}
