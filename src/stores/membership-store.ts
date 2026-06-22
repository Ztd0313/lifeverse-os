/**
 * 会员体系状态管理 Store
 *
 * 管理用户会员信息、每日用量统计、数据报表。
 * 使用 Zustand + persist 中间件持久化到 localStorage。
 *
 * 功能：
 * - 会员等级管理（订阅、取消、升级）
 * - 每日对话/议会用量追踪
 * - Agent 席位管理（购买额外席位）
 * - 用户数据报表生成
 * - 用量限制校验
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type MembershipTier,
  type MembershipInfo,
  type DailyUsage,
  type UserStats,
  type BillingCycle,
  TIER_CONFIGS,
  getTotalAgentSeats,
  getTierConfig,
} from '@/types/membership';

// ===== 工具函数 =====

/** 获取今日日期 YYYY-MM-DD */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/** 获取指定日期偏移的日期 */
function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** 计算两个日期之间的天数 */
function daysBetween(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** 本月活跃天数（模拟） */
function getActiveDaysThisMonth(): number {
  const day = new Date().getDate();
  return Math.min(day, Math.ceil(day * 0.7));
}

// ===== Store 类型定义 =====

export interface MembershipStore {
  /** 会员信息 */
  membership: MembershipInfo;
  /** 每日用量记录（按日期键存储） */
  usageRecords: Record<string, DailyUsage>;
  /** 总对话次数 */
  totalDialogues: number;
  /** 总议会次数 */
  totalCouncils: number;

  // ===== Actions =====
  /** 订阅会员 */
  subscribe: (tier: MembershipTier, cycle: BillingCycle) => void;
  /** 取消订阅 */
  cancelSubscription: () => void;
  /** 购买额外 Agent 席位 */
  purchaseAgentSeat: () => void;
  /** 记录内心对话 */
  recordInnerDialogue: () => void;
  /** 记录重逢对话 */
  recordReunionDialogue: () => void;
  /** 记录议会 */
  recordCouncil: () => void;
  /** 记录 Agent 追问 */
  recordAgentQuery: () => void;
  /** 检查是否可以内心对话 */
  canInnerDialogue: () => { allowed: boolean; remaining: number; limit: number };
  /** 检查是否可以议会 */
  canCouncil: () => { allowed: boolean; remaining: number; limit: number };
  /** 获取今日用量 */
  getTodayUsage: () => DailyUsage;
  /** 获取用户数据报表 */
  getStats: (params: {
    customAgentCount: number;
    ownedAgentCount: number;
    memoryCount: number;
    createdAt: string;
  }) => UserStats;
  /** 重置用量（测试用） */
  resetUsage: () => void;
}

// ===== 默认会员信息 =====

const DEFAULT_MEMBERSHIP: MembershipInfo = {
  tier: 'free',
  status: 'none',
  autoRenew: false,
  purchasedSeats: 0,
};

// ===== 创建 Store =====

export const useMembershipStore = create<MembershipStore>()(
  persist(
    (set, get) => ({
      // ===== Initial State =====
      membership: DEFAULT_MEMBERSHIP,
      usageRecords: {},
      totalDialogues: 0,
      totalCouncils: 0,

      // ===== Actions =====

      /**
       * 订阅会员
       */
      subscribe: (tier, cycle) => {
        const now = new Date();
        const expiresAt = new Date(now);
        if (cycle === 'monthly') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        set({
          membership: {
            tier,
            status: 'active',
            subscribedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            autoRenew: true,
            purchasedSeats: get().membership.purchasedSeats,
            billingCycle: cycle,
          },
        });
      },

      /**
       * 取消订阅（降级为免费用户）
       */
      cancelSubscription: () => {
        set({
          membership: {
            ...DEFAULT_MEMBERSHIP,
            purchasedSeats: get().membership.purchasedSeats,
          },
        });
      },

      /**
       * 购买额外 Agent 席位（+1）
       */
      purchaseAgentSeat: () => {
        const current = get().membership;
        set({
          membership: {
            ...current,
            purchasedSeats: current.purchasedSeats + 1,
          },
        });
      },

      /**
       * 记录内心对话
       */
      recordInnerDialogue: () => {
        const today = getToday();
        const records = { ...get().usageRecords };
        const todayRecord = records[today] || {
          date: today,
          innerDialogueCount: 0,
          reunionDialogueCount: 0,
          councilCount: 0,
          agentQueryCount: 0,
        };
        todayRecord.innerDialogueCount++;
        records[today] = todayRecord;
        set({
          usageRecords: records,
          totalDialogues: get().totalDialogues + 1,
        });
      },

      /**
       * 记录重逢对话
       */
      recordReunionDialogue: () => {
        const today = getToday();
        const records = { ...get().usageRecords };
        const todayRecord = records[today] || {
          date: today,
          innerDialogueCount: 0,
          reunionDialogueCount: 0,
          councilCount: 0,
          agentQueryCount: 0,
        };
        todayRecord.reunionDialogueCount++;
        records[today] = todayRecord;
        set({
          usageRecords: records,
          totalDialogues: get().totalDialogues + 1,
        });
      },

      /**
       * 记录议会
       */
      recordCouncil: () => {
        const today = getToday();
        const records = { ...get().usageRecords };
        const todayRecord = records[today] || {
          date: today,
          innerDialogueCount: 0,
          reunionDialogueCount: 0,
          councilCount: 0,
          agentQueryCount: 0,
        };
        todayRecord.councilCount++;
        records[today] = todayRecord;
        set({
          usageRecords: records,
          totalCouncils: get().totalCouncils + 1,
        });
      },

      /**
       * 记录 Agent 追问
       */
      recordAgentQuery: () => {
        const today = getToday();
        const records = { ...get().usageRecords };
        const todayRecord = records[today] || {
          date: today,
          innerDialogueCount: 0,
          reunionDialogueCount: 0,
          councilCount: 0,
          agentQueryCount: 0,
        };
        todayRecord.agentQueryCount++;
        records[today] = todayRecord;
        set({ usageRecords: records });
      },

      /**
       * 检查是否可以内心对话
       */
      canInnerDialogue: () => {
        const { membership } = get();
        const config = getTierConfig(membership.tier);
        const limit = config.dailyDialogueLimit;
        if (limit === -1) {
          return { allowed: true, remaining: -1, limit: -1 };
        }
        const today = getToday();
        const todayRecord = get().usageRecords[today];
        const used = todayRecord?.innerDialogueCount || 0;
        const remaining = Math.max(0, limit - used);
        return { allowed: remaining > 0, remaining, limit };
      },

      /**
       * 检查是否可以议会
       */
      canCouncil: () => {
        const { membership } = get();
        const config = getTierConfig(membership.tier);
        const limit = config.dailyCouncilLimit;
        if (limit === -1) {
          return { allowed: true, remaining: -1, limit: -1 };
        }
        const today = getToday();
        const todayRecord = get().usageRecords[today];
        const used = todayRecord?.councilCount || 0;
        const remaining = Math.max(0, limit - used);
        return { allowed: remaining > 0, remaining, limit };
      },

      /**
       * 获取今日用量
       */
      getTodayUsage: () => {
        const today = getToday();
        const record = get().usageRecords[today];
        return record || {
          date: today,
          innerDialogueCount: 0,
          reunionDialogueCount: 0,
          councilCount: 0,
          agentQueryCount: 0,
        };
      },

      /**
       * 获取用户数据报表
       */
      getStats: (params) => {
        const { customAgentCount, ownedAgentCount, memoryCount, createdAt } = params;
        const today = getToday();
        const weeklyUsage: DailyUsage[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = getDateOffset(-i);
          const record = get().usageRecords[date];
          weeklyUsage.push(record || {
            date,
            innerDialogueCount: 0,
            reunionDialogueCount: 0,
            councilCount: 0,
            agentQueryCount: 0,
          });
        }

        const todayUsage = get().getTodayUsage();

        // 模拟热门 Agent 数据
        const topAgents = [
          { name: '马斯克', count: Math.floor(get().totalDialogues * 0.3) + 5 },
          { name: '苏格拉底', count: Math.floor(get().totalDialogues * 0.2) + 3 },
          { name: '王阳明', count: Math.floor(get().totalDialogues * 0.15) + 2 },
        ].sort((a, b) => b.count - a.count);

        return {
          totalDialogues: get().totalDialogues,
          totalCouncils: get().totalCouncils,
          customAgentCount,
          ownedAgentCount,
          memoryCount,
          daysSinceJoin: daysBetween(createdAt),
          activeDaysThisMonth: getActiveDaysThisMonth(),
          todayUsage,
          weeklyUsage,
          topAgents,
        };
      },

      /**
       * 重置用量（测试用）
       */
      resetUsage: () => {
        set({
          usageRecords: {},
          totalDialogues: 0,
          totalCouncils: 0,
        });
      },
    }),
    {
      name: 'lifeverse-membership',
      partialize: (state) => ({
        membership: state.membership,
        usageRecords: state.usageRecords,
        totalDialogues: state.totalDialogues,
        totalCouncils: state.totalCouncils,
      }),
    }
  )
);

// ===== 便捷导出 =====

export { TIER_CONFIGS, getTotalAgentSeats, getTierConfig };
