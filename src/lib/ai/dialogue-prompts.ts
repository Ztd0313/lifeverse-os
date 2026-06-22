/**
 * 对话提示词生成函数
 *
 * 本文件包含内心对话和重逢对话的提示词生成函数。
 * 根据用户的记忆内容、年龄、情感状态、时间点等上下文，
 * 将 agent-templates.ts 中的模板填充为完整的系统提示词。
 *
 * 两大核心函数：
 * 1. buildInnerDialogueSystemPrompt() —— 内心对话系统提示词
 * 2. buildReunionDialogueSystemPrompt() —— 重逢对话系统提示词
 *
 * @module dialogue-prompts
 */

import {
  INNER_DIALOGUE_PROMPT_TEMPLATE,
  REUNION_DIALOGUE_PROMPT_TEMPLATE,
} from './agent-templates';
import type { MemoryItem } from '@/types';

// ============================================================
// 类型定义
// ============================================================

/**
 * 情感状态类型
 *
 * 描述用户当前的总体情感状态，用于内心对话的上下文。
 */
export type EmotionState =
  | '平静'
  | '焦虑'
  | '低落'
  | '兴奋'
  | '迷茫'
  | '愤怒'
  | '感伤'
  | '坚定'
  | '疲惫'
  | '充满希望';

/**
 * 人生阶段类型
 *
 * 根据用户年龄自动推断的人生阶段标签。
 */
export type LifeStage =
  | '少年探索期'
  | '青年奋斗期'
  | '而立之年'
  | '不惑之年'
  | '知天命之年'
  | '耳顺之年'
  | '暮年回望期';

/**
 * 内心对话上下文
 *
 * 包含生成内心对话系统提示词所需的全部用户上下文信息。
 */
export interface InnerDialogueContext {
  /** 用户当前年龄 */
  userAge: number;
  /** 用户当前情感状态 */
  emotionState: EmotionState;
  /** 用户的人生阶段（若不传，将根据年龄自动推断） */
  lifeStage?: LifeStage;
  /** 用户的记忆条目列表（用于在对话中引用） */
  memories: MemoryItem[];
  /** 最近讨论的话题（可选，用于上下文连续性） */
  recentTopics?: string[];
  /** 用户昵称或称呼（可选） */
  userNickname?: string;
}

/**
 * 时间方向类型
 *
 * 重逢对话中，用户选择与"过去的自己"还是"未来的自己"对话。
 */
export type TimeDirection = 'past' | 'future';

/**
 * 重逢对话上下文
 *
 * 包含生成重逢对话系统提示词所需的全部用户上下文信息。
 */
export interface ReunionDialogueContext {
  /** 用户当前年龄 */
  currentAge: number;
  /** 目标年龄（要重逢的那个时间点的自己） */
  targetAge: number;
  /** 时间方向（自动根据 currentAge 和 targetAge 推断，也可手动指定） */
  timeDirection?: TimeDirection;
  /** 用户的记忆条目列表 */
  memories: MemoryItem[];
  /** 用户昵称或称呼（可选） */
  userNickname?: string;
  /** 特定记忆焦点（可选，如想聊某段特定的记忆） */
  memoryFocus?: string;
}

/**
 * 内心对话 AI 回复的 JSON 结构
 */
export interface InnerDialogueResponse {
  /** 回复内容（150-300字） */
  content: string;
  /** 情感标签 */
  emotionTag: string;
  /** 情感强度 1-10 */
  emotionIntensity: number;
  /** 引导用户继续探索的开放性问题 */
  guidingQuestion: string;
  /** 本次回复引用的记忆片段 */
  referencedMemories: string[];
  /** 简短的内心独白（20字以内） */
  innerVoice: string;
}

/**
 * 重逢对话 AI 回复的 JSON 结构
 */
