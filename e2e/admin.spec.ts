import { test, expect } from '@playwright/test';

/**
 * 管理后台 E2E 测试
 *
 * 测试内容：
 * - Dashboard 仪表盘加载
 * - 侧边栏导航切换
 * - 用户管理页面
 * - 议会管理页面
 *
 * 管理后台路由前缀：/admin
 * 侧边栏包含 8 个导航项：
 *   Dashboard / 用户管理 / 议会管理 / 记忆管理 /
 *   Agent 管理 / 内容管理 / 运营管理 / 系统设置
 */

test.describe('管理后台', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage，避免状态残留
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  // ===== Dashboard 仪表盘 =====
  test.describe('Dashboard 仪表盘', () => {
    test('应正确加载 Dashboard 页面', async ({ page }) => {
      await page.goto('/admin');

      // 验证 URL
      await expect(page).toHaveURL('/admin');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    test('应显示 4 个统计卡片', async ({ page }) => {
      await page.goto('/admin');

      // 验证 4 个统计卡片标题
      await expect(page.getByText('总用户数')).toBeVisible();
      await expect(page.getByText('今日活跃')).toBeVisible();
      await expect(page.getByText('议会总数')).toBeVisible();
      await expect(page.getByText('记忆总数')).toBeVisible();
    });

    test('应显示最近 7 天议会趋势图', async ({ page }) => {
      await page.goto('/admin');

      // 验证趋势图标题
      await expect(page.getByText('最近 7 天议会趋势')).toBeVisible();
      await expect(page.getByText('每日议会创建数量')).toBeVisible();
    });

    test('应显示热门 Agent 排行', async ({ page }) => {
      await page.goto('/admin');

      // 验证热门 Agent 排行标题
      await expect(page.getByText('热门 Agent 排行')).toBeVisible();
    });

    test('应显示最近议会记录表格', async ({ page }) => {
      await page.goto('/admin');

      // 验证最近议会记录标题
      await expect(page.getByText('最近议会记录')).toBeVisible();

      // 验证表格表头
      await expect(page.getByText('问题', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('冲突值', { exact: true }).first()).toBeVisible();
    });

    test('应显示管理员信息', async ({ page }) => {
      await page.goto('/admin');

      // 验证管理员信息
      await expect(page.getByText('David Kim')).toBeVisible();
      await expect(page.getByText('技术总监')).toBeVisible();
    });

    test('应显示返回前台链接', async ({ page }) => {
      await page.goto('/admin');

      // 验证返回前台链接
      const backLink = page.getByRole('link', { name: /返回前台/ });
      await expect(backLink).toBeVisible();
    });
  });

  // ===== 侧边栏导航 =====
  test.describe('侧边栏导航', () => {
    test('应显示 8 个导航项', async ({ page }) => {
      await page.goto('/admin');

      // 验证侧边栏导航项
      const navItems = [
        'Dashboard',
        '用户管理',
        '议会管理',
        '记忆管理',
        'Agent 管理',
        '内容管理',
        '运营管理',
        '系统设置',
      ];

      for (const item of navItems) {
        await expect(page.getByRole('link', { name: item })).toBeVisible();
      }
    });

    test('应显示 LifeVerse Admin 标识', async ({ page }) => {
      await page.goto('/admin');

      // 验证侧边栏 Logo
      await expect(page.getByText('LifeVerse')).toBeVisible();
      await expect(page.getByText('ADMIN')).toBeVisible();
    });

    test('点击用户管理应导航到 /admin/users', async ({ page }) => {
      await page.goto('/admin');

      // 点击用户管理
      await page.getByRole('link', { name: '用户管理' }).click();

      // 验证 URL
      await expect(page).toHaveURL('/admin/users');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
    });

    test('点击议会管理应导航到 /admin/councils', async ({ page }) => {
      await page.goto('/admin');

      // 点击议会管理
      await page.getByRole('link', { name: '议会管理' }).click();

      // 验证 URL
      await expect(page).toHaveURL('/admin/councils');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '议会管理' })).toBeVisible();
    });

    test('点击 Dashboard 应导航到 /admin', async ({ page }) => {
      // 先导航到子页面
      await page.goto('/admin/users');
      await expect(page).toHaveURL('/admin/users');

      // 点击 Dashboard
      await page.getByRole('link', { name: 'Dashboard' }).click();

      // 验证 URL
      await expect(page).toHaveURL('/admin');
    });

    test('当前页面的导航项应高亮', async ({ page }) => {
      await page.goto('/admin/users');

      // 用户管理链接应有高亮样式（金色文本）
      const userLink = page.getByRole('link', { name: '用户管理' });
      await expect(userLink).toBeVisible();

      // 验证高亮（通过 class 包含 gold 相关样式）
      const classAttr = await userLink.getAttribute('class');
      expect(classAttr).toContain('gold');
    });
  });

  // ===== 用户管理页面 =====
  test.describe('用户管理页面', () => {
    test('应正确加载用户管理页面', async ({ page }) => {
      await page.goto('/admin/users');

      // 验证 URL
      await expect(page).toHaveURL('/admin/users');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
    });

    test('应显示用户统计信息', async ({ page }) => {
      await page.goto('/admin/users');

      // 验证用户统计文案
      await expect(page.getByText(/共 \d+ 位用户/)).toBeVisible();
    });

    test('应显示搜索框', async ({ page }) => {
      await page.goto('/admin/users');

      // 验证搜索框
      await expect(page.getByPlaceholder('搜索昵称或邮箱')).toBeVisible();
    });

    test('应显示状态筛选按钮', async ({ page }) => {
      await page.goto('/admin/users');

      // 验证筛选按钮
      await expect(page.getByRole('button', { name: '全部' })).toBeVisible();
      await expect(page.getByRole('button', { name: '正常' })).toBeVisible();
      await expect(page.getByRole('button', { name: '已禁用' })).toBeVisible();
    });

    test('应显示用户表格表头', async ({ page }) => {
      await page.goto('/admin/users');

      // 验证表格表头
      await expect(page.getByText('用户', { exact: true })).toBeVisible();
      await expect(page.getByText('注册时间', { exact: true })).toBeVisible();
      await expect(page.getByText('最后活跃', { exact: true })).toBeVisible();
      await expect(page.getByText('议会数', { exact: true })).toBeVisible();
      await expect(page.getByText('状态', { exact: true })).toBeVisible();
      await expect(page.getByText('操作', { exact: true })).toBeVisible();
    });

    test('搜索用户应过滤表格结果', async ({ page }) => {
      await page.goto('/admin/users');

      // 在搜索框中输入文字
      const searchInput = page.getByPlaceholder('搜索昵称或邮箱');
      await searchInput.fill('测试');

      // 验证筛选结果文案更新
      await expect(page.getByText(/筛选结果：\d+ 条/)).toBeVisible();
    });

    test('应显示筛选结果计数', async ({ page }) => {
      await page.goto('/admin/users');

      // 验证筛选结果计数
      await expect(page.getByText(/筛选结果：\d+ 条/)).toBeVisible();
    });

    test('点击用户详情按钮应弹出详情弹窗', async ({ page }) => {
      await page.goto('/admin/users');

      // 点击第一个"详情"按钮
      const detailBtn = page.getByRole('button', { name: /详情/ }).first();
      await detailBtn.click();

      // 验证详情弹窗
      await expect(page.getByText('用户详情')).toBeVisible();
      await expect(page.getByText('用户 ID')).toBeVisible();
      await expect(page.getByText('议会数')).toBeVisible();
      await expect(page.getByText('注册时间')).toBeVisible();
      await expect(page.getByText('最后活跃')).toBeVisible();
    });
  });

  // ===== 议会管理页面 =====
  test.describe('议会管理页面', () => {
    test('应正确加载议会管理页面', async ({ page }) => {
      await page.goto('/admin/councils');

      // 验证 URL
      await expect(page).toHaveURL('/admin/councils');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '议会管理' })).toBeVisible();
    });

    test('应显示议会记录统计', async ({ page }) => {
      await page.goto('/admin/councils');

      // 验证议会记录统计文案
      await expect(page.getByText(/共 \d+ 条议会记录/)).toBeVisible();
    });

    test('应显示搜索框', async ({ page }) => {
      await page.goto('/admin/councils');

      // 验证搜索框
      await expect(page.getByPlaceholder('搜索问题')).toBeVisible();
    });

    test('应显示议会类型筛选按钮', async ({ page }) => {
      await page.goto('/admin/councils');

      // 验证类型筛选标签
      await expect(page.getByText('类型：')).toBeVisible();

      // 验证类型筛选按钮
      await expect(page.getByRole('button', { name: '全部' })).toBeVisible();
      await expect(page.getByRole('button', { name: '智慧议会' })).toBeVisible();
      await expect(page.getByRole('button', { name: '未来议会' })).toBeVisible();
    });

    test('应显示时间范围筛选按钮', async ({ page }) => {
      await page.goto('/admin/councils');

      // 验证时间筛选标签
      await expect(page.getByText('时间：')).toBeVisible();

      // 验证时间筛选按钮
      await expect(page.getByRole('button', { name: '近 1 天' })).toBeVisible();
      await expect(page.getByRole('button', { name: '近 7 天' })).toBeVisible();
      await expect(page.getByRole('button', { name: '近 30 天' })).toBeVisible();
    });

    test('应显示议会表格表头', async ({ page }) => {
      await page.goto('/admin/councils');

      // 验证表格表头
      await expect(page.getByText('问题', { exact: true })).toBeVisible();
      await expect(page.getByText('类型', { exact: true })).toBeVisible();
      await expect(page.getByText('参与者', { exact: true })).toBeVisible();
      await expect(page.getByText('冲突值', { exact: true })).toBeVisible();
      await expect(page.getByText('用户', { exact: true })).toBeVisible();
      await expect(page.getByText('时间', { exact: true })).toBeVisible();
    });

    test('点击议会详情按钮应弹出详情弹窗', async ({ page }) => {
      await page.goto('/admin/councils');

      // 点击第一个"详情"按钮
      const detailBtn = page.getByRole('button', { name: /详情/ }).first();
      await detailBtn.click();

      // 验证详情弹窗
      await expect(page.getByText('议会详情')).toBeVisible();
      await expect(page.getByText('议会 ID')).toBeVisible();
      await expect(page.getByText('参与者')).toBeVisible();
    });

    test('点击删除按钮应弹出删除确认弹窗', async ({ page }) => {
      await page.goto('/admin/councils');

      // 点击第一个"删除"按钮
      const deleteBtn = page.getByRole('button', { name: /删除/ }).first();
      await deleteBtn.click();

      // 验证删除确认弹窗
      await expect(page.getByText('确认删除')).toBeVisible();
      await expect(page.getByText(/此操作不可恢复/)).toBeVisible();

      // 验证确认删除与取消按钮
      await expect(page.getByRole('button', { name: '确认删除' })).toBeVisible();
      await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
    });
  });
});
