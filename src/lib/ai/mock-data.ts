/**
 * Mock 数据
 *
 * 当没有配置 OPENAI_API_KEY 时，API 路由会降级返回这些 Mock 数据，
 * 保证开发和演示流程不被阻塞。
 *
 * 数据基于一个典型的议会场景：
 * 用户提问"我该不该辞掉稳定的工作去创业？"
 * 议会成员：musk, buffett, jobs, munger, future20, future50
 */

import type {
  Message,
  ConflictPair,
  DestinyReport,
  TimelineBranch,
} from '@/types';

/** 议会结果（API 返回的完整结构） */
export interface CouncilResult {
  /** 议会 ID */
  councilId: string;
  /** 用户原始问题 */
  question: string;
  /** 议会类型 */
  councilType: 'wisdom' | 'future' | 'inner' | 'reunion';
  /** 参与的 Agent ID 列表 */
  agentIds: string[];
  /** 主席开场白 */
  chairmanOpening: string;
  /** 所有发言消息（按时间顺序） */
  messages: Message[];
  /** 冲突对列表 */
  conflicts: ConflictPair[];
  /** 命运报告 */
  report: DestinyReport;
  /** 时间线分支 */
  timeline: TimelineBranch[];
  /** 整体冲突分数 0-100 */
  overallConflictScore: number;
  /** 是否为 Mock 数据 */
  isMock: boolean;
}

/** Mock 议会 ID */
const MOCK_COUNCIL_ID = 'mock-council-0001';

/** Mock 用户问题 */
const MOCK_QUESTION = '我今年32岁，在一家大厂做产品经理，年薪60万。最近有个创业机会，做AI教育产品，但意味着要放弃稳定收入。我该不该辞职去创业？';

/** Mock 主席开场白 */
const MOCK_CHAIRMAN_OPENING =
  '欢迎来到第 1 次命运议会。本次议题涉及事业转型与风险决策，主席已为你匹配 6 位议会成员：马斯克（第一性原理）、巴菲特（价值投资）、乔布斯（追求卓越）、芒格（逆向思维）、20岁的你（热血冲动）、50岁的你（成熟平衡）。他们将围绕"是否辞职创业"展开三轮辩论，最终为你生成命运报告与时间线预测。';

/** Mock 时间戳基准（构建时确定，保证 SSR/CSR 一致） */
const BASE_TS = 1_700_000_000_000;

