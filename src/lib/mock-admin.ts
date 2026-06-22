/**
 * 管理后台 Mock 数据
 *
 * 包含：
 * - 10 条用户数据
 * - 15 条议会记录
 * - 10 条用户反馈
 * - 统计数据（总用户、日活、议会数等）
 * - 7 天趋势数据
 * - 热门 Agent 排行
 *
 * 所有数据均为本地静态数据，用于管理后台演示与联调。
 */

import type { CouncilType } from '@/types';

// ===== 类型定义 =====

export interface AdminUser {
  id: string;
  avatar: string;
  nickname: string;
  email: string;
  registeredAt: string; // ISO date
  lastActiveAt: string; // ISO date
  councilCount: number;
  status: 'active' | 'disabled';
}

export interface AdminCouncilRecord {
  id: string;
  question: string;
  councilType: CouncilType;
  participants: string[];
  conflictValue: number; // 0-100
  createdAt: string; // ISO date
  userId: string;
  userName: string;
}

export interface AdminFeedback {
  id: string;
  userId: string;
  userName: string;
  content: string;
  rating: number; // 1-5
  createdAt: string;
  status: 'pending' | 'resolved' | 'ignored';
}

export interface AdminStat {
  totalUsers: number;
  todayActive: number;
  totalCouncils: number;
  totalMemories: number;
  totalAgents: number;
  avgConflict: number;
  mockRate: number; // mock fallback 比例 0-100
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  councils: number;
  users: number;
}

export interface AgentRankItem {
  agentId: string;
  name: string;
  avatar: string;
  appearances: number;
  avgScore: number;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  status: 'published' | 'draft';
}

export interface AdminBanner {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  order: number;
  enabled: boolean;
}

export interface AdminPresetQuestion {
  id: string;
  text: string;
  category: string;
  usageCount: number;
}

// ===== 用户数据（10 条）=====

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'u-001',
    avatar: '🦊',
    nickname: '林深',
    email: 'linshen@example.com',
    registeredAt: '2024-09-12T10:24:00+08:00',
    lastActiveAt: '2026-06-22T08:15:00+08:00',
    councilCount: 42,
    status: 'active',
  },
  {
    id: 'u-002',
    avatar: '🐳',
    nickname: '海蓝',
    email: 'hailan@example.com',
    registeredAt: '2024-10-03T14:50:00+08:00',
    lastActiveAt: '2026-06-21T22:40:00+08:00',
    councilCount: 28,
    status: 'active',
  },
  {
    id: 'u-003',
    avatar: '🦉',
    nickname: '夜行者',
    email: 'nightowl@example.com',
    registeredAt: '2024-11-21T03:12:00+08:00',
    lastActiveAt: '2026-06-22T02:08:00+08:00',
    councilCount: 67,
    status: 'active',
  },
  {
    id: 'u-004',
    avatar: '🌻',
    nickname: '向阳',
    email: 'xiangyang@example.com',
    registeredAt: '2025-01-08T09:30:00+08:00',
    lastActiveAt: '2026-06-20T18:22:00+08:00',
    councilCount: 15,
    status: 'active',
  },
  {
    id: 'u-005',
    avatar: '🏔️',
    nickname: '山客',
    email: 'shanke@example.com',
    registeredAt: '2025-02-14T20:05:00+08:00',
    lastActiveAt: '2026-06-19T11:47:00+08:00',
    councilCount: 9,
    status: 'active',
  },
  {
    id: 'u-006',
    avatar: '🍃',
    nickname: '清风',
    email: 'qingfeng@example.com',
    registeredAt: '2025-03-30T16:18:00+08:00',
    lastActiveAt: '2026-06-22T07:55:00+08:00',
    councilCount: 53,
    status: 'active',
  },
  {
    id: 'u-007',
    avatar: '🦋',
    nickname: '蝶舞',
    email: 'diewu@example.com',
    registeredAt: '2025-04-17T12:00:00+08:00',
    lastActiveAt: '2026-05-30T09:10:00+08:00',
    councilCount: 4,
    status: 'disabled',
  },
  {
    id: 'u-008',
    avatar: '🌙',
    nickname: '月白',
    email: 'yuebai@example.com',
    registeredAt: '2025-05-22T08:42:00+08:00',
    lastActiveAt: '2026-06-22T01:30:00+08:00',
    councilCount: 31,
    status: 'active',
  },
  {
    id: 'u-009',
    avatar: '🔥',
    nickname: '炽翼',
    email: 'chiyi@example.com',
    registeredAt: '2025-06-10T19:25:00+08:00',
    lastActiveAt: '2026-06-18T14:08:00+08:00',
    councilCount: 22,
    status: 'active',
  },
  {
    id: 'u-010',
    avatar: '🪐',
    nickname: '星轨',
    email: 'xinggui@example.com',
    registeredAt: '2025-07-29T22:33:00+08:00',
    lastActiveAt: '2026-06-21T17:12:00+08:00',
    councilCount: 18,
    status: 'disabled',
  },
];

