# QA Skill — 测试工程师

> Skill 路径：`.skills/qa/`
> 角色定位：LifeVerse 虚拟公司测试工程师
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 职责

测试工程师 Skill 负责 LifeVerse OS 的自动化测试与质量保障，包括测试用例编写、自动化测试实现、性能测试、兼容性测试与质量报告。该 Skill 确保每一行代码都经过严格验证，是产品质量的最后防线。

### 核心职责
- 编写测试用例
- 实现自动化测试（单元/集成/E2E）
- 性能测试与优化建议
- 兼容性测试
- 无障碍测试
- 测试报告生成
- 持续集成配置

---

## 2. 输入

| 输入项 | 类型 | 说明 |
|--------|------|------|
| 代码 | TypeScript/TSX | 待测试的源代码 |
| 需求文档 | Markdown | PRD 与验收标准 |
| 组件规格 | Markdown | components/ 下的 spec.md |
| API 文档 | Markdown | 接口定义 |
| 架构文档 | Markdown | 系统架构说明 |

---

## 3. 输出

| 输出项 | 格式 | 说明 |
|--------|------|------|
| 测试用例 | Markdown | 测试用例文档 |
| 单元测试 | .test.ts | Jest/Vitest 测试代码 |
| 集成测试 | .test.ts | 组件集成测试 |
| E2E 测试 | .spec.ts | Playwright 测试代码 |
| 测试报告 | Markdown | 测试结果报告 |
| CI 配置 | YAML | CI/CD 流水线配置 |

---

## 4. 测试体系

### 4.1 测试金字塔

```
        /\
       /E2E\        ← 少量，覆盖关键流程
      /------\
     / 集成测试 \    ← 适量，覆盖模块交互
    /----------\
   /   单元测试   \  ← 大量，覆盖函数与组件
  /--------------\
```

### 4.2 测试工具栈

| 测试类型 | 工具 | 说明 |
|----------|------|------|
| 单元测试 | Vitest | 快速，Vite 原生支持 |
| 组件测试 | Vitest + Testing Library | React 组件测试 |
| E2E 测试 | Playwright | 跨浏览器端到端测试 |
| 性能测试 | Lighthouse CI | 性能指标自动化 |
| 无障碍测试 | axe-core | 自动化 a11y 检查 |
| 视觉回归 | Playwright Screenshots | 视觉差异检测 |
| 覆盖率 | c8 / istanbul | 代码覆盖率统计 |

---

## 5. 测试用例模板

```markdown
# 测试用例 — {模块/组件名称}

## 1. 测试范围
{描述本次测试覆盖的范围}

## 2. 测试环境
- 浏览器: Chrome 120+ / Firefox / Safari / Edge
- 设备: Desktop / Tablet / Mobile
- 网络: WiFi / 4G / Slow 3G

## 3. 测试用例

### TC-001: {用例名称}
- 优先级: P0/P1/P2
- 前置条件: {条件}
- 测试步骤:
  1. {步骤1}
  2. {步骤2}
  3. {步骤3}
- 预期结果: {结果}
- 实际结果: {待填写}
- 状态: 通过/失败/阻塞

## 4. 验收标准对照
| 验收标准 | 对应用例 | 状态 |
|----------|----------|------|
```

---

## 6. 自动化测试代码规范

### 6.1 单元测试示例

```typescript
// components/radar-chart/radar-chart.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadarChart } from './radar-chart';

describe('RadarChart', () => {
  const mockData: RadarData = {
    freedom: 80,
    wealth: 60,
    happiness: 90,
    stability: 70,
    growth: 85,
  };

  it('should render 5 axis labels', () => {
    render(<RadarChart chartId="test" data={{ id: 'test', label: 'Test', values: mockData, color: '#FFD700' }} />);
    expect(screen.getByText('自由')).toBeInTheDocument();
    expect(screen.getByText('财富')).toBeInTheDocument();
    expect(screen.getByText('幸福')).toBeInTheDocument();
    expect(screen.getByText('稳定')).toBeInTheDocument();
    expect(screen.getByText('成长')).toBeInTheDocument();
  });

  it('should render SVG element', () => {
    const { container } = render(
      <RadarChart chartId="test" data={{ id: 'test', label: 'Test', values: mockData, color: '#FFD700' }} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom size', () => {
    const { container } = render(
      <RadarChart chartId="test" size={300} data={{ id: 'test', label: 'Test', values: mockData, color: '#FFD700' }} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '300');
    expect(svg).toHaveAttribute('height', '300');
  });
});
```

### 6.2 E2E 测试示例

