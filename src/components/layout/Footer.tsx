import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { APP_VERSION } from '@/lib/version';

/**
 * Footer 导航链接分组
 */
const FOOTER_LINKS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: '议会',
    links: [
      { href: '/council/wisdom', label: '智慧议会' },
      { href: '/council/future', label: '未来议会' },
      { href: '/council', label: '议会入口' },
    ],
  },
  {
    title: '生命模块',
    links: [
      { href: '/memory', label: '记忆星球' },
      { href: '/inner', label: '内心世界' },
      { href: '/dream', label: '梦想档案' },
      { href: '/reunion', label: '重逢' },
    ],
  },
  {
    title: '系统',
    links: [
      { href: '/history', label: '历史' },
      { href: '/settings', label: '设置' },
    ],
  },
];

/**
 * 全局底部组件
 *
 * 内容：
 * - LifeVerse 品牌名（serif 字体，金色）
 * - Slogan: Every life deserves its own universe.
 * - 导航链接分组（议会 / 生命模块 / 系统）
 * - 版权信息（动态年份）
 *
 * 纯展示组件，无 hooks，可作为服务端组件使用。
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-border bg-bg-soft/60">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* 品牌区 */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Logo size="lg" />
            <p className="mt-2 text-sm text-text-soft">
              Every life deserves its own universe.
            </p>
            <div className="my-3 h-px w-24 bg-gradient-to-r from-transparent via-gold-dim to-transparent" />
            <p className="text-xs text-text-dim">
              生命宇宙 · 和塑造你的人，一起决定未来
            </p>
          </div>

          {/* 导航链接分组 */}
          {FOOTER_LINKS.map((group) => (
            <div
              key={group.title}
              className="flex flex-col items-center md:items-start"
            >
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">
                {group.title}
              </h3>
              <nav aria-label={group.title}>
                <ul className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-text-soft transition-colors hover:text-gold"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* 版权信息 */}
        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-xs text-text-dim">
            © {currentYear} LifeVerse. All rights reserved.
          </p>
          <p className="mt-1 text-xs text-text-dim/60">
            {APP_VERSION} · 生命宇宙操作系统
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