/** Mock 消息列表（10 条） */
export const mockMessages: Message[] = [
  {
    id: 'mock-msg-001',
    personaId: 'system',
    personaName: '主席',
    role: 'system',
    content: MOCK_CHAIRMAN_OPENING,
    round: 0,
    timestamp: BASE_TS,
  },
  {
    id: 'mock-msg-002',
    personaId: 'musk',
    personaName: '马斯克',
    role: 'agent',
    content:
      '这个问题的本质是什么？别给我讲"稳定收入"——稳定是幻觉，是大厂用期权把你锁住的枷锁。回到第一性原理：AI教育的市场天花板至少是千亿级，你32岁正是体能和认知的巅峰。最坏情况是什么？创业失败，你带着大厂PM经验回去找工作，损失18个月时间。但成功的上行空间是数量级的跨越。犹豫本身就是最大的成本。',
    round: 1,
    timestamp: BASE_TS + 1000,
  },
  {
    id: 'mock-msg-003',
    personaId: 'buffett',
    personaName: '巴菲特',
    role: 'agent',
    content:
      '小伙子，我给你讲个故事。我1950年代想买一家保险公司，估值太高没买，后来它涨了10倍。但我没后悔——因为我把那笔钱投了GEICO，涨了100倍。关键不是这次创业能不能成，而是你的"安全边际"在哪里？60万年薪是你的现金流护城河，辞职等于把护城河填了。我的建议：先验证MVP，用业余时间跑3个月数据，有traction再全职。别把桥烧了。',
    round: 1,
    timestamp: BASE_TS + 2000,
  },
  {
    id: 'mock-msg-004',
    personaId: 'jobs',
    personaName: '乔布斯',
    role: 'agent',
    content:
      '你问该不该？先问你自己——这件事值得你用生命中有限的时间去换吗？如果今天是你生命最后一天，你会后悔没去试，还是后悔辞了那份让你麻木的工作？直觉已经告诉你答案了。大厂的60万买的是你的可能性。砍掉它，聚焦在那件让你心跳加速的事上。',
    round: 1,
    timestamp: BASE_TS + 3000,
  },
  {
    id: 'mock-msg-005',
    personaId: 'munger',
    personaName: '芒格',
    role: 'agent',
    content:
      '反过来想。什么会让你这次创业必死无疑？第一，现金流断裂——没有12个月跑道就辞职是自杀。第二，能力圈错配——你是PM不是技术合伙人，AI教育需要强技术壁垒。第三，确认偏差——你只看到机会没看到竞争。告诉我你会死在哪里，我就知道你该不该去。建议：先找技术合伙人，再谈辞职。',
    round: 1,
    timestamp: BASE_TS + 4000,
  },
  {
    id: 'mock-msg-006',
    personaId: 'future20',
    personaName: '20岁的自己',
    role: 'agent',
    content:
      '冲啊！你现在不去做，难道等60岁再后悔吗？！大厂那点工资算什么，你赌的是整个人生！失败了大不了重来，年轻就是最大的资本！那些说"再等等"的人，等到最后什么都没做！',
    round: 1,
    timestamp: BASE_TS + 5000,
  },
  {
    id: 'mock-msg-007',
    personaId: 'future50',
    personaName: '50岁的自己',
    role: 'agent',
    content:
      '我理解你想冲，20岁的我也这么想，而且我不后悔冲过。但我现在要告诉你——有些东西冲过去就回不来了。32岁正是上有老下有小的年纪，你的决策不只关乎你自己。我的建议：别把人生想成单选题。先做MVP验证，6个月内有数据再辞职，平衡不是平庸，是更高的功夫。',
    round: 1,
    timestamp: BASE_TS + 6000,
  },
  {
    id: 'mock-msg-008',
    personaId: 'musk',
    personaName: '马斯克',
    role: 'agent',
    content:
      '巴菲特、芒格、50岁的我，你们都在说"先验证再辞职"。但你们忽略了一个事实：业余时间做MVP，意味着你只投入了30%的精力。AI教育这个赛道窗口期就18个月，等你慢悠悠验证完，市场已经被占完了。速度本身就是战略。要么all in，要么别做。',
    round: 2,
    timestamp: BASE_TS + 7000,
    isConflict: true,
    conflictWith: 'buffett',
  },
  {
    id: 'mock-msg-009',
    personaId: 'buffett',
    personaName: '巴菲特',
    role: 'agent',
    content:
      '马斯克，你的"速度即战略"在火箭上成立，在人生决策上未必。人生不是火箭发射，没有第二次机会。我见过太多人被"窗口期"焦虑裹挟，结果all in后发现方向错了。慢一点，把MVP做扎实，6个月的延迟换来的是90%的存活率。复利的前提是——你得活着看到复利。',
    round: 2,
    timestamp: BASE_TS + 8000,
    isConflict: true,
    conflictWith: 'musk',
  },
  {
    id: 'mock-msg-010',
    personaId: 'munger',
    personaName: '芒格',
    role: 'agent',
    content:
      '这场辩论的本质不是"快vs慢"，而是"机会成本vs生存概率"。我的结论：用3个月业余时间做MVP，同时找技术合伙人。如果3个月内拿到种子轮TS（term sheet），立即辞职。这是有条件的all in——既不放弃速度，也不放弃安全边际。避免愚蠢比追求聪明更可靠。',
    round: 3,
    timestamp: BASE_TS + 9000,
  },
];

/** Mock 冲突对 */
export const mockConflicts: ConflictPair[] = [
  {
    personaA: 'musk',
    personaB: 'buffett',
    value: 78,
    label: '速度 vs 安全边际',
    color: '#e85d5d',
  },
  {
    personaA: 'musk',
    personaB: 'future50',
    value: 65,
    label: '激进 vs 平衡',
    color: '#e8a05d',
  },
  {
    personaA: 'future20',
    personaB: 'buffett',
    value: 72,
    label: '热血冲动 vs 长期主义',
    color: '#e8a05d',
  },
  {
    personaA: 'jobs',
    personaB: 'munger',
    value: 55,
    label: '直觉驱动 vs 逆向思维',
    color: '#c9a84c',
  },
];

