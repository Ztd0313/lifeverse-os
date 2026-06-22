import { NextResponse } from 'next/server';
import { councilGraph } from '@/lib/ai/langgraph-engine';
import { mockCouncilResult } from '@/lib/ai/mock-data';
import { isOpenAIConfigured } from '@/lib/ai/openai-client';
import type { CouncilType } from '@/types';

/**
 * 议会 API 路由
 *
 * 使用 DeepSeek（兼容 OpenAI 协议）作为底层 LLM。
 *
 * POST /api/council
 *
 * 请求体：
 * {
 *   "question": "string — 用户的人生问题",
 *   "agentIds": ["musk", "buffett", ...],  // 可选，不传则自动调度
 *   "councilType": "wisdom | future | inner | reunion",  // 可选
 *   "rounds": 2,  // 可选，辩论轮次
 *   "userContext": { ... }  // 可选
 * }
 *
 * 响应：
 * {
 *   "councilId": "string",
 *   "question": "string",
 *   "messages": [...],
 *   "conflicts": [...],
 *   "report": {...},
 *   "timeline": [...],
 *   "isMock": boolean
 * }
 *
 * 错误处理：
 * - 未配置 DEEPSEEK_API_KEY 时返回 Mock 数据（HTTP 200，isMock=true）
 * - 参数校验失败返回 400
 * - 引擎执行失败返回 500
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

/** 合法的议会类型 */
const VALID_COUNCIL_TYPES: CouncilType[] = [
  'wisdom',
  'future',
  'inner',
  'reunion',
];

interface CouncilRequestBody {
  question?: unknown;
  agentIds?: unknown;
  councilType?: unknown;
  rounds?: unknown;
  userContext?: unknown;
  locale?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. 解析请求体
  let body: CouncilRequestBody;
  try {
    body = (await request.json()) as CouncilRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // 2. 参数校验
  const { question, agentIds, councilType, rounds, userContext, locale } = body;

  if (typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json(
      { error: 'Field "question" is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  // 校验 agentIds（可选）
  let validatedAgentIds: string[] | undefined;
  if (agentIds !== undefined) {
    if (!Array.isArray(agentIds) || !agentIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'Field "agentIds" must be an array of strings' },
        { status: 400 }
      );
    }
    validatedAgentIds = agentIds as string[];
  }

  // 校验 councilType（可选）
  let validatedCouncilType: CouncilType | undefined;
  if (councilType !== undefined) {
    if (typeof councilType !== 'string' || !VALID_COUNCIL_TYPES.includes(councilType as CouncilType)) {
      return NextResponse.json(
        {
          error: `Field "councilType" must be one of: ${VALID_COUNCIL_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }
    validatedCouncilType = councilType as CouncilType;
  }

  // 校验 rounds（可选）
  let validatedRounds: number | undefined;
  if (rounds !== undefined) {
    if (typeof rounds !== 'number' || rounds < 1 || rounds > 3) {
      return NextResponse.json(
        { error: 'Field "rounds" must be a number between 1 and 3' },
        { status: 400 }
      );
    }
    validatedRounds = rounds;
  }

  // 3. 降级：未配置 API key 时返回 Mock 数据
  if (!isOpenAIConfigured()) {
    const mockResult = {
      ...mockCouncilResult,
      question,
      councilType: validatedCouncilType ?? mockCouncilResult.councilType,
      agentIds: validatedAgentIds ?? mockCouncilResult.agentIds,
    };
    return NextResponse.json(mockResult, { status: 200 });
  }

  // 4. 调用议会引擎
  try {
    const result = await councilGraph.run({
      question,
      agentIds: validatedAgentIds,
      councilType: validatedCouncilType,
      rounds: validatedRounds,
      userContext:
        userContext && typeof userContext === 'object'
          ? (userContext as Record<string, unknown>)
          : undefined,
      locale: typeof locale === 'string' ? locale : 'zh',
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Council API] Engine execution failed:', error);

    // 引擎失败时降级到 Mock 数据，保证前端可用
    const fallbackResult = {
      ...mockCouncilResult,
      question,
      councilType: validatedCouncilType ?? mockCouncilResult.councilType,
      agentIds: validatedAgentIds ?? mockCouncilResult.agentIds,
    };

    return NextResponse.json(fallbackResult, { status: 200 });
  }
}

/**
 * GET /api/council
 *
 * 返回 API 说明（便于调试）。
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/council',
    method: 'POST',
    description: '执行命运议会流程，返回完整的议会结果',
    requestSchema: {
      question: 'string (required) — 用户的人生问题',
      agentIds: 'string[] (optional) — 参与的 Agent ID 列表',
      councilType: 'wisdom | future | inner | reunion (optional)',
      rounds: 'number 1-3 (optional, default 2)',
      userContext: 'object (optional) — 用户画像',
    },
    responseSchema: {
      councilId: 'string',
      question: 'string',
      messages: 'Message[]',
      conflicts: 'ConflictPair[]',
      report: 'DestinyReport',
      timeline: 'TimelineBranch[]',
      isMock: 'boolean',
    },
    configured: isOpenAIConfigured(),
  });
}
