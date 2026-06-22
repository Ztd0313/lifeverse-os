'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, ArrowLeft, Bell, Search } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * 管理后台布局
 *
 * 结构：
 * - 左侧：固定侧边栏（AdminSidebar）
 * - 顶部：管理员信息栏（汉堡菜单 / 搜索 / 通知 / 返回前台）
 * - 主内容区：children
 *
 * 主题：深色，与前台一致但更简洁（去除毛玻璃、减少金色装饰）
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg">
      {/* 侧边栏 */}
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* 主区域（桌面端留出侧边栏宽度） */}
      <div className="md:pl-60">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-bg-soft/80 px-4 backdrop-blur-md md:px-6">
          {/* 左侧：汉堡菜单（移动端）+ 搜索 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-soft transition-colors hover:bg-bg-card hover:text-text md:hidden"
              aria-label="打开菜单"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-1.5 md:flex">
              <Search className="h-4 w-4 text-text-dim" />
              <input
                type="text"
                placeholder="搜索用户、议会、记忆..."
                className="w-64 bg-transparent text-sm text-text placeholder:text-text-dim focus:outline-none"
              />
            </div>
          </div>

          {/* 右侧：通知 + 管理员信息 + 返回前台 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-soft transition-colors hover:bg-bg-card hover:text-text"
              aria-label="通知"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red" />
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-soft text-sm">
                👨‍💼
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-text">David Kim</p>
                <p className="text-[10px] text-text-dim">技术总监</p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">返回前台</span>
            </Link>
          </div>
        </header>

        {/* 主内容 */}
        <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
