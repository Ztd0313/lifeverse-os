import { useCouncilStore } from '@/stores/council-store';
import type { Persona, Message, QuestionType } from '@/types';

/**
 * Council Store 单元测试
 *
 * 测试内容：
 * - 初始状态
 * - setQuestion
 * - setPersonas
 * - addMessage
 * - reset
 * - incrementSession
 *
 * 注意：council-store 使用 zustand persist 中间件，
 * 会将 sessionNumber 持久化到 localStorage。
 * 每个测试前需清除 localStorage 并重置 store 状态。
 */

/** 测试用 Persona 数据 */
const mockPersonas: Persona[] = [
  {
    id: 'musk',
    name: '马斯克',
    nameEn: 'Elon Musk',
    type: 'sage',
    philosophy: '第一性原理',
    speakingStyle: '直接、大胆',
    avatar: '🚀',
    model: 'gpt-4o',
    radar: {
      freedom: 95,
      wealth: 90,
      happiness: 70,
      stability: 40,
      growth: 85,
    },
  },
  {
    id: 'buffett',
    name: '巴菲特',
    nameEn: 'Warren Buffett',
    type: 'sage',
    philosophy: '价值投资',
    speakingStyle: '幽默、比喻丰富',
    avatar: '📈',
    model: 'gpt-4o',
    radar: {
      freedom: 60,
      wealth: 95,
      happiness: 85,
      stability: 90,
      growth: 70,
    },
  },
];

/** 测试用 Message 数据（不含 id 和 timestamp，由 addMessage 生成） */
const mockMessage: Omit<Message, 'id' | 'timestamp'> = {
  personaId: 'musk',
  personaName: '马斯克',
  role: 'agent',
  content: '从第一性原理来看，你应该...',
  round: 1,
};

/**
 * 重置 store 到初始状态
 *
 * 由于 persist 中间件会从 localStorage 恢复 sessionNumber，
 * 需要先清除 localStorage，再手动重置全部状态。
 */
function resetStore() {
  window.localStorage.clear();
  useCouncilStore.setState({
    phase: 'idle',
    sessionNumber: 1,
    currentRound: 0,
    currentSpeakerIndex: -1,
    question: '',
    questionType: 'other' as QuestionType,
    councilType: 'wisdom',
    personas: [],
    messages: [],
    conflicts: [],
    report: null,
    timeline: null,
    isAnimating: false,
    roundTransition: false,
    mentionedIds: [],
  });
}

