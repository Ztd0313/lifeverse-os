import { useMemoryStore } from '@/stores/memory-store';
import { MOCK_MEMORIES } from '@/lib/mock-memories';
import type { MemoryItem } from '@/types';

/**
 * Memory Store 单元测试
 *
 * 测试内容：
 * - 初始状态
 * - addMemory
 * - deleteMemory
 * - selectPlanet
 * - selectMemory
 *
 * 注意：memory-store 不使用 persist 中间件，
 * 但由于 store 是模块级单例，测试间状态会共享，
 * 需在每个测试前重置状态。
 */

/**
 * 重置 store 到初始状态
 */
function resetStore() {
  useMemoryStore.setState({
    memories: [...MOCK_MEMORIES],
    selectedPlanet: 'forest',
    selectedMemory: null,
    isUploadOpen: false,
    dialogueMemory: null,
  });
}

describe('Memory Store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===== 初始状态 =====
  describe('初始状态', () => {
    test('memories 应为 MOCK_MEMORIES', () => {
      expect(useMemoryStore.getState().memories).toEqual(MOCK_MEMORIES);
    });

    test('memories 初始长度应为 15', () => {
      expect(useMemoryStore.getState().memories).toHaveLength(15);
    });

    test('selectedPlanet 应为 "forest"', () => {
      expect(useMemoryStore.getState().selectedPlanet).toBe('forest');
    });

    test('selectedMemory 应为 null', () => {
      expect(useMemoryStore.getState().selectedMemory).toBeNull();
    });

    test('isUploadOpen 应为 false', () => {
      expect(useMemoryStore.getState().isUploadOpen).toBe(false);
    });
  });

  // ===== addMemory =====
  describe('addMemory', () => {
    test('应将新记忆添加到列表开头', () => {
      // Arrange
      const initialCount = useMemoryStore.getState().memories.length;
      const newMemory = {
        title: '新记忆',
        type: 'text' as const,
        content: '这是新记忆的内容',
        emotion: 'warm' as const,
        date: new Date().toISOString(),
        importance: 0.5,
      };

      // Act
      useMemoryStore.getState().addMemory(newMemory);

      // Assert
      const state = useMemoryStore.getState();
      expect(state.memories).toHaveLength(initialCount + 1);
      expect(state.memories[0].title).toBe('新记忆');
    });

    test('应自动生成 id', () => {
      // Act
      useMemoryStore.getState().addMemory({
        title: '测试记忆',
        type: 'text',
        content: '内容',
        emotion: 'warm',
        date: new Date().toISOString(),
        importance: 0.5,
      });

      // Assert
      const memory = useMemoryStore.getState().memories[0];
      expect(memory.id).toBeDefined();
      expect(typeof memory.id).toBe('string');
      expect(memory.id.length).toBeGreaterThan(0);
    });

    test('未指定 category 时应使用当前 selectedPlanet', () => {
      // Arrange — 切换到 ocean 星球
      useMemoryStore.getState().selectPlanet('ocean');

      // Act
      useMemoryStore.getState().addMemory({
        title: '海洋记忆',
        type: 'text',
        content: '内容',
        emotion: 'warm',
        date: new Date().toISOString(),
        importance: 0.5,
      });

      // Assert
      const memory = useMemoryStore.getState().memories[0];
      expect(memory.category).toBe('ocean');
    });

    test('显式指定 category 时应使用指定值', () => {
      // Arrange — 当前选中 forest
      expect(useMemoryStore.getState().selectedPlanet).toBe('forest');

      // Act — 显式指定 mountain
      useMemoryStore.getState().addMemory({
        title: '山脉记忆',
        type: 'text',
        content: '内容',
        emotion: 'cool',
        date: new Date().toISOString(),
        importance: 0.8,
        category: 'mountain',
      });

      // Assert
      const memory = useMemoryStore.getState().memories[0];
      expect(memory.category).toBe('mountain');
    });

    test('添加后应关闭上传弹窗', () => {
      // Arrange — 打开上传弹窗
      useMemoryStore.setState({ isUploadOpen: true });
      expect(useMemoryStore.getState().isUploadOpen).toBe(true);

      // Act
      useMemoryStore.getState().addMemory({
        title: '测试',
        type: 'text',
        content: '内容',
        emotion: 'warm',
        date: new Date().toISOString(),
        importance: 0.5,
      });

      // Assert
      expect(useMemoryStore.getState().isUploadOpen).toBe(false);
    });

    test('应保留传入的 title、content、emotion 等字段', () => {
      // Act
      useMemoryStore.getState().addMemory({
        title: '保留字段测试',
        type: 'photo',
        content: '内容体',
        emotion: 'cool',
        date: '2026-01-01T00:00:00+08:00',
        importance: 0.9,
        tags: ['测试', '验证'],
        location: '北京',
        people: ['自己'],
      });

      // Assert
      const memory = useMemoryStore.getState().memories[0];
      expect(memory.title).toBe('保留字段测试');
      expect(memory.type).toBe('photo');
      expect(memory.content).toBe('内容体');
      expect(memory.emotion).toBe('cool');
      expect(memory.date).toBe('2026-01-01T00:00:00+08:00');
      expect(memory.importance).toBe(0.9);
      expect(memory.tags).toEqual(['测试', '验证']);
      expect(memory.location).toBe('北京');
      expect(memory.people).toEqual(['自己']);
    });
  });

  // ===== deleteMemory =====
  describe('deleteMemory', () => {
    test('应根据 id 删除记忆', () => {
      // Arrange
      const initialCount = useMemoryStore.getState().memories.length;
      const targetId = MOCK_MEMORIES[0].id;

      // Act
      useMemoryStore.getState().deleteMemory(targetId);

      // Assert
      const state = useMemoryStore.getState();
      expect(state.memories).toHaveLength(initialCount - 1);
      expect(state.memories.find((m) => m.id === targetId)).toBeUndefined();
    });

    test('删除不存在的 id 时不应影响列表', () => {
      // Arrange
      const initialCount = useMemoryStore.getState().memories.length;

      // Act
      useMemoryStore.getState().deleteMemory('non-existent-id');

      // Assert
      expect(useMemoryStore.getState().memories).toHaveLength(initialCount);
    });

    test('删除已选中的记忆时应清空 selectedMemory', () => {
      // Arrange — 选中第一条记忆
      const target = MOCK_MEMORIES[0];
      useMemoryStore.getState().selectMemory(target);
      expect(useMemoryStore.getState().selectedMemory).not.toBeNull();

      // Act
      useMemoryStore.getState().deleteMemory(target.id);

      // Assert
      expect(useMemoryStore.getState().selectedMemory).toBeNull();
    });

    test('删除未选中的记忆时不应影响 selectedMemory', () => {
      // Arrange — 选中第一条记忆
      const selected = MOCK_MEMORIES[0];
      useMemoryStore.getState().selectMemory(selected);

      // Act — 删除第二条（不是选中的那条）
      const otherId = MOCK_MEMORIES[1].id;
      useMemoryStore.getState().deleteMemory(otherId);

      // Assert
      expect(useMemoryStore.getState().selectedMemory).toEqual(selected);
    });
  });

  // ===== selectPlanet =====
  describe('selectPlanet', () => {
    test('应设置 selectedPlanet', () => {
      // Act
      useMemoryStore.getState().selectPlanet('ocean');

      // Assert
      expect(useMemoryStore.getState().selectedPlanet).toBe('ocean');
    });

    test('应支持切换到不同星球', () => {
      // Arrange
      useMemoryStore.getState().selectPlanet('ocean');
      expect(useMemoryStore.getState().selectedPlanet).toBe('ocean');

      // Act
      useMemoryStore.getState().selectPlanet('mountain');

      // Assert
      expect(useMemoryStore.getState().selectedPlanet).toBe('mountain');
    });

    test('应支持所有 5 个星球', () => {
      const planets: MemoryItem['category'][] = [
        'forest',
        'ocean',
        'town',
        'city',
        'mountain',
      ];

      for (const planet of planets) {
        useMemoryStore.getState().selectPlanet(planet);
        expect(useMemoryStore.getState().selectedPlanet).toBe(planet);
      }
    });

    test('切换星球不应影响 memories 列表', () => {
      // Arrange
      const initialMemories = useMemoryStore.getState().memories;

      // Act
      useMemoryStore.getState().selectPlanet('city');

      // Assert
      expect(useMemoryStore.getState().memories).toBe(initialMemories);
    });
  });

  // ===== selectMemory =====
  describe('selectMemory', () => {
    test('应设置 selectedMemory', () => {
      // Arrange
      const target = MOCK_MEMORIES[0];

      // Act
      useMemoryStore.getState().selectMemory(target);

      // Assert
      expect(useMemoryStore.getState().selectedMemory).toEqual(target);
    });

    test('应能切换选中的记忆', () => {
      // Arrange
      const first = MOCK_MEMORIES[0];
      const second = MOCK_MEMORIES[1];
      useMemoryStore.getState().selectMemory(first);

      // Act
      useMemoryStore.getState().selectMemory(second);

      // Assert
      expect(useMemoryStore.getState().selectedMemory).toEqual(second);
    });

    test('选中记忆不应影响 memories 列表', () => {
      // Arrange
      const initialMemories = useMemoryStore.getState().memories;
      const target = MOCK_MEMORIES[2];

      // Act
      useMemoryStore.getState().selectMemory(target);

      // Assert
      expect(useMemoryStore.getState().memories).toBe(initialMemories);
    });

    test('选中记忆不应影响 selectedPlanet', () => {
      // Arrange
      const initialPlanet = useMemoryStore.getState().selectedPlanet;
      const target = MOCK_MEMORIES[5]; // 属于 ocean 星球

      // Act
      useMemoryStore.getState().selectMemory(target);

      // Assert — selectedPlanet 不应改变
      expect(useMemoryStore.getState().selectedPlanet).toBe(initialPlanet);
    });
  });
});
