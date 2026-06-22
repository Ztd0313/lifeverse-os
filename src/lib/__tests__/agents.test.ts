import {
  AGENTS,
  getAgentById,
  getAgentsByType,
  WISDOM_COUNCIL_AGENTS,
  FUTURE_COUNCIL_AGENTS,
  RELATION_AGENTS,
  INNER_PERSONAS,
} from '@/lib/agents';
import type { Persona, RadarData } from '@/types';

/**
 * 雷达数据字段 key 列表
 */
const RADAR_KEYS: (keyof RadarData)[] = [
  'freedom',
  'wealth',
  'happiness',
  'stability',
  'growth',
];

/**
 * Persona 必填字段列表
 */
const REQUIRED_FIELDS: (keyof Persona)[] = [
  'id',
  'name',
  'nameEn',
  'type',
  'philosophy',
  'speakingStyle',
  'avatar',
  'model',
  'radar',
];

/**
 * AGENTS 数组基础测试
 */
describe('AGENTS — Agent 人格数据', () => {
  test('AGENTS 数组长度应为 12', () => {
    expect(AGENTS).toHaveLength(12);
  });

  test('每个 Agent 应包含完整的必填字段', () => {
    AGENTS.forEach((agent) => {
      REQUIRED_FIELDS.forEach((field) => {
        expect(agent[field]).toBeDefined();
        expect(agent[field]).not.toBe('');
      });
    });
  });

  test('每个 Agent 的 id 应唯一', () => {
    const ids = AGENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('每个 Agent 的 radar 应包含 5 个维度且值在 0-100 之间', () => {
    AGENTS.forEach((agent) => {
      RADAR_KEYS.forEach((key) => {
        expect(agent.radar[key]).toBeDefined();
        expect(typeof agent.radar[key]).toBe('number');
        expect(agent.radar[key]).toBeGreaterThanOrEqual(0);
        expect(agent.radar[key]).toBeLessThanOrEqual(100);
      });
    });
  });

  test('Agent 类型应只包含 sage / time / relation', () => {
    const validTypes = ['sage', 'time', 'relation'];
    AGENTS.forEach((agent) => {
      expect(validTypes).toContain(agent.type);
    });
  });
});

/**
 * getAgentById() 测试
 */
describe('getAgentById() — 按 ID 查找 Agent', () => {
  test('应能根据有效 id 返回对应 Agent', () => {
    const musk = getAgentById('musk');
    expect(musk).toBeDefined();
    expect(musk?.name).toBe('马斯克');
    expect(musk?.nameEn).toBe('Elon Musk');
  });

  test('传入不存在的 id 应返回 undefined', () => {
    expect(getAgentById('non-existent-id')).toBeUndefined();
  });

  test('返回的 Agent 应与 AGENTS 中的对象一致', () => {
    const firstAgent = AGENTS[0];
    const found = getAgentById(firstAgent.id);
    expect(found).toBe(firstAgent);
  });
});

/**
 * getAgentsByType() 测试
 */
describe('getAgentsByType() — 按类型筛选 Agent', () => {
  test('筛选 sage 类型应返回 7 个智者', () => {
    const sages = getAgentsByType('sage');
    expect(sages).toHaveLength(7);
    sages.forEach((a) => expect(a.type).toBe('sage'));
  });

  test('筛选 time 类型应返回 3 个时间型 Agent', () => {
    const timeAgents = getAgentsByType('time');
    expect(timeAgents).toHaveLength(3);
    timeAgents.forEach((a) => expect(a.type).toBe('time'));
  });

  test('筛选 relation 类型应返回 2 个关系型 Agent', () => {
    const relationAgents = getAgentsByType('relation');
    expect(relationAgents).toHaveLength(2);
    relationAgents.forEach((a) => expect(a.type).toBe('relation'));
  });
});

/**
 * 预设议会组合测试
 */
describe('预设议会组合', () => {
  test('WISDOM_COUNCIL_AGENTS 长度应为 7', () => {
    expect(WISDOM_COUNCIL_AGENTS).toHaveLength(7);
    WISDOM_COUNCIL_AGENTS.forEach((a) => expect(a.type).toBe('sage'));
  });

  test('FUTURE_COUNCIL_AGENTS 长度应为 3', () => {
    expect(FUTURE_COUNCIL_AGENTS).toHaveLength(3);
    FUTURE_COUNCIL_AGENTS.forEach((a) => expect(a.type).toBe('time'));
  });

  test('RELATION_AGENTS 长度应为 2', () => {
    expect(RELATION_AGENTS).toHaveLength(2);
    RELATION_AGENTS.forEach((a) => expect(a.type).toBe('relation'));
  });

  test('INNER_PERSONAS 长度应为 6', () => {
    expect(INNER_PERSONAS).toHaveLength(6);
    INNER_PERSONAS.forEach((a) => expect(a.type).toBe('inner'));
  });

  test('INNER_PERSONAS 的 id 应与 AGENTS 不重叠', () => {
    const agentIds = new Set(AGENTS.map((a) => a.id));
    INNER_PERSONAS.forEach((p) => {
      expect(agentIds.has(p.id)).toBe(false);
    });
  });
});