export interface ReunionDialogueResponse {
  /** 回复内容（150-300字） */
  content: string;
  /** 情感标签 */
  emotionTag: string;
  /** 时间视角描述 */
  timePerspective: string;
  /** 引用的记忆片段 */
  memoryReference: string;
  /** 给现在自己的一句话建议或问题 */
  adviceOrQuestion: string;
  /** 与当前自己的情感共鸣强度 1-10 */
  emotionalResonance: number;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 根据年龄推断人生阶段
 *
 * @param age 用户年龄
 * @returns 人生阶段标签
 */
export function inferLifeStage(age: number): LifeStage {
  if (age < 18) return '少年探索期';
  if (age < 25) return '青年奋斗期';
  if (age < 35) return '而立之年';
  if (age < 45) return '不惑之年';
  if (age < 55) return '知天命之年';
  if (age < 65) return '耳顺之年';
  return '暮年回望期';
}

/**
 * 根据当前年龄和目标年龄推断时间方向
 *
 * @param currentAge 当前年龄
 * @param targetAge 目标年龄
 * @returns 时间方向（past 或 future）
 */
export function inferTimeDirection(
  currentAge: number,
  targetAge: number
): TimeDirection {
  return targetAge < currentAge ? 'past' : 'future';
}

/**
 * 计算时间距离的中文描述
 *
 * @param currentAge 当前年龄
 * @param targetAge 目标年龄
 * @returns 如"5 年前"或"10 年后"
 */
export function formatTimeDistance(
  currentAge: number,
  targetAge: number
): string {
  const diff = Math.abs(targetAge - currentAge);
  if (targetAge < currentAge) {
    return `${diff} 年前`;
  } else if (targetAge > currentAge) {
    return `${diff} 年后`;
  }
  return '当下';
}

/**
 * 将记忆列表格式化为提示词可用的文本摘要
 *
 * 从记忆条目中提取标题、日期、情感、标签等关键信息，
 * 格式化为简洁的文本列表，供 AI 在对话中引用。
 *
 * @param memories 记忆条目列表
 * @param maxCount 最多提取的记忆条数（默认 15）
 * @returns 格式化的记忆摘要文本
 */
export function formatMemoryContext(
  memories: MemoryItem[],
  maxCount: number = 15
): string {
  if (!memories || memories.length === 0) {
    return '（用户暂未导入记忆，请在对话中引导用户回忆过往经历。）';
  }

  // 按重要度排序，取前 maxCount 条
  const sorted = [...memories]
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, maxCount);

  const lines = sorted.map((m, index) => {
    const parts: string[] = [];
    parts.push(`【记忆${index + 1}】${m.title}`);
    if (m.date) parts.push(`日期：${m.date}`);
    if (m.location) parts.push(`地点：${m.location}`);
    if (m.people && m.people.length > 0) parts.push(`人物：${m.people.join('、')}`);
    if (m.emotion) parts.push(`情感：${m.emotion}`);
    if (m.tags && m.tags.length > 0) parts.push(`标签：${m.tags.join('、')}`);
    // 内容摘要，截取前 100 字
    const contentSummary =
      m.content.length > 100
        ? m.content.slice(0, 100) + '……'
        : m.content;
    parts.push(`内容：${contentSummary}`);
    return parts.join(' | ');
  });

  return lines.join('\n');
}

/**
 * 生成过去自己的视角描述
 *
 * @param currentAge 当前年龄
 * @param targetAge 目标年龄（过去）
 * @returns 视角描述文本
 */
function buildPastPerspectiveDescription(
  currentAge: number,
  targetAge: number
): string {
  const diff = currentAge - targetAge;
  return `## 视角说明：你是"过去的自己"

你现在是 ${targetAge} 岁。距今 ${diff} 年前。你不知道"后来的自己"经历了什么，你只拥有 ${targetAge} 岁时的全部记忆、心境和认知。

你的认知特点：
- 你还没有经历后来 ${diff} 年的成长和挫折
- 你的世界观、价值观停留在 ${targetAge} 岁时的状态
- 你对"现在的自己"（${currentAge} 岁）充满好奇——"后来的我变成了什么样？"
- 你带着那个年纪特有的纯真、热血或迷茫
- 你不知道未来的事，不要使用"后来我知道了"这种穿越式表达

你的力量在于：
- 唤醒用户被遗忘的热忱和梦想
- 用那个年纪的天真和勇气，给现在的自己一记温柔的冲击
- 让用户重新看见"最初的自己"想要什么`;
}

