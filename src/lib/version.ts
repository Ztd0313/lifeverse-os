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

export const APP_VERSION = 'v5.2.0';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '修复议会一键使用按钮（替换无效成员ID）',
    '修复召集议会按钮无反馈问题（新增Toast提示）',
    'Header新增用户头像下拉菜单（个人中心入口）',
    '改善登录态保持（Serverless容错+Token自动续期）',
    '新增i18n国际化系统（中文/英文/日语/韩语）',
    'Header/Footer集成语言切换器',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
