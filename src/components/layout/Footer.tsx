'use client';

import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { APP_VERSION } from '@/lib/version';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

/**
 * Footer 导航链接分组配置
 *
 * titleKey / labelKey 对应 i18n 翻译路径
 */
const FOOTER_LINKS: {
  titleKey: string;
  links: { href: string; labelKey: string }[];
}[] = [
  {
    titleKey: 'footer.councils',
    links: [
      { href: '/council/wisdom', labelKey: 'footer.wisdomCouncil' },
      { href: '/council/future', labelKey: 'footer.futureCouncil' },
      { href: '/council', labelKey: 'footer.councilEntry' },
    ],
  },
  {
    titleKey: 'footer.lifeModules',
    links: [
      { href: '/memory', labelKey: 'footer.memoryPlanet' },
      { href: '/inner', labelKey: 'footer.innerWorld' },
      { href: '/dream', labelKey: 'footer.dreamArchive' },
      { href: '/reunion', labelKey: 'footer.reunion' },
    ],
  },
  {
    titleKey: 'footer.system',
    links: [
      { href: '/history', labelKey: 'footer.history' },
      { href: '/settings', labelKey: 'footer.settings' },
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
 * - 语言切换器
 * - 版权信息（动态年份）
 *
 * 使用 i18n 翻译所有可见文本。
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 border-t border-border bg-bg-soft/60">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* 品牌区 */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Logo size="lg" />
            <p className="mt-2 text-sm text-text-soft">
              {t('footer.slogan')}
            </p>
            <div className="my-3 h-px w-24 bg-gradient-to-r from-transparent via-gold-dim to-transparent" />
            <p className="text-xs text-text-dim">
              {t('footer.tagline')}
            </p>
          </div>

          {/* 导航链接分组 */}
          {FOOTER_LINKS.map((group) => (
            <div
              key={group.titleKey}
              className="flex flex-col items-center md:items-start"
            >
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">
                {t(group.titleKey)}
              </h3>
              <nav aria-label={t(group.titleKey)}>
                <ul className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-text-soft transition-colors hover:text-gold"
                      >
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* 语言切换器 */}
        <div className="mt-8 flex justify-center">
          <LanguageSwitcher />
        </div>

        {/* 版权信息 */}
        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-xs text-text-dim">
            © {currentYear} LifeVerse. {t('footer.copyright')}
          </p>
          <p className="mt-1 text-xs text-text-dim/60">
            {APP_VERSION} · {t('footer.systemName')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