/** Mock 命运报告 */
export const mockReport: DestinyReport = {
  id: 'mock-report-0001',
  councilId: MOCK_COUNCIL_ID,
  question: MOCK_QUESTION,
  summary:
    '本次议会围绕"32岁产品经理是否辞职创业做AI教育"展开三轮辩论。核心冲突在于"速度优先"与"安全边际"的对立。议会最终达成条件性共识：采用分阶段策略，先以3个月业余时间验证MVP并寻找技术合伙人，若获得种子轮TS则立即全职投入。这一方案在保留安全边际的同时，不放弃市场窗口。',
  dimensions: [
    {
      title: '决策洞察',
      content:
        '问题的本质不是"该不该创业"，而是"以什么节奏进入创业"。你的真实困境是机会成本焦虑与生存风险之间的张力。议会识别出三个关键变量：现金流跑道、技术合伙人、市场窗口期。',
      icon: '🔍',
    },
    {
      title: '价值雷达',
      content:
        '当前你的价值雷达偏稳定（稳定75/成长68），本次决策将推动雷达向"成长"和"自由"方向迁移。预测6个月后：自由+12，成长+15，稳定-18，财富-8，幸福+5。',
      icon: '📊',
    },
    {
      title: '人生指数',
      content:
        '决策清晰度82，行动勇气65，风险承受力58，长期一致性78，内心平和度70。整体指数70.6——处于"有方向但需勇气"的状态。',
      icon: '📈',
    },
    {
      title: '冲突地图',
      content:
        '主要冲突：马斯克（速度优先）vs 巴菲特（安全边际），冲突值78。次要冲突：20岁的你（热血）vs 50岁的你（平衡），冲突值65。冲突启示：你需要在外部激进与内部稳健之间找到自己的节奏。',
      icon: '⚔️',
    },
    {
      title: '行动路径',
      content:
        '主方案：3个月MVP验证期（业余时间）→ 寻找技术合伙人 → 获得种子轮TS → 全职创业。备选方案：若3个月无traction，继续大厂工作6个月积累，等待下一个窗口。检查点：第1月MVP上线、第2月首批用户数据、第3月合伙人确认。',
      icon: '🚀',
    },
    {
      title: '心灵寄语',
      content:
        '你不需要在"all in"和"放弃"之间二选一。真正的勇气不是纵身一跃，而是在不确定中依然稳步前行。给自己3个月，用行动而不是焦虑来回答这个问题。无论结果如何，你都不会后悔曾经认真地试过。',
      icon: '🌙',
    },
  ],
  indices: {
    conflict: 68,
    growth: 82,
    happiness: 70,
    freedom: 75,
    stability: 58,
  },
  radar: {
    freedom: 78,
    wealth: 62,
    happiness: 72,
    stability: 57,
    growth: 83,
  },
  consensusPoints: [
    '采用分阶段策略，先验证MVP再全职投入',
    '必须寻找技术合伙人补齐能力圈',
    '保留至少12个月的现金流跑道',
    '设定明确的检查点和退出条件',
  ],
  disclaimer:
    '本报告由AI议会生成，仅供参考，不构成投资或职业建议。重大决策请结合自身实际情况和专业咨询。',
  timestamp: BASE_TS + 10000,
};

/** Mock 时间线 */
export const mockTimeline: TimelineBranch[] = [
  {
    node: 'now',
    label: '现在',
    description: '32岁，大厂PM，年薪60万，面临创业抉择',
    happinessProb: 70,
    regretProb: 30,
    incomeChange: '0%',
    growthRate: '基准',
  },
  {
    node: '3m',
    label: '3个月后（验证期）',
    description: '业余时间完成MVP，获得首批100名种子用户，技术合伙人初步意向',
    happinessProb: 75,
    regretProb: 20,
    incomeChange: '-5%（业余投入消耗精力）',
    growthRate: '+15%',
    children: [
      {
        node: '1y',
        label: '1年后（全职创业）',
        description: '获得种子轮，全职投入，产品用户破万，团队5人',
        happinessProb: 80,
        regretProb: 25,
        incomeChange: '-40%（创业薪资）',
        growthRate: '+45%',
      },
    ],
  },
  {
    node: '5y',
    label: '5年后',
    description: 'AI教育产品占据细分赛道前三，B轮融资，团队30人，年营收千万级',
    happinessProb: 82,
    regretProb: 18,
    incomeChange: '+120%（股权价值）',
    growthRate: '+200%',
  },
  {
    node: '10y',
    label: '10年后',
    description: '公司被收购或独立上市，财务自由，转向天使投资',
    happinessProb: 85,
    regretProb: 12,
    incomeChange: '+500%',
    growthRate: '+400%',
  },
  {
    node: '20y',
    label: '20年后',
    description: '回望人生，这段创业经历成为最珍贵的记忆，无论商业成败',
    happinessProb: 90,
    regretProb: 8,
    incomeChange: '已实现财务自由',
    growthRate: '人生圆满',
  },
];

