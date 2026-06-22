/**
 * 验证码登录 API
 *
 * POST /api/auth/sms/verify
 *
 * 请求体：{ phone: string, code: string }
 * 返回：{ success: true, token: string, user: User }
 *
 * 流程：
 * 1. 验证手机号格式
 * 2. 校验验证码是否正确（未过期、匹配）
 * 3. 用户不存在则自动创建（昵称默认"探索者"+随机数，随机头像）
 * 4. 生成 JWT token（7 天有效）
 * 5. 返回 token 与用户信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/user-store';
import { generateToken } from '@/lib/auth';
import type { User } from '@/types';

/** 中国大陆手机号正则 */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** 固定测试验证码（正式上线短信服务后移除） */
const TEST_CODE = '888888';

/**
 * POST /api/auth/sms/verify
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    | { success: true; token: string; user: User }
    | { success: false; error: string }
  >
> {
  try {
    const body = (await request.json()) as { phone?: string; code?: string };

    // ===== 参数校验 =====
    if (!body.phone || !body.code) {
      return NextResponse.json(
        { success: false, error: '请输入手机号和验证码' },
        { status: 400 }
      );
    }

    const phone = body.phone.trim();
    const code = body.code.trim();

    // 手机号格式验证
    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { success: false, error: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // 验证码格式：6 位数字
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: '验证码应为 6 位数字' },
        { status: 400 }
      );
    }

    // ===== 校验验证码 =====
    // 测试阶段：固定验证码 888888 直接通过
    // 同时也校验内存中的验证码（兼容旧逻辑）
    const isValid = code === TEST_CODE || userStore.verifySmsCode(phone, code);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '验证码错误或已过期，请重新获取' },
        { status: 400 }
      );
    }

    // ===== 查找或创建用户 =====
    const user = userStore.findOrCreateByPhone(phone);

    // ===== 生成 JWT token =====
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('[SMS Verify API] 验证码登录失败：', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
