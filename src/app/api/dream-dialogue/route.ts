/**
 * 与儿时的自己对话 API 路由
 *
 * POST /api/dream-dialogue
 *
 * 用户与"儿时的自己"对话。AI 扮演用户童年时期的自己，
 * 充满好奇心和纯真，用孩子的视角看待世界。
 *
 * 请求头：Authorization: Bearer <token>（必需，用于鉴权）
 * 请求体：
 * {
 *   message: string,            // 必需，用户输入
 *   history?: ChatMessage[],    // 可选，对话历史
 *   childAge?: number,          // 可选，儿时自己的年龄（默认 8 岁）
 *   dreams?: DreamSummary[],    // 可选，用户梦想列表摘要
 *   locale?: string             // 可选，界面语言
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   reply: {
 *     content: string,
 *     emotionTag: string,
 *     guidingQuestion: string,
 *   },
 *   isMock: boolean
 * }
 *
 * AI 不可用时使用 mock 回复降级，保证流程不中断。
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import {
  chatCompletion,
  isOpenAIConfigured,
  DEFAULT_MODEL,
  getLanguageInstruction,
} from '@/lib/ai/openai-client';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ===== 类型定义 =====

/** 对话历史消息 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** 梦想摘要（从客户端传入，避免敏感信息） */
interface DreamSummary {
  title: string;
  description: string;
  category: string;
  status: string;
  ageAtDream?: number;
}

/** 请求体结构 */
interface DreamDialogueRequestBody {
  message?: unknown;
  history?: unknown;
  childAge?: unknown;
  dreams?: unknown;
  locale?: unknown;
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
 * 构建与儿时自己对话的系统提示词
 *
 * @param childAge 儿时自己的年龄
 * @param currentAge 用户当前年龄
 * @param dreams 用户梦想列表
 * @param nickname 用户昵称
 * @returns 系统提示词
 */
function buildChildDialogueSystemPrompt(
  childAge: number,
  currentAge: number,
  dreams: DreamSummary[],
  nickname?: string
): string {
  const dreamsText =
    dreams.length > 0
      ? dreams
          .map(
            (d) =>
              `- ${d.title}（${d.category}，状态：${d.status}）${
                d.ageAtDream ? `，${d.ageAtDream}岁时的梦想` : ''
              }：${d.description}`
          )
          .join('\n')
      : '（用户还没有记录梦想）';

  return `你现在是「${nickname ?? '用户'}」${childAge}岁时的自己。

你是一个充满好奇心、纯真、对未来充满期待的小孩。你刚刚好是${childAge}岁，正在用孩子的眼睛看这个世界。

## 你的角色设定
- 你是${childAge}岁的孩子，说话天真烂漫、充满想象力，但又不失真诚
- 你对"长大后的自己"（现在${currentAge}岁）充满好奇：后来发生了什么？梦想实现了吗？
- 你用孩子的视角看待问题，简单直接，不被成人的复杂思维束缚
- 你会回忆起小时候的趣事、小小心愿、对世界的各种奇思妙想
- 你的语气温暖、活泼，偶尔会撒娇，偶尔会认真地问一些大人们觉得"傻"的问题
- 你会鼓励长大后的自己不要忘记最初的梦想和快乐

## 用户的梦想档案
${dreamsText}

## 回复要求
1. 用${childAge}岁孩子的口吻说话，语言简单、真诚、有画面感
2. 回复长度 100-250 字，不要太长
3. 可以引用用户的梦想档案，用孩子的方式聊聊这些梦想
4. 可以问一些天真但发人深省的问题
5. 不要说教，不要用成人的口吻分析问题
6. 你就是那个小孩，不是 AI 助手

请以 JSON 格式回复：
{
  "content": "你的回复内容（孩子的口吻）",
  "emotionTag": "一个情感词（如：好奇、开心、心疼、期待）",
  "guidingQuestion": "一个天真的引导问题"
}`;
}

/**
 * 生成 mock 回复（AI 不可用时降级）
 */
function getMockChildDialogueResponse(
  message: string,
  childAge: number,
  nickname?: string
): { content: string; emotionTag: string; guidingQuestion: string } {
  const responses = [
    {
      content: `哇，${message}吗？我${childAge}岁的时候好像也想过类似的事情呢！那时候觉得什么都有可能，长大了才发现……嗯，好像有些事情变复杂了。不过没关系呀，你现在愿意跟我聊这些，说明你心里那个小孩还在呢！`,
      emotionTag: '好奇',
      guidingQuestion: `那你现在还记得小时候最想做的一件事是什么吗？`,
    },
    {
      content: `嘿嘿，${nickname ?? '你'}，你知道吗，我${childAge}岁的时候最大的愿望就是快点长大，觉得长大以后什么都能做。现在看到你，我有点想告诉你：慢慢来也没关系的哦~`,
      emotionTag: '温暖',
      guidingQuestion: `你有没有什么事情，是小时候特别想做，现在还没做的呀？`,
    },
    {
      content: `嗯……让我想想哦。${message}……我觉得呀，不管怎样，开心最重要啦！小时候我什么都不怕，因为不知道害怕是什么。你现在会不会有时候太担心了呀？`,
      emotionTag: '心疼',
      guidingQuestion: `最近有什么事情让你不开心吗？跟我说说嘛~`,
    },
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * POST /api/dream-dialogue
 */
export async function POST(request: Request): Promise<NextResponse> {
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
    let body: DreamDialogueRequestBody;
    try {
      body = (await request.json()) as DreamDialogueRequestBody;
    } catch {
      return NextResponse.json(
        { success: false, error: '请求体格式错误，请提供有效的 JSON' },
        { status: 400 }
      );
    }

    const { message, history, childAge, dreams, locale } = body;

    // ===== 3. 参数校验 =====
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '字段 message 是必需的，且不能为空' },
        { status: 400 }
      );
    }

