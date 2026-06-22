/**
 * LifeVerse 版本配置
 *
 * 集中管理版本号，便于追踪迭代进度。
 * 每次发布新版本时更新此文件。
 *
 * 版本号规则：主版本.次版本.修订号
 * - 主版本：重大架构变更或里程碑
 * - 次版本：新功能开发
 * - 修订号：Bug 修复和小优化
 */

export const APP_VERSION = 'v5.1.0';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '线上测试验证码登录',
    '版本号显示系统',
    'Next.js 15.2.3 安全升级',
    'Suspense 边界修复',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
