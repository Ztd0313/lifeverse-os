import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 *
 * - 测试目录：./e2e
 * - 并行执行
 * - 基础 URL：http://localhost:3000
 * - 浏览器：Chromium（桌面版 Chrome）
 * - 自动启动 Next.js dev server（如未运行）
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120_000, // 议会流程包含动画延迟，需要较长超时
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
