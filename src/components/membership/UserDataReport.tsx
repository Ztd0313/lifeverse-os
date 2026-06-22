'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Bot,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useMembershipStore } from '@/stores/membership-store';
import { TIER_CONFIGS, getTierConfig } from '@/types/membership';
import { MembershipBadge } from '@/components/membership/MembershipBadge';
import { cn } from '@/lib/utils';

/**
 * 用户数据报表组件
 *
 * 以可视化仪表盘形式展示用户活动统计：
 * - 数据概览卡片（总对话、总议会、自定义/拥有 Agent、记忆、加入天数）
 * - 今日用量（内心对话 / 议会，带每日额度进度条）
 * - 本周活跃度柱状图（7 天，纯 div 实现）
 * - 最常对话的 Agent 排行
 * - 会员等级信息（等级、到期时间、Agent 席位）
 */

// ===== 类型定义 =====

interface UserDataReportProps {
  customAgentCount: number;
  ownedAgentCount: number;
  memoryCount: number;
  createdAt: string;
}

// ===== 常量 =====

/** 周几标签（getDay() 返回 0=周日 ... 6=周六） */
const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// ===== 子组件：统计卡片 =====

interface StatCardProps {
  icon: typeof MessageSquare;
  value: number | string;
  label: string;
  delay?: number;
}

function StatCard({ icon: Icon, value, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="card-hover rounded-lg border border-border bg-bg-card p-4"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-soft">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-text">{value}</div>
        <div className="mt-0.5 text-xs text-text-dim">{label}</div>
      </div>
    </motion.div>
  );
}

// ===== 子组件：今日用量进度条 =====

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  icon: typeof MessageSquare;
}

function UsageBar({ label, used, limit, icon: Icon }: UsageBarProps) {
  const isUnlimited = limit === -1;
  const percent = isUnlimited
    ? 100
    : limit > 0
      ? Math.min(100, (used / limit) * 100)
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gold" />
          <span className="text-sm text-text-soft">{label}</span>
        </div>
        <span className="text-sm font-medium text-text">
          {used}
          <span className="text-text-dim"> / {isUnlimited ? '∞' : limit}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: isUnlimited
              ? 'linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-hover))'
              : 'linear-gradient(90deg, var(--gold-dim), var(--gold))',
          }}
        />
      </div>
    </div>
  );
}

// ===== 主组件 =====

