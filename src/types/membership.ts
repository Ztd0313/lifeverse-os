/**
 * 会员体系类型定义
 *
 * 三层用户体系：
 * - free: 免费普通用户
 * - basic: 基础会员（月度订阅）
 * - pro: Pro 高级会员（月度订阅）
 */

/** 会员等级 */
export type MembershipTier = 'free' | 'basic' | 'pro';

/** 会员状态 */
export type MembershipStatus = 'active' | 'expired' | 'none';

/** 订阅周期 */
export type BillingCycle = 'monthly' | 'yearly';

/** Agent 席位来源 */
export type SeatSource = 'free' | 'membership' | 'purchased';

/**
 * 会员等级配置
 */
export interface TierConfig {
  /** 等级标识 */
  tier: MembershipTier;
  /** 中文名称 */
  name: string;
  /** 英文名称 */
  nameEn: string;
  /** 月度价格（分） */
  priceMonthly: number;
  /** 年度价格（分） */
  priceYearly: number;
  /** 主题色 */
  color: string;
  /** 渐变色 */
  gradient: string;
  /** 图标 emoji */
  icon: string;
  /** 标语 */
  tagline: string;
  /** 功能列表 */
  features: TierFeature[];
  /** 自定义 Agent 免费席位数 */
  agentSeats: number;
  /** 每日对话次数限制（-1 表示无限） */
  dailyDialogueLimit: number;
  /** 每日议会次数限制（-1 表示无限） */
  dailyCouncilLimit: number;
  /** 议会成员上限 */
  councilMemberLimit: number;
  /** 是否解锁全部市场 Agent */
  unlockAllAgents: boolean;
  /** 是否有语音试听 */
  voiceTrial: boolean;
  /** 是否有数据报表 */
  dataReport: boolean;
  /** 优先级排序 */
  priority: number;
}

/**
 * 等级功能项
 */
export interface TierFeature {
  /** 功能描述 */
  label: string;
  /** 是否包含 */
  included: boolean;
  /** 图标 */
  icon?: string;
}

/**
 * 用户会员信息
 */
export interface MembershipInfo {
  /** 当前等级 */
  tier: MembershipTier;
  /** 会员状态 */
  status: MembershipStatus;
  /** 订阅开始时间 ISO */
  subscribedAt?: string;
  /** 到期时间 ISO */
  expiresAt?: string;
  /** 自动续费 */
  autoRenew: boolean;
  /** 额外购买的 Agent 席位数 */
  purchasedSeats: number;
  /** 订阅周期 */
  billingCycle?: BillingCycle;
}

/**
 * 每日用量统计
 */
export interface DailyUsage {
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 内心对话次数 */
  innerDialogueCount: number;
  /** 重逢对话次数 */
  reunionDialogueCount: number;
  /** 议会次数 */
  councilCount: number;
  /** Agent 追问次数 */
  agentQueryCount: number;
}

/**
 * 用户数据报表
 */
export interface UserStats {
  /** 总对话次数 */
  totalDialogues: number;
  /** 总议会次数 */
  totalCouncils: number;
  /** 自定义 Agent 数 */
  customAgentCount: number;
  /** 拥有的市场 Agent 数 */
  ownedAgentCount: number;
  /** 记忆条目数 */
  memoryCount: number;
  /** 注册天数 */
  daysSinceJoin: number;
  /** 本月活跃天数 */
  activeDaysThisMonth: number;
  /** 今日用量 */
  todayUsage: DailyUsage;
  /** 历史用量（最近 7 天） */
  weeklyUsage: DailyUsage[];
  /** 最常对话的 Agent */
  topAgents: { name: string; count: number }[];
}

// ===== 会员等级配置常量 =====

