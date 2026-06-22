'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Sparkles, Globe, ShoppingBag, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

/**
 * 底部导航栏 Tab 项配置
 *
 * 精简为 5 个主要 Tab，提升移动端单手操作体验：
 * 1. 首页 → /
 * 2. 议会 → /council
 * 3. 记忆 → /memory
 * 4. 市场 → /marketplace
 * 5. 我的 → /agents
 */
type BottomTab = {
  href: string;
  icon: LucideIcon;
  labelKey: string;
};

const TABS: readonly BottomTab[] = [
  { href: '/', icon: Home, labelKey: 'nav.bottomHome' },
  { href: '/council', icon: Sparkles, labelKey: 'nav.bottomCouncil' },
  { href: '/memory', icon: Globe, labelKey: 'nav.bottomMemory' },
  { href: '/marketplace', icon: ShoppingBag, labelKey: 'nav.bottomMarket' },
  { href: '/agents', icon: User, labelKey: 'nav.bottomAgent' },
];

/**
 * 移动端底部导航栏
 *
 * 仅在移动端显示（lg:hidden），固定在视口底部。
 * - 毛玻璃背景（glass）+ 顶部边框
 * - 安全区适配（env(safe-area-inset-bottom)）
 * - 当前页面 Tab 高亮（金色文字 + 图标）
 * - 点击 Tab 缩放反馈动画（Framer Motion whileTap）
 * - 当前页面 Tab 图标上方有小圆点指示器
 */
export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  /** 判断 Tab 是否处于活跃状态 */
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label={t('nav.mainNav')}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
        'glass border-t border-border',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                aria-label={t(tab.labelKey)}
                className="flex h-16 flex-col items-center justify-center gap-1"
              >
                <motion.span
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                  className="relative flex h-6 w-6 items-center justify-center"
                >
                  {/* 当前页面指示圆点 */}
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active-dot"
                      className="absolute -top-1.5 h-1 w-1 rounded-full bg-gold"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  )}
                  <Icon
                    size={22}
                    className={cn(
                      'transition-colors',
                      active ? 'text-gold' : 'text-text-soft'
                    )}
                  />
                </motion.span>
                <span
                  className={cn(
                    'text-[11px] leading-none transition-colors',
                    active ? 'text-gold' : 'text-text-soft'
                  )}
                >
                  {t(tab.labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
