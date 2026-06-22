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

export const APP_VERSION = 'v5.5.0';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    'Agent创建支持上传聊天记录截图，AI自动分析人物特征',
    '人物市场新增100位名人大师角色卡',
    '上线记忆回放功能（/memory/replay）',
    '上线梦想档案功能（/dream）— 记录梦想/梦想时间轴/与儿时的自己对话',
    '上线历史模块会议记录详情页（/history/[id]）',
    '历史记录删除增加二次确认弹窗',
    '个人中心拥有Agent卡片支持点击跳转到我的Agent页面',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
