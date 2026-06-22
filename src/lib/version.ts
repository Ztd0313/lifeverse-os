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

export const APP_VERSION = 'v5.3.0';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '移动端全站响应式适配',
    '新增viewport meta标签（修复移动端缩放问题）',
    'MeetingRoom环形布局动态自适应屏幕尺寸',
    'AgentCard卡片宽度响应式改造',
    'Header移动端优化（右侧元素移入抽屉、safe-area适配、触摸目标增大）',
    '历史页接入全局Header导航',
    '首页Hero标题移动端自适应',
    '对话页header添加flex-wrap防溢出',
    '全局文字最小11px、触摸目标最小36px',
    '设置页/个人中心/议会页触摸目标优化',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