// ===== 议会记录（15 条）=====

export const MOCK_ADMIN_COUNCILS: AdminCouncilRecord[] = [
  {
    id: 'c-001',
    question: '我应该接受海外 offer 还是留在国内陪伴父母？',
    councilType: 'wisdom',
    participants: ['musk', 'buffett', 'father', 'mother'],
    conflictValue: 78,
    createdAt: '2026-06-22T09:12:00+08:00',
    userId: 'u-001',
    userName: '林深',
  },
  {
    id: 'c-002',
    question: '30 岁了还要不要去读博？',
    councilType: 'wisdom',
    participants: ['socrates', 'munger', 'wangyangming'],
    conflictValue: 62,
    createdAt: '2026-06-22T08:45:00+08:00',
    userId: 'u-003',
    userName: '夜行者',
  },
  {
    id: 'c-003',
    question: '10 年后的我会如何看待今天这个决定？',
    councilType: 'future',
    participants: ['future20', 'future50', 'future80'],
    conflictValue: 45,
    createdAt: '2026-06-22T07:30:00+08:00',
    userId: 'u-006',
    userName: '清风',
  },
  {
    id: 'c-004',
    question: '创业失败后我该如何重新开始？',
    councilType: 'wisdom',
    participants: ['musk', 'jobs', 'munger', 'zhuangzi'],
    conflictValue: 85,
    createdAt: '2026-06-21T22:18:00+08:00',
    userId: 'u-008',
    userName: '月白',
  },
  {
    id: 'c-005',
    question: '我和伴侣的未来会怎样？',
    councilType: 'future',
    participants: ['future20', 'future50', 'future80', 'mother'],
    conflictValue: 52,
    createdAt: '2026-06-21T20:05:00+08:00',
    userId: 'u-002',
    userName: '海蓝',
  },
  {
    id: 'c-006',
    question: '我内心到底想要什么？',
    councilType: 'inner',
    participants: ['socrates', 'wangyangming', 'zhuangzi'],
    conflictValue: 70,
    createdAt: '2026-06-21T18:42:00+08:00',
    userId: 'u-001',
    userName: '林深',
  },
  {
    id: 'c-007',
    question: '该不该和父亲和解？',
    councilType: 'reunion',
    participants: ['father', 'mother', 'future50'],
    conflictValue: 88,
    createdAt: '2026-06-21T15:20:00+08:00',
    userId: 'u-004',
    userName: '向阳',
  },
  {
    id: 'c-008',
    question: '我该选择稳定的工作还是追求梦想？',
    councilType: 'wisdom',
    participants: ['musk', 'buffett', 'jobs', 'munger'],
    conflictValue: 82,
    createdAt: '2026-06-21T11:08:00+08:00',
    userId: 'u-009',
    userName: '炽翼',
  },
  {
    id: 'c-009',
    question: '5 年后我会在哪里？',
    councilType: 'future',
    participants: ['future20', 'future50', 'future80'],
    conflictValue: 38,
    createdAt: '2026-06-20T23:55:00+08:00',
    userId: 'u-006',
    userName: '清风',
  },
  {
    id: 'c-010',
    question: '我该如何面对亲人的离世？',
    councilType: 'reunion',
    participants: ['mother', 'future80', 'zhuangzi'],
    conflictValue: 65,
    createdAt: '2026-06-20T19:30:00+08:00',
    userId: 'u-005',
    userName: '山客',
  },
  {
    id: 'c-011',
    question: '该不该辞职做自由职业？',
    councilType: 'wisdom',
    participants: ['musk', 'buffett', 'wangyangming'],
    conflictValue: 74,
    createdAt: '2026-06-20T16:14:00+08:00',
    userId: 'u-003',
    userName: '夜行者',
  },
  {
    id: 'c-012',
    question: '我是否在逃避真实的自己？',
    councilType: 'inner',
    participants: ['socrates', 'zhuangzi', 'wangyangming'],
    conflictValue: 68,
    createdAt: '2026-06-20T10:42:00+08:00',
    userId: 'u-008',
    userName: '月白',
  },
  {
    id: 'c-013',
    question: '该不该卖掉房子去环游世界？',
    councilType: 'wisdom',
    participants: ['musk', 'buffett', 'jobs', 'zhuangzi'],
    conflictValue: 91,
    createdAt: '2026-06-19T21:25:00+08:00',
    userId: 'u-002',
    userName: '海蓝',
  },
  {
    id: 'c-014',
    question: '20 年后的我会后悔今天没有做什么？',
    councilType: 'future',
    participants: ['future20', 'future50', 'future80'],
    conflictValue: 48,
    createdAt: '2026-06-19T14:50:00+08:00',
    userId: 'u-001',
    userName: '林深',
  },
  {
    id: 'c-015',
    question: '我该如何与过去的自己和解？',
    councilType: 'reunion',
    participants: ['future20', 'future80', 'wangyangming'],
    conflictValue: 72,
    createdAt: '2026-06-19T09:18:00+08:00',
    userId: 'u-009',
    userName: '炽翼',
  },
];