export const TIER_CONFIGS: Record<MembershipTier, TierConfig> = {
  free: {
    tier: 'free',
    name: '免费用户',
    nameEn: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    color: '#9a9a9a',
    gradient: 'linear-gradient(135deg, #9a9a9a, #6a6a6a)',
    icon: '🧭',
    tagline: '开启你的生命宇宙探索之旅',
    features: [
      { label: '自定义 Agent 2 个', included: true },
      { label: '每日内心对话 5 次', included: true },
      { label: '每日议会 1 次', included: true },
      { label: '议会成员上限 4 位', included: true },
      { label: '基础市场 Agent', included: true },
      { label: '语音试听', included: false },
      { label: '数据报表', included: false },
      { label: '无限对话', included: false },
    ],
    agentSeats: 2,
    dailyDialogueLimit: 5,
    dailyCouncilLimit: 1,
    councilMemberLimit: 4,
    unlockAllAgents: false,
    voiceTrial: false,
    dataReport: false,
    priority: 0,
  },
  basic: {
    tier: 'basic',
    name: '基础会员',
    nameEn: 'Basic',
    priceMonthly: 2900,
    priceYearly: 28800,
    color: '#c9a84c',
    gradient: 'linear-gradient(135deg, #c9a84c, #e8d68a)',
    icon: '⭐',
    tagline: '深度探索，解锁更多可能',
    features: [
      { label: '自定义 Agent 4 个（赠送 2 席位）', included: true },
      { label: '每日内心对话 30 次', included: true },
      { label: '每日议会 5 次', included: true },
      { label: '议会成员上限 6 位', included: true },
      { label: '全部市场 Agent 解锁', included: true },
      { label: '语音试听', included: true },
      { label: '数据报表', included: true },
      { label: '无限对话', included: false },
    ],
    agentSeats: 4,
    dailyDialogueLimit: 30,
    dailyCouncilLimit: 5,
    councilMemberLimit: 6,
    unlockAllAgents: true,
    voiceTrial: true,
    dataReport: true,
    priority: 1,
  },
  pro: {
    tier: 'pro',
    name: 'Pro 高级会员',
    nameEn: 'Pro',
    priceMonthly: 5900,
    priceYearly: 58800,
    color: '#b8a0c8',
    gradient: 'linear-gradient(135deg, #b8a0c8, #e8d6f0)',
    icon: '👑',
    tagline: '极致体验，掌控你的生命宇宙',
    features: [
      { label: '自定义 Agent 6 个（赠送 4 席位）', included: true },
      { label: '无限内心对话', included: true },
      { label: '无限议会', included: true },
      { label: '议会成员上限 8 位', included: true },
      { label: '全部市场 Agent 解锁', included: true },
      { label: '语音试听', included: true },
      { label: '高级数据报表 + 趋势分析', included: true },
      { label: '优先体验新功能', included: true },
    ],
    agentSeats: 6,
    dailyDialogueLimit: -1,
    dailyCouncilLimit: -1,
    councilMemberLimit: 8,
    unlockAllAgents: true,
    voiceTrial: true,
    dataReport: true,
    priority: 2,
  },
};

/** Agent 席位单价（分/月） */
export const AGENT_SEAT_PRICE = 900;

/**
 * 获取会员等级配置
 */
export function getTierConfig(tier: MembershipTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * 获取用户 Agent 席位总数（会员赠送 + 额外购买）
 */
export function getTotalAgentSeats(membership: MembershipInfo): number {
  const config = TIER_CONFIGS[membership.tier];
  return config.agentSeats + membership.purchasedSeats;
}

/**
 * 格式化价格（分 → 元）
 */
export function formatPrice(cents: number): string {
  if (cents === 0) return '免费';
  return `¥${(cents / 100).toFixed(0)}`;
}

/**
 * 格式化价格带周期
 */
export function formatPriceWithCycle(cents: number, cycle: BillingCycle): string {
  if (cents === 0) return '免费';
  const yuan = (cents / 100).toFixed(0);
  return cycle === 'monthly' ? `¥${yuan}/月` : `¥${yuan}/年`;
}
