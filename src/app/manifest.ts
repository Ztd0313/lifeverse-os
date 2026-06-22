import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand/brand-guide';

/**
 * PWA Manifest
 *
 * 定义 LifeVerse 作为渐进式 Web 应用的元信息，
 * 支持添加到主屏幕、离线启动、全屏显示。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LifeVerse',
    short_name: 'LifeVerse',
    description: BRAND.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#060710',
    theme_color: '#c9a84c',
    orientation: 'portrait-primary',
    categories: ['lifestyle', 'productivity', 'health'],
    lang: 'zh-CN',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '智慧议会',
        short_name: '议会',
        description: '召集 7 位智者，多角度审视你的人生选择',
        url: '/council',
      },
      {
        name: '历史',
        short_name: '历史',
        description: '查看所有议会记录与生命时间线',
        url: '/history',
      },
    ],
  };
}