/** Mock 整体冲突分数 */
export const MOCK_OVERALL_CONFLICT_SCORE = 68;

/**
 * 完整的 Mock 议会结果
 *
 * 当 OPENAI_API_KEY 未配置时，API 路由返回此对象。
 */
export const mockCouncilResult: CouncilResult = {
  councilId: MOCK_COUNCIL_ID,
  question: MOCK_QUESTION,
  councilType: 'wisdom',
  agentIds: ['musk', 'buffett', 'jobs', 'munger', 'future20', 'future50'],
  chairmanOpening: MOCK_CHAIRMAN_OPENING,
  messages: mockMessages,
  conflicts: mockConflicts,
  report: mockReport,
  timeline: mockTimeline,
  overallConflictScore: MOCK_OVERALL_CONFLICT_SCORE,
  isMock: true,
};

/**
 * 生成单个 Agent 的 Mock 回复（用于 /api/agent 追问）
 *
 * @param agentId Agent ID
 * @param question 用户追问
 * @returns Mock 回复文本
 */
export function getMockAgentReply(agentId: string, question: string): string {
  const replies: Record<string, string> = {
    musk: `你追问"${question}"——回到第一性原理：这件事的物理极限在哪里？别被表象迷惑，拆到最底层，答案自然浮现。犹豫的成本远高于试错。`,
    buffett: `关于"${question}"，我给你打个比方：这就像打桥牌，你手里的牌面再好，也要看对手和概率。先想清楚最坏情况你能不能承受，再决定要不要下注。复利需要时间，活着最重要。`,
    jobs: `"${question}"——你心里其实已经有答案了。别让分析淹没直觉。问自己：这件事值得用生命去换吗？如果答案是肯定的，其他都是噪音。`,
    munger: `反过来想"${question}"——什么会让你在这件事上彻底失败？避开那些坑，剩下的就是路。拿着锤子的人看什么都像钉子，多换几个思维模型。`,
    socrates: `你问"${question}"？那我反问你——你说的那个词，到底是什么意思？你的定义和别人一样吗？让我们先把这个想清楚，答案或许就不言自明。`,
    wangyangming: `汝问"${question}"。吾问汝——此事汝之良知如何说？知而不行，只是未知。放下外在权衡，叩问本心，答案汝早已知晓。`,
    zhuangzi: `汝忧"${question}"如庄周忧蝶。那棵樗树，匠人嫌它无用，正因无用才活到今天。或许这忧虑本身，才是那场梦。醒来再看，天地有大美而不言。`,
    future20: `"${question}"——冲就完了！想那么多干嘛！趁年轻，现在就去做！失败了大不了重来，年轻就是资本！`,
    future50: `关于"${question}"，我理解你的冲动，也理解你的顾虑。得到的东西背后总有失去的，想清楚代价，找到那个平衡点。平衡不是平庸，是更高的功夫。`,
    future80: `孩子，你问"${question}"。我活到80岁回头看，你担心的这些事啊，十件里有九件根本没发生。剩下那一件发生了，我也活到了80岁。没关系，去走就是了。`,
    father: `"${question}"——爸不拦你。但记住，别把退路都断了，留条后路不丢人。照顾好身体，别的都是次要的。去吧，爸在。`,
    mother: `"${question}"——妈不懂那些大道理。妈就盼你健健康康的，别太累。累了就回家，妈给你做口热饭。妈永远站你这边。`,
  };

  return replies[agentId] ?? `（${agentId} 暂无 Mock 回复，请配置 OPENAI_API_KEY 以获得真实回复。）`;
}
