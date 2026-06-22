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
import { useTranslation } from '@/lib/i18n';

/**
 * 议会入口卡片定义
 *
 * nameKey / nameEnKey / descKey 对应 i18n 翻译路径
 */
interface CouncilEntry {
  icon: LucideIcon;
  nameKey: string;
  nameEnKey: string;
  descKey: string;
  href: string;
  accent: string;
}

const COUNCIL_ENTRIES: CouncilEntry[] = [
  {
    icon: Users,
    nameKey: 'council.wisdomCouncil',
    nameEnKey: 'home.modules.wisdomCouncil.nameEn',
    descKey: 'home.modules.wisdomCouncil.description',
    href: '/council/wisdom',
    accent: '#c9a84c',
  },
  {
    icon: Clock,
    nameKey: 'council.futureCouncil',
    nameEnKey: 'home.modules.futureCouncil.nameEn',
    descKey: 'home.modules.futureCouncil.description',
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
  const { t } = useTranslation();

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
            <p className="text-sm">{t('council.verifying')}</p>
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
                {t('council.backHome')}
              </Link>
            </Button>
          </motion.div>

          {/* 标题区 */}
          <motion.div variants={fadeInUp} className="mb-4 text-center">
            <span className="inline-flex items-center rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
              {t('council.destinyCouncil')}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="h-display text-5xl text-gradient-gold sm:text-6xl md:text-7xl"
          >
            {t('council.title')}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-4 max-w-2xl text-center text-sm leading-relaxed text-text-soft sm:text-base"
          >
            {t('council.description')}
            <br />
            {t('council.description2')}
          </motion.p>

          {/* 议会入口卡片 */}
          <motion.div
            variants={staggerContainer}
            className="mt-16 grid w-full grid-cols-1 gap-6 sm:grid-cols-2"
          >
            {COUNCIL_ENTRIES.map((entry) => {
              const Icon = entry.icon;
              return (
                <motion.div key={entry.nameKey} variants={cardItem}>
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
                          {t(entry.nameKey)}
                        </h2>
                        <span className="text-sm font-medium text-gold">
                          {t(entry.nameEnKey)}
                        </span>
                      </div>

                      {/* 描述 */}
                      <p className="flex-1 text-sm leading-relaxed text-text-soft">
                        {t(entry.descKey)}
                      </p>

                      {/* 进入提示 */}
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-dim transition-colors group-hover:text-gold">
                        <span>{t('council.enterCouncil')}</span>
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
              {t('council.quote')}
            </p>
          </motion.blockquote>
        </motion.div>
      </main>
    </>
  );
}