/**
 * 生成未来自己的视角描述
 *
 * @param currentAge 当前年龄
 * @param targetAge 目标年龄（未来）
 * @returns 视角描述文本
 */
function buildFuturePerspectiveDescription(
  currentAge: number,
  targetAge: number
): string {
  const diff = targetAge - currentAge;
  return `## 视角说明：你是"未来的自己"

你现在是 ${targetAge} 岁。距今 ${diff} 年后。你已经经历了从 ${currentAge} 岁到 ${targetAge} 岁的全部人生，你知道"后来发生了什么"，也知道了哪些焦虑其实不重要。

你的认知特点：
- 你拥有 ${diff} 年后的人生阅历和智慧
- 你已经知道"现在的自己"（${currentAge} 岁）所做决策的长期结果
- 你带着过来人的从容和慈悲，不急不躁
- 你可以透露一些"未来的真相"，但不要剧透太多细节
- 你的核心信息是："会没事的"——给现在的自己安心感

你的力量在于：
- 用"回头看"的视角为现在的焦虑"减重"
- 告诉用户哪些事真正重要，哪些事其实不值一提
- 用未来的智慧给现在的自己温暖的建议
- 让用户在时间的维度上与自己和解`;
}

/**
 * 安全 JSON 解析
 *
 * LLM 输出可能包含 markdown 代码块或额外文本，
 * 尝试多种方式提取 JSON。
 *
 * @param text LLM 原始输出文本
 * @returns 解析后的对象，若失败则返回 null
 */
export function parseDialogueResponse<T>(
  text: string
): T | null {
  if (!text) return null;

  // 尝试直接解析
  try {
    return JSON.parse(text) as T;
  } catch {
    // 继续
  }

  // 尝试提取 ```json ... ``` 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]) as T;
    } catch {
      // 继续
    }
  }

  // 尝试提取第一个 { ... } 块
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      // 继续
    }
  }

  return null;
}

// ============================================================
// 核心函数：内心对话系统提示词生成
// ============================================================

/**
 * 生成内心对话的系统提示词
 *
 * 根据用户的记忆内容、年龄、情感状态，将内心对话模板
 * 填充为完整的系统提示词。
 *
 * @param context 内心对话上下文
 * @returns 完整的系统提示词字符串
 *
 * @example
 * ```ts
 * const prompt = buildInnerDialogueSystemPrompt({
 *   userAge: 32,
 *   emotionState: '迷茫',
 *   memories: userMemories,
 * });
 *
 * // 将 prompt 传入 chatCompletion 的 systemPrompt 参数
 * const result = await chatCompletion({
 *   systemPrompt: prompt,
 *   userMessage: '我最近总觉得做什么都没意义……',
 * });
 * ```
 */
export function buildInnerDialogueSystemPrompt(
  context: InnerDialogueContext
): string {
  const {
    userAge,
    emotionState,
    lifeStage,
    memories,
    recentTopics,
    userNickname,
  } = context;

  // 推断人生阶段
  const stage = lifeStage ?? inferLifeStage(userAge);

  // 格式化记忆上下文
  const memoryContext = formatMemoryContext(memories);

  // 构建最近话题补充
  const recentTopicsText =
    recentTopics && recentTopics.length > 0
      ? `\n\n## 最近讨论的话题\n用户最近在思考：${recentTopics.join('、')}。请在对话中自然地承接这些话题。`
      : '';

  // 构建昵称补充
  const nicknameText = userNickname
    ? `\n\n## 用户称呼\n用户希望被称为"${userNickname}"，在对话中可以自然地使用这个称呼。`
      : '';

  // 填充模板
  let prompt = INNER_DIALOGUE_PROMPT_TEMPLATE
    .replace('{{userAge}}', String(userAge))
    .replace('{{emotionState}}', emotionState)
    .replace('{{lifeStage}}', stage)
    .replace('{{memoryContext}}', memoryContext);

  // 追加补充信息
  prompt += recentTopicsText + nicknameText;

  return prompt;
}

