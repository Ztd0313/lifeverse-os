'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Menu, X, Crown, User as UserIcon, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { useMembershipStore } from '@/stores/membership-store';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { MembershipBadge } from '@/components/membership/MembershipBadge';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

/**
 * 导航链接配置
 *
 * 顶层导航（7 项）：首页、命运议会、对话▾、档案▾、市场、我的 Agent、历史
 * - 直链项（direct）：直接跳转
 * - 下拉组（dropdown）：桌面端 hover 展开，移动端抽屉展开为缩进子项
 *
 * labelKey 对应 i18n 翻译路径
 */

/** 直链导航项 */
type NavLinkItem = {
  type: 'direct';
  href: string;
  labelKey: string;
};

/** 下拉分组导航项 */
type NavDropdownItem = {
  type: 'dropdown';
  labelKey: string;
  items: { href: string; labelKey: string }[];
};

type NavItem = NavLinkItem | NavDropdownItem;

const NAV_ITEMS: readonly NavItem[] = [
  { type: 'direct', href: '/', labelKey: 'nav.home' },
  { type: 'direct', href: '/council', labelKey: 'nav.council' },
  {
    type: 'dropdown',
    labelKey: 'nav.navDialogue',
    items: [
      { href: '/inner-dialogue', labelKey: 'nav.innerDialogue' },
      { href: '/reunion-dialogue', labelKey: 'nav.reunionDialogue' },
    ],
  },
  {
    type: 'dropdown',
    labelKey: 'nav.navArchive',
    items: [
      { href: '/memory', labelKey: 'nav.memoryPlanet' },
      { href: '/dream', labelKey: 'nav.dreamArchive' },
    ],
  },
  { type: 'direct', href: '/marketplace', labelKey: 'nav.marketplace' },
  { type: 'direct', href: '/agents', labelKey: 'nav.myAgent' },
  { type: 'direct', href: '/history', labelKey: 'nav.history' },
];

/**
 * 全局头部导航组件
 *
 * 布局：
 * - 左侧：LifeVerse logo（serif 字体，金色）
 * - 中间：导航链接（首页 / 命运议会 / 对话▾ / 档案▾ / 市场 / 我的 Agent / 历史）
 * - 右侧：会员链接 + 会员标识 + 设置按钮 + 用户头像下拉菜单 + 移动端汉堡菜单按钮
 *
 * 特性：
 * - 毛玻璃效果（glass）
 * - 固定顶部（fixed top-0）
 * - 滚动时增加背景不透明度
 * - 响应式：移动端隐藏导航链接，通过汉堡菜单展开侧边抽屉
 * - 当前路由高亮
 * - 用户头像下拉菜单：个人中心、设置、退出登录（Framer Motion 动画）
 * - 未登录时显示"登录"按钮
 * - 无障碍：ARIA 标签、键盘导航支持
 */
