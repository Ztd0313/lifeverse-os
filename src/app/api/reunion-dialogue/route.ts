/**
 * 重逢对话 API 路由
 *
 * POST /api/reunion-dialogue
 *
 * 用户与"过去/未来的自己"对话。AI 扮演用户在指定时间点的自己，
 * 过去的自己怀旧天真，未来的自己成熟智慧。
 *
 * 请求头：Authorization: Bearer <token>（必需，用于鉴权）
 * 请求体：
 * {
 *   message: string,               // 必需，用户输入
 *   history?: ChatMessage[],       // 可选，对话历史
 *   timeDirection: 'past'|'future',// 必需，时间方向
 *   yearsOffset: number            // 必需，时间偏移年数（正整数）
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   reply: {
 *     content: string,
 *     emotionTag: string,
 *     timePerspective: string,
 *     adviceOrQuestion: string,
 *     ...
 *   },
 *   isMock: boolean
 * }
 *
 * AI 不可用时使用 getMockReunionDialogueResponse 降级，保证流程不中断。
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { chatCompletion, isOpenAIConfigured, DEFAULT_MODEL } from '@/lib/ai/openai-client';
import {
  buildReunionDialogueSystemPrompt,
  parseDialogueResponse,
  getMockReunionDialogueResponse,
  formatTimeDistance,
  type TimeDirection,
  type ReunionDialogueContext,
  type ReunionDialogueResponse,
} from '@/lib/ai/dialogue-prompts';
import { MOCK_MEMORIES } from '@/lib/mock-memories';
import type { MemoryItem } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ===== 类型定义 =====

/** 对话历史消息 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** 请求体结构 */
interface ReunionDialogueRequestBody {
  message?: unknown;
  history?: unknown;
  timeDirection?: unknown;
  yearsOffset?: unknown;
}

/**
 * 根据生日计算年龄
 *
 * @param birthday 生日字符串 YYYY-MM-DD
 * @returns 年龄（岁），无法计算时返回 30（默认值）
 */
function calculateAge(birthday?: string): number {
  if (!birthday) return 30;
  try {
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return 30;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 && age < 150 ? age : 30;
  } catch {
    return 30;
  }
}

/**
 * 获取用户的记忆列表作为对话上下文
 *
 * 当前从 MOCK_MEMORIES 获取（开发阶段）。
 * 后续对接数据库后，应从数据库按 userId 查询。
 *
 * @param _userId 用户 ID（预留，当前未使用）
 * @returns 记忆条目列表
 */
function getUserMemories(_userId: string): MemoryItem[] {
  // TODO: 对接数据库后，按 userId 查询用户记忆
  // 当前使用 mock 数据作为上下文
  return MOCK_MEMORIES.slice(0, 10);
}

/**
 * POST /api/reunion-dialogue
 */
