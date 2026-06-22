/**
 * 议会成员合并模块
 *
 * 将系统预设成员（COUNCIL_MEMBERS + 核心 AGENTS）与用户自定义 Agent
 * 合并为统一的成员列表，提供按分类筛选和搜索的函数。
 *
 * 注意：
 * - COUNCIL_MEMBERS（24 位）来自 agent-templates.ts
 * - 核心 AGENTS（智者型 7 位）来自 agents.ts，因为推荐组合中引用了
 *   这些成员的 ID（如 musk、buffett 等），需要将它们一并纳入可选列表
 * - 用户自定义 Agent 来自 agent-store
 *
 * 该模块不直接读取 store，而是接收自定义 Agent 列表作为参数，
 * 以保持纯函数特性，便于测试和复用。
 *
 * @module council-members
 */

import {
  COUNCIL_MEMBERS,
  MEMBER_CATEGORY_LABELS,
  type CouncilMemberConfig,
  type CouncilMemberCategory,
} from '@/lib/ai/agent-templates';
import { AGENTS } from '@/lib/agents';
import type { Persona } from '@/types';
import type { CustomAgent } from '@/stores/agent-store';

// ===== 统一成员类型 =====

/**
 * 统一议会成员类型
 *
 * 既包含系统预设成员，也包含用户自定义 Agent。
 * 通过 source 字段区分来源。
 */
export interface UnifiedCouncilMember {
  /** 唯一 ID（系统成员用原 id，自定义成员用 custom_ 前缀） */
  id: string;
  /** 中文名称 */
  name: string;
  /** 英文名称 */
  nameEn: string;
  /** 分类（自定义成员统一归为 'custom'） */
  category: CouncilMemberCategory | 'custom';
  /** 身份描述 */
  identity: string;
  /** 性格特点 */
  personality: string;
  /** 专业领域 */
  expertise: string[];
  /** 说话风格概述 */
  speakingStyle: string;
  /** 头像 emoji */
  avatar: string;
  /** 系统提示词 */
  systemPrompt: string;
  /** 来源：系统预设 or 用户自定义 */
  source: 'system' | 'custom';
  /** 原始数据 */
  raw: CouncilMemberConfig | CustomAgent | Persona;
}

// ===== 分类标签扩展 =====

/**
 * 扩展后的分类标签映射（包含 'custom'）
 */
export const EXTENDED_CATEGORY_LABELS: Record<
  CouncilMemberCategory | 'custom',
  string
> = {
  ...MEMBER_CATEGORY_LABELS,
  custom: '我的自定义',
};

/**
 * 筛选分类选项（包含"全部"）
 */
export const CATEGORY_FILTER_OPTIONS: {
  value: CouncilMemberCategory | 'custom' | 'all';
  label: string;
}[] = [
  { value: 'all', label: '全部' },
  { value: 'historical', label: '历史人物' },
  { value: 'business', label: '商业领袖' },
  { value: 'philosopher', label: '哲学家' },
  { value: 'literary', label: '文学家' },
  { value: 'scientist', label: '科学家' },
  { value: 'psychologist', label: '心理顾问' },
  { value: 'career', label: '职业导师' },
  { value: 'fictional', label: '虚构角色' },
  { value: 'custom', label: '我的自定义' },
];

// ===== 核心 AGENTS 分类映射 =====

/**
 * 智者型 AGENTS 到 COUNCIL_MEMBERS 分类的映射
 *
 * 推荐组合中引用了 musk、buffett 等智者型 Agent 的 ID，
 * 需要将它们纳入可选成员列表并归入合适的分类。
 */
const SAGE_AGENT_CATEGORY_MAP: Record<string, CouncilMemberCategory> = {
  musk: 'business',
  buffett: 'business',
  jobs: 'business',
  munger: 'business',
  socrates: 'philosopher',
  wangyangming: 'philosopher',
  zhuangzi: 'philosopher',
};

/**
 * 智者型 AGENTS 的身份描述映射
 */
const SAGE_AGENT_IDENTITY_MAP: Record<string, string> = {
  musk: '特斯拉与 SpaceX 创始人，第一性原理的践行者',
  buffett: '伯克希尔哈撒韦董事长，价值投资的代表',
  jobs: '苹果创始人，追求卓越的产品哲学家',
  munger: '巴菲特搭档，多元思维模型的倡导者',
  socrates: '古希腊哲学家，追问真理的先驱',
  wangyangming: '明代大儒，心学集大成者',
  zhuangzi: '道家代表人物，逍遥自在的智者',
};

// ===== 转换函数 =====

/**
 * 将系统预设成员（COUNCIL_MEMBERS）转换为统一格式
 */
function normalizeSystemMember(
  member: CouncilMemberConfig
): UnifiedCouncilMember {
  return {
    id: member.id,
    name: member.name,
    nameEn: member.nameEn,
    category: member.category,
    identity: member.identity,
    personality: member.personality,
    expertise: member.expertise,
    speakingStyle: member.speakingStyle,
    avatar: member.avatar,
    systemPrompt: member.systemPrompt,
    source: 'system',
    raw: member,
  };
}

