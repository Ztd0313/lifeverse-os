/**
 * 获取当前登录用户 API
 *
 * GET /api/auth/me
 *
 * 请求头：Authorization: Bearer <token>
 * 返回：{ success: true, user: User }
 *
 * 用于前端在页面加载时校验 token 是否有效，并获取最新用户信息。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, verifyToken, extractToken } from '@/lib/auth';
import { userStore } from '@/lib/user-store';
import type { User } from '@/types';

/**
 * GET /api/auth/me
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    | { success: true; user: User }
    | { success: false; error: string }
  >
> {
  try {
    // 调试日志：帮助排查 401 问题
    const token = extractToken(request);
    console.log('[Auth Me API] token:', token ? `${token.slice(0, 20)}...` : 'null');

    const payload = token ? verifyToken(token) : null;
    console.log('[Auth Me API] payload:', payload);

    if (payload) {
      const user = userStore.findById(payload.userId);
      console.log('[Auth Me API] user found:', user ? user.id : 'null');
      console.log('[Auth Me API] usersMap size:', (globalThis as any).__lifeverseUserStore?.usersMap?.size ?? 'N/A');
    }

    const user = getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[Auth Me API] 获取用户信息失败：', error);
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