export async function POST(
  request: Request
): Promise<NextResponse> {
  try {
    // ===== 1. 鉴权：验证用户登录 =====
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    // ===== 2. 解析请求体 =====
    let body: ReunionDialogueRequestBody;
    try {
      body = (await request.json()) as ReunionDialogueRequestBody;
    } catch {
      return NextResponse.json(
        { success: false, error: '请求体格式错误，请提供有效的 JSON' },
        { status: 400 }
      );
    }

    const { message, history, timeDirection, yearsOffset } = body;

    // ===== 3. 参数校验 =====
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '字段 message 是必需的，且不能为空' },
        { status: 400 }
      );
    }

    // 校验时间方向
    if (
      typeof timeDirection !== 'string' ||
      (timeDirection !== 'past' && timeDirection !== 'future')
    ) {
      return NextResponse.json(
        { success: false, error: '字段 timeDirection 必须为 "past" 或 "future"' },
        { status: 400 }
      );
    }
    const direction = timeDirection as TimeDirection;

    // 校验时间偏移
    const offset =
      typeof yearsOffset === 'number'
        ? yearsOffset
        : parseInt(String(yearsOffset), 10);
    if (!Number.isFinite(offset) || offset <= 0 || offset > 80) {
      return NextResponse.json(
        { success: false, error: '字段 yearsOffset 必须为 1-80 之间的正整数' },
        { status: 400 }
      );
    }

    // 解析对话历史
    const historyMessages: ChatMessage[] = Array.isArray(history)
      ? (history as ChatMessage[]).filter(
          (m) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string'
        )
      : [];

    // ===== 4. 构建对话上下文 =====
    const currentAge = calculateAge(user.birthday);
    const targetAge =
      direction === 'past' ? currentAge - offset : currentAge + offset;

    // 目标年龄合理性校验
    if (targetAge < 5 || targetAge > 120) {
      return NextResponse.json(
        {
          success: false,
          error: `目标年龄 ${targetAge} 岁不在合理范围内（5-120 岁），请调整时间偏移`,
        },
        { status: 400 }
      );
    }

    const memories = getUserMemories(user.id);

    const context: ReunionDialogueContext = {
      currentAge,
      targetAge,
      timeDirection: direction,
      memories,
      userNickname: user.nickname,
    };

    // ===== 5. 降级：未配置 API key 时返回 Mock 回复 =====
    if (!isOpenAIConfigured()) {
      const mockReply = getMockReunionDialogueResponse(message, context);
      return NextResponse.json({
        success: true,
        reply: {
          content: mockReply.content,
          emotionTag: mockReply.emotionTag,
          timePerspective: mockReply.timePerspective,
          adviceOrQuestion: mockReply.adviceOrQuestion,
        },
        isMock: true,
      });
    }

    // ===== 6. 调用 DeepSeek 生成回复 =====
    try {
      const systemPrompt = buildReunionDialogueSystemPrompt(context);

      // 将对话历史拼接到 user message 中（DeepSeek 单轮调用）
      const timeDistance = formatTimeDistance(currentAge, targetAge);
      const historyStr =
        historyMessages.length > 0
          ? historyMessages
              .map(
                (m) =>
                  `${m.role === 'user' ? '现在的自己' : `${timeDistance}的自己`}：${m.content}`
              )
              .join('\n\n') + '\n\n'
          : '';

      const userMessage = `${historyStr}现在的自己：${message}\n\n${timeDistance}的自己：`;

      const result = await chatCompletion({
        systemPrompt,
        userMessage,
        model: DEFAULT_MODEL,
        temperature: 0.85,
        maxTokens: 800,
      });

      // ===== 7. 解析 AI 返回的 JSON =====
      const parsed = parseDialogueResponse<ReunionDialogueResponse>(
        result.content
      );

      if (parsed && parsed.content) {
        return NextResponse.json({
          success: true,
          reply: {
            content: parsed.content,
            emotionTag: parsed.emotionTag || '温暖',
            timePerspective: parsed.timePerspective || '',
            adviceOrQuestion: parsed.adviceOrQuestion || '',
          },
          isMock: false,
        });
      }

      // JSON 解析失败，降级到 Mock
      const mockReply = getMockReunionDialogueResponse(message, context);
      return NextResponse.json({
        success: true,
        reply: {
          content: mockReply.content,
          emotionTag: mockReply.emotionTag,
          timePerspective: mockReply.timePerspective,
          adviceOrQuestion: mockReply.adviceOrQuestion,
        },
        isMock: true,
      });
    } catch (error) {
      console.error('[Reunion Dialogue API] AI 调用失败：', error);

      // AI 调用失败，降级到 Mock
      const mockReply = getMockReunionDialogueResponse(message, context);
      return NextResponse.json({
        success: true,
        reply: {
          content: mockReply.content,
          emotionTag: mockReply.emotionTag,
          timePerspective: mockReply.timePerspective,
          adviceOrQuestion: mockReply.adviceOrQuestion,
        },
        isMock: true,
      });
    }
  } catch (error) {
    console.error('[Reunion Dialogue API] 服务器错误：', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reunion-dialogue
 *
 * 返回 API 说明（便于调试）。
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/reunion-dialogue',
    method: 'POST',
    description: '与过去/未来的自己对话',
    requestSchema: {
      message: 'string (required) — 用户输入',
      history: 'ChatMessage[] (optional) — 对话历史',
      timeDirection: '"past" | "future" (required) — 时间方向',
      yearsOffset: 'number (required) — 时间偏移年数（1-80）',
    },
    responseSchema: {
      success: 'boolean',
      reply: {
        content: 'string — 回复内容',
        emotionTag: 'string — 情感标签',
        timePerspective: 'string — 时间视角',
        adviceOrQuestion: 'string — 建议或问题',
      },
      isMock: 'boolean — 是否为降级回复',
    },
    configured: isOpenAIConfigured(),
  });
}
