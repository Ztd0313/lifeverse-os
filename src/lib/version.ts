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

export const APP_VERSION = 'v5.5.1';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '人物市场所有角色均支持试听预览（无需购买/会员即可查看卡片内容）',
    '试听弹窗内保留语音朗读功能（会员可用）',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
