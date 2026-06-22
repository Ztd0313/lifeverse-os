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

export const APP_VERSION = 'v6.0.0';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: '2026-06-23',
  codename: 'Life OS',
  changes: [
    '设计 Token 系统升级：新增深空蓝+生命紫+星耀金三大品牌色系',
    '字体层级/间距/圆角 Token 规范化，TailwindCSS 配置同步扩展',
    'Header 新增主题快捷切换按钮（太阳/月亮图标），切换时 400ms 平滑过渡',
    '品牌动效系统上线：宇宙穿越页面切换（template.tsx + AnimatePresence）',
    '动效变体库扩展 7 个品牌变体：cosmicEntry、planetaryOrbit、galaxyConvergence 等',
    '新增 ReunionHalo 重逢光晕渐入组件与 OrbitalIcon 行星轨道图标组件',
    'MemoryCard 增加 3D 翻转 hover 效果（rotateY/rotateX + preserve-3d）',
    '移动端底部导航栏（BottomNav）上线：5 Tab + 安全区适配 + 触摸反馈',
    '触摸交互优化：hover 降级为 active、44px 最小触摸目标、粒子背景性能调优',
    '新增 useMediaQuery/useIsMobile 响应式 Hook',
    '议会对话流可视化上线：流式展示/分歧光谱/共识聚拢三种模式',
    '情感色彩编码系统：positive/negative/passionate/contemplative 四色编码',
    '新增共识度仪表盘和情感分布指示器组件',
    '3D 生命星图上线（React Three Fiber）：可旋转星空 + 生命记忆星点 + 脉冲动画 + 星际连线',
    '交互式五维雷达图增强：hover tooltip、点击展开、多数据集对比动画',
    '新增动态仪表盘组件（Dashboard）含指标卡片+迷你趋势线+大趋势线图',
    '新增独立趋势线组件（TrendLine）支持多线+渐变填充+hover 十字线',
  ],
};

export function getVersionString(): string {
  return APP_VERSION;
}

export function getFullVersionInfo(): string {
  return `${APP_VERSION} (${VERSION_INFO.buildDate})`;
}