describe('Council Store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===== 初始状态 =====
  describe('初始状态', () => {
    test('phase 应为 "idle"', () => {
      expect(useCouncilStore.getState().phase).toBe('idle');
    });

    test('sessionNumber 应为 1', () => {
      expect(useCouncilStore.getState().sessionNumber).toBe(1);
    });

    test('currentRound 应为 0', () => {
      expect(useCouncilStore.getState().currentRound).toBe(0);
    });

    test('currentSpeakerIndex 应为 -1', () => {
      expect(useCouncilStore.getState().currentSpeakerIndex).toBe(-1);
    });

    test('question 应为空字符串', () => {
      expect(useCouncilStore.getState().question).toBe('');
    });

    test('questionType 应为 "other"', () => {
      expect(useCouncilStore.getState().questionType).toBe('other');
    });

    test('councilType 应为 "wisdom"', () => {
      expect(useCouncilStore.getState().councilType).toBe('wisdom');
    });

    test('personas 应为空数组', () => {
      expect(useCouncilStore.getState().personas).toEqual([]);
    });

    test('messages 应为空数组', () => {
      expect(useCouncilStore.getState().messages).toEqual([]);
    });

    test('conflicts 应为空数组', () => {
      expect(useCouncilStore.getState().conflicts).toEqual([]);
    });

    test('report 应为 null', () => {
      expect(useCouncilStore.getState().report).toBeNull();
    });

    test('timeline 应为 null', () => {
      expect(useCouncilStore.getState().timeline).toBeNull();
    });

    test('isAnimating 应为 false', () => {
      expect(useCouncilStore.getState().isAnimating).toBe(false);
    });

    test('roundTransition 应为 false', () => {
      expect(useCouncilStore.getState().roundTransition).toBe(false);
    });

    test('mentionedIds 应为空数组', () => {
      expect(useCouncilStore.getState().mentionedIds).toEqual([]);
    });
  });

  // ===== setQuestion =====
  describe('setQuestion', () => {
    test('应同时设置 question 和 questionType', () => {
      // Arrange
      const question = '要不要辞职创业？';
      const type: QuestionType = 'career';

      // Act
      useCouncilStore.getState().setQuestion(question, type);

      // Assert
      const state = useCouncilStore.getState();
      expect(state.question).toBe(question);
      expect(state.questionType).toBe(type);
    });

    test('应支持不同的问题类型', () => {
      // Arrange & Act
      useCouncilStore.getState().setQuestion('该不该买房？', 'finance');

      // Assert
      const state = useCouncilStore.getState();
      expect(state.question).toBe('该不该买房？');
      expect(state.questionType).toBe('finance');
    });

    test('应能覆盖之前设置的问题', () => {
      // Arrange
      useCouncilStore.getState().setQuestion('问题一', 'career');

      // Act
      useCouncilStore.getState().setQuestion('问题二', 'relationship');

      // Assert
      const state = useCouncilStore.getState();
      expect(state.question).toBe('问题二');
      expect(state.questionType).toBe('relationship');
    });
  });

  // ===== setPersonas =====
  describe('setPersonas', () => {
    test('应设置 personas 数组', () => {
      // Act
      useCouncilStore.getState().setPersonas(mockPersonas);

      // Assert
      const state = useCouncilStore.getState();
      expect(state.personas).toEqual(mockPersonas);
      expect(state.personas).toHaveLength(2);
    });

    test('应能覆盖之前的 personas', () => {
      // Arrange
      useCouncilStore.getState().setPersonas(mockPersonas);

      // Act
      useCouncilStore.getState().setPersonas([mockPersonas[0]]);

      // Assert
      expect(useCouncilStore.getState().personas).toHaveLength(1);
      expect(useCouncilStore.getState().personas[0].id).toBe('musk');
    });

    test('设置为空数组应清空 personas', () => {
      // Arrange
      useCouncilStore.getState().setPersonas(mockPersonas);

      // Act
      useCouncilStore.getState().setPersonas([]);

      // Assert
      expect(useCouncilStore.getState().personas).toEqual([]);
    });
  });

  // ===== addMessage =====
  describe('addMessage', () => {
    test('应将消息添加到 messages 数组', () => {
      // Act
      useCouncilStore.getState().addMessage(mockMessage);

      // Assert
      const state = useCouncilStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].personaId).toBe('musk');
      expect(state.messages[0].content).toBe('从第一性原理来看，你应该...');
    });

    test('应自动生成 id', () => {
      // Act
      useCouncilStore.getState().addMessage(mockMessage);

      // Assert
      const message = useCouncilStore.getState().messages[0];
      expect(message.id).toBeDefined();
      expect(typeof message.id).toBe('string');
      expect(message.id.length).toBeGreaterThan(0);
    });

    test('应自动生成 timestamp', () => {
      // Arrange
      const before = Date.now();

      // Act
      useCouncilStore.getState().addMessage(mockMessage);

      // Assert
      const after = Date.now();
      const timestamp = useCouncilStore.getState().messages[0].timestamp;
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    test('应保留传入的 round 和 role 字段', () => {
      // Act
      useCouncilStore.getState().addMessage(mockMessage);

      // Assert
      const message = useCouncilStore.getState().messages[0];
      expect(message.round).toBe(1);
      expect(message.role).toBe('agent');
    });

    test('应追加到已有消息列表末尾', () => {
      // Arrange
      useCouncilStore.getState().addMessage(mockMessage);

      // Act
      useCouncilStore.getState().addMessage({
        ...mockMessage,
        content: '第二条消息',
        round: 2,
      });

      // Assert
      const messages = useCouncilStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('从第一性原理来看，你应该...');
      expect(messages[1].content).toBe('第二条消息');
    });

    test('多条消息的 id 应各不相同', () => {
      // Act
      useCouncilStore.getState().addMessage(mockMessage);
      useCouncilStore.getState().addMessage({ ...mockMessage, content: '第二条' });

      // Assert
      const messages = useCouncilStore.getState().messages;
      expect(messages[0].id).not.toBe(messages[1].id);
    });
  });

  // ===== reset =====
  describe('reset', () => {
    test('应将状态重置为初始值', () => {
      // Arrange — 先修改状态
      useCouncilStore.getState().setQuestion('测试问题', 'career');
      useCouncilStore.getState().setPersonas(mockPersonas);
      useCouncilStore.getState().addMessage(mockMessage);
      useCouncilStore.getState().setPhase('r1');

      // Act
      useCouncilStore.getState().reset();

      // Assert
      const state = useCouncilStore.getState();
      expect(state.phase).toBe('idle');
      expect(state.question).toBe('');
      expect(state.questionType).toBe('other');
      expect(state.personas).toEqual([]);
      expect(state.messages).toEqual([]);
      expect(state.currentRound).toBe(0);
      expect(state.currentSpeakerIndex).toBe(-1);
    });

    test('reset 应保留 sessionNumber', () => {
      // Arrange — 先增加 sessionNumber
      useCouncilStore.getState().incrementSession();
      useCouncilStore.getState().incrementSession();
      expect(useCouncilStore.getState().sessionNumber).toBe(3);

      // Act
      useCouncilStore.getState().reset();

      // Assert — sessionNumber 应保持为 3
      expect(useCouncilStore.getState().sessionNumber).toBe(3);
    });

    test('reset 应将 report 和 timeline 清空', () => {
      // Arrange
      useCouncilStore.setState({
        report: {
          id: 'test-report',
          councilId: 'test-council',
          question: '测试',
          summary: '摘要',
          dimensions: [],
          indices: {
            conflict: 50,
            growth: 70,
            happiness: 80,
            freedom: 60,
            stability: 75,
          },
          radar: {
            freedom: 60,
            wealth: 70,
            happiness: 80,
            stability: 75,
            growth: 70,
          },
          consensusPoints: [],
          disclaimer: '免责声明',
          timestamp: Date.now(),
        },
      });

      // Act
      useCouncilStore.getState().reset();

      // Assert
      expect(useCouncilStore.getState().report).toBeNull();
      expect(useCouncilStore.getState().timeline).toBeNull();
    });
  });

  // ===== incrementSession =====
  describe('incrementSession', () => {
    test('应将 sessionNumber 加 1', () => {
      // Arrange — 初始为 1
      expect(useCouncilStore.getState().sessionNumber).toBe(1);

      // Act
      useCouncilStore.getState().incrementSession();

      // Assert
      expect(useCouncilStore.getState().sessionNumber).toBe(2);
    });

    test('连续调用应持续递增', () => {
      // Act
      useCouncilStore.getState().incrementSession();
      useCouncilStore.getState().incrementSession();
      useCouncilStore.getState().incrementSession();

      // Assert
      expect(useCouncilStore.getState().sessionNumber).toBe(4);
    });

    test('incrementSession 不应影响其他状态', () => {
      // Arrange
      useCouncilStore.getState().setQuestion('测试问题', 'career');

      // Act
      useCouncilStore.getState().incrementSession();

      // Assert — question 不应被改变
      expect(useCouncilStore.getState().question).toBe('测试问题');
    });

    test('reset 后 incrementSession 应从保留的 sessionNumber 继续递增', () => {
      // Arrange — 先递增到 3
      useCouncilStore.getState().incrementSession();
      useCouncilStore.getState().incrementSession();
      expect(useCouncilStore.getState().sessionNumber).toBe(3);

      // Act — reset 后再递增
      useCouncilStore.getState().reset();
      useCouncilStore.getState().incrementSession();

      // Assert — 应从 3 递增到 4
      expect(useCouncilStore.getState().sessionNumber).toBe(4);
    });
  });
});