export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const pathname = usePathname();
  const { membership } = useMembershipStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 路由切换时关闭移动端菜单和用户菜单
  React.useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setOpenDropdown(null);
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

  // 点击用户菜单外部时关闭
  React.useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

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

  /** 判断下拉分组是否处于活跃状态（组内任一子项匹配当前路径） */
  const isDropdownActive = (items: { href: string }[]): boolean =>
    items.some((item) => isActive(item.href));

  /** 桌面端下拉：鼠标移入展开 */
  const handleDropdownEnter = (key: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setOpenDropdown(key);
  };

  /** 桌面端下拉：鼠标移出延迟关闭（避免经过触发器与面板间隙时误关） */
  const handleDropdownLeave = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  /** 处理退出登录 */
  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          'glass border-b border-border pt-[env(safe-area-inset-top)]',
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
            aria-label={t('nav.homePage')}
          >
            <Logo size="md" />
          </Link>

          {/* 中间：桌面端导航链接 */}
          <nav
            className="hidden items-center gap-6 lg:flex"
            aria-label={t('nav.mainNav')}
          >
            {NAV_ITEMS.map((item) => {
              if (item.type === 'direct') {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'text-sm transition-colors hover:text-gold',
                      active ? 'text-gold' : 'text-text-soft'
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              }

              const groupActive = isDropdownActive(item.items);
              const isOpen = openDropdown === item.labelKey;

              return (
                <div
                  key={item.labelKey}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(item.labelKey)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    className={cn(
                      'flex items-center gap-1 text-sm transition-colors hover:text-gold',
                      groupActive ? 'text-gold' : 'text-text-soft'
                    )}
                  >
                    {t(item.labelKey)}
                    <ChevronDown
                      size={14}
                      className={cn(
                        'transition-transform',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-bg-soft shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                        role="menu"
                      >
                        <nav className="py-1">
                          {item.items.map((sub) => {
                            const subActive = isActive(sub.href);
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setOpenDropdown(null)}
                                aria-current={subActive ? 'page' : undefined}
                                className={cn(
                                  'flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-bg-card',
                                  subActive
                                    ? 'text-gold'
                                    : 'text-text-soft hover:text-gold'
                                )}
                                role="menuitem"
                              >
                                {t(sub.labelKey)}
                              </Link>
                            );
                          })}
                        </nav>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* 右侧：会员链接 + 会员标识 + 设置按钮 + 语言切换器 + 用户头像下拉菜单 + 移动端汉堡菜单 */}
          <div className="flex items-center gap-2">
            {/* 会员导航链接（桌面端） */}
            <Link
              href="/membership"
              className={cn(
                'hidden text-sm transition-colors hover:text-gold interactive lg:inline-block',
                pathname === '/membership' ? 'text-gold' : 'text-text-soft'
              )}
            >
              {t('nav.membership')}
            </Link>

            {/* 会员标识（仅登录用户显示，桌面端） */}
            {isAuthenticated && (
              <>
                <MembershipBadge tier={membership.tier} size="sm" className="hidden lg:inline-flex" />
                {membership.tier === 'free' && (
                  <Link
                    href="/membership"
                    aria-label={t('nav.upgrade')}
                    className="interactive hidden items-center gap-1 rounded-full border border-gold-dim bg-gold-soft/30 px-2.5 py-1 text-xs text-gold transition-all hover:bg-gold-soft/50 lg:inline-flex"
                  >
                    <Crown size={12} />
                    {t('nav.upgrade')}
                  </Link>
                )}
              </>
            )}

            <Link
              href="/settings"
              aria-label={t('nav.settings')}
              aria-current={isActive('/settings') ? 'page' : undefined}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-bg-card lg:h-9 lg:w-9',
                isActive('/settings') ? 'text-gold' : 'text-text-soft hover:text-gold'
              )}
            >
              <Settings size={18} />
            </Link>

            {/* 主题切换按钮：深色主题显示太阳（点击切到浅色），浅色主题显示月亮（点击切到深色） */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t('nav.themeToggle')}
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-soft transition-all hover:bg-bg-card hover:text-gold lg:h-9 lg:w-9"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* 语言切换器 */}
            <LanguageSwitcher />

            {/* 用户头像下拉菜单 / 登录按钮（桌面端） */}
            {isAuthenticated && user ? (
              <div className="relative hidden lg:block" ref={userMenuRef}>
                {/* 触发器：头像 + 昵称 */}
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-all hover:bg-bg-card"
                  aria-label={t('nav.userMenu')}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="h-8 w-8 rounded-full border border-gold-dim/40 object-cover"
                  />
                  <span className="hidden max-w-[80px] truncate text-sm text-text-soft xl:inline-block">
                    {user.nickname}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'hidden text-text-dim transition-transform xl:block',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* 下拉菜单 */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-bg-soft shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                      role="menu"
                    >
                      {/* 用户信息头部 */}
                      <div className="border-b border-border px-4 py-3">
                        <p className="truncate text-sm font-medium text-text">
                          {user.nickname}
                        </p>
                        {user.phone && (
                          <p className="truncate text-xs text-text-dim">
                            {user.phone}
                          </p>
                        )}
                      </div>

                      {/* 菜单项 */}
                      <nav className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-bg-card',
                            isActive('/profile')
                              ? 'text-gold'
                              : 'text-text-soft hover:text-gold'
                          )}
                          role="menuitem"
                        >
                          <UserIcon size={16} />
                          {t('nav.profile')}
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-bg-card',
                            isActive('/settings')
                              ? 'text-gold'
                              : 'text-text-soft hover:text-gold'
                          )}
                          role="menuitem"
                        >
                          <Settings size={16} />
                          {t('nav.settings')}
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text-soft transition-colors hover:bg-bg-card hover:text-red"
                          role="menuitem"
                        >
                          <LogOut size={16} />
                          {t('nav.logout')}
                        </button>
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden rounded-full border border-gold-dim bg-gold-soft/30 px-4 py-1.5 text-sm text-gold transition-all hover:bg-gold-soft/50 interactive lg:inline-block"
              >
                {t('nav.login')}
              </Link>
            )}

            {/* 移动端汉堡菜单按钮 */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('common.openMenu')}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-soft transition-all hover:bg-bg-card hover:text-gold lg:hidden"
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
              className="fixed right-0 top-0 z-[70] flex h-[100dvh] w-72 max-w-[85vw] flex-col border-l border-border bg-bg-soft pt-[env(safe-area-inset-top)] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.mobileNavMenu')}
            >
              {/* 抽屉头部 */}
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('common.closeMenu')}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-gold"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 导航链接 */}
              <nav
                className="flex-1 space-y-1 overflow-y-auto px-4 py-6"
                aria-label={t('nav.mainNav')}
              >
                {NAV_ITEMS.map((item) => {
                  if (item.type === 'direct') {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center rounded-lg px-4 py-3 text-sm transition-all',
                          active
                            ? 'border border-gold-dim bg-gold-soft/30 text-gold'
                            : 'border border-transparent text-text-soft hover:bg-bg-card hover:text-text'
                        )}
                      >
                        {t(item.labelKey)}
                      </Link>
                    );
                  }

                  // 下拉分组：移动端展开为带缩进的子项列表（不用 hover）
                  return (
                    <div key={item.labelKey} className="space-y-1">
                      <p className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-text-dim">
                        {t(item.labelKey)}
                      </p>
                      {item.items.map((sub) => {
                        const active = isActive(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex items-center rounded-lg py-2.5 pl-8 pr-4 text-sm transition-all',
                              active
                                ? 'border border-gold-dim bg-gold-soft/30 text-gold'
                                : 'border border-transparent text-text-soft hover:bg-bg-card hover:text-text'
                            )}
                          >
                            {t(sub.labelKey)}
                          </Link>
                        );
                      })}
                    </div>
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
                  {t('nav.membership')}
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
                  {t('nav.settings')}
                </Link>

                {/* 个人中心链接（移动端单独列出，仅登录用户） */}
                {isAuthenticated && (
                  <Link
                    href="/profile"
                    aria-current={isActive('/profile') ? 'page' : undefined}
                    className={cn(
                      'flex items-center rounded-lg px-4 py-3 text-sm transition-all',
                      isActive('/profile')
                        ? 'border border-gold-dim bg-gold-soft/30 text-gold'
                        : 'border border-transparent text-text-soft hover:bg-bg-card hover:text-text'
                    )}
                  >
                    {t('nav.profile')}
                  </Link>
                )}
              </nav>

              {/* 用户区域（移动端） */}
              <div className="border-t border-border px-4 py-4">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-3 px-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.avatar}
                        alt={user.nickname}
                        className="h-10 w-10 rounded-full border border-gold-dim/40 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">
                          {user.nickname}
                        </p>
                        {user.phone && (
                          <p className="truncate text-xs text-text-dim">
                            {user.phone}
                          </p>
                        )}
                      </div>
                      {/* 会员标识（移动端抽屉） */}
                      <MembershipBadge tier={membership.tier} size="sm" />
                    </div>
                    {/* 升级链接（仅 free 用户，移动端抽屉） */}
                    {membership.tier === 'free' && (
                      <Link
                        href="/membership"
                        aria-label={t('nav.upgrade')}
                        className="interactive flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold-dim bg-gold-soft/30 px-4 py-2.5 text-sm text-gold transition-all hover:bg-gold-soft/50"
                      >
                        <Crown size={14} />
                        {t('nav.upgrade')}
                      </Link>
                    )}
                    {/* 退出登录 */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm text-text-soft transition-all hover:bg-bg-card hover:text-red"
                    >
                      <LogOut size={16} />
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold-dim bg-gold-soft/30 px-4 py-3 text-sm text-gold transition-all hover:bg-gold-soft/50"
                  >
                    <UserIcon size={16} />
                    {t('auth.loginRegister')}
                  </Link>
                )}
              </div>

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