// ===== 用户反馈（10 条）=====

export const MOCK_ADMIN_FEEDBACKS: AdminFeedback[] = [
  {
    id: 'f-001',
    userId: 'u-001',
    userName: '林深',
    content: '议会讨论非常深入，但希望增加导出 PDF 报告的功能。',
    rating: 5,
    createdAt: '2026-06-22T10:00:00+08:00',
    status: 'pending',
  },
  {
    id: 'f-002',
    userId: 'u-003',
    userName: '夜行者',
    content: '深夜使用时希望有夜间模式增强版，目前的深色还是有点亮。',
    rating: 4,
    createdAt: '2026-06-21T23:15:00+08:00',
    status: 'pending',
  },
  {
    id: 'f-003',
    userId: 'u-006',
    userName: '清风',
    content: 'Agent 回复速度很快，体验流畅。建议增加自定义 Agent。',
    rating: 5,
    createdAt: '2026-06-21T16:30:00+08:00',
    status: 'resolved',
  },
  {
    id: 'f-004',
    userId: 'u-002',
    userName: '海蓝',
    content: '记忆星球的概念很美，但上传图片后压缩有点严重。',
    rating: 4,
    createdAt: '2026-06-20T20:45:00+08:00',
    status: 'pending',
  },
  {
    id: 'f-005',
    userId: 'u-008',
    userName: '月白',
    content: '未来议会让我哭了三次，谢谢你们做这个产品。',
    rating: 5,
    createdAt: '2026-06-20T12:08:00+08:00',
    status: 'resolved',
  },
  {
    id: 'f-006',
    userId: 'u-004',
    userName: '向阳',
    content: '偶尔会遇到 mock 数据返回，希望 AI 配置更稳定。',
    rating: 3,
    createdAt: '2026-06-19T18:22:00+08:00',
    status: 'pending',
  },
  {
    id: 'f-007',
    userId: 'u-009',
    userName: '炽翼',
    content: '冲突可视化很酷，但希望冲突值能解释得更清楚。',
    rating: 4,
    createdAt: '2026-06-19T11:50:00+08:00',
    status: 'ignored',
  },
  {
    id: 'f-008',
    userId: 'u-005',
    userName: '山客',
    content: '希望增加语音输入功能，方便在户外使用。',
    rating: 4,
    createdAt: '2026-06-18T15:33:00+08:00',
    status: 'pending',
  },
  {
    id: 'f-009',
    userId: 'u-001',
    userName: '林深',
    content: '历史记录的搜索功能很好用，希望能支持标签筛选。',
    rating: 5,
    createdAt: '2026-06-18T09:12:00+08:00',
    status: 'resolved',
  },
  {
    id: 'f-010',
    userId: 'u-008',
    userName: '月白',
    content: '移动端体验需要优化，议会页面在小屏上有点挤。',
    rating: 3,
    createdAt: '2026-06-17T22:40:00+08:00',
    status: 'pending',
  },
];

// ===== 统计数据 =====

export const MOCK_ADMIN_STAT: AdminStat = {
  totalUsers: 1286,
  todayActive: 248,
  totalCouncils: 8421,
  totalMemories: 5632,
  totalAgents: 12,
  avgConflict: 64,
  mockRate: 12,
};

