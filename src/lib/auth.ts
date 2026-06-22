/**
 * 认证工具模块
 *
 * 提供 JWT token 的生成与验证，以及从请求中解析当前登录用户。
 * 服务端 API Route 通过 getAuthUser 获取当前用户，进行鉴权。
 *
 * 注意：
 * - JWT_SECRET 优先使用环境变量，默认值仅供本地开发使用。
 * - 用户数据当前存储在内存 Map 中（见 user-store.ts），后续对接数据库时只需替换存储层。
 */

import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import type { User } from '@/types';
import { userStore } from './user-store';

/** JWT 密钥：优先使用环境变量，默认值仅供本地开发 */
export const JWT_SECRET = process.env.JWT_SECRET || 'lifeverse-secret-2026';

/** Token 有效期（7 天） */
export const TOKEN_EXPIRES_IN = '7d';

/** JWT Payload 结构 */
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * 生成 JWT token
 *
 * @param userId 用户唯一 ID
 * @returns 签名后的 JWT 字符串
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

/**
 * 验证 JWT token
 *
 * @param token JWT 字符串
 * @returns 验证成功返回 { userId }，失败返回 null
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded || !decoded.userId) return null;
    return { userId: decoded.userId };
  } catch {
    // token 过期、签名错误、格式错误等
    return null;
  }
}

/**
 * 从请求中获取当前登录用户
 *
 * 解析 Authorization: Bearer <token> 头，验证 token 并返回用户信息。
 *
 * @param req NextRequest 对象
 * @returns 用户信息；未登录或 token 无效时返回 null
 */
export function getAuthUser(req: Request | NextRequest): User | null {
  // 从 Authorization header 提取 token
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;

  // 支持 "Bearer <token>" 与裸 token 两种格式
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) return null;

  // 验证 token
  const payload = verifyToken(token);
  if (!payload) return null;

  // 查找用户
  const user = userStore.findById(payload.userId);
  return user;
}

/**
 * 从请求中提取 Bearer token（供前端调试使用）
 *
 * @param req NextRequest 对象
 * @returns token 字符串或 null
 */
export function extractToken(req: Request | NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  return token || null;
}
