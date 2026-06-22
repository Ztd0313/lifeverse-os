/**
 * 自定义 Agent 状态管理 Store
 *
 * 使用 Zustand 管理用户自定义 Agent 的增删改查。
 *
 * 持久化策略：
 * - 自定义 Agent 列表存入 localStorage（key: 'lifeverse-custom-agents'）
 * - 页面加载时调用 loadFromStorage() 读取
 *
 * 约束：
 * - 每个用户最多 10 个自定义 Agent
 * - 创建时自动调用 generateCustomAgentSystemPrompt 生成系统提示词
 */

import { create } from 'zustand';
import {
  generateCustomAgentSystemPrompt,
  DIALOGUE_STYLE_LABELS,
  type DialogueStyle,
} from '@/lib/ai/agent-templates';
import { generateId } from '@/lib/utils';

// ===== localStorage 配置 =====

/** localStorage 键名 */
const STORAGE_KEY = 'lifeverse-custom-agents';

/** 每个用户最多可创建的自定义 Agent 数量 */
export const MAX_CUSTOM_AGENTS = 10;

// ===== 类型定义 =====

/**
 * 自定义 Agent 数据结构
 *
 * 存储用户创建的个性化 Agent 配置，
 * 其中 systemPrompt 由创建/更新时自动生成。
 */
export interface CustomAgent {
  /** 唯一 ID */
  id: string;
  /** Agent 名称（2-20 字符） */
  name: string;
  /** 头像 emoji */
  avatar: string;
  /** 性格描述（50-200 字） */
  personality: string;
  /** 专业领域（单个分类） */
  expertise: string;
  /** 对话风格 */
  dialogueStyle: DialogueStyle;
  /** 核心理念（20-100 字） */
  coreBelief: string;
  /** 自动生成的系统提示词 */
  systemPrompt: string;
  /** 创建时间 ISO 字符串 */
  createdAt: string;
}

/**
 * 创建 Agent 时用户填写的配置（不含 id、systemPrompt、createdAt）
 */
export type CustomAgentInput = Omit<
  CustomAgent,
  'id' | 'systemPrompt' | 'createdAt'
>;

/**
 * Agent Store 接口
 */
export interface AgentStore {
  /** 用户已创建的自定义 Agent 列表 */
  customAgents: CustomAgent[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 创建新 Agent */
  createAgent: (config: CustomAgentInput) => CustomAgent | null;
  /** 更新已有 Agent */
  updateAgent: (id: string, data: Partial<CustomAgentInput>) => void;
  /** 删除 Agent */
  deleteAgent: (id: string) => void;
  /** 从 localStorage 加载数据 */
  loadFromStorage: () => void;
  /** 根据 ID 获取 Agent */
  getAgentById: (id: string) => CustomAgent | undefined;
}

// ===== localStorage 读写工具 =====

/**
 * 从 localStorage 读取自定义 Agent 列表
 */
function readFromStorage(): CustomAgent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as CustomAgent[];
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * 将自定义 Agent 列表写入 localStorage
 */
function writeToStorage(agents: CustomAgent[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  } catch {
    // localStorage 写入失败（如隐私模式、空间不足），忽略
  }
}

// ===== 系统提示词生成 =====

/**
 * 根据用户配置生成系统提示词
 *
 * 将 CustomAgentInput 转换为 generateCustomAgentSystemPrompt
 * 所需的 CustomAgentConfig 格式。
 */
function buildSystemPrompt(config: CustomAgentInput): string {
  return generateCustomAgentSystemPrompt({
    name: config.name,
    personality: config.personality,
    dialogueStyle: config.dialogueStyle,
    expertise: [config.expertise],
    philosophy: config.coreBelief,
    avatar: config.avatar,
  });
}

// ===== 创建 Store =====

export const useAgentStore = create<AgentStore>((set, get) => ({
  // ===== Initial State =====
  customAgents: [],
  isLoading: false,
  error: null,

  // ===== Actions =====

  /**
   * 创建新 Agent
   *
   * 自动生成 id、systemPrompt 和 createdAt。
   * 如果已达上限（10 个），返回 null 并设置 error。
   */
  createAgent: (config) => {
    const current = get().customAgents;
    if (current.length >= MAX_CUSTOM_AGENTS) {
      set({
        error: `最多只能创建 ${MAX_CUSTOM_AGENTS} 个自定义 Agent`,
      });
      return null;
    }

    const now = new Date().toISOString();
    const systemPrompt = buildSystemPrompt(config);

    const newAgent: CustomAgent = {
      ...config,
      id: generateId(),
      systemPrompt,
      createdAt: now,
    };

    const updated = [...current, newAgent];
    writeToStorage(updated);
    set({ customAgents: updated, error: null });
    return newAgent;
  },

  /**
   * 更新已有 Agent
   *
   * 如果更新涉及 personality、dialogueStyle、expertise、coreBelief、name
   * 等字段，会重新生成 systemPrompt。
   */
  updateAgent: (id, data) => {
    const current = get().customAgents;
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) return;

    const existing = current[index];
    const merged: CustomAgent = { ...existing, ...data };

    // 如果影响了系统提示词的关键字段，重新生成
    const promptFields: (keyof CustomAgentInput)[] = [
      'name',
      'personality',
      'dialogueStyle',
      'expertise',
      'coreBelief',
      'avatar',
    ];
    const needRegenerate = promptFields.some((f) => f in data);
    if (needRegenerate) {
      merged.systemPrompt = buildSystemPrompt({
        name: merged.name,
        avatar: merged.avatar,
        personality: merged.personality,
        expertise: merged.expertise,
        dialogueStyle: merged.dialogueStyle,
        coreBelief: merged.coreBelief,
      });
    }

    const updated = [...current];
    updated[index] = merged;
    writeToStorage(updated);
    set({ customAgents: updated, error: null });
  },

  /**
   * 删除 Agent
   */
  deleteAgent: (id) => {
    const current = get().customAgents;
    const updated = current.filter((a) => a.id !== id);
    writeToStorage(updated);
    set({ customAgents: updated, error: null });
  },

  /**
   * 从 localStorage 加载自定义 Agent 列表
   */
  loadFromStorage: () => {
    set({ isLoading: true });
    const agents = readFromStorage();
    set({ customAgents: agents, isLoading: false, error: null });
  },

  /**
   * 根据 ID 获取 Agent
   */
  getAgentById: (id) => {
    return get().customAgents.find((a) => a.id === id);
  },
}));

// ===== 便捷导出 =====

export { DIALOGUE_STYLE_LABELS };
export type { DialogueStyle };