export function UserDataReport({
  customAgentCount,
  ownedAgentCount,
  memoryCount,
  createdAt,
}: UserDataReportProps) {
  const { membership, getStats, canInnerDialogue, canCouncil } =
    useMembershipStore();
  const stats = getStats({
    customAgentCount,
    ownedAgentCount,
    memoryCount,
    createdAt,
  });
  const dialogueCheck = canInnerDialogue();
  const councilCheck = canCouncil();

  const tierConfig = getTierConfig(membership.tier);
  const totalSeats = tierConfig.agentSeats + membership.purchasedSeats;

  // 周活跃度归一化最大值（至少为 1，避免除零）
  const weeklyTotals = stats.weeklyUsage.map(
    (d) =>
      d.innerDialogueCount +
      d.reunionDialogueCount +
      d.councilCount +
      d.agentQueryCount
  );
  const maxWeekly = Math.max(1, ...weeklyTotals);

  // 预处理图表数据
  const chartData = stats.weeklyUsage.map((day, i) => {
    const total =
      day.innerDialogueCount +
      day.reunionDialogueCount +
      day.councilCount +
      day.agentQueryCount;
    const date = new Date(`${day.date}T00:00:00`);
    return {
      date: day.date,
      total,
      heightPercent: (total / maxWeekly) * 100,
      weekday: WEEKDAY_LABELS[date.getDay()],
      isToday: i === stats.weeklyUsage.length - 1,
    };
  });

  // 到期时间格式化
  const expiryText = membership.expiresAt
    ? new Date(membership.expiresAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  // 统计卡片配置
  const statCards: StatCardProps[] = [
    { icon: MessageSquare, value: stats.totalDialogues, label: '总对话次数' },
    { icon: Users, value: stats.totalCouncils, label: '总议会次数' },
    { icon: Bot, value: stats.customAgentCount, label: '自定义 Agent' },
    { icon: Sparkles, value: stats.ownedAgentCount, label: '拥有 Agent' },
    { icon: BookOpen, value: stats.memoryCount, label: '记忆条目' },
    { icon: Calendar, value: stats.daysSinceJoin, label: '加入天数' },
  ];

  return (
    <div className="space-y-6">
      {/* ===== 数据概览卡片 ===== */}
      <section>
        <h3 className="h-title mb-3 text-base text-text">数据概览</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} delay={i * 0.05} />
          ))}
        </div>
      </section>

      {/* ===== 今日用量 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        className="rounded-lg border border-border bg-bg-card p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gold" />
          <h3 className="h-title text-base text-text">今日用量</h3>
        </div>
        <div className="space-y-4">
          <UsageBar
            label="内心对话"
            used={stats.todayUsage.innerDialogueCount}
            limit={dialogueCheck.limit}
            icon={MessageSquare}
          />
          <UsageBar
            label="命运议会"
            used={stats.todayUsage.councilCount}
            limit={councilCheck.limit}
            icon={Users}
          />
        </div>
      </motion.section>

      {/* ===== 本周活跃度图表 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        className="rounded-lg border border-border bg-bg-card p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" />
            <h3 className="h-title text-base text-text">本周活跃度</h3>
          </div>
          <span className="text-xs text-text-dim">最近 7 天</span>
        </div>
        {/* 柱状图区域 */}
        <div className="flex h-32 justify-between gap-2">
          {chartData.map((item) => (
            <div
              key={item.date}
              className="flex h-full flex-1 items-end"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${item.heightPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full rounded-t-md"
                style={{
                  background:
                    item.total > 0
                      ? 'linear-gradient(to top, var(--gold-dim), var(--gold))'
                      : 'var(--border)',
                  minHeight: 3,
                }}
                title={`${item.weekday}：${item.total} 次`}
              />
            </div>
          ))}
        </div>
        {/* 周几标签 */}
        <div className="mt-2 flex justify-between gap-2">
          {chartData.map((item) => (
            <span
              key={item.date}
              className={cn(
                'flex-1 text-center text-[10px]',
                item.isToday ? 'font-medium text-gold' : 'text-text-dim'
              )}
            >
              {item.weekday}
            </span>
          ))}
        </div>
      </motion.section>

      {/* ===== 最常对话的 Agent ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
        className="rounded-lg border border-border bg-bg-card p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-4 w-4 text-gold" />
          <h3 className="h-title text-base text-text">最常对话的 Agent</h3>
        </div>
        {stats.topAgents.length > 0 ? (
          <div className="space-y-2">
            {stats.topAgents.map((agent, i) => (
              <div
                key={agent.name}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-soft/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      i === 0
                        ? 'bg-gold-soft text-gold'
                        : 'bg-border text-text-soft'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm text-text">{agent.name}</span>
                </div>
                <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-medium text-gold">
                  {agent.count} 次
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-text-dim">暂无对话记录</p>
        )}
      </motion.section>

      {/* ===== 会员信息 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
        className="rounded-lg border border-border bg-bg-card p-5"
        style={
          membership.tier !== 'free'
            ? { borderColor: `${tierConfig.color}40` }
            : undefined
        }
      >
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h3 className="h-title text-base text-text">会员信息</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-soft">当前等级</span>
            <MembershipBadge tier={membership.tier} size="md" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-soft">到期时间</span>
            <span className="text-sm font-medium text-text">{expiryText}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-soft">Agent 席位</span>
            <span className="text-sm font-medium text-text">
              {totalSeats}
              <span className="text-text-dim"> 个</span>
            </span>
          </div>
          <p className="border-t border-border pt-3 text-xs leading-relaxed text-text-dim">
            {TIER_CONFIGS[membership.tier].tagline}
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default UserDataReport;
