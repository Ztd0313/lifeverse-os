import OpenAI from 'openai';

/**
 * DeepSeek AI 客户端单例
 *
 * DeepSeek API 兼容 OpenAI 格式，复用 openai SDK。
 * - baseURL: https://api.deepseek.com/v1
 * - 默认模型: deepseek-chat
 *
 * API key 读取顺序：
 * 1. 环境变量 DEEPSEEK_API_KEY
 * 2. 环境变量 OPENAI_API_KEY（向后兼容）
 * 3. 内置 fallback key（仅用于本地开发/演示，生产环境必须通过环境变量注入）
 *
 * 未配置时返回 null，调用方需自行处理降级逻辑（如返回 Mock 数据）。
 */

/** DeepSeek API base URL */
export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

/** 默认模型名 */
export const DEFAULT_MODEL = 'deepseek-chat';

/**
 * 内置 fallback API Key
 *
 * 仅当环境变量未配置时使用，方便本地开发与演示。
 * 生产环境务必通过 DEEPSEEK_API_KEY 环境变量覆盖。
 */
const FALLBACK_API_KEY = 'sk-9e12ccb93989439b8d8bb4ed23e91539';

let client: OpenAI | null = null;

/**
 * 获取当前生效的 API Key
 *
 * 优先级：DEEPSEEK_API_KEY > OPENAI_API_KEY > 内置 fallback
 */
function resolveApiKey(): string | null {
  if (process.env.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY;
  }
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  return FALLBACK_API_KEY;
}

/**
 * 获取 DeepSeek 客户端单例
 *
 * @returns OpenAI 兼容客户端实例，若未配置 API key 则返回 null
 */
export function getOpenAIClient(): OpenAI | null {
  if (client) return client;

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return null;
  }

  client = new OpenAI({
    apiKey,
    // DeepSeek 兼容 OpenAI 协议，使用 DeepSeek 官方 base URL
    baseURL: DEEPSEEK_BASE_URL,
    // 默认超时 60s，长文本生成可能需要更久
    timeout: 60_000,
    maxRetries: 2,
  });

  return client;
}

/**
 * 是否已配置 AI API key
 *
 * 保留原函数名以兼容既有调用方（/api/council、/api/agent 等）。
 * 实际判断逻辑：环境变量 DEEPSEEK_API_KEY 或 OPENAI_API_KEY 任一存在即视为已配置；
 * 若两者均不存在，则视为未配置（即使存在 fallback key 也返回 false，
 * 以便生产环境能通过 mock fallback 暴露配置缺失问题）。
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
}

/** chatCompletion 入参 */
export interface ChatCompletionParams {
  /** System Prompt，定义 AI 角色 */
  systemPrompt: string;
  /** 用户消息 */
  userMessage: string;
  /** 模型名称，默认 deepseek-chat */
  model?: string;
  /** 温度，0-2，默认 0.8（议会讨论需要一定发散性） */
  temperature?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
}

/** chatCompletion 返回 */
export interface ChatCompletionResult {
  /** AI 回复文本 */
  content: string;
  /** 实际使用的模型 */
  model: string;
  /** 完成原因（stop / length / content_filter） */
  finishReason: string;
  /** prompt token 用量 */
  promptTokens?: number;
  /** 生成 token 用量 */
  completionTokens?: number;
}

/**
 * 单次对话补全（非流式）
 *
 * 内置重试机制：遇到网络错误或 429/5xx 时按指数退避重试，
 * 最多重试 3 次。
 *
 * @param params 调用参数
 * @returns AI 回复结果
 * @throws 当未配置 API key 或所有重试均失败时抛出
 */
export async function chatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResult> {
  const {
    systemPrompt,
    userMessage,
    model = DEFAULT_MODEL,
    temperature = 0.8,
    maxTokens = 600,
  } = params;

  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. Set it in .env.local to enable AI features.'
    );
  }

  const MAX_RETRIES = 3;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      const choice = response.choices[0];
      return {
        content: choice?.message?.content ?? '',
        model: response.model,
        finishReason: choice?.finish_reason ?? 'stop',
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      };
    } catch (error) {
      lastError = error;

      // 判断是否可重试：网络错误、429、5xx
      const isRetryable = isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }

      // 指数退避：500ms, 1000ms, 2000ms
      const backoff = 500 * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('DeepSeek request failed after all retries');
}

/**
 * 流式对话补全
 *
 * 通过 async generator 逐块产出文本，适用于打字机效果。
 * 同样内置重试机制，但流开始后不再重试（避免重复输出）。
 *
 * @example
 * ```ts
 * for await (const chunk of chatCompletionStream({ ... })) {
 *   console.log(chunk);
 * }
 * ```
 *
 * @param params 调用参数
 * @returns 异步生成器，逐块产出文本片段
 */
export async function* chatCompletionStream(
  params: ChatCompletionParams
): AsyncGenerator<string, void, unknown> {
  const {
    systemPrompt,
    userMessage,
    model = DEFAULT_MODEL,
    temperature = 0.8,
    maxTokens = 600,
  } = params;

  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. Set it in .env.local to enable AI features.'
    );
  }

  const MAX_RETRIES = 3;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const stream = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
      return;
    } catch (error) {
      lastError = error;
      const isRetryable = isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }
      const backoff = 500 * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('DeepSeek stream failed after all retries');
}

/**
 * 判断错误是否可重试
 *
 * 可重试：网络错误、超时、429 Too Many Requests、5xx 服务端错误
 * 不可重试：400 参数错误、401 鉴权失败、403 权限不足、404 模型不存在
 */
function isRetryableError(error: unknown): boolean {
  // OpenAI SDK 错误对象
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (status) {
      if (status === 429) return true;
      if (status >= 500 && status < 600) return true;
      return false;
    }
  }

  // 网络错误 / 超时（无 status 字段）
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('fetch failed')
    ) {
      return true;
    }
  }

  return false;
}

/** Promise 延时工具 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
