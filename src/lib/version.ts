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

export const APP_VERSION = 'v5.4.1';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '修复重逢对话时间标签翻译键值裸露问题（past-10/past-5/future-5/future-10）',
    '修复AI回复语言与界面语言不匹配问题（全链路locale传递+语言指令）',
    '所有AI API路由追加语言控制指令（zh/en/ja/ko）',
    'langgraph-engine 6个节点均追加语言指令',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
