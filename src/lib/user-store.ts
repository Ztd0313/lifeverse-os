/**
 * 用户内存存储
 *
 * 开发阶段使用内存 Map 存储用户数据。
 * 后续对接数据库（如 Supabase / PostgreSQL）时，只需替换本模块的实现，
 * 上层 API Route 与 auth.ts 无需改动。
 *
 * 同时管理短信验证码的内存存储（带过期时间）。
 */

import type { User } from '@/types';

// ===== 全局存储（确保 Next.js 多 worker 间共享） =====

/**
 * Next.js 开发模式下，不同 API Route 可能运行在不同 worker 进程中，
 * 模块级变量会被重新创建，导致状态不共享。
 * 使用 globalThis 确保所有 worker 共用同一份内存存储。
 */

interface GlobalUserStore {
  usersMap: Map<string, User>;
  phoneIndex: Map<string, string>;
  wechatIndex: Map<string, string>;
  smsCodesMap: Map<string, SmsCodeEntry>;
}

// 延迟声明 SmsCodeEntry（下方定义）
interface SmsCodeEntry {
  code: string;
  phone: string;
  expiresAt: number;
}

function getGlobalStore(): GlobalUserStore {
  const g = globalThis as unknown as { __lifeverseUserStore?: GlobalUserStore };
  if (!g.__lifeverseUserStore) {
    g.__lifeverseUserStore = {
      usersMap: new Map<string, User>(),
      phoneIndex: new Map<string, string>(),
      wechatIndex: new Map<string, string>(),
      smsCodesMap: new Map<string, SmsCodeEntry>(),
    };
  }
  return g.__lifeverseUserStore;
}

/** 用户表：userId -> User */
const usersMap = getGlobalStore().usersMap;

/** 手机号索引：phone -> userId，便于通过手机号查找用户 */
const phoneIndex = getGlobalStore().phoneIndex;

/** 微信 OpenID 索引：wechatId -> userId */
const wechatIndex = getGlobalStore().wechatIndex;

/**
 * 生成用户唯一 ID
 */
function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 生成随机昵称："探索者" + 4 位随机数
 */
function generateNickname(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `探索者${randomNum}`;
}

/**
 * 生成随机头像 URL（使用 DiceBear API，无需密钥）
 */
function generateAvatar(seed?: string): string {
  const s = seed || Math.random().toString(36).slice(2, 10);
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(s)}&backgroundColor=c9a84c,8a7430`;
}

/**
 * 通过手机号查找或创建用户
 *
 * 用户不存在时自动创建，昵称默认"探索者"+随机数，随机头像。
 *
 * @param phone 手机号
 * @returns 用户信息
 */
function findOrCreateByPhone(phone: string): User {
  // 先查索引
  const existingId = phoneIndex.get(phone);
  if (existingId) {
    const existing = usersMap.get(existingId);
    if (existing) return existing;
  }

  // 创建新用户
  const user: User = {
    id: generateUserId(),
    phone,
    nickname: generateNickname(),
    avatar: generateAvatar(phone),
    createdAt: new Date().toISOString(),
  };

  usersMap.set(user.id, user);
  phoneIndex.set(phone, user.id);
  return user;
}

/**
 * 通过微信 OpenID 查找或创建用户
 *
 * @param wechatId 微信 OpenID
 * @returns 用户信息
 */
function findOrCreateByWechat(wechatId: string): User {
  const existingId = wechatIndex.get(wechatId);
  if (existingId) {
    const existing = usersMap.get(existingId);
    if (existing) return existing;
  }

  const user: User = {
    id: generateUserId(),
    wechatId,
    nickname: generateNickname(),
    avatar: generateAvatar(wechatId),
    createdAt: new Date().toISOString(),
  };

  usersMap.set(user.id, user);
  wechatIndex.set(wechatId, user.id);
  return user;
}

/**
 * 通过 ID 查找用户
 */
function findById(id: string): User | null {
  return usersMap.get(id) || null;
}

/**
 * 更新用户资料
 *
 * 仅允许更新 nickname / avatar / birthday / gender / bio 字段。
 *
 * @param id 用户 ID
 * @param data 待更新字段
 * @returns 更新后的用户，用户不存在时返回 null
 */
function updateProfile(id: string, data: Partial<User>): User | null {
  const user = usersMap.get(id);
  if (!user) return null;

  // 白名单字段更新
  const allowedFields: (keyof User)[] = [
    'nickname',
    'avatar',
    'birthday',
    'gender',
    'bio',
  ];

  const updated: User = { ...user };
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      // 类型安全：仅更新白名单字段
      (updated as unknown as Record<string, unknown>)[field] = data[field];
    }
  }

  usersMap.set(id, updated);
  return updated;
}

// ===== 验证码存储 =====

/** 验证码条目已在上方声明（GlobalUserStore 需要） */

/** 验证码存储：phone -> SmsCodeEntry（使用全局共享） */
const smsCodesMap = getGlobalStore().smsCodesMap;

/** 验证码有效期：5 分钟 */
const SMS_CODE_TTL = 5 * 60 * 1000;

/**
 * 存储验证码（带过期时间）
 *
 * @param phone 手机号
 * @param code 验证码
 */
function saveSmsCode(phone: string, code: string): void {
  smsCodesMap.set(phone, {
    code,
    phone,
    expiresAt: Date.now() + SMS_CODE_TTL,
  });
}

/**
 * 校验验证码
 *
 * 验证通过后自动删除（一次性使用）。
 *
 * @param phone 手机号
 * @param code 用户输入的验证码
 * @returns 是否验证通过
 */
function verifySmsCode(phone: string, code: string): boolean {
  const entry = smsCodesMap.get(phone);
  if (!entry) return false;

  // 已过期
  if (Date.now() > entry.expiresAt) {
    smsCodesMap.delete(phone);
    return false;
  }

  // 验证码不匹配
  if (entry.code !== code) return false;

  // 验证通过，删除验证码（一次性使用）
  smsCodesMap.delete(phone);
  return true;
}

/**
 * 获取验证码（供开发环境调试返回）
 */
function getSmsCode(phone: string): string | null {
  const entry = smsCodesMap.get(phone);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    smsCodesMap.delete(phone);
    return null;
  }
  return entry.code;
}

// ===== 导出 =====

export const userStore = {
  findOrCreateByPhone,
  findOrCreateByWechat,
  findById,
  updateProfile,
  saveSmsCode,
  verifySmsCode,
  getSmsCode,
};
