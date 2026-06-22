import type { MetadataRoute } from 'next';

/**
 * 站点地图
 *
 * 向搜索引擎声明所有可索引页面及其优先级。
 * Next.js 会自动在 /sitemap.xml 路由输出此内容。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lifeverse.ai';
  const lastModified = new Date();

  return [
    { url: `${baseUrl}`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/council`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/council/wisdom`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/council/future`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/marketplace`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/memory`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/inner`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/dream`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/reunion`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/history`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/settings`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
