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

export const APP_VERSION = 'v5.6.0';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '顶部导航栏重构：合并智慧议会与未来议会为「命运议会」入口',
    '导航精简为 7 个顶层项，新增「对话」「档案」下拉分组菜单',
    '下拉菜单支持 hover 展开与 Framer Motion 动画，移动端抽屉展开为缩进子项',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
