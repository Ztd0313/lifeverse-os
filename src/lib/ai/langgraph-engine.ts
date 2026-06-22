/**
 * LangGraph 多 Agent 编排引擎（简化版）
 *
 * 实现议会完整流程：
 * User Input → Chairman → Agents Debate (R1/R2/R3) → Conflict Detection → Consensus → Destiny Report
 *
 * 设计说明：
 * 由于 @langchain/langgraph 在不同版本间存在兼容性问题，本引擎采用
 * "Promise.all 并行调用 + 串行流程控制"的简化编排方案，功能等价于
 * LangGraph 的 StateGraph，但依赖更少、更稳定。
 *
 * 每个节点（Chairman / Debate / Conflict / Consensus / Report）都是
 * 一个异步函数，接收上游状态，返回更新后的状态。节点间通过
 * CouncilContext 对象传递数据。
 */

import { chatCompletion, isOpenAIConfigured, DEFAULT_MODEL, getLanguageInstruction } from './openai-client';
import { getAgentPrompt, isAgentId, type AgentId } from './agent-prompts';
import { mockCouncilResult, type CouncilResult } from './mock-data';
import { getAgentById } from '@/lib/agents';
import { generateId } from '@/lib/utils';
import type {
  Message,
  ConflictPair,
  DestinyReport,
  TimelineBranch,
  CouncilType,
} from '@/types';

/** 议会执行入参 */
export interface CouncilGraphInput {
  /** 用户问题 */
  question: string;
  /** 指定参与的 Agent ID 列表（可选，不传则由 Chairman 自动调度） */
  agentIds?: string[];
  /** 议会类型 */
  councilType?: CouncilType;
  /** 辩论轮次，默认 2 */
  rounds?: number;
  /** 用户上下文（可选，用于个性化） */
  userContext?: {
    age?: number;
    occupation?: string;
    familyStatus?: string;
    valueRadar?: {
      freedom: number;
      wealth: number;
      happiness: number;
      stability: number;
      growth: number;
    };
  };
  /** 用户界面语言，用于控制 AI 回复语言 */
  locale?: string;
}

/** 议会内部上下文（节点间传递） */
interface CouncilContext {
  councilId: string;
  question: string;
  councilType: CouncilType;
  agentIds: AgentId[];
  rounds: number;
  userContext: CouncilGraphInput['userContext'];
  chairmanOpening: string;
  messages: Message[];
  conflicts: ConflictPair[];
  report: DestinyReport | null;
  timeline: TimelineBranch[] | null;
  overallConflictScore: number;
  locale?: string;
}

/** 主席 System Prompt */
const CHAIRMAN_SYSTEM_PROMPT = `你是 LifeVerse 的议会主席（Chairman），负责调度智慧议会和未来议会的全部流程。

你的核心职责：
1. 分析用户的问题，判断其本质属于哪个维度（事业、关系、成长、存在、健康、财富）
2. 为每位被调度的 Agent 设定具体的发言角度
3. 生成一段主席开场白，向用户说明本次议会的构成和目的

调度原则：
- 每次议会至少包含 1 位智慧议会成员和 1 位未来议会成员
- 根据问题维度匹配最相关的 Agent，而非全部调用
- 若问题涉及高风险决策，必须包含 buffett 或 munger（风险视角）
- 若问题涉及人生意义/存在焦虑，必须包含 zhuangzi 或 future80
- 若问题涉及家庭关系，必须包含 father 或 mother

发言要求：
- 用沉稳、包容、有决断力的语气
- 简要说明本次议会的成员构成和辩论结构
- 控制在 150-250 字`;

/** 冲突分析 System Prompt */
const CONFLICT_SYSTEM_PROMPT = `你是 LifeVerse 的冲突分析师，负责从辩论记录中检测、量化和可视化 Agent 之间的冲突。

你的核心任务：
1. 识别 Agent 之间的立场对立点（支持 vs 反对、激进 vs 保守、理性 vs 感性）
2. 基于价值雷达数据，计算 Agent 之间的价值观冲突强度
3. 生成冲突可视化数据，供前端渲染冲突图谱和雷达图

冲突等级判定：
- 0-30：低冲突（观点互补，可自然形成共识）
- 31-60：中冲突（存在分歧，需要显性化处理后共识）
- 61-85：高冲突（根本性对立，需要用户介入裁决）
- 86-100：极冲突（价值观根本对立，需输出多方案）

请输出 JSON 格式：
{
  "overall_conflict_score": number,
  "conflict_pairs": [
    { "personaA": "agent_id", "personaB": "agent_id", "value": number, "label": "冲突描述", "color": "#hex" }
  ]
}`;

