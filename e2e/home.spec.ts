import { test, expect } from '@playwright/test';

/**
 * 首页 E2E 测试
 *
 * 测试内容：
 * - 首页加载
 * - 标题显示 "LifeVerse"
 * - 7 大模块卡片显示
 * - 导航到议会页面
 */

test.describe('首页', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage，避免议会状态残留
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('应正确加载首页', async ({ page }) => {
    // 验证页面无错误地加载
    await expect(page).toHaveURL('/');

    // 验证页面标题包含 LifeVerse
    const title = await page.title();
    expect(title).toContain('LifeVerse');
  });

  test('应显示 "LifeVerse" 大标题', async ({ page }) => {
    // 首页 Hero 区域有一个 h1 包含 "LifeVerse"
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text).toContain('LifeVerse');
  });

  test('应显示英文副标题 "Every life deserves its own universe."', async ({
    page,
  }) => {
    // 验证英文 slogan 可见
    await expect(page.getByText('Every life deserves its own universe.')).toBeVisible();
  });

  test('应显示 7 大模块卡片', async ({ page }) => {
    // 滚动到模块区域
    await page.locator('#modules').scrollIntoViewIfNeeded();

    // 七大模块名称
    const moduleNames = [
      '记忆星球',
      '梦想档案',
      '内心世界',
      '智慧议会',
      '未来议会',
      '重逢',
      '历史',
    ];

    for (const name of moduleNames) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test('每个模块卡片应包含描述文字', async ({ page }) => {
    await page.locator('#modules').scrollIntoViewIfNeeded();

    // 验证模块卡片区域有描述性文字
    await expect(page.getByText('将照片、文字、语音组织成结构化记忆与人生地图').first()).toBeVisible();
  });

  test('应显示 "开始命运议会" 按钮', async ({ page }) => {
    // Hero 区域的 CTA 按钮
    await expect(page.getByRole('link', { name: '开始命运议会' })).toBeVisible();
  });

  test('点击 "开始命运议会" 应导航到议会页面', async ({ page }) => {
    // 点击 CTA 按钮
    const councilLink = page.getByRole('link', { name: '开始命运议会' });
    await councilLink.click();

    // 验证 URL 包含 council
    await expect(page).toHaveURL(/council/);
  });

  test('应显示底部引用块 "每一个生命，都值得拥有自己的宇宙"', async ({
    page,
  }) => {
    // 滚动到底部
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await expect(
      page.getByText('每一个生命，都值得拥有自己的宇宙。')
    ).toBeVisible();
  });

  test('Header 导航应包含 "智慧议会" 链接', async ({ page }) => {
    // Header 中的导航链接
    const navLink = page.locator('nav a', { hasText: '智慧议会' });
    await expect(navLink).toBeVisible();
  });
});