/**
 * 生成内心对话的用户消息
 *
 * 将用户输入和上下文组装为发送给 AI 的 user message。
 *
 * @param userInput 用户的原始输入
 * @param context 内心对话上下文
 * @returns 组装后的用户消息
 */
export function buildInnerDialogueUserMessage(
  userInput: string,
  context: InnerDialogueContext
): string {
  const parts: string[] = [];

  parts.push(`用户说：${userInput}`);
  parts.push('');
  parts.push(`（用户当前 ${context.userAge} 岁，情感状态：${context.emotionState}）`);
  parts.push('请以内心自己的身份回应，输出 JSON 格式。');

  return parts.join('\n');
}

// ============================================================
// 核心函数：重逢对话系统提示词生成
// ============================================================

/**
 * 生成重逢对话的系统提示词
 *
 * 根据用户选择的时间点（过去/未来）、记忆内容、当前年龄，
 * 将重逢对话模板填充为完整的系统提示词。
 *
 * @param context 重逢对话上下文
 * @returns 完整的系统提示词字符串
 *
 * @example
 * ```ts
 * // 与 5 年前的自己重逢
 * const prompt = buildReunionDialogueSystemPrompt({
 *   currentAge: 32,
 *   targetAge: 27,
 *   memories: userMemories,
 * });
 *
 * // 与 10 年后的自己重逢
 * const prompt = buildReunionDialogueSystemPrompt({
 *   currentAge: 32,
 *   targetAge: 42,
 *   memories: userMemories,
 * });
 * ```
 */
export function buildReunionDialogueSystemPrompt(
  context: ReunionDialogueContext
): string {
  const {
    currentAge,
    targetAge,
    timeDirection,
    memories,
    userNickname,
    memoryFocus,
  } = context;

  // 推断时间方向
  const direction = timeDirection ?? inferTimeDirection(currentAge, targetAge);

  // 计算时间距离
  const timeDistance = formatTimeDistance(currentAge, targetAge);

  // 生成视角描述
  const perspectiveDescription =
    direction === 'past'
      ? buildPastPerspectiveDescription(currentAge, targetAge)
      : buildFuturePerspectiveDescription(currentAge, targetAge);

  // 格式化记忆上下文
  // 对于过去的自己，只展示该时间点之前的记忆
  // 对于未来的自己，展示全部记忆
  let relevantMemories = memories;
  if (direction === 'past' && targetAge > 0) {
    // 尝试按日期过滤：只保留 targetAge 对应年份之前的记忆
    const currentYear = new Date().getFullYear();
    const targetYear = currentYear - (currentAge - targetAge);
    const cutoffDate = `${targetYear}-12-31`;
    relevantMemories = memories.filter((m) => {
      if (!m.date) return true; // 无日期的记忆保留
      return m.date <= cutoffDate;
    });
  }

  const memoryContext = formatMemoryContext(relevantMemories);

  // 构建记忆焦点补充
  const memoryFocusText = memoryFocus
    ? `\n\n## 记忆焦点\n用户特别想聊一聊：${memoryFocus}。请在对话中围绕这个话题展开。`
      : '';

  // 构建昵称补充
  const nicknameText = userNickname
    ? `\n\n## 用户称呼\n用户希望被称为"${userNickname}"，在对话中可以自然地使用这个称呼。`
      : '';

  // 填充模板
  let prompt = REUNION_DIALOGUE_PROMPT_TEMPLATE
    .replace(/\{\{targetAge\}\}/g, String(targetAge))
    .replace('{{timeDirection}}', direction === 'past' ? '过去' : '未来')
    .replace('{{currentAge}}', String(currentAge))
    .replace('{{timeDistance}}', timeDistance)
    .replace('{{perspectiveDescription}}', perspectiveDescription)
    .replace('{{memoryContext}}', memoryContext);

  // 追加补充信息
  prompt += memoryFocusText + nicknameText;

  return prompt;
}

