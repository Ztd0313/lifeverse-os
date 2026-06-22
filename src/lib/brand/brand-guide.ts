/**
 * LifeVerse 品牌指南
 *
 * 统一管理品牌名称、口号、配色、字体、社交媒体等信息。
 * 所有品牌相关内容应从此文件引用，确保一致性。
 */

export const BRAND = {
  /** 品牌名称（中文） */
  name: 'LifeVerse',
  /** 品牌名称（英文） */
  nameEn: 'LifeVerse',
  /** 英文口号 */
  slogan: 'Every life deserves its own universe.',
  /** 中文口号 */
  sloganZh: '每一个生命，都值得拥有自己的宇宙。',
  /** 品牌标语 */
  tagline: '和塑造你的人，一起决定未来。',
  /** 品牌描述 */
  description:
    '帮助人们理解自己、理解过去、理解未来，并在重大选择时与智慧、记忆和未来版本的自己共同对话。',
  /** 品牌配色方案 */
  colors: {
    /** 主色：金色 */
    primary: '#c9a84c',
    /** 背景色：深黑 */
    background: '#060710',
    /** 文字色：暖白 */
    text: '#eae8e3',
    /** 辅助色：金色暗调 */
    goldDim: '#8a7434',
    /** 辅助色：金色柔和 */
    goldSoft: 'rgba(201, 168, 76, 0.08)',
    /** 卡片背景 */
    cardBg: '#0d0f1a',
    /** 边框色 */
    border: 'rgba(201, 168, 76, 0.15)',
    /** 冲突红 */
    conflict: '#e85d5d',
    /** 成长绿 */
    growth: '#5de8a0',
    /** 自由蓝 */
    freedom: '#5da0e8',
    /** 稳定橙 */
    stability: '#e8a05d',
  },
  /** 品牌字体 */
  fonts: {
    /** 衬线字体（标题、引用） */
    serif: 'Instrument Serif',
    /** 无衬线字体（正文、UI） */
    sans: 'Work Sans',
  },
  /** 社交媒体 */
  social: {
    twitter: '@lifeverse_ai',
    github: 'lifeverse-ai/lifeverse',
    website: 'https://lifeverse.ai',
  },
  /** 品牌域名 */
  domain: 'lifeverse.ai',
  /** 品牌版本 */
  version: '5.0.0',
} as const;

/**
 * 品牌配色方案类型
 */
export type BrandColors = typeof BRAND.colors;

/**
 * 品牌字体类型
 */
export type BrandFonts = typeof BRAND.fonts;