/**
 * 将智者型 AGENTS 转换为统一格式
 *
 * 推荐组合中引用了这些 Agent 的 ID，需要纳入可选列表。
 * 根据 SAGE_AGENT_CATEGORY_MAP 映射到合适的分类。
 */
function normalizeSageAgent(agent: Persona): UnifiedCouncilMember {
  const category = SAGE_AGENT_CATEGORY_MAP[agent.id] || 'business';
  const identity = SAGE_AGENT_IDENTITY_MAP[agent.id] || agent.philosophy;
  return {
    id: agent.id,
    name: agent.name,
    nameEn: agent.nameEn,
    category,
    identity,
    personality: agent.philosophy,
    expertise: [agent.philosophy],
    speakingStyle: agent.speakingStyle,
    avatar: agent.avatar,
    systemPrompt: '', // AGENTS 的 systemPrompt 在 agent-prompts.ts 中按需生成
    source: 'system',
    raw: agent,
  };
}

/**
 * 将用户自定义 Agent 转换为统一格式
 *
 * 自定义成员的 ID 加 'custom_' 前缀，避免与系统成员 ID 冲突。
 */
function normalizeCustomAgent(agent: CustomAgent): UnifiedCouncilMember {
  return {
    id: `custom_${agent.id}`,
    name: agent.name,
    nameEn: 'Custom Agent',
    category: 'custom',
    identity: `自定义成员 · ${agent.expertise}`,
    personality: agent.personality,
    expertise: [agent.expertise],
    speakingStyle: agent.coreBelief,
    avatar: agent.avatar,
    systemPrompt: agent.systemPrompt,
    source: 'custom',
    raw: agent,
  };
}

// ===== 核心函数 =====

/**
 * 获取合并后的所有议会成员
 *
 * 合并顺序：COUNCIL_MEMBERS（24 位）+ 智者型 AGENTS（7 位）+ 用户自定义 Agent
 *
 * @param customAgents 用户自定义 Agent 列表
 * @returns 合并后的统一成员列表
 */
export function getUnifiedMembers(
  customAgents: CustomAgent[] = []
): UnifiedCouncilMember[] {
  const systemMembers = COUNCIL_MEMBERS.map(normalizeSystemMember);

  // 智者型 AGENTS（排除已在 COUNCIL_MEMBERS 中的，虽然目前没有重复）
  const sageAgents = AGENTS.filter(
    (a) => a.type === 'sage' && SAGE_AGENT_CATEGORY_MAP[a.id]
  ).map(normalizeSageAgent);

  const customMembers = customAgents.map(normalizeCustomAgent);

  return [...systemMembers, ...sageAgents, ...customMembers];
}

/**
 * 按分类筛选成员
 *
 * @param members 成员列表
 * @param category 分类（'all' 表示全部）
 * @returns 筛选后的成员列表
 */
export function filterMembersByCategory(
  members: UnifiedCouncilMember[],
  category: CouncilMemberCategory | 'custom' | 'all'
): UnifiedCouncilMember[] {
  if (category === 'all') return members;
  return members.filter((m) => m.category === category);
}

/**
 * 搜索成员
 *
 * 在名称、身份、专业领域、性格特点中搜索关键词。
 *
 * @param members 成员列表
 * @param query 搜索关键词
 * @returns 匹配的成员列表
 */
export function searchMembers(
  members: UnifiedCouncilMember[],
  query: string
): UnifiedCouncilMember[] {
  if (!query.trim()) return members;
  const lower = query.trim().toLowerCase();
  return members.filter((m) => {
    return (
      m.name.toLowerCase().includes(lower) ||
      m.nameEn.toLowerCase().includes(lower) ||
      m.identity.toLowerCase().includes(lower) ||
      m.personality.toLowerCase().includes(lower) ||
      m.expertise.some((e) => e.toLowerCase().includes(lower)) ||
      m.speakingStyle.toLowerCase().includes(lower)
    );
  });
}

/**
 * 综合筛选：分类 + 搜索
 *
 * @param members 成员列表
 * @param category 分类
 * @param query 搜索关键词
 * @returns 筛选后的成员列表
 */
export function filterAndSearchMembers(
  members: UnifiedCouncilMember[],
  category: CouncilMemberCategory | 'custom' | 'all',
  query: string
): UnifiedCouncilMember[] {
  const filtered = filterMembersByCategory(members, category);
  return searchMembers(filtered, query);
}

/**
 * 根据 ID 获取统一成员
 *
 * @param members 成员列表
 * @param id 成员 ID
 * @returns 成员信息，若不存在返回 undefined
 */
export function getMemberById(
  members: UnifiedCouncilMember[],
  id: string
): UnifiedCouncilMember | undefined {
  return members.find((m) => m.id === id);
}

/**
 * 根据多个 ID 获取成员列表
 *
 * @param members 成员列表
 * @param ids ID 列表
 * @returns 匹配的成员列表（保持 ids 顺序）
 */
export function getMembersByIds(
  members: UnifiedCouncilMember[],
  ids: string[]
): UnifiedCouncilMember[] {
  return ids
    .map((id) => getMemberById(members, id))
    .filter((m): m is UnifiedCouncilMember => Boolean(m));
}
