import {
  cn,
  formatDate,
  formatSessionNumber,
  truncate,
  getConflictLevel,
  radarPoint,
  delay,
  generateId,
} from '@/lib/utils';

/**
 * cn() 工具函数测试
 */
describe('cn() — Tailwind 类名合并', () => {
  test('应合并多个字符串类名', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  test('应过滤掉假值（undefined / null / false）', () => {
    expect(cn('base', undefined, null, false, 'tail')).toBe('base tail');
  });

  test('应处理条件类名（对象语法）', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });

  test('应解决 Tailwind 冲突（后者覆盖前者）', () => {
    // px-2 与 px-4 冲突，twMerge 应保留后者
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

/**
 * formatDate() 测试
 */
describe('formatDate() — 相对时间格式化', () => {
  test('1 分钟以内应返回"刚刚"', () => {
    const now = Date.now();
    expect(formatDate(now)).toBe('刚刚');
    expect(formatDate(now - 30 * 1000)).toBe('刚刚');
  });

  test('1 小时以内应返回"X 分钟前"', () => {
    const now = Date.now();
    const fiveMinAgo = now - 5 * 60 * 1000;
    expect(formatDate(fiveMinAgo)).toBe('5 分钟前');
  });

  test('1 天以内应返回"X 小时前"', () => {
    const now = Date.now();
    const threeHoursAgo = now - 3 * 60 * 60 * 1000;
    expect(formatDate(threeHoursAgo)).toBe('3 小时前');
  });

  test('7 天以内应返回"X 天前"', () => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    expect(formatDate(threeDaysAgo)).toBe('3 天前');
  });

  test('超过 7 天应返回完整日期（zh-CN 格式）', () => {
    // 使用固定日期避免时区问题
    const oldDate = new Date(2020, 0, 15).getTime();
    const result = formatDate(oldDate);
    // 应包含"年"和"月"字样
    expect(result).toContain('年');
    expect(result).toContain('月');
    expect(result).toContain('2020');
  });
});

/**
 * formatSessionNumber() 测试
 */
describe('formatSessionNumber() — 议会编号格式化', () => {
  test('应返回"第 N 次命运议会"格式', () => {
    expect(formatSessionNumber(1)).toBe('第 1 次命运议会');
    expect(formatSessionNumber(42)).toBe('第 42 次命运议会');
  });
});

/**
 * truncate() 测试
 */
describe('truncate() — 文本截断', () => {
  test('文本长度不超过 maxLen 时应原样返回', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  test('文本长度等于 maxLen 时应原样返回（不加省略号）', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  test('文本长度超过 maxLen 时应截断并加省略号', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  test('空字符串应原样返回', () => {
    expect(truncate('', 10)).toBe('');
  });
});

/**
 * getConflictLevel() 测试
 */
describe('getConflictLevel() — 冲突等级判定', () => {
  test('value >= 80 应返回"激烈冲突"', () => {
    const result = getConflictLevel(80);
    expect(result.label).toBe('激烈冲突');
    expect(result.color).toBe('#e85d5d');
  });

  test('value >= 60 且 < 80 应返回"明显分歧"', () => {
    const result = getConflictLevel(65);
    expect(result.label).toBe('明显分歧');
    expect(result.color).toBe('#e8a05d');
  });

  test('value >= 40 且 < 60 应返回"温和讨论"', () => {
    const result = getConflictLevel(50);
    expect(result.label).toBe('温和讨论');
    expect(result.color).toBe('#c9a84c');
  });

  test('value < 40 应返回"基本一致"', () => {
    const result = getConflictLevel(30);
    expect(result.label).toBe('基本一致');
    expect(result.color).toBe('#5de8a0');
  });

  test('边界值 100 应返回"激烈冲突"', () => {
    expect(getConflictLevel(100).label).toBe('激烈冲突');
  });

  test('边界值 0 应返回"基本一致"', () => {
    expect(getConflictLevel(0).label).toBe('基本一致');
  });
});

/**
 * radarPoint() 测试
 */
describe('radarPoint() — 雷达图坐标计算', () => {
  test('value=0 时应返回中心点', () => {
    const result = radarPoint(0, 0, 100, 100, 50);
    expect(result.x).toBeCloseTo(100, 5);
    expect(result.y).toBeCloseTo(100, 5);
  });

  test('value=100, angle=0（正上方）应在中心正上方', () => {
    const result = radarPoint(100, 0, 100, 100, 50);
    // angle=0 -> radian = -90° -> cos(-90°)=0, sin(-90°)=-1
    expect(result.x).toBeCloseTo(100, 5);
    expect(result.y).toBeCloseTo(50, 5);
  });

  test('value=100, angle=72 应在右上方区域', () => {
    const result = radarPoint(100, 72, 100, 100, 50);
    // x 应大于 centerX（右侧），y 应小于 centerY（上方）
    expect(result.x).toBeGreaterThan(100);
    expect(result.y).toBeLessThan(100);
  });

  test('value=50 应在半径中点', () => {
    const result = radarPoint(50, 0, 100, 100, 50);
    // 半径 = 50/100 * 50 = 25，正上方 -> y = 100 - 25 = 75
    expect(result.x).toBeCloseTo(100, 5);
    expect(result.y).toBeCloseTo(75, 5);
  });
});

/**
 * generateId() 测试
 */
describe('generateId() — 唯一 ID 生成', () => {
  test('应返回字符串', () => {
    expect(typeof generateId()).toBe('string');
  });

  test('应包含时间戳和随机部分（用 - 分隔）', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  test('连续调用应生成不同的 ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

/**
 * delay() 测试
 */
describe('delay() — 异步延迟', () => {
  test('应在指定毫秒后 resolve', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});