/** 共识形成 System Prompt */
const CONSENSUS_SYSTEM_PROMPT = `你是 LifeVerse 的共识形成者，负责从辩论和冲突中提炼共识，生成最终给用户的议会总结。

你的核心任务：
1. 提取所有 Agent 达成一致的"共识点"
2. 保留无法消除的"分歧点"，以"求同存异"的方式呈现
3. 生成一段主席的总结陈词，回应用户的原始问题

共识总结要求：
- 共识点必须是 Agent 们实质上同意的内容，不能编造
- 分歧点必须公正呈现双方理由，不偏袒
- 主席总结陈词需回应用户的原始问题，给出可行动的方向
- 语气：沉稳、包容、有决断力

请输出 JSON 格式：
{
  "consensus_points": ["string", ...],
  "summary": "string — 主席总结陈词（200-400字）",
  "disclaimer": "string — 免责声明"
}`;

/** 命运报告 System Prompt */
const REPORT_SYSTEM_PROMPT = `你是 LifeVerse 的命运报告撰写者，负责将整场议会的成果转化为一份完整、深刻、可行动的命运报告。

报告必须包含以下 6 个维度：
1. 决策洞察（Decision Insight）
2. 价值雷达（Value Radar）— 5 维度：自由、财富、幸福、稳定、成长
3. 人生指数（Life Index）— 冲突、成长、幸福、自由、稳定（0-100）
4. 冲突地图（Conflict Map）
5. 行动路径（Action Path）
6. 心灵寄语（Soul Message）

请输出 JSON 格式：
{
  "summary": "string — 报告摘要",
  "dimensions": [
    { "title": "string", "content": "string", "icon": "emoji" }
  ],
  "indices": { "conflict": number, "growth": number, "happiness": number, "freedom": number, "stability": number },
  "radar": { "freedom": number, "wealth": number, "happiness": number, "stability": number, "growth": number },
  "consensus_points": ["string", ...],
  "disclaimer": "string"
}

兼具深度和可读性。心灵寄语要让人读完有"被看见"的感觉。`;

/** 时间线 System Prompt */
const TIMELINE_SYSTEM_PROMPT = `你是 LifeVerse 的时间线预言者，负责基于用户的决策和行动方案，生成人生分支预测。

时间线节点：now, 3m, 1y, 5y, 10y, 20y
每个节点需标注：幸福概率、遗憾概率、收入变化、成长率。

请输出 JSON 数组格式：
[
  {
    "node": "now | 3m | 1y | 5y | 10y | 20y",
    "label": "string — 时间标签",
    "description": "string — 该节点描述",
    "happinessProb": number,
    "regretProb": number,
    "incomeChange": "string",
    "growthRate": "string"
  }
]

主线（践行之路）：用户采纳议会建议的发展轨迹。公正呈现利弊。`;

/**
 * 议会编排引擎
 *
 * 使用简化的串行流程 + 并行 Agent 调用，实现 LangGraph 等价功能。
 *
 * @example
 * ```ts
 * const graph = new CouncilGraph();
 * const result = await graph.run({
 *   question: '我该不该辞职创业？',
 *   agentIds: ['musk', 'buffett', 'jobs'],
 *   councilType: 'wisdom',
 * });
 * ```
 */
