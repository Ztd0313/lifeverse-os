import {
  MOCK_MEMORIES,
  PLANETS,
  getPlanetMeta,
  getEmotionMeta,
  EMOTIONS,
  type PlanetMeta,
} from '@/lib/mock-memories';
import type { MemoryCategory } from '@/types';

/**
 * mock-memories 数据测试
 *
 * 测试内容：
 * - PLANETS 数组长度为 5
 * - 每个星球都有 mock 记忆
 * - getPlanetMeta 返回正确元信息
 */

/** 5 个星球的 id 列表 */
const PLANET_IDS: MemoryCategory[] = ['forest', 'ocean', 'town', 'city', 'mountain'];

describe('mock-memories', () => {
  // ===== PLANETS 数组 =====
  describe('PLANETS', () => {
    test('PLANETS 数组长度应为 5', () => {
      expect(PLANETS).toHaveLength(5);
    });

    test('每个星球应包含完整的元信息字段', () => {
      const requiredFields: (keyof PlanetMeta)[] = [
        'id',
        'name',
        'nameEn',
        'color',
        'description',
        'icon',
      ];

      PLANETS.forEach((planet) => {
        requiredFields.forEach((field) => {
          expect(planet[field]).toBeDefined();
          expect(planet[field]).not.toBe('');
        });
      });
    });

    test('每个星球的 id 应唯一', () => {
      const ids = PLANETS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('应包含 forest / ocean / town / city / mountain 五个星球', () => {
      const ids = PLANETS.map((p) => p.id);
      PLANET_IDS.forEach((id) => {
        expect(ids).toContain(id);
      });
    });

    test('每个星球的 color 应为有效的十六进制颜色', () => {
      PLANETS.forEach((planet) => {
        expect(planet.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    test('每个星球的 icon 应为合法值', () => {
      const validIcons = ['TreePine', 'Waves', 'Home', 'Building2', 'Mountain'];
      PLANETS.forEach((planet) => {
        expect(validIcons).toContain(planet.icon);
      });
    });
  });

  // ===== 每个星球都有 mock 记忆 =====
  describe('每个星球都有 mock 记忆', () => {
    test('MOCK_MEMORIES 总数应为 15（5 星球 x 3 条）', () => {
      expect(MOCK_MEMORIES).toHaveLength(15);
    });

    PLANET_IDS.forEach((planetId) => {
      test(`星球 "${planetId}" 应至少有 1 条记忆`, () => {
        const planetMemories = MOCK_MEMORIES.filter(
          (m) => m.category === planetId
        );
        expect(planetMemories.length).toBeGreaterThanOrEqual(1);
      });

      test(`星球 "${planetId}" 应有 3 条记忆`, () => {
        const planetMemories = MOCK_MEMORIES.filter(
          (m) => m.category === planetId
        );
        expect(planetMemories).toHaveLength(3);
      });
    });

    test('每条记忆的 id 应唯一', () => {
      const ids = MOCK_MEMORIES.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('每条记忆应包含必填字段', () => {
      const requiredFields: (keyof (typeof MOCK_MEMORIES)[number])[] = [
        'id',
        'title',
        'type',
        'category',
        'content',
        'emotion',
        'date',
        'importance',
      ];

      MOCK_MEMORIES.forEach((memory) => {
        requiredFields.forEach((field) => {
          expect(memory[field]).toBeDefined();
        });
      });
    });

    test('每条记忆的 category 应在 5 个星球范围内', () => {
      MOCK_MEMORIES.forEach((memory) => {
        expect(PLANET_IDS).toContain(memory.category);
      });
    });

    test('每条记忆的 importance 应在 0-1 之间', () => {
      MOCK_MEMORIES.forEach((memory) => {
        expect(memory.importance).toBeGreaterThanOrEqual(0);
        expect(memory.importance).toBeLessThanOrEqual(1);
      });
    });

    test('每条记忆的 emotion 应为 warm / cool / neutral', () => {
      const validEmotions = ['warm', 'cool', 'neutral'];
      MOCK_MEMORIES.forEach((memory) => {
        expect(validEmotions).toContain(memory.emotion);
      });
    });
  });

  // ===== getPlanetMeta =====
  describe('getPlanetMeta', () => {
    test('传入 "forest" 应返回青春森林元信息', () => {
      const meta = getPlanetMeta('forest');
      expect(meta).toBeDefined();
      expect(meta?.name).toBe('青春森林');
      expect(meta?.nameEn).toBe('Forest');
      expect(meta?.description).toBe('校园 / 毕业 / 童年');
    });

    test('传入 "ocean" 应返回爱情海洋元信息', () => {
      const meta = getPlanetMeta('ocean');
      expect(meta).toBeDefined();
      expect(meta?.name).toBe('爱情海洋');
      expect(meta?.nameEn).toBe('Ocean');
      expect(meta?.description).toBe('表白 / 约会 / 婚礼');
    });

    test('传入 "town" 应返回家庭小镇元信息', () => {
      const meta = getPlanetMeta('town');
      expect(meta).toBeDefined();
      expect(meta?.name).toBe('家庭小镇');
      expect(meta?.nameEn).toBe('Town');
      expect(meta?.description).toBe('家庭聚会 / 父母 / 孩子');
    });

    test('传入 "city" 应返回梦想之城元信息', () => {
      const meta = getPlanetMeta('city');
      expect(meta).toBeDefined();
      expect(meta?.name).toBe('梦想之城');
      expect(meta?.nameEn).toBe('City');
      expect(meta?.description).toBe('升职 / 创业 / 作品');
    });

    test('传入 "mountain" 应返回成长山脉元信息', () => {
      const meta = getPlanetMeta('mountain');
      expect(meta).toBeDefined();
      expect(meta?.name).toBe('成长山脉');
      expect(meta?.nameEn).toBe('Mountain');
      expect(meta?.description).toBe('失败 / 告别 / 蜕变');
    });

    test('返回的 meta 应与 PLANETS 中的对象一致', () => {
      PLANETS.forEach((planet) => {
        const meta = getPlanetMeta(planet.id);
        expect(meta).toBe(planet);
      });
    });

    test('传入不存在的 id 应返回 undefined', () => {
      expect(getPlanetMeta('non-existent' as MemoryCategory)).toBeUndefined();
    });
  });

  // ===== getEmotionMeta（附加测试） =====
  describe('getEmotionMeta', () => {
    test('EMOTIONS 数组长度应为 3', () => {
      expect(EMOTIONS).toHaveLength(3);
    });

    test('传入 "warm" 应返回暖色调元信息', () => {
      const meta = getEmotionMeta('warm');
      expect(meta).toBeDefined();
      expect(meta?.label).toBe('暖');
    });

    test('传入 "cool" 应返回冷色调元信息', () => {
      const meta = getEmotionMeta('cool');
      expect(meta).toBeDefined();
      expect(meta?.label).toBe('冷');
    });

    test('传入 "neutral" 应返回中性色调元信息', () => {
      const meta = getEmotionMeta('neutral');
      expect(meta).toBeDefined();
      expect(meta?.label).toBe('中性');
    });

    test('传入不存在的 id 应返回 undefined', () => {
      expect(getEmotionMeta('non-existent' as never)).toBeUndefined();
    });
  });
});
