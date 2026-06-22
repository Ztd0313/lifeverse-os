import { test, expect } from '@playwright/test';

/**
 * 记忆星球 E2E 测试
 *
 * 测试内容：
 * - 记忆星球页面加载
 * - 星球导航切换
 * - 记忆卡片展示
 * - 记忆上传弹窗
 *
 * 页面路由：/memory
 * 5 个星球：青春森林 / 爱情海洋 / 家庭小镇 / 梦想之城 / 成长山脉
 */

test.describe('记忆星球', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage，避免状态残留
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/memory');
  });

  // ===== 页面加载 =====
  test.describe('页面加载', () => {
    test('应正确加载记忆星球页面', async ({ page }) => {
      // 验证 URL
      await expect(page).toHaveURL('/memory');
    });

    test('应显示 "记忆星球" 大标题', async ({ page }) => {
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      const text = await heading.textContent();
      expect(text).toContain('记忆星球');
    });

    test('应显示英文标识 "Memory Planet"', async ({ page }) => {
      await expect(page.getByText('Memory Planet')).toBeVisible();
    });

    test('应显示副标题 "让过去有形状"', async ({ page }) => {
      await expect(page.getByText('让过去有形状')).toBeVisible();
    });

    test('应显示拖拽上传区域', async ({ page }) => {
      await expect(page.getByText('拖拽记忆到此处')).toBeVisible();
      await expect(
        page.getByText('支持照片、文字、语音、视频 · AI 会自动分类到对应星球')
      ).toBeVisible();
    });

    test('应显示 "记录此刻" 按钮', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /记录此刻/ })
      ).toBeVisible();
    });
  });

  // ===== 星球导航切换 =====
  test.describe('星球导航切换', () => {
    test('应显示 5 个星球导航按钮', async ({ page }) => {
      const planetNames = [
        '青春森林',
        '爱情海洋',
        '家庭小镇',
        '梦想之城',
        '成长山脉',
      ];

      for (const name of planetNames) {
        await expect(page.getByText(name).first()).toBeVisible();
      }
    });

    test('应显示每个星球的记忆数量', async ({ page }) => {
      // 每个星球应显示 "X 条记忆"
      const countElements = page.getByText(/\d+ 条记忆/);
      const count = await countElements.count();
      expect(count).toBe(5);
    });

    test('点击爱情海洋应切换到该星球', async ({ page }) => {
      // 点击爱情海洋星球
      await page.getByRole('button', { name: /爱情海洋/ }).click();

      // 验证当前星球描述更新
      await expect(page.getByText(/爱情海洋/).first()).toBeVisible();
    });

    test('点击成长山脉应切换到该星球', async ({ page }) => {
      // 点击成长山脉星球
      await page.getByRole('button', { name: /成长山脉/ }).click();

      // 验证页面更新
      await expect(page.getByText(/成长山脉/).first()).toBeVisible();
    });

    test('切换星球后应更新记忆列表标题', async ({ page }) => {
      // 初始状态为青春森林
      await expect(page.getByText(/青春森林的记忆/)).toBeVisible();

      // 切换到梦想之城
      await page.getByRole('button', { name: /梦想之城/ }).click();

      // 验证标题更新
      await expect(page.getByText(/梦想之城的记忆/)).toBeVisible();
    });

    test('切换星球后应更新记忆数量统计', async ({ page }) => {
      // 初始状态显示青春森林的记忆数量
      await expect(page.getByText(/共 \d+ 条记忆/)).toBeVisible();

      // 切换到家庭小镇
      await page.getByRole('button', { name: /家庭小镇/ }).click();

      // 验证数量统计仍可见
      await expect(page.getByText(/共 \d+ 条记忆/)).toBeVisible();
    });
  });

  // ===== 记忆卡片展示 =====
  test.describe('记忆卡片展示', () => {
    test('应显示当前星球的记忆卡片', async ({ page }) => {
      // 青春森林（默认选中）应有 3 条记忆
      await expect(page.getByText(/共 3 条记忆/)).toBeVisible();
    });

    test('记忆卡片应显示标题', async ({ page }) => {
      // 验证青春森林的记忆标题
      await expect(page.getByText('大学毕业典礼')).toBeVisible();
    });

    test('点击记忆卡片应弹出详情弹窗', async ({ page }) => {
      // 点击第一个记忆卡片
      await page.getByText('大学毕业典礼').click();

      // 验证详情弹窗中的内容
      await expect(page.getByText('穿着学士服站在图书馆前')).toBeVisible();
    });

    test('切换到爱情海洋应显示对应的记忆', async ({ page }) => {
      // 切换到爱情海洋
      await page.getByRole('button', { name: /爱情海洋/ }).click();

      // 验证爱情海洋的记忆标题
      await expect(page.getByText('雨夜表白')).toBeVisible();
      await expect(page.getByText('海边的第一次约会')).toBeVisible();
    });

    test('切换到成长山脉应显示对应的记忆', async ({ page }) => {
      // 切换到成长山脉
      await page.getByRole('button', { name: /成长山脉/ }).click();

      // 验证成长山脉的记忆标题
      await expect(page.getByText('创业失败的那天')).toBeVisible();
      await expect(page.getByText('独自完成第一次马拉松')).toBeVisible();
    });
  });

  // ===== 记忆上传弹窗 =====
  test.describe('记忆上传弹窗', () => {
    test('点击 "记录此刻" 应打开上传弹窗', async ({ page }) => {
      // 点击记录此刻按钮
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 验证弹窗标题
      await expect(page.getByText('记录此刻').first()).toBeVisible();
      await expect(page.getByText('让这一刻有形状')).toBeVisible();
    });

    test('上传弹窗应显示标题输入框', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 验证标题输入框
      await expect(page.getByPlaceholder('给这段记忆起个名字...')).toBeVisible();
    });

    test('上传弹窗应显示内容输入框', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 验证内容输入框
      await expect(
        page.getByPlaceholder('发生了什么？你当时在想什么？')
      ).toBeVisible();
    });

    test('上传弹窗应显示情感色调选择', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 验证情感色调标签
      await expect(page.getByText('情感色调')).toBeVisible();

      // 验证情感选项
      await expect(page.getByText('暖')).toBeVisible();
      await expect(page.getByText('冷')).toBeVisible();
      await expect(page.getByText('中性')).toBeVisible();
    });

    test('上传弹窗应显示记忆类型选择', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 验证记忆类型标签
      await expect(page.getByText('记忆类型')).toBeVisible();

      // 验证类型选项
      await expect(page.getByText('照片')).toBeVisible();
      await expect(page.getByText('文字')).toBeVisible();
      await expect(page.getByText('语音')).toBeVisible();
      await expect(page.getByText('视频')).toBeVisible();
    });

    test('标题和内容为空时 "保存记忆" 按钮应禁用', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 验证保存按钮存在且禁用
      const saveBtn = page.getByRole('button', { name: /保存记忆/ });
      await expect(saveBtn).toBeVisible();
      await expect(saveBtn).toBeDisabled();
    });

    test('填写标题和内容后 "保存记忆" 按钮应启用', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 填写标题
      await page.getByPlaceholder('给这段记忆起个名字...').fill('测试记忆标题');

      // 填写内容
      await page.getByPlaceholder('发生了什么？你当时在想什么？').fill('测试记忆内容');

      // 验证保存按钮启用
      const saveBtn = page.getByRole('button', { name: /保存记忆/ });
      await expect(saveBtn).toBeEnabled();
    });

    test('保存记忆后弹窗应关闭且新记忆出现在列表', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 填写标题和内容
      await page.getByPlaceholder('给这段记忆起个名字...').fill('E2E 测试新增记忆');
      await page.getByPlaceholder('发生了什么？你当时在想什么？').fill('这是通过 E2E 测试新增的记忆内容');

      // 点击保存
      await page.getByRole('button', { name: /保存记忆/ }).click();

      // 验证弹窗关闭（标题输入框不再可见）
      await expect(page.getByPlaceholder('给这段记忆起个名字...')).not.toBeVisible();

      // 验证新记忆出现在列表中
      await expect(page.getByText('E2E 测试新增记忆')).toBeVisible();
    });

    test('点击取消按钮应关闭弹窗', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 点击取消
      await page.getByRole('button', { name: '取消' }).click();

      // 验证弹窗关闭
      await expect(page.getByPlaceholder('给这段记忆起个名字...')).not.toBeVisible();
    });

    test('点击关闭按钮应关闭弹窗', async ({ page }) => {
      // 打开弹窗
      await page.getByRole('button', { name: /记录此刻/ }).click();

      // 点击关闭按钮（aria-label="关闭"）
      await page.getByRole('button', { name: '关闭' }).click();

      // 验证弹窗关闭
      await expect(page.getByPlaceholder('给这段记忆起个名字...')).not.toBeVisible();
    });
  });
});
