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

export const APP_VERSION = 'v5.4.0';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '智慧议会接入真实AI（DeepSeek）— 议会对话/命运报告/时间线均由AI生成',
    '未来议会接入真实AI — 时间自己发言/雷达图/反思内容由AI生成',
    '移除硬编码API Key（安全修复）',
    '议会API失败时自动降级到Mock数据',
    '新增AI加载状态和isMock提示标签',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
