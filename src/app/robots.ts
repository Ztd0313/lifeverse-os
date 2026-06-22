import type { MetadataRoute } from 'next';

/**
 * robots.txt
 *
 * 控制搜索引擎爬虫的访问规则。
 * Next.js 会自动在 /robots.txt 路由输出此内容。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings'],
    },
    sitemap: 'https://lifeverse.ai/sitemap.xml',
    host: 'https://lifeverse.ai',
  };
}
