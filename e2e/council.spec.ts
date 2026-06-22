import { test, expect } from '@playwright/test';

/**
 * 议会流程 E2E 测试
 *
 * 测试内容：
 * - 输入问题
 * - Agent 选择
 * - 议会流程（Mock 模式：仪式 → 3 轮讨论 → 报告）
 * - 命运报告显示
 *
 * 注意：议会流程包含动画延迟（仪式 3s + 每条消息约 2s），
 * 测试超时设置为 120s。
 */

test.describe('智慧议会流程', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage，避免议会状态残留（zustand persist）
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/council');
  });

  test('应显示问题输入区域', async ({ page }) => {
    // 验证标题
    await expect(page.getByText('提出你的命运之问')).toBeVisible();

    // 验证 textarea 存在
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute(
      'placeholder',
      '输入你正在纠结的人生问题...'
    );

    // 验证 "召集议会" 按钮存在且初始禁用
    const submitBtn = page.getByRole('button', { name: /召集议会/ });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('输入问题后 "召集议会" 按钮应启用', async ({ page }) => {
    const textarea = page.locator('textarea');
    const submitBtn = page.getByRole('button', { name: /召集议会/ });

    // 输入问题
    await textarea.fill('要不要辞职创业？');
    await expect(submitBtn).toBeEnabled();
  });

  test('应显示问题建议快捷选项', async ({ page }) => {
    // 验证建议问题按钮存在
    await expect(page.getByText('或者试试这些问题:')).toBeVisible();
    await expect(page.getByText('要不要辞职创业？').first()).toBeVisible();
    await expect(page.getByText('该不该买房还是继续租房？')).toBeVisible();
  });

  test('点击建议问题应填入 textarea', async ({ page }) => {
    // 点击建议问题
    await page.getByText('要不要辞职创业？').first().click();

    // 验证 textarea 已填入
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveValue('要不要辞职创业？');
  });

  test('应显示 7 位智者 Agent 选择网格', async ({ page }) => {
    // 验证 "选择议会成员" 标题
    await expect(page.getByText('选择议会成员')).toBeVisible();

    // 7 位智者的名字
    const agentNames = ['马斯克', '巴菲特', '乔布斯', '芒格', '苏格拉底', '王阳明', '庄子'];
    for (const name of agentNames) {
      await expect(page.getByText(name).first()).toBeVisible();
    }

    // 验证默认全选提示
    await expect(page.getByText(/已选择 7 位智者/)).toBeVisible();
  });

  test('点击 Agent 卡片应切换选中状态', async ({ page }) => {
    // 初始状态：7 位已选
    await expect(page.getByText(/已选择 7 位智者/)).toBeVisible();

    // 点击庄子取消选中
    await page.getByText('庄子').first().click();

    // 验证变为 6 位
    await expect(page.getByText(/已选择 6 位智者/)).toBeVisible();

    // 再次点击庄子恢复选中
    await page.getByText('庄子').first().click();
    await expect(page.getByText(/已选择 7 位智者/)).toBeVisible();
  });

  test('应显示返回首页按钮和议会编号', async ({ page }) => {
    // 验证返回首页按钮
    await expect(page.getByText('返回首页')).toBeVisible();

    // 验证议会编号
    await expect(page.getByText('智慧议会')).toBeVisible();
    await expect(page.getByText(/第 \d+ 次命运议会/)).toBeVisible();
  });

  test('完整议会流程：提问 → 仪式 → 3 轮讨论 → 命运报告', async ({
    page,
  }) => {
    // ===== Step 1: 输入问题并提交 =====
    const textarea = page.locator('textarea');
    await textarea.fill('要不要辞职创业？');
    await page.getByRole('button', { name: /召集议会/ }).click();

    // ===== Step 2: 仪式动画 =====
    await expect(page.getByText('议会正在召集...')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('智者们正在从各自的世界汇聚而来')).toBeVisible();

    // ===== Step 3: 第一轮 · 表态 =====
    // 等待仪式结束（3s）并进入第一轮
    await expect(page.getByText('第一轮 · 表态')).toBeVisible({
      timeout: 15_000,
    });

    // 等待第一轮所有消息出现并显示 "下一轮" 按钮
    const nextRoundBtn = page.getByRole('button', { name: /下一轮/ });
    await expect(nextRoundBtn).toBeVisible({ timeout: 30_000 });
    await nextRoundBtn.click();

    // ===== Step 4: 第二轮 · 质疑 =====
    await expect(page.getByText('第二轮 · 质疑')).toBeVisible({
      timeout: 10_000,
    });
    const nextRoundBtn2 = page.getByRole('button', { name: /下一轮/ });
    await expect(nextRoundBtn2).toBeVisible({ timeout: 30_000 });
    await nextRoundBtn2.click();

    // ===== Step 5: 第三轮 · 共识 =====
    await expect(page.getByText('第三轮 · 共识')).toBeVisible({
      timeout: 10_000,
    });
    const generateReportBtn = page.getByRole('button', {
      name: /生成命运报告/,
    });
    await expect(generateReportBtn).toBeVisible({ timeout: 30_000 });
    await generateReportBtn.click();

    // ===== Step 6: 命运报告 =====
    // 验证报告标题
    await expect(page.getByText('人生命运报告')).toBeVisible({
      timeout: 15_000,
    });

    // 验证命运报告 badge
    await expect(page.getByText('命运报告').first()).toBeVisible();

    // 验证议题显示
    await expect(page.getByText('议题')).toBeVisible();
    await expect(page.getByText(/要不要辞职创业？/)).toBeVisible();

    // 验证核心指数区域
    await expect(page.getByText('核心指数')).toBeVisible();
    await expect(page.getByText('冲突值')).toBeVisible();
    await expect(page.getByText('成长值')).toBeVisible();
    await expect(page.getByText('幸福值')).toBeVisible();
    await expect(page.getByText('自由值')).toBeVisible();
    await expect(page.getByText('稳定值')).toBeVisible();

    // 验证维度分析区域
    await expect(page.getByText('维度分析')).toBeVisible();
    await expect(page.getByText('风险分析')).toBeVisible();
    await expect(page.getByText('后悔概率')).toBeVisible();
    await expect(page.getByText('长期收益')).toBeVisible();

    // 验证各方共识区域
    await expect(page.getByText('各方共识')).toBeVisible();

    // 验证免责声明
    await expect(
      page.getByText('最终决定权，属于你。议会只提供视角，不替你做选择。')
    ).toBeVisible();

    // 验证操作按钮
    await expect(page.getByRole('button', { name: /新建议会/ })).toBeVisible();
  });

  test('命运报告中应显示查看时间线按钮', async ({ page }) => {
    // 快速走完流程
    const textarea = page.locator('textarea');
    await textarea.fill('该不该接受这份新工作offer？');
    await page.getByRole('button', { name: /召集议会/ }).click();

    // 等待并走完 3 轮
    for (let round = 1; round <= 3; round++) {
      const btnText = round < 3 ? /下一轮/ : /生成命运报告/;
      const btn = page.getByRole('button', { name: btnText });
      await expect(btn).toBeVisible({ timeout: 30_000 });
      await btn.click();
    }

    // 验证报告已生成
    await expect(page.getByText('人生命运报告')).toBeVisible({
      timeout: 15_000,
    });

    // 验证 "查看命运时间线" 按钮存在
    await expect(
      page.getByRole('button', { name: /查看命运时间线/ })
    ).toBeVisible();
  });
});
