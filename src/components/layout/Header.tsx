'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Menu, X, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { useMembershipStore } from '@/stores/membership-store';
import { useAuthStore } from '@/stores/auth-store';
import { MembershipBadge } from '@/components/membership/MembershipBadge';

/**
 * 导航链接配置
 *
 * 完整导航：首页、智慧议会、未来议会、记忆星球、市场、内心对话、
 * 重逢对话、我的 Agent、历史
 * （移动端通过汉堡菜单展开）
 */
const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/council/wisdom', label: '智慧议会' },
  { href: '/council/future', label: '未来议会' },
  { href: '/memory', label: '记忆星球' },
  { href: '/marketplace', label: '市场' },
  { href: '/inner-dialogue', label: '内心对话' },
  { href: '/reunion-dialogue', label: '重逢对话' },
  { href: '/agents', label: '我的 Agent' },
  { href: '/history', label: '历史' },
] as const;

/**
 * 全局头部导航组件
 *
 * 布局：
 * - 左侧：LifeVerse logo（serif 字体，金色）
 * - 中间：导航链接（首页 / 智慧议会 / 未来议会 / 记忆星球 / 市场 / 内心对话 / 重逢对话 / 我的 Agent / 历史）
 * - 右侧：设置按钮 + 移动端汉堡菜单按钮
 *
 * 特性：
 * - 毛玻璃效果（glass）
 * - 固定顶部（fixed top-0）
 * - 滚动时增加背景不透明度
 * - 响应式：移动端隐藏导航链接，通过汉堡菜单展开侧边抽屉
 * - 当前路由高亮
 * - 无障碍：ARIA 标签、键盘导航支持
 */
export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const { membership } = useMembershipStore();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 路由切换时关闭移动端菜单
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ESC 键关闭移动端菜单
  React.useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // 锁定背景滚动
  React.useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  /** 判断链接是否处于活跃状态 */
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          'glass border-b border-border',
          scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.15)]' : ''
        )}
        style={{
          backgroundColor: scrolled ? 'var(--header-bg-scrolled)' : 'var(--header-bg)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* 左侧：Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 transition-opacity group-hover:opacity-80"
            aria-label="LifeVerse 首页"
          >
            <Logo size="md" />
          </Link>

          {/* 中间：桌面端导航链接 */}
          <nav
            className="hidden items-center gap-6 lg:flex"
            aria-label="主导航"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'text-sm transition-colors hover:text-gold',
                  isActive(link.href)
                    ? 'text-gold'
                    : 'text-text-soft'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 右侧：会员链接 + 会员标识 + 设置按钮 + 移动端汉堡菜单 */}
          <div className="flex items-center gap-2">
            {/* 会员导航链接（桌面端） */}
            <Link
              href="/membership"
              className={cn(
                'hidden text-sm transition-colors hover:text-gold interactive lg:inline-block',
                pathname === '/membership' ? 'text-gold' : 'text-text-soft'
              )}
            >
              会员
            </Link>

            {/* 会员标识（仅登录用户显示） */}
            {isAuthenticated && (
              <>
                <MembershipBadge tier={membership.tier} size="sm" />
                {membership.tier === 'free' && (
                  <Link
                    href="/membership"
                    aria-label="升级会员"
                    className="interactive inline-flex items-center gap-1 rounded-full border border-gold-dim bg-gold-soft/30 px-2.5 py-1 text-xs text-gold transition-all hover:bg-gold-soft/50"
                  >
                    <Crown size={12} />
                    升级
                  </Link>
                )}
              </>
            )}

            <Link
              href="/settings"
              aria-label="设置"
              aria-current={isActive('/settings') ? 'page' : undefined}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-bg-card',
                isActive('/settings') ? 'text-gold' : 'text-text-soft hover:text-gold'
              )}
            >
              <Settings size={18} />
            </Link>

            {/* 移动端汉堡菜单按钮 */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-all hover:bg-bg-card hover:text-gold lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* 移动端导航抽屉 */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              key="mobile-nav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />

            {/* 抽屉 */}
            <motion.aside
              key="mobile-nav-drawer"
              id="mobile-nav-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 z-[70] flex h-screen w-72 max-w-[85vw] flex-col border-l border-border bg-bg-soft lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="移动端导航菜单"
            >
              {/* 抽屉头部 */}
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="关闭菜单"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-gold"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 导航链接 */}
              <nav
                className="flex-1 space-y-1 overflow-y-auto px-4 py-6"
                aria-label="移动端导航"
              >
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center rounded-lg px-4 py-3 text-sm transition-all',
                        active
                          ? 'border border-gold-dim bg-gold-soft/30 text-gold'
                          : 'border border-transparent text-text-soft hover:bg-bg-card hover:text-text'
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {/* 会员链接（移动端单独列出） */}
                <Link
                  href="/membership"
                  aria-current={isActive('/membership') ? 'page' : undefined}
                  className={cn(
                    'flex items-center rounded-lg px-4 py-3 text-sm transition-all interactive',
                    isActive('/membership')
                      ? 'border border-gold-dim bg-gold-soft/30 text-gold'
                      : 'border border-transparent text-text-soft hover:bg-bg-card hover:text-text'
                  )}
                >
                  会员
                </Link>

                {/* 设置链接（移动端单独列出） */}
                <Link
                  href="/settings"
                  aria-current={isActive('/settings') ? 'page' : undefined}
                  className={cn(
                    'flex items-center rounded-lg px-4 py-3 text-sm transition-all',
                    isActive('/settings')
                      ? 'border border-gold-dim bg-gold-soft/30 text-gold'
                      : 'border border-transparent text-text-soft hover:bg-bg-card hover:text-text'
                  )}
                >
                  设置
                </Link>
              </nav>

              {/* 底部信息 */}
              <div className="border-t border-border px-6 py-4">
                <p className="text-xs text-text-dim">
                  Every life deserves its own universe.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Header;
