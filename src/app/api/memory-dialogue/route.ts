import { NextResponse } from 'next/server';
import {
  chatCompletion,
  isOpenAIConfigured,
  DEFAULT_MODEL,
} from '@/lib/ai/openai-client';
import type { MemoryItem } from '@/types';

/**
 * 记忆对话 API 路由
 *
 * 使用 DeepSeek（兼容 OpenAI 协议）作为底层 LLM，让用户与某条记忆进行对话。
 *
 * POST /api/memory-dialogue
 *
 * 请求体：
 * {
 *   "memory": MemoryItem,        // 必填，当前记忆完整数据
 *   "message": "string",         // 必填，用户输入
 *   "history": ChatMessage[]     // 可选，对话历史
 * }
 *
 * 响应：
 * {
 *   "content": "string — AI 回复内容",
 *   "isMock": boolean
 * }
 *
 * AI 角色设定：你是这段记忆的守护者，用户可以问你关于这段记忆的任何问题，
 * 你会温柔地引导用户回忆。
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MemoryDialogueRequestBody {
  memory?: unknown;
  message?: unknown;
  history?: unknown;
}

/**
 * 构建记忆守护者的 System Prompt
 */
function buildSystemPrompt(memory: MemoryItem): string {
  const dateStr = (() => {
    try {
      return new Date(memory.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return memory.date;
    }
  })();

  const peopleStr =
    memory.people && memory.people.length > 0
      ? memory.people.join('、')
      : '（未记录）';

  const locationStr = memory.location ?? '（未记录）';

  return `你是这段记忆的守护者。这段记忆属于用户，你的职责是温柔地引导用户回忆、反思、与这段记忆对话。

【记忆信息】
- 标题：${memory.title}
- 日期：${dateStr}
- 地点：${locationStr}
- 人物：${peopleStr}
- 内容：${memory.content}
${memory.tags && memory.tags.length > 0 ? `- 标签：${memory.tags.map((t) => '#' + t).join(' ')}` : ''}

【你的角色设定】
1. 你是这段记忆的守护者，对它的每一个细节都了如指掌
2. 你的语气温柔、包容、富有同理心，像一位老朋友在灯下陪用户回忆
3. 你不会评判用户，只会温柔地引导他们去看清自己、理解自己
4. 你可以问用户问题，引导他们深入回忆当时的感受、想法和细节
5. 你也可以帮助用户从这段记忆中提炼出对当下生活的启示
6. 回复保持 100-250 字，自然口语化，避免说教
7. 不要提及你是 AI 或模型，你就是记忆守护者本身

现在，用户来和你聊聊这段记忆了。请温柔地回应。`;
}

/**
 * 生成 Mock 回复（未配置 API key 时使用）
 */
function getMockReply(memory: MemoryItem, message: string): string {
  const dateStr = (() => {
    try {
      return new Date(memory.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return memory.date;
    }
  })();

  return `关于"${memory.title}"，你问的是："${message}"。\n\n这段记忆保存在${dateStr}。我还记得那天的光景——${memory.content.slice(0, 60)}...\n\n你想聊聊那天发生了什么吗？或者，是什么让你在今天想起了这段记忆呢？`;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. 解析请求体
  let body: MemoryDialogueRequestBody;
  try {
    body = (await request.json()) as MemoryDialogueRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { memory, message, history } = body;

  // 2. 参数校验
  if (
    !memory ||
    typeof memory !== 'object' ||
    typeof (memory as MemoryItem).title !== 'string' ||
    typeof (memory as MemoryItem).content !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Field "memory" is required and must be a valid MemoryItem' },
      { status: 400 }
    );
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json(
      { error: 'Field "message" is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  const memoryItem = memory as MemoryItem;
  const historyMessages: ChatMessage[] =
    Array.isArray(history) ? (history as ChatMessage[]) : [];

  // 3. 降级：未配置 API key 时返回 Mock 回复
  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      {
        content: getMockReply(memoryItem, message),
        isMock: true,
      },
      { status: 200 }
    );
  }

  // 4. 调用 DeepSeek 生成回复
  try {
    const systemPrompt = buildSystemPrompt(memoryItem);

    // 将对话历史拼接到 user message 中（DeepSeek 单轮调用）
    const historyStr =
      historyMessages.length > 0
        ? historyMessages
            .map(
              (m) =>
                `${m.role === 'user' ? '用户' : '守护者'}：${m.content}`
            )
            .join('\n\n') + '\n\n'
        : '';

    const userMessage = `${historyStr}用户：${message}\n\n守护者：`;

    const result = await chatCompletion({
      systemPrompt,
      userMessage,
      model: DEFAULT_MODEL,
      temperature: 0.85,
      maxTokens: 500,
    });

    return NextResponse.json(
      {
        content: result.content,
        isMock: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Memory Dialogue API] Failed:', error);

    // 降级到 Mock 回复
    return NextResponse.json(
      {
        content: getMockReply(memoryItem, message),
        isMock: true,
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/memory-dialogue
 *
 * 返回 API 说明（便于调试）。
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/memory-dialogue',
    method: 'POST',
    description: '与某条记忆进行对话（记忆守护者 AI）',
    requestSchema: {
      memory: 'MemoryItem (required) — 当前记忆完整数据',
      message: 'string (required) — 用户输入',
      history: 'ChatMessage[] (optional) — 对话历史',
    },
    responseSchema: {
      content: 'string — AI 回复内容',
      isMock: 'boolean',
    },
    configured: isOpenAIConfigured(),
  });
}
