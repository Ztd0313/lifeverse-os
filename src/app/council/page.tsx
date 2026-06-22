'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, Users, Clock, Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
import { useAuthStore } from '@/stores/auth-store';

/**
 * 议会入口卡片定义
 */
interface CouncilEntry {
  icon: LucideIcon;
  name: string;
  nameEn: string;
  description: string;
  href: string;
  accent: string;
}

const COUNCIL_ENTRIES: CouncilEntry[] = [
  {
    icon: Users,
    name: '智慧议会',
    nameEn: 'Wisdom Council',
    description: '召集 7 位智者，多元视角辩论，生成命运报告与共识方案',
    href: '/council/wisdom',
    accent: '#c9a84c',
  },
  {
    icon: Clock,
    name: '未来议会',
    nameEn: 'Future Council',
    description: '20 岁、当前、50 岁、80 岁的自己同时发言，推演未来路径',
    href: '/council/future',
    accent: '#5da0e8',
  },
];

/**
 * 卡片入场动画变体（配合 staggerContainer 使用）
 */
const cardItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * 议会枢纽页
 *
 * 作为智慧议会与未来议会的统一入口。
 * 整体深色主题，金色点缀，与首页风格保持一致。
 */
export default function CouncilHubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();

  /** 首次加载时校验登录态 */
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /** 未登录时重定向到登录页 */
  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  // 登录态校验中，显示加载状态
  if (!isInitialized || !isAuthenticated) {
    return (
      <>
        <ParticleBackground />
        <Header />
        <main className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-text-soft">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="text-sm">正在验证登录状态...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* 全屏粒子背景 */}
      <ParticleBackground />

      {/* 全局头部导航 */}
      <Header />

      {/* 主内容 */}
      <main className="relative z-10 min-h-screen px-6 pb-24 pt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-5xl flex-col items-center"
        >
          {/* 返回首页按钮 */}
          <motion.div variants={fadeInUp} className="mb-8 self-start">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Link>
            </Button>
          </motion.div>

          {/* 标题区 */}
          <motion.div variants={fadeInUp} className="mb-4 text-center">
            <span className="inline-flex items-center rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
              命运议会
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="h-display text-5xl text-gradient-gold sm:text-6xl md:text-7xl"
          >
            Councils
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-4 max-w-2xl text-center text-sm leading-relaxed text-text-soft sm:text-base"
          >
            在重大选择时，召集不同的声音与你共同对话。
            <br />
            智者给你视角，未来的你给你时间。
          </motion.p>

          {/* 议会入口卡片 */}
          <motion.div
            variants={staggerContainer}
            className="mt-16 grid w-full grid-cols-1 gap-6 sm:grid-cols-2"
          >
            {COUNCIL_ENTRIES.map((entry) => {
              const Icon = entry.icon;
              return (
                <motion.div key={entry.name} variants={cardItem}>
                  <Card className="group h-full">
                    <Link
                      href={entry.href}
                      className="flex h-full flex-col gap-5"
                    >
                      {/* 图标 */}
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl border bg-gold-soft text-gold transition-all duration-300 group-hover:shadow-[0_0_24px_var(--shadow-gold-strong)]"
                        style={{ borderColor: `${entry.accent}66` }}
                      >
                        <Icon size={28} />
                      </div>

                      {/* 名称 */}
                      <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-semibold text-text">
                          {entry.name}
                        </h2>
                        <span className="text-sm font-medium text-gold">
                          {entry.nameEn}
                        </span>
                      </div>

                      {/* 描述 */}
                      <p className="flex-1 text-sm leading-relaxed text-text-soft">
                        {entry.description}
                      </p>

                      {/* 进入提示 */}
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-dim transition-colors group-hover:text-gold">
                        <span>进入议会</span>
                        <ArrowLeft className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* 底部引用 */}
          <motion.blockquote
            variants={fadeInUp}
            className="mt-20 max-w-2xl text-center"
          >
            <p className="h-title text-2xl leading-relaxed text-text-soft sm:text-3xl">
              &ldquo;每一个重大决定，都值得被多个时间维度的自己审视。&rdquo;
            </p>
          </motion.blockquote>
        </motion.div>
      </main>
    </>
  );
}