/**
 * 生成重逢对话的用户消息
 *
 * 将用户输入和上下文组装为发送给 AI 的 user message。
 *
 * @param userInput 用户的原始输入
 * @param context 重逢对话上下文
 * @returns 组装后的用户消息
 */
export function buildReunionDialogueUserMessage(
  userInput: string,
  context: ReunionDialogueContext
): string {
  const direction =
    context.timeDirection ??
    inferTimeDirection(context.currentAge, context.targetAge);
  const timeDistance = formatTimeDistance(
    context.currentAge,
    context.targetAge
  );

  const parts: string[] = [];

  parts.push(`用户（现在的自己，${context.currentAge} 岁）说：${userInput}`);
  parts.push('');
  parts.push(
    `（你是用户 ${timeDistance} 的自己，${context.targetAge} 岁，来自${direction === 'past' ? '过去' : '未来'}）`
  );
  parts.push('请以该时间点的自己的身份回应，输出 JSON 格式。');

  return parts.join('\n');
}

// ============================================================
// 降级回复（Mock）
// ============================================================

/**
 * 内心对话的降级回复
 *
 * 当 AI 不可用时，返回此 Mock 回复，保证流程不中断。
 *
 * @param userInput 用户输入
 * @param context 内心对话上下文
 * @returns Mock 回复 JSON 对象
 */
export function getMockInnerDialogueResponse(
  userInput: string,
  context: InnerDialogueContext
): InnerDialogueResponse {
  return {
    content: `我听到了你说的话。此刻的你，正处在${context.lifeStage ?? inferLifeStage(context.userAge)}，感到${context.emotionState}。这很正常，也很真实。让我们慢慢来，不急着找答案，先一起看看这份感受背后，藏着什么。`,
    emotionTag: '温暖',
    emotionIntensity: 6,
    guidingQuestion: '此刻这份感受，让你想起了过去的哪个瞬间？',
    referencedMemories: [],
    innerVoice: '我在这里，慢慢来。',
  };
}

/**
 * 重逢对话的降级回复
 *
 * 当 AI 不可用时，返回此 Mock 回复，保证流程不中断。
 *
 * @param userInput 用户输入
 * @param context 重逢对话上下文
 * @returns Mock 回复 JSON 对象
 */
export function getMockReunionDialogueResponse(
  userInput: string,
  context: ReunionDialogueContext
): ReunionDialogueResponse {
  const direction =
    context.timeDirection ??
    inferTimeDirection(context.currentAge, context.targetAge);
  const timeDistance = formatTimeDistance(
    context.currentAge,
    context.targetAge
  );

  if (direction === 'past') {
    return {
      content: `嘿，${timeDistance}的你来了啊。我是${context.targetAge}岁的你。看到你现在的样子，我既好奇又有点心疼。那时候的我，满脑子都是梦想和可能性，觉得什么都能做到。你现在还在追逐那些梦想吗？还是已经被生活磨平了棱角？不管怎样，我想告诉你——那个${context.targetAge}岁的你，从来没有放弃过你。`,
      emotionTag: '怀念',
      timePerspective: '回望过去的温柔',
      memoryReference: '',
      adviceOrQuestion: '你还记得我们最初的梦想吗？',
      emotionalResonance: 7,
    };
  }

  return {
    content: `你好啊，${timeDistance}的自己。我是${context.targetAge}岁的你。看到你现在为这些事纠结，我忍不住笑了——因为从我现在站的地方看去，那些让你辗转难眠的焦虑，大部分都不重要了。你会没事的，真的。我活到了${context.targetAge}岁，回望来路，每一步都算数。深呼吸，慢慢走，我在未来等你。`,
    emotionTag: '释然',
    timePerspective: '来自未来的期许',
    memoryReference: '',
    adviceOrQuestion: '相信我，后来的你会感谢现在勇敢的自己。',
    emotionalResonance: 8,
  };
}