```typescript
// e2e/wisdom-council.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Wisdom Council 议会流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wisdom-council');
  });

  test('完整议会流程', async ({ page }) => {
    // 1. 输入议题
    await page.fill('[data-testid="topic-input"]', '我应该接受这份新工作 offer 吗？');
    await page.click('[data-testid="start-meeting-btn"]');

    // 2. 等待仪式动画完成
    await page.waitForSelector('[data-testid="meeting-state-ritual"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="meeting-state-r1"]', { timeout: 10000 });

    // 3. 验证 7 个 Agent 卡片存在
    const agentCards = page.locator('[data-testid="agent-card"]');
    await expect(agentCards).toHaveCount(7);

    // 4. 等待 R1 完成
    await page.waitForSelector('[data-testid="meeting-state-r2"]', { timeout: 60000 });

    // 5. 等待 R2 完成
    await page.waitForSelector('[data-testid="meeting-state-r3"]', { timeout: 60000 });

    // 6. 等待报告生成
    await page.waitForSelector('[data-testid="meeting-state-report"]', { timeout: 60000 });

    // 7. 验证报告存在
    await expect(page.locator('[data-testid="report-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-radar-chart"]')).toBeVisible();
  });

  test('点击 Agent 查看详情', async ({ page }) => {
    await page.fill('[data-testid="topic-input"]', '测试议题');
    await page.click('[data-testid="start-meeting-btn"]');
    await page.waitForSelector('[data-testid="meeting-state-r1"]');

    await page.click('[data-testid="agent-card"]:first-child');
    await expect(page.locator('[data-testid="agent-detail-drawer"]')).toBeVisible();
  });
});
```

---

## 7. 工作流程

### 阶段 1：测试需求分析
1. 阅读需求文档与验收标准
2. 阅读组件规格说明
3. 识别测试范围与重点
4. 评估测试风险
5. 输出：测试计划

### 阶段 2：测试用例编写
1. 根据验收标准编写测试用例
2. 覆盖正常流程与异常流程
3. 标注优先级（P0/P1/P2）
4. 输出：测试用例文档

### 阶段 3：单元测试实现
1. 为工具函数编写单元测试
2. 为 UI 组件编写组件测试
3. 为 Hooks 编写测试
4. 覆盖率目标：≥ 80%
5. 输出：单元测试代码

### 阶段 4：集成测试实现
1. 为模块间交互编写集成测试
2. 测试组件组合行为
3. 测试状态管理逻辑
4. 输出：集成测试代码

### 阶段 5：E2E 测试实现
1. 为关键用户流程编写 E2E 测试
2. 覆盖议会完整流程
3. 覆盖页面导航与转场
4. 输出：E2E 测试代码

### 阶段 6：性能与兼容性测试
1. Lighthouse 性能审计
2. 跨浏览器兼容性测试
3. 移动端适配测试
4. 无障碍自动化检测
5. 输出：性能与兼容性报告

### 阶段 7：CI/CD 集成
1. 配置 GitHub Actions / Vercel CI
2. PR 时自动运行测试
3. 测试失败阻止合并
4. 生成覆盖率报告
5. 输出：CI 配置文件

### 阶段 8：测试报告
1. 汇总测试结果
2. 统计通过率与覆盖率
3. 列出已知缺陷
4. 给出质量评估
5. 输出：测试报告

---

## 8. LifeVerse 关键测试场景

### 8.1 议会流程测试
- 议题提交与验证
- 仪式动画触发
- R1/R2/R3 状态切换
- Agent 发言顺序
- 冲突检测与标记
- 共识凝聚
- 报告生成

### 8.2 组件测试
- Agent 卡片 4 种状态
- 雷达图 5 维渲染
- 时间线分支展开
- 打字机逐字显示
- 粒子背景性能
- 语音输入/输出

### 8.3 性能测试
- 首页加载 < 3s
- 议会大厅 60FPS
- 粒子背景移动端 30FPS+
- 100+ 历史记录虚拟滚动流畅
- Lighthouse 评分 ≥ 90

### 8.4 无障碍测试
- 键盘导航完整可用
- 屏幕阅读器可读
- 颜色对比度 ≥ 4.5:1
- 所有图片有 alt 文本
- 表单标签关联正确

---

## 9. 协作关系

| 协作对象 | 交互内容 |
|----------|----------|
| product-manager | 接收验收标准 |
| frontend | 接收代码，反馈 Bug |
| architect | 接收架构文档，设计测试策略 |
| database | 接收 Schema，设计数据测试 |
| motion | 接转动效测试需求 |

---

## 10. 质量标准

- 测试用例覆盖所有验收标准
- 单元测试覆盖率 ≥ 80%
- E2E 测试覆盖所有关键流程
- 无 P0 级 Bug 遗留
- Lighthouse 性能评分 ≥ 90
- 无障碍检测无严重违规
- CI 流水线稳定运行
- 测试报告准确完整

---

## 11. 触发条件

当以下情况出现时激活本 Skill：
- 新功能开发完成需要测试
- 收到 frontend Skill 的代码交付
- 需要编写测试用例
- 需要实现自动化测试
- 需要进行性能测试
- 需要配置 CI/CD
- 发现 Bug 需要编写回归测试
- 版本发布前需要质量评估