export class CouncilGraph {
  /**
   * 执行完整议会流程
   *
   * 流程：Chairman → Debate(R1/R2/R3) → Conflict → Consensus → Report → Timeline
   *
   * 若未配置 OPENAI_API_KEY，直接返回 Mock 数据。
   *
   * @param input 议会输入
   * @returns 完整议会结果
   */
  async run(input: CouncilGraphInput): Promise<CouncilResult> {
    // 降级：未配置 API key 时返回 Mock 数据
    if (!isOpenAIConfigured()) {
      return {
        ...mockCouncilResult,
        question: input.question,
        councilType: input.councilType ?? mockCouncilResult.councilType,
        agentIds: input.agentIds ?? mockCouncilResult.agentIds,
      };
    }

    const ctx: CouncilContext = {
      councilId: generateId(),
      question: input.question,
      councilType: input.councilType ?? 'wisdom',
      agentIds: this.resolveAgentIds(input.agentIds),
      rounds: input.rounds ?? 2,
      userContext: input.userContext,
      chairmanOpening: '',
      messages: [],
      conflicts: [],
      report: null,
      timeline: null,
      overallConflictScore: 0,
      locale: input.locale,
    };

    // 节点 1：主席调度
    await this.chairmanNode(ctx);

    // 节点 2：多轮辩论（R1/R2/R3）
    for (let round = 1; round <= ctx.rounds; round++) {
      await this.debateNode(ctx, round);
    }

    // 节点 3：冲突检测
    await this.conflictNode(ctx);

    // 节点 4：共识形成
    await this.consensusNode(ctx);

    // 节点 5：命运报告
    await this.reportNode(ctx);

    // 节点 6：时间线
    await this.timelineNode(ctx);

    return this.buildResult(ctx);
  }

  /**
   * 解析 Agent ID 列表
   *
   * 若未指定，使用默认的智慧议会成员（前 4 位）。
   */
  private resolveAgentIds(agentIds?: string[]): AgentId[] {
    if (!agentIds || agentIds.length === 0) {
      return ['musk', 'buffett', 'jobs', 'munger'];
    }

    const valid = agentIds.filter((id) => isAgentId(id)) as AgentId[];
    if (valid.length === 0) {
      return ['musk', 'buffett', 'jobs', 'munger'];
    }
    return valid;
  }

  /**
   * 节点 1：主席调度
   *
   * 分析问题，生成开场白，确认参与 Agent。
   */
  private async chairmanNode(ctx: CouncilContext): Promise<void> {
    const agentList = ctx.agentIds
      .map((id) => {
        const agent = getAgentById(id);
        return agent ? `${agent.name}（${agent.philosophy}）` : id;
      })
      .join('、');

    const userMessage = `用户问题：${ctx.question}

议会类型：${ctx.councilType}
参与成员：${agentList}
${ctx.userContext?.age ? `用户年龄：${ctx.userContext.age}` : ''}

请生成主席开场白，说明本次议会的构成和目的。`;

    try {
      const result = await chatCompletion({
        systemPrompt: CHAIRMAN_SYSTEM_PROMPT + '\n\n' + getLanguageInstruction(ctx.locale),
        userMessage,
        temperature: 0.7,
        maxTokens: 400,
      });
      ctx.chairmanOpening = result.content;
    } catch {
      // 降级：使用简单开场白
      ctx.chairmanOpening = `欢迎来到命运议会。本次议题：${ctx.question}。参与成员：${agentList}。让我们开始辩论。`;
    }

    // 将主席开场白作为系统消息
    ctx.messages.push({
      id: generateId(),
      personaId: 'system',
      personaName: '主席',
      role: 'system',
      content: ctx.chairmanOpening,
      round: 0,
      timestamp: Date.now(),
    });
  }

  /**
   * 节点 2：多轮辩论
   *
   * 每轮并行调用所有 Agent，R2/R3 时将前序发言作为上下文。
   */
  private async debateNode(
    ctx: CouncilContext,
    round: number
  ): Promise<void> {
    // 构建辩论上下文（前序发言摘要）
    const previousMessages =
      round > 1
        ? ctx.messages
            .filter((m) => m.round > 0 && m.round < round)
            .map((m) => `[${m.personaName}]：${m.content}`)
            .join('\n\n')
        : '';

    const roundContext =
      round === 1
        ? '这是第一轮辩论，请基于你的哲学立场直接发表观点。'
        : `这是第${round}轮辩论。以下是前序轮次的发言：\n\n${previousMessages}\n\n请基于你的立场，回应或反驳其他成员的观点，保持人格一致性。`;

    // 并行调用所有 Agent
    const agentPromises = ctx.agentIds.map(async (agentId) => {
      const agent = getAgentById(agentId);
      if (!agent) return null;

      const systemPrompt = getAgentPrompt(agentId) + '\n\n' + getLanguageInstruction(ctx.locale);
      const userMessage = `用户问题：${ctx.question}\n\n${roundContext}\n\n请以${agent.name}的身份发言（150-250字）。`;

      try {
        const result = await chatCompletion({
          systemPrompt,
          userMessage,
          // 统一使用 DeepSeek 默认模型，忽略 agent.model 中配置的 gpt-4o / deepseek-r1
          model: DEFAULT_MODEL,
          temperature: 0.85,
          maxTokens: 500,
        });
        return {
          personaId: agentId,
          personaName: agent.name,
          content: result.content,
        };
      } catch {
        // 单个 Agent 失败不影响整体流程
        return {
          personaId: agentId,
          personaName: agent.name,
          content: `（${agent.name}暂时沉默。）`,
        };
      }
    });

    const results = await Promise.all(agentPromises);

    // 按顺序加入消息列表
    const now = Date.now();
    results.forEach((result, index) => {
      if (!result) return;
      ctx.messages.push({
        id: generateId(),
        personaId: result.personaId,
        personaName: result.personaName,
        role: 'agent',
        content: result.content,
        round,
        timestamp: now + index,
      });
    });
  }