// ===== 7 天趋势数据 =====

export const MOCK_7D_TREND: TrendPoint[] = [
  { date: '2026-06-16', councils: 142, users: 198 },
  { date: '2026-06-17', councils: 168, users: 215 },
  { date: '2026-06-18', councils: 155, users: 207 },
  { date: '2026-06-19', councils: 189, users: 232 },
  { date: '2026-06-20', councils: 176, users: 240 },
  { date: '2026-06-21', councils: 203, users: 256 },
  { date: '2026-06-22', councils: 218, users: 248 },
];

// ===== 热门 Agent 排行 =====

export const MOCK_AGENT_RANK: AgentRankItem[] = [
  { agentId: 'musk', name: '马斯克', avatar: '🚀', appearances: 1842, avgScore: 4.6 },
  { agentId: 'buffett', name: '巴菲特', avatar: '📈', appearances: 1675, avgScore: 4.8 },
  { agentId: 'socrates', name: '苏格拉底', avatar: '🏛️', appearances: 1521, avgScore: 4.7 },
  { agentId: 'jobs', name: '乔布斯', avatar: '🍎', appearances: 1389, avgScore: 4.5 },
  { agentId: 'wangyangming', name: '王阳明', avatar: '🌙', appearances: 1245, avgScore: 4.9 },
  { agentId: 'future50', name: '50岁的自己', avatar: '⚖️', appearances: 1102, avgScore: 4.7 },
  { agentId: 'zhuangzi', name: '庄子', avatar: '🦋', appearances: 987, avgScore: 4.8 },
  { agentId: 'munger', name: '芒格', avatar: '🧠', appearances: 856, avgScore: 4.6 },
];

// ===== 公告数据 =====

export const MOCK_ANNOUNCEMENTS: AdminAnnouncement[] = [
  {
    id: 'a-001',
    title: 'LifeVerse v5.0 正式发布',
    content: '全新议会引擎上线，支持 DeepSeek AI，议会讨论更深入、更流畅。',
    publishedAt: '2026-06-15T10:00:00+08:00',
    status: 'published',
  },
  {
    id: 'a-002',
    title: '记忆星球功能升级',
    content: '新增 5 个星球主题，支持语音记忆上传，情感色调自动识别。',
    publishedAt: '2026-06-10T14:30:00+08:00',
    status: 'published',
  },
  {
    id: 'a-003',
    title: '系统维护通知（草稿）',
    content: '将于 2026-06-25 凌晨 2:00-4:00 进行系统维护，期间服务可能短暂不可用。',
    publishedAt: '2026-06-22T09:00:00+08:00',
    status: 'draft',
  },
];

// ===== Banner 数据 =====

export const MOCK_BANNERS: AdminBanner[] = [
  {
    id: 'b-001',
    title: '智慧议会全新上线',
    imageUrl: '/images/banner-1.jpg',
    link: '/council/wisdom',
    order: 1,
    enabled: true,
  },
  {
    id: 'b-002',
    title: '与未来的自己对话',
    imageUrl: '/images/banner-2.jpg',
    link: '/council/future',
    order: 2,
    enabled: true,
  },
  {
    id: 'b-003',
    title: '记录你的生命故事',
    imageUrl: '/images/banner-3.jpg',
    link: '/memory',
    order: 3,
    enabled: false,
  },
];

// ===== 预设问题 =====

export const MOCK_PRESET_QUESTIONS: AdminPresetQuestion[] = [
  { id: 'q-001', text: '我应该接受海外 offer 还是留在国内陪伴父母？', category: 'career', usageCount: 342 },
  { id: 'q-002', text: '30 岁了还要不要去读博？', category: 'education', usageCount: 268 },
  { id: 'q-003', text: '该不该辞职做自由职业？', category: 'career', usageCount: 421 },
  { id: 'q-004', text: '我内心到底想要什么？', category: 'life_direction', usageCount: 389 },
  { id: 'q-005', text: '10 年后的我会如何看待今天这个决定？', category: 'life_direction', usageCount: 312 },
  { id: 'q-006', text: '我该如何面对亲人的离世？', category: 'relationship', usageCount: 187 },
  { id: 'q-007', text: '该不该卖掉房子去环游世界？', category: 'life_direction', usageCount: 156 },
  { id: 'q-008', text: '我和伴侣的未来会怎样？', category: 'relationship', usageCount: 245 },
];
