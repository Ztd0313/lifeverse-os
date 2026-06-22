'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  Brain,
  Bot,
  FileText,
  Megaphone,
  CreditCard,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 管理后台侧边栏导航项配置
 */
interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/councils', label: '议会管理', icon: MessagesSquare },
  { href: '/admin/memories', label: '记忆管理', icon: Brain },
  { href: '/admin/agents', label: 'Agent 管理', icon: Bot },
  { href: '/admin/content', label: '内容管理', icon: FileText },
  { href: '/admin/operations', label: '运营管理', icon: Megaphone },
  { href: '/admin/payments', label: '付费管理', icon: CreditCard },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
];

/**
 * 管理后台侧边栏导航组件
 *
 * 特性：
 * - 8 个导航项，对应管理后台 8 个模块
 * - 当前路由高亮（金色边框 + 背景晕染）
 * - 深色主题，与前台一致但更简洁
 * - 响应式：移动端可折叠（由父级控制）
 */
export interface AdminSidebarProps {
  /** 移动端是否展开（可选，桌面端始终展示） */
  mobileOpen?: boolean;
  /** 关闭移动端侧边栏（可选） */
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-bg-soft transition-transform duration-300 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <span className="font-semibold text-xl text-gradient-gold">LifeVerse</span>
          <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[10px] font-medium text-gold">
            ADMIN
          </span>
        </div>

        {/* 导航列表 */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                  active
                    ? 'border border-gold-dim bg-gold-soft/30 text-gold'
                    : 'border border-transparent text-text-soft hover:bg-bg-card hover:text-text'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 底部信息 */}
        <div className="border-t border-border px-6 py-4">
          <p className="text-[11px] leading-relaxed text-text-dim">
            LifeVerse Admin v5.0.0
            <br />
            © 2026 LifeVerse Team
          </p>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
