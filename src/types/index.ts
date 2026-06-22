// ===== Core Types =====

/**
 * 用户类型定义
 *
 * 描述 LifeVerse 平台的注册用户信息。
 * 用户可通过手机验证码或微信扫码登录，登录后获得唯一 id。
 */
export interface User {
  /** 用户唯一 ID */
  id: string;
  /** 手机号（手机验证码登录时存在） */
  phone?: string;
  /** 微信开放平台唯一标识（微信扫码登录时存在） */
  wechatId?: string;
  /** 昵称（自动注册时默认"探索者"+随机数） */
  nickname: string;
  /** 头像 URL */
  avatar: string;
  /** 生日 YYYY-MM-DD（可选，用户可在个人资料中补充） */
  birthday?: string;
  /** 性别：male / female / other */
  gender?: 'male' | 'female' | 'other';
  /** 个人简介 */
  bio?: string;
  /** 创建时间 ISO 字符串 */
  createdAt: string;
}

export type PersonaType = 'sage' | 'time' | 'relation' | 'inner';

export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'conflict';

export type CouncilType =
  | 'wisdom'
  | 'future'
  | 'inner'
  | 'reunion';

export type CouncilPhase =
  | 'idle'
  | 'matching'
  | 'ritual'
  | 'r1' // Round 1: 表态
  | 'r2' // Round 2: 质疑
  | 'r3' // Round 3: 共识
  | 'report'
  | 'timeline'
  | 'done';

export type QuestionType =
  | 'career'
  | 'relationship'
  | 'finance'
  | 'education'
  | 'life_direction'
  | 'other';

// ===== Agent / Persona =====

export interface Persona {
  id: string;
  name: string;
  nameEn: string;
  type: PersonaType;
  philosophy: string;
  speakingStyle: string;
  avatar: string;
  model: string;
  radar: RadarData;
  relationLabel?: string;
  isPrivate?: boolean;
}

export interface RadarData {
  freedom: number;
  wealth: number;
  happiness: number;
  stability: number;
  growth: number;
}

// ===== Message =====

export interface Message {
  id: string;
  personaId: string;
  personaName: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  round: number;
  timestamp: number;
  isConflict?: boolean;
  conflictWith?: string;
}

// ===== Conflict =====

export interface ConflictPair {
  personaA: string;
  personaB: string;
  value: number;
  label: string;
  color: string;
}

// ===== Destiny Report =====

export interface DestinyReport {
  id: string;
  councilId: string;
  question: string;
  summary: string;
  dimensions: ReportDimension[];
  indices: ReportIndices;
  radar: RadarData;
  consensusPoints: string[];
  disclaimer: string;
  timestamp: number;
}

export interface ReportDimension {
  title: string;
  content: string;
  icon: string;
}

export interface ReportIndices {
  conflict: number;
  growth: number;
  happiness: number;
  freedom: number;
  stability: number;
}

// ===== Timeline =====

export interface TimelineBranch {
  node: 'now' | '3m' | '1y' | '5y' | '10y' | '20y';
  label: string;
  description: string;
  happinessProb: number;
  regretProb: number;
  incomeChange: string;
  growthRate: string;
  children?: TimelineBranch[];
}

// ===== Council State =====

export interface CouncilState {
  phase: CouncilPhase;
  sessionNumber: number;
  currentRound: number;
  currentSpeakerIndex: number;
  question: string;
  questionType: QuestionType;
  councilType: CouncilType;
  personas: Persona[];
  messages: Message[];
  conflicts: ConflictPair[];
  report: DestinyReport | null;
  timeline: TimelineBranch[] | null;
  isAnimating: boolean;
  roundTransition: boolean;
  mentionedIds: string[];
}

// ===== Memory =====

export interface Memory {
  id: string;
  userId: string;
  type: 'photo' | 'diary' | 'markdown' | 'pdf' | 'txt';
  content: string;
  category: 'forest' | 'ocean' | 'town' | 'city' | 'mountain';
  title: string;
  metadata: Record<string, unknown>;
  createdAt: number;
}

/**
 * 记忆星球（Memory Planet）中的记忆条目类型
 *
 * 相比基础 Memory 类型，扩展了情感色调、日期、地点、人物、标签、重要度等字段，
 * 用于在记忆星球模块中展示与分类。
 */
export type MemoryCategory = 'forest' | 'ocean' | 'town' | 'city' | 'mountain';

export type MemoryType = 'photo' | 'text' | 'voice' | 'video';

export type MemoryEmotion = 'warm' | 'cool' | 'neutral';

export interface MemoryItem {
  id: string;
  title: string;
  type: MemoryType;
  category: MemoryCategory;
  content: string;
  emotion: MemoryEmotion;
  date: string; // ISO date string
  location?: string;
  people?: string[];
  tags?: string[];
  importance: number; // 0-1
  fileUrl?: string;       // 上传文件的 URL 路径
  fileName?: string;      // 原始文件名
  fileSize?: number;      // 文件大小（字节）
  fileMimeType?: string;  // 文件 MIME 类型
  thumbnailUrl?: string;  // 缩略图 URL（图片类型）
}

// ===== History =====

export interface HistoryEntry {
  id: string;
  userId: string;
  councilId: string;
  councilType: CouncilType;
  question: string;
  summary: string;
  tags: string[];
  favorited: boolean;
  createdAt: number;
}
