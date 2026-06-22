'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  Globe,
  Sparkles,
  Brain,
  Users,
  Clock,
  HeartHandshake,
  History,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';

/**
 * 七大模块定义
 *
 * nameKey / nameEnKey / descKey 对应 i18n 翻译路径
 */
interface ModuleItem {
  icon: LucideIcon;
  nameKey: string;
  nameEnKey: string;
  descKey: string;
  href: string;
}

const MODULES: ModuleItem[] = [
  {
    icon: Globe,
    nameKey: 'home.modules.memoryPlanet.name',
    nameEnKey: 'home.modules.memoryPlanet.nameEn',
    descKey: 'home.modules.memoryPlanet.description',
    href: '/memory',
  },
  {
    icon: Sparkles,
    nameKey: 'home.modules.dreamArchive.name',
    nameEnKey: 'home.modules.dreamArchive.nameEn',
    descKey: 'home.modules.dreamArchive.description',
    href: '/dream',
  },
  {
    icon: Brain,
    nameKey: 'home.modules.innerWorld.name',
    nameEnKey: 'home.modules.innerWorld.nameEn',
    descKey: 'home.modules.innerWorld.description',
    href: '/inner',
  },
  {
    icon: Users,
    nameKey: 'home.modules.wisdomCouncil.name',
    nameEnKey: 'home.modules.wisdomCouncil.nameEn',
    descKey: 'home.modules.wisdomCouncil.description',
    href: '/council/wisdom',
  },
  {
    icon: Clock,
    nameKey: 'home.modules.futureCouncil.name',
    nameEnKey: 'home.modules.futureCouncil.nameEn',
    descKey: 'home.modules.futureCouncil.description',
    href: '/council/future',
  },
  {
    icon: HeartHandshake,
    nameKey: 'home.modules.reunion.name',
    nameEnKey: 'home.modules.reunion.nameEn',
    descKey: 'home.modules.reunion.description',
    href: '/reunion',
  },
  {
    icon: History,
    nameKey: 'home.modules.history.name',
    nameEnKey: 'home.modules.history.nameEn',
    descKey: 'home.modules.history.description',
    href: '/history',
  },
];

/**
 * Framer Motion 动画变体
 */
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * 首页客户端内容组件
 *
 * 包含：
 * - Hero 区域（大标题、副标题、描述、按钮）
 * - 七大模块卡片区域（grid 布局）
 * - 底部引用块
 *
 * 使用 Framer Motion 做入场动画（fadeIn + slideUp）。
 */
export function HomeContent() {
  const { t } = useTranslation();

  return (
    <main className="relative z-10">
      {/* ===== Hero 区域 ===== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 pt-16 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6"
        >
          {/* 顶部小标签 */}
          <motion.div variants={fadeInUp}>
            <span className="interactive inline-flex items-center rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
              {t('home.badge')}
            </span>
          </motion.div>

          {/* 大标题 */}
          <motion.h1
            variants={fadeInUp}
            className="h-display text-4xl leading-tight sm:text-6xl lg:text-[80px] lg:leading-none text-gradient-gold"
          >
            {t('home.title')}
          </motion.h1>

          {/* 英文副标题 */}
          <motion.p
            variants={fadeInUp}
            className="h-subtitle text-xl text-text-soft sm:text-2xl"
          >
            {t('home.subtitleEn')}
          </motion.p>

          {/* 中文副标题 */}
          <motion.p
            variants={fadeInUp}
            className="text-lg text-text sm:text-xl"
          >
            {t('home.subtitleZh')}
          </motion.p>

          {/* 描述文字 */}
          <motion.p
            variants={fadeInUp}
            className="max-w-2xl text-sm leading-relaxed text-text-soft sm:text-base"
          >
            {t('home.description')}
          </motion.p>

          {/* 按钮组 */}
          <motion.div
            variants={fadeInUp}
            className="mt-4 flex flex-col gap-4 sm:flex-row"
          >
            <Button asChild variant="gold" size="lg">
              <Link href="/council" aria-label={t('home.startButton')}>
                {t('home.startButton')}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#modules" aria-label={t('home.learnMore')}>
                {t('home.learnMore')}
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== 七大模块卡片区域 ===== */}
      <section
        id="modules"
        className="mx-auto max-w-7xl px-6 py-24"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.h2
            variants={fadeInUp}
            className="h-title text-4xl text-gradient-gold sm:text-5xl"
          >
            {t('home.modulesTitle')}
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="max-w-2xl text-center text-sm text-text-soft sm:text-base"
          >
            {t('home.modulesDescription')}
          </motion.p>
        </motion.div>

        {/* 卡片网格 */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <motion.div key={module.nameKey} variants={cardItem}>
                <Card className="group h-full card-hover hover-lift">
                  <Link
                    href={module.href}
                    className="flex h-full flex-col gap-4"
                  >
                    {/* 图标 */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-dim bg-gold-soft text-gold transition-all duration-300 group-hover:shadow-[0_0_20px_var(--shadow-gold)]">
                      <Icon size={24} />
                    </div>

                    {/* 名称 */}
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold text-text">
                        {t(module.nameKey)}
                      </h3>
                      <span className="text-sm font-medium text-gold">
                        {t(module.nameEnKey)}
                      </span>
                    </div>

                    {/* 描述 */}
                    <p className="flex-1 text-sm leading-relaxed text-text-soft">
                      {t(module.descKey)}
                    </p>
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ===== 人物市场入口卡片 ===== */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <Card className="group relative overflow-hidden border-gold-dim bg-gradient-to-br from-bg-card to-bg-soft card-hover">
            <Link
              href="/marketplace"
              className="flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-left"
            >
              {/* 图标 */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold bg-gold-soft text-gold transition-all duration-300 group-hover:shadow-[0_0_32px_var(--shadow-gold-strong)]">
                <ShoppingBag size={28} />
              </div>

              {/* 内容 */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold text-text">
                    {t('home.marketplaceCard.title')}
                  </h3>
                  <span className="text-sm font-medium text-gold">
                    {t('home.marketplaceCard.nameEn')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-text-soft">
                  {t('home.marketplaceCard.description')}
                </p>
              </div>

              {/* 箭头指示 */}
              <div className="shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-2">
                <span className="text-2xl font-light">→</span>
              </div>
            </Link>

            {/* 底部金色渐变线 */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
          </Card>
        </motion.div>
      </section>

      {/* ===== 底部引用块 ===== */}
      <section className="px-6 py-24">
        <motion.blockquote
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="h-display text-3xl leading-relaxed text-gradient-gold sm:text-4xl">
            {t('home.quote')}
          </p>
        </motion.blockquote>
      </section>
    </main>
  );
}

export default HomeContent;
