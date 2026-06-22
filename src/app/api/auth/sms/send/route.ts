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
 * - 开发环境（NODE_ENV !== 'production'）返回 debugCode 便于测试
 */

import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/user-store';

/** 中国大陆手机号正则：1[3-9] 开头，共 11 位 */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** 发送频率限制：同一手机号 60 秒内只能发送一次 */
const SEND_INTERVAL_MS = 60 * 1000;

/** 记录每个手机号最近一次发送时间，用于频率限制 */
const lastSendTime = new Map<string, number>();

/**
 * 生成 6 位随机数字验证码
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // ===== 频率限制：60 秒内只能发送一次 =====
    const lastTime = lastSendTime.get(phone);
    if (lastTime && Date.now() - lastTime < SEND_INTERVAL_MS) {
      const remainSeconds = Math.ceil(
        (SEND_INTERVAL_MS - (Date.now() - lastTime)) / 1000
      );
      return NextResponse.json(
        {
          success: false,
          error: `发送过于频繁，请 ${remainSeconds} 秒后再试`,
        },
        { status: 429 }
      );
    }

    // ===== 生成验证码并存入内存 =====
    const code = generateCode();
    userStore.saveSmsCode(phone, code);
    lastSendTime.set(phone, Date.now());

    // TODO: 对接阿里云短信服务实际发送短信
    // await aliyunSmsClient.send(phone, `您的验证码是 ${code}，5 分钟内有效`);

    // ===== 开发环境返回验证码便于测试 =====
    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      ...(isDev ? { debugCode: code } : {}),
    });
  } catch (error) {
    console.error('[SMS Send API] 发送验证码失败：', error);
    return NextResponse.json(
      { success: false, error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
