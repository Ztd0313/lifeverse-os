import { NextResponse } from 'next/server';
import { chatCompletion, isOpenAIConfigured, DEFAULT_MODEL } from '@/lib/ai/openai-client';
import { getAgentPrompt, isAgentId } from '@/lib/ai/agent-prompts';
import { getMockAgentReply } from '@/lib/ai/mock-data';
import { getAgentById } from '@/lib/agents';

/**
 * 单个 Agent 回复 API 路由
 *
 * 使用 DeepSeek（兼容 OpenAI 协议）作为底层 LLM，默认模型 deepseek-chat。
 *
 * POST /api/agent
 *
 * 请求体：
 * {
 *   "agentId": "musk",          // 必填，Agent ID
 *   "question": "string",       // 必填，用户追问
 *   "context": "string"         // 可选，议会上下文（前序发言摘要）
 * }
 *
 * 响应：
 * {
 *   "content": "string — Agent 回复内容",
 *   "agentId": "string",
 *   "agentName": "string",
 *   "isMock": boolean
 * }
 *
 * 错误处理：
 * - 未配置 DEEPSEEK_API_KEY 时返回 Mock 回复（HTTP 200，isMock=true）
 * - 参数校验失败返回 400
 * - API 调用失败返回 500
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

interface AgentRequestBody {
  agentId?: unknown;
  question?: unknown;
  context?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. 解析请求体
  let body: AgentRequestBody;
  try {
    body = (await request.json()) as AgentRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // 2. 参数校验
  const { agentId, question, context } = body;

  if (typeof agentId !== 'string' || !isAgentId(agentId)) {
    return NextResponse.json(
      {
        error:
          'Field "agentId" is required and must be a valid agent ID (musk, buffett, jobs, munger, socrates, wangyangming, zhuangzi, future20, future50, future80, father, mother)',
      },
      { status: 400 }
    );
  }

  if (typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json(
      { error: 'Field "question" is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  const contextStr =
    typeof context === 'string' ? context : '';

  // 3. 获取 Agent 信息
  const agent = getAgentById(agentId);
  if (!agent) {
    return NextResponse.json(
      { error: `Agent not found: ${agentId}` },
      { status: 404 }
    );
  }

  // 4. 降级：未配置 API key 时返回 Mock 回复
  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      {
        content: getMockAgentReply(agentId, question),
        agentId,
        agentName: agent.name,
        isMock: true,
      },
      { status: 200 }
    );
  }

  // 5. 调用 DeepSeek 生成回复
  //    统一使用 DeepSeek 默认模型 deepseek-chat，忽略 agent.model 中可能配置的 gpt-4o / deepseek-r1
  //    （DeepSeek API 当前仅提供 deepseek-chat 与 deepseek-reasoner 两个模型）。
  try {
    const systemPrompt = getAgentPrompt(agentId);
    const userMessage = contextStr
      ? `议会上下文：\n${contextStr}\n\n用户追问：${question}\n\n请以${agent.name}的身份回复（150-250字）。`
      : `用户提问：${question}\n\n请以${agent.name}的身份回复（150-250字）。`;

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
        agentId,
        agentName: agent.name,
        isMock: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Agent API] Failed for ${agentId}:`, error);

    // 降级到 Mock 回复
    return NextResponse.json(
      {
        content: getMockAgentReply(agentId, question),
        agentId,
        agentName: agent.name,
        isMock: true,
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/agent
 *
 * 返回 API 说明（便于调试）。
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/agent',
    method: 'POST',
    description: '获取单个 Agent 的回复（用于追问功能）',
    requestSchema: {
      agentId: 'string (required) — Agent ID',
      question: 'string (required) — 用户追问',
      context: 'string (optional) — 议会上下文',
    },
    responseSchema: {
      content: 'string — Agent 回复内容',
      agentId: 'string',
      agentName: 'string',
      isMock: 'boolean',
    },
    configured: isOpenAIConfigured(),
  });
}