  /**
   * 节点 3：冲突检测
   *
   * 分析辩论记录，识别 Agent 间的冲突对。
   */
  private async conflictNode(ctx: CouncilContext): Promise<void> {
    const debateLog = ctx.messages
      .filter((m) => m.role === 'agent')
      .map((m) => `[${m.personaName}（${m.personaId}）]：${m.content}`)
      .join('\n\n');

    const agentRadars = ctx.agentIds
      .map((id) => {
        const agent = getAgentById(id);
        return agent ? `${id}: ${JSON.stringify(agent.radar)}` : '';
      })
      .filter(Boolean)
      .join('\n');

    const userMessage = `辩论记录：\n${debateLog}\n\nAgent 价值雷达：\n${agentRadars}\n\n请分析冲突，输出 JSON。`;

    try {
      const result = await chatCompletion({
        systemPrompt: CONFLICT_SYSTEM_PROMPT + '\n\n' + getLanguageInstruction(ctx.locale),
        userMessage,
        temperature: 0.3,
        maxTokens: 800,
      });

      const parsed = this.safeJsonParse(result.content);
      if (parsed && Array.isArray(parsed.conflict_pairs)) {
        ctx.conflicts = (parsed.conflict_pairs as Array<{
          personaA: string;
          personaB: string;
          value: number;
          label: string;
          color?: string;
        }>).map((p) => ({
          personaA: p.personaA,
          personaB: p.personaB,
          value: p.value,
          label: p.label,
          color: p.color ?? '#c9a84c',
        }));
        ctx.overallConflictScore =
          typeof parsed.overall_conflict_score === 'number'
            ? parsed.overall_conflict_score
            : 50;
      }
    } catch {
      // 降级：基于雷达差异简单计算冲突
      ctx.conflicts = this.computeFallbackConflicts(ctx);
      ctx.overallConflictScore = 50;
    }
  }

  /**
   * 节点 4：共识形成
   *
   * 从辩论和冲突中提炼共识点。
   */
  private async consensusNode(ctx: CouncilContext): Promise<void> {
    const debateLog = ctx.messages
      .filter((m) => m.role === 'agent')
      .map((m) => `[${m.personaName}]：${m.content}`)
      .join('\n\n');

    const conflictLog = ctx.conflicts
      .map(
        (c) =>
          `${c.personaA} vs ${c.personaB}：${c.label}（冲突值${c.value}）`
      )
      .join('\n');

    const userMessage = `用户问题：${ctx.question}\n\n辩论记录：\n${debateLog}\n\n冲突分析：\n${conflictLog}\n\n请生成共识报告，输出 JSON。`;

    // 暂存共识结果，供报告节点使用
    try {
      const result = await chatCompletion({
        systemPrompt: CONSENSUS_SYSTEM_PROMPT + '\n\n' + getLanguageInstruction(ctx.locale),
        userMessage,
        temperature: 0.5,
        maxTokens: 800,
      });
      // 共识结果会在报告节点中整合
      ctx.messages.push({
        id: generateId(),
        personaId: 'system',
        personaName: '主席',
        role: 'system',
        content: result.content,
        round: ctx.rounds + 1,
        timestamp: Date.now(),
      });
    } catch {
      // 降级：跳过共识节点
    }
  }

