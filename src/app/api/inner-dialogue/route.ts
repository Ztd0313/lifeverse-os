/**
 * 内心对话 API 路由
 *
 * POST /api/inner-dialogue
 *
 * 用户与"内心的自己"对话。AI 扮演用户内心深处的声音，
 * 风格温柔、自省、引导式。
 *
 * 请求头：Authorization: Bearer <token>（必需，用于鉴权）
 * 请求体：
 * {
 *   message: string,            // 必需，用户输入
 *   history?: ChatMessage[],    // 可选，对话历史
 *   emotionState?: EmotionState // 可选，用户当前情感状态（默认"平静"）
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   reply: {
 *     content: string,
 *     emotionTag: string,
 *     guidingQuestion: string,
 *     ...
 *   },
 *   isMock: boolean
 * }
 *
 * AI 不可用时使用 getMockInnerDialogueResponse 降级，保证流程不中断。
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { chatCompletion, isOpenAIConfigured, DEFAULT_MODEL, getLanguageInstruction } from '@/lib/ai/openai-client';
import {
  buildInnerDialogueSystemPrompt,
  parseDialogueResponse,
  getMockInnerDialogueResponse,
  type EmotionState,
  type InnerDialogueContext,
  type InnerDialogueResponse,
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
interface InnerDialogueRequestBody {
  message?: unknown;
  history?: unknown;
  emotionState?: unknown;
  locale?: unknown;
}

/** 合法的情感状态取值 */
const VALID_EMOTION_STATES: EmotionState[] = [
  '平静',
  '焦虑',
  '低落',
  '兴奋',
  '迷茫',
  '愤怒',
  '感伤',
  '坚定',
  '疲惫',
  '充满希望',
];

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
 * POST /api/inner-dialogue
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
    let body: InnerDialogueRequestBody;
    try {
      body = (await request.json()) as InnerDialogueRequestBody;
    } catch {
      return NextResponse.json(
        { success: false, error: '请求体格式错误，请提供有效的 JSON' },
        { status: 400 }
      );
    }

    const { message, history, emotionState, locale } = body;

    // ===== 3. 参数校验 =====
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '字段 message 是必需的，且不能为空' },
        { status: 400 }
      );
    }

    // 校验情感状态
    let userEmotionState: EmotionState = '平静';
    if (
      typeof emotionState === 'string' &&
      VALID_EMOTION_STATES.includes(emotionState as EmotionState)
    ) {
      userEmotionState = emotionState as EmotionState;
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
    const userAge = calculateAge(user.birthday);
    const memories = getUserMemories(user.id);

    const context: InnerDialogueContext = {
      userAge,
      emotionState: userEmotionState,
      memories,
      userNickname: user.nickname,
    };

    // ===== 5. 降级：未配置 API key 时返回 Mock 回复 =====
    if (!isOpenAIConfigured()) {
      const mockReply = getMockInnerDialogueResponse(message, context);
      return NextResponse.json({
        success: true,
        reply: {
          content: mockReply.content,
          emotionTag: mockReply.emotionTag,
          guidingQuestion: mockReply.guidingQuestion,
        },
        isMock: true,
      });
    }

    // ===== 6. 调用 DeepSeek 生成回复 =====
    try {
      const systemPrompt = buildInnerDialogueSystemPrompt(context) + '\n\n' + getLanguageInstruction(typeof locale === 'string' ? locale : 'zh');

      // 将对话历史拼接到 user message 中（DeepSeek 单轮调用）
      const historyStr =
        historyMessages.length > 0
          ? historyMessages
              .map(
                (m) =>
                  `${m.role === 'user' ? '用户' : '内心的自己'}：${m.content}`
              )
              .join('\n\n') + '\n\n'
          : '';

      const userMessage = `${historyStr}用户：${message}\n\n内心的自己：`;

      const result = await chatCompletion({
        systemPrompt,
        userMessage,
        model: DEFAULT_MODEL,
        temperature: 0.85,
        maxTokens: 800,
      });

      // ===== 7. 解析 AI 返回的 JSON =====
      const parsed = parseDialogueResponse<InnerDialogueResponse>(
        result.content
      );

      if (parsed && parsed.content) {
        return NextResponse.json({
          success: true,
          reply: {
            content: parsed.content,
            emotionTag: parsed.emotionTag || '温暖',
            guidingQuestion: parsed.guidingQuestion || '',
          },
          isMock: false,
        });
      }

      // JSON 解析失败，降级到 Mock
      const mockReply = getMockInnerDialogueResponse(message, context);
      return NextResponse.json({
        success: true,
        reply: {
          content: mockReply.content,
          emotionTag: mockReply.emotionTag,
          guidingQuestion: mockReply.guidingQuestion,
        },
        isMock: true,
      });
    } catch (error) {
      console.error('[Inner Dialogue API] AI 调用失败：', error);

      // AI 调用失败，降级到 Mock
      const mockReply = getMockInnerDialogueResponse(message, context);
      return NextResponse.json({
        success: true,
        reply: {
          content: mockReply.content,
          emotionTag: mockReply.emotionTag,
          guidingQuestion: mockReply.guidingQuestion,
        },
        isMock: true,
      });
    }
  } catch (error) {
    console.error('[Inner Dialogue API] 服务器错误：', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inner-dialogue
 *
 * 返回 API 说明（便于调试）。
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/inner-dialogue',
    method: 'POST',
    description: '与内心的自己对话',
    requestSchema: {
      message: 'string (required) — 用户输入',
      history: 'ChatMessage[] (optional) — 对话历史',
      emotionState: 'EmotionState (optional) — 用户当前情感状态',
    },
    responseSchema: {
      success: 'boolean',
      reply: {
        content: 'string — 回复内容',
        emotionTag: 'string — 情感标签',
        guidingQuestion: 'string — 引导问题',
      },
      isMock: 'boolean — 是否为降级回复',
    },
    configured: isOpenAIConfigured(),
  });
}