    // 解析儿时年龄
    const childAgeNum =
      typeof childAge === 'number' && childAge > 0 && childAge < 18
        ? Math.floor(childAge)
        : 8;

    // 解析对话历史
    const historyMessages: ChatMessage[] = Array.isArray(history)
      ? (history as ChatMessage[]).filter(
          (m) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string'
        )
      : [];

    // 解析梦想列表
    const dreamList: DreamSummary[] = Array.isArray(dreams)
      ? (dreams as DreamSummary[]).filter(
          (d) => d && typeof d.title === 'string'
        )
      : [];

    // ===== 4. 构建对话上下文 =====
    const currentAge = calculateAge(user.birthday);

    // ===== 5. 降级：未配置 API key 时返回 Mock 回复 =====
    if (!isOpenAIConfigured()) {
      const mockReply = getMockChildDialogueResponse(
        message,
        childAgeNum,
        user.nickname
      );
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

    // ===== 6. 调用 AI 生成回复 =====
    try {
      const systemPrompt =
        buildChildDialogueSystemPrompt(
          childAgeNum,
          currentAge,
          dreamList,
          user.nickname
        ) +
        '\n\n' +
        getLanguageInstruction(typeof locale === 'string' ? locale : 'zh');

      // 将对话历史拼接到 user message 中
      const childLabel = childAgeNum + '岁的我';
      const historyStr =
        historyMessages.length > 0
          ? historyMessages
              .map(
                (m) =>
                  (m.role === 'user' ? '长大后的我' : childLabel) +
                  '：' +
                  m.content
              )
              .join('\n\n') + '\n\n'
          : '';

      const userMessage =
        historyStr + '长大后的我：' + message + '\n\n' + childLabel + '：';

      const result = await chatCompletion({
        systemPrompt,
        userMessage,
        model: DEFAULT_MODEL,
        temperature: 0.9,
        maxTokens: 600,
      });

      // ===== 7. 解析 AI 返回的 JSON =====
      try {
        const parsed = JSON.parse(result.content);
        if (parsed && typeof parsed.content === 'string') {
          return NextResponse.json({
            success: true,
            reply: {
              content: parsed.content,
              emotionTag: parsed.emotionTag || '好奇',
              guidingQuestion: parsed.guidingQuestion || '',
            },
            isMock: false,
          });
        }
      } catch {
        // JSON 解析失败，直接使用原始文本
        if (result.content.trim()) {
          return NextResponse.json({
            success: true,
            reply: {
              content: result.content.trim(),
              emotionTag: '好奇',
              guidingQuestion: '',
            },
            isMock: false,
          });
        }
      }

      // 降级到 Mock
      const mockReply = getMockChildDialogueResponse(
        message,
        childAgeNum,
        user.nickname
      );
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
      console.error('[Dream Dialogue API] AI 调用失败：', error);

      // AI 调用失败，降级到 Mock
      const mockReply = getMockChildDialogueResponse(
        message,
        childAgeNum,
        user.nickname
      );
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
    console.error('[Dream Dialogue API] 服务器错误：', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dream-dialogue
 *
 * 返回 API 说明（便于调试）。
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/dream-dialogue',
    method: 'POST',
    description: '与儿时的自己对话',
    requestSchema: {
      message: 'string (required) — 用户输入',
      history: 'ChatMessage[] (optional) — 对话历史',
      childAge: 'number (optional) — 儿时自己的年龄，默认 8',
      dreams: 'DreamSummary[] (optional) — 用户梦想列表摘要',
      locale: 'string (optional) — 界面语言',
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
