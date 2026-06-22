/**
 * LifeVerse SEO 配置
 *
 * 包含页面标题、描述、关键词、Open Graph、Twitter Card、
 * 以及 JSON-LD 结构化数据，用于搜索引擎优化和社交分享。
 */

import { BRAND } from './brand-guide';

/**
 * SEO 基础配置
 */
export const SEO_CONFIG = {
  /** 页面标题 */
  title: 'LifeVerse — Every life deserves its own universe',
  /** 页面描述 */
  description:
    'LifeVerse 是一个 AI 生命操作系统，帮助人们理解自己、理解过去、理解未来。在重大选择时，与 7 位智者、未来版本的自己和内心人格共同对话，生成命运报告与生命时间线。',
  /** 关键词 */
  keywords: [
    'LifeVerse',
    '生命宇宙',
    'AI 生命操作系统',
    '智慧议会',
    '命运报告',
    '人生决策',
    '内心世界',
    '记忆星球',
    '未来议会',
    '个人成长',
    'AI 对话',
    '生命时间线',
  ],
  /** canonical URL */
  canonical: 'https://lifeverse.ai',
  /** Open Graph 配置 */
  openGraph: {
    title: 'LifeVerse — Every life deserves its own universe',
    description:
      '和塑造你的人，一起决定未来。在重大选择时，与智慧、记忆和未来版本的自己共同对话。',
    url: 'https://lifeverse.ai',
    siteName: 'LifeVerse',
    images: [
      {
        url: 'https://lifeverse.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LifeVerse — Every life deserves its own universe',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  /** Twitter Card 配置 */
  twitter: {
    card: 'summary_large_image',
    title: 'LifeVerse — Every life deserves its own universe',
    description:
      '和塑造你的人，一起决定未来。在重大选择时，与智慧、记忆和未来版本的自己共同对话。',
    creator: '@lifeverse_ai',
    images: ['https://lifeverse.ai/og-image.png'],
  },
  /** JSON-LD 结构化数据 */
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LifeVerse',
    description: BRAND.description,
    url: 'https://lifeverse.ai',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'LifeVerse',
      url: 'https://lifeverse.ai',
      sameAs: [
        'https://twitter.com/lifeverse_ai',
        'https://github.com/lifeverse-ai/lifeverse',
      ],
    },
    featureList: [
      '记忆星球 — 将照片、文字、语音组织成结构化记忆',
      '梦想档案 — 记录儿时梦想，与儿时的自己重逢对话',
      '内心世界 — 6 个内心人格共存，检测冲突与渴望',
      '智慧议会 — 7 位智者多元视角辩论，生成命运报告',
      '未来议会 — 20 岁、50 岁、80 岁的自己同时发言',
      '重逢 — 与已经离开的人重逢，完成未完成的对话',
      '历史 — 生命时间线与生命星图',
    ],
  },
  /** 站点验证码（按需配置） */
  verification: {
    google: '',
    bing: '',
  },
} as const;

/**
 * 生成 JSON-LD 脚本字符串（用于嵌入 <script type="application/ld+json">）
 */
export function getStructuredDataScript(): string {
  return JSON.stringify(SEO_CONFIG.structuredData);
}