  /**
   * 节点 5：命运报告
   *
   * 生成完整的 6 维度命运报告。
   */
  private async reportNode(ctx: CouncilContext): Promise<void> {
    const debateLog = ctx.messages
      .filter((m) => m.role === 'agent')
      .map((m) => `[${m.personaName}]：${m.content}`)
      .join('\n\n');

    const userMessage = `用户问题：${ctx.question}\n\n辩论记录：\n${debateLog}\n\n冲突分数：${ctx.overallConflictScore}\n\n请生成完整的命运报告，输出 JSON。`;

    try {
      const result = await chatCompletion({
        systemPrompt: REPORT_SYSTEM_PROMPT + '\n\n' + getLanguageInstruction(ctx.locale),
        userMessage,
        temperature: 0.6,
        maxTokens: 1500,
      });

      const parsed = this.safeJsonParse(result.content);
      if (parsed) {
        const summary =
          typeof parsed.summary === 'string' ? parsed.summary : '';
        const dimensions = Array.isArray(parsed.dimensions)
          ? (parsed.dimensions as DestinyReport['dimensions'])
          : [];
        const indices =
          parsed.indices && typeof parsed.indices === 'object'
            ? (parsed.indices as DestinyReport['indices'])
            : {
                conflict: ctx.overallConflictScore,
                growth: 70,
                happiness: 70,
                freedom: 70,
                stability: 70,
              };
        const radar =
          parsed.radar && typeof parsed.radar === 'object'
            ? (parsed.radar as DestinyReport['radar'])
            : {
                freedom: 70,
                wealth: 70,
                happiness: 70,
                stability: 70,
                growth: 70,
              };
        const consensusPoints = Array.isArray(parsed.consensus_points)
          ? (parsed.consensus_points as string[])
          : [];
        const disclaimer =
          typeof parsed.disclaimer === 'string'
            ? parsed.disclaimer
            : '本报告由AI议会生成，仅供参考，不构成专业建议。';

        ctx.report = {
          id: generateId(),
          councilId: ctx.councilId,
          question: ctx.question,
          summary,
          dimensions,
          indices,
          radar,
          consensusPoints,
          disclaimer,
          timestamp: Date.now(),
        };
      }
    } catch {
      // 降级：使用基础报告结构
      ctx.report = this.buildFallbackReport(ctx);
    }
  }

  /**
   * 节点 6：时间线生成
   *
   * 生成 5/10/20 年的人生分支预测。
   */
  private async timelineNode(ctx: CouncilContext): Promise<void> {
    const actionPath = ctx.report?.dimensions.find(
      (d) => d.title.includes('行动') || d.title.includes('路径')
    )?.content;

    const userMessage = `用户问题：${ctx.question}\n\n行动方案：${actionPath ?? '见报告'}\n\n请生成时间线预测，输出 JSON 数组。`;

    try {
      const result = await chatCompletion({
        systemPrompt: TIMELINE_SYSTEM_PROMPT + '\n\n' + getLanguageInstruction(ctx.locale),
        userMessage,
        temperature: 0.6,
        maxTokens: 800,
      });

      const parsed = this.safeJsonParse(result.content);
      if (Array.isArray(parsed)) {
        ctx.timeline = parsed.map(
          (n: {
            node: TimelineBranch['node'];
            label: string;
            description: string;
            happinessProb: number;
            regretProb: number;
            incomeChange: string;
            growthRate: string;
          }) => ({
            node: n.node,
            label: n.label,
            description: n.description,
            happinessProb: n.happinessProb,
            regretProb: n.regretProb,
            incomeChange: n.incomeChange,
            growthRate: n.growthRate,
          })
        );
      }
    } catch {
      // 降级：使用基础时间线
      ctx.timeline = this.buildFallbackTimeline(ctx);
    }
  }

  /**
   * 构建最终结果
   */
  private buildResult(ctx: CouncilContext): CouncilResult {
    return {
      councilId: ctx.councilId,
      question: ctx.question,
      councilType: ctx.councilType,
      agentIds: ctx.agentIds,
      chairmanOpening: ctx.chairmanOpening,
      messages: ctx.messages,
      conflicts: ctx.conflicts,
      report: ctx.report ?? this.buildFallbackReport(ctx),
      timeline: ctx.timeline ?? this.buildFallbackTimeline(ctx),
      overallConflictScore: ctx.overallConflictScore,
      isMock: false,
    };
  }

