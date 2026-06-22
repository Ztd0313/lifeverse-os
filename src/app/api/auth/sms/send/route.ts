/**
 * 发送短信验证码 API
 *
 * POST /api/auth/sms/send
 *
 * 请求体：{ phone: string }
 * 返回：{ success: true, debugCode?: string }
 *
 * 说明：
 * - 验证中国大陆手机号格式（1 开头，第二位 3-9，共 11 位）
 * - 生成 6 位随机数字验证码
 * - 实际短信发送需要阿里云短信服务，当前为 mock：验证码存内存
 * - 测试阶段：始终返回固定测试验证码 888888，方便用户体验
 */

import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/user-store';

/** 中国大陆手机号正则：1[3-9] 开头，共 11 位 */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** 固定测试验证码（正式上线短信服务后移除） */
const TEST_CODE = '888888';

/**
 * POST /api/auth/sms/send
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    { success: true; debugCode?: string } | { success: false; error: string }
  >
> {
  try {
    const body = (await request.json()) as { phone?: string };

    // ===== 参数校验 =====
    if (!body.phone) {
      return NextResponse.json(
        { success: false, error: '请输入手机号' },
        { status: 400 }
      );
    }

    const phone = body.phone.trim();

    // 手机号格式验证
    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { success: false, error: '手机号格式不正确，请输入正确的中国大陆手机号' },
        { status: 400 }
      );
    }

    // ===== 存入固定测试验证码 =====
    userStore.saveSmsCode(phone, TEST_CODE);

    // ===== 返回测试验证码 =====
    // 当前为测试阶段，使用固定验证码 888888
    // 正式上线短信服务后替换为随机验证码
    return NextResponse.json({
      success: true,
      debugCode: TEST_CODE,
    });
  } catch (error) {
    console.error('[SMS Send API] 发送验证码失败：', error);
    return NextResponse.json(
      { success: false, error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