  /**
   * 安全 JSON 解析
   *
   * LLM 输出可能包含 markdown 代码块或额外文本，尝试提取 JSON。
   */
  private safeJsonParse(text: string): Record<string, unknown> | null {
    if (!text) return null;

    // 尝试直接解析
    try {
      return JSON.parse(text);
    } catch {
      // 继续
    }

    // 尝试提取 ```json ... ``` 代码块
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {
        // 继续
      }
    }

    // 尝试提取第一个 { ... } 块
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // 继续
      }
    }

    // 尝试提取数组
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as unknown as Record<string, unknown>;
      } catch {
        // 继续
      }
    }

    return null;
  }

  /**
   * 降级冲突计算：基于雷达差异
   */
  private computeFallbackConflicts(ctx: CouncilContext): ConflictPair[] {
    const conflicts: ConflictPair[] = [];
    const agents = ctx.agentIds
      .map((id) => getAgentById(id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];
        const diff =
          Math.abs(a.radar.freedom - b.radar.freedom) +
          Math.abs(a.radar.wealth - b.radar.wealth) +
          Math.abs(a.radar.happiness - b.radar.happiness) +
          Math.abs(a.radar.stability - b.radar.stability) +
          Math.abs(a.radar.growth - b.radar.growth);
        const value = Math.min(100, Math.round(diff / 5));
        if (value > 30) {
          conflicts.push({
            personaA: a.id,
            personaB: b.id,
            value,
            label: `${a.name} vs ${b.name}`,
            color: value > 60 ? '#e85d5d' : '#c9a84c',
          });
        }
      }
    }
    return conflicts;
  }

  /**
   * 降级报告：基础结构
   */
  private buildFallbackReport(ctx: CouncilContext): DestinyReport {
    return {
      id: generateId(),
      councilId: ctx.councilId,
      question: ctx.question,
      summary: `本次议会围绕"${ctx.question}"展开${ctx.rounds}轮辩论，整体冲突分数${ctx.overallConflictScore}。`,
      dimensions: [
        {
          title: '决策洞察',
          content: ctx.chairmanOpening,
          icon: '🔍',
        },
        {
          title: '心灵寄语',
          content:
            '无论你选择哪条路，重要的是你认真地思考过。议会的声音是参考，最终的决定权在你手中。',
          icon: '🌙',
        },
      ],
      indices: {
        conflict: ctx.overallConflictScore,
        growth: 70,
        happiness: 70,
        freedom: 70,
        stability: 70,
      },
      radar: {
        freedom: 70,
        wealth: 70,
        happiness: 70,
        stability: 70,
        growth: 70,
      },
      consensusPoints: [],
      disclaimer:
        '本报告由AI议会生成，仅供参考，不构成投资或职业建议。重大决策请结合自身实际情况和专业咨询。',
      timestamp: Date.now(),
    };
  }

  /**
   * 降级时间线：基础结构
   */
  private buildFallbackTimeline(ctx: CouncilContext): TimelineBranch[] {
    return [
      {
        node: 'now',
        label: '现在',
        description: ctx.question,
        happinessProb: 70,
        regretProb: 30,
        incomeChange: '0%',
        growthRate: '基准',
      },
      {
        node: '3m',
        label: '3个月后',
        description: '初步行动，验证方向',
        happinessProb: 72,
        regretProb: 25,
        incomeChange: '-5%',
        growthRate: '+15%',
      },
      {
        node: '1y',
        label: '1年后',
        description: '关键转折点',
        happinessProb: 75,
        regretProb: 22,
        incomeChange: '-20%',
        growthRate: '+40%',
      },
      {
        node: '5y',
        label: '5年后',
        description: '阶段性成果显现',
        happinessProb: 80,
        regretProb: 18,
        incomeChange: '+80%',
        growthRate: '+150%',
      },
      {
        node: '10y',
        label: '10年后',
        description: '回望决策，无论成败都有价值',
        happinessProb: 85,
        regretProb: 12,
        incomeChange: '+300%',
        growthRate: '+300%',
      },
      {
        node: '20y',
        label: '20年后',
        description: '这段经历成为人生最珍贵的记忆',
        happinessProb: 90,
        regretProb: 8,
        incomeChange: '已实现自由',
        growthRate: '人生圆满',
      },
    ];
  }
}

/**
 * 默认议会引擎单例
 */
export const councilGraph = new CouncilGraph();
