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

/**
 * 七大模块定义
 */
interface ModuleItem {
  icon: LucideIcon;
  name: string;
  nameEn: string;
  description: string;
  href: string;
}

const MODULES: ModuleItem[] = [
  {
    icon: Globe,
    name: '记忆星球',
    nameEn: 'Memory Planet',
    description: '将照片、文字、语音组织成结构化记忆与人生地图，让过去有形状。',
    href: '/memory',
  },
  {
    icon: Sparkles,
    name: '梦想档案',
    nameEn: 'Dream Archive',
    description: '记录儿时梦想，生成梦想时间轴，与儿时的自己重逢对话。',
    href: '/dream',
  },
  {
    icon: Brain,
    name: '内心世界',
    nameEn: 'Inner World',
    description: '6 个内心人格共存，检测冲突与渴望，看见自己的全貌。',
    href: '/inner',
  },
  {
    icon: Users,
    name: '智慧议会',
    nameEn: 'Wisdom Council',
    description: '召集 7 位智者，多元视角辩论，生成命运报告与共识方案。',
    href: '/council/wisdom',
  },
  {
    icon: Clock,
    name: '未来议会',
    nameEn: 'Future Council',
    description: '20 岁、当前、50 岁、80 岁的自己同时发言，推演未来路径。',
    href: '/council/future',
  },
  {
    icon: HeartHandshake,
    name: '重逢',
    nameEn: 'Reunion',
    description: '与已经离开的人重逢，完成未完成的对话，温柔地告别。',
    href: '/reunion',
  },
  {
    icon: History,
    name: '历史',
    nameEn: 'History',
    description: '所有模块的事件汇成生命时间线与生命星图，回溯生命轨迹。',
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
  return (
    <main className="relative z-10">
      {/* ===== Hero 区域 ===== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6"
        >
          {/* 顶部小标签 */}
          <motion.div variants={fadeInUp}>
            <span className="interactive inline-flex items-center rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
              AI 生命操作系统
            </span>
          </motion.div>

          {/* 大标题 */}
          <motion.h1
            variants={fadeInUp}
            className="h-display text-[80px] leading-none text-gradient-gold sm:text-[96px] md:text-[120px]"
          >
            LifeVerse
          </motion.h1>

          {/* 英文副标题 */}
          <motion.p
            variants={fadeInUp}
            className="h-subtitle text-xl text-text-soft sm:text-2xl"
          >
            Every life deserves its own universe.
          </motion.p>

          {/* 中文副标题 */}
          <motion.p
            variants={fadeInUp}
            className="text-lg text-text sm:text-xl"
          >
            生命宇宙 · 和塑造你的人，一起决定未来
          </motion.p>

          {/* 描述文字 */}
          <motion.p
            variants={fadeInUp}
            className="max-w-2xl text-sm leading-relaxed text-text-soft sm:text-base"
          >
            把记忆、情感、梦想、关系与决策，组织成一个可被觉察、可被推演、可被重逢的私人宇宙。
            在重大选择时，与智慧、记忆和未来版本的自己共同对话。
          </motion.p>

          {/* 按钮组 */}
          <motion.div
            variants={fadeInUp}
            className="mt-4 flex flex-col gap-4 sm:flex-row"
          >
            <Button asChild variant="gold" size="lg">
              <Link href="/council" aria-label="进入议会入口，开始命运议会">
                开始命运议会
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#modules" aria-label="滚动到七大模块区域，了解更多">
                了解更多
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
            七大模块
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="max-w-2xl text-center text-sm text-text-soft sm:text-base"
          >
            它们不是平行的功能，而是一个有机的整体——输入、处理、输出三层协同，
            构成你的生命宇宙。
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
              <motion.div key={module.name} variants={cardItem}>
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
                        {module.name}
                      </h3>
                      <span className="text-sm font-medium text-gold">
                        {module.nameEn}
                      </span>
                    </div>

                    {/* 描述 */}
                    <p className="flex-1 text-sm leading-relaxed text-text-soft">
                      {module.description}
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
                    人物市场
                  </h3>
                  <span className="text-sm font-medium text-gold">
                    Agent Marketplace
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-text-soft">
                  解锁更多智者，扩展你的议会。与达芬奇、爱因斯坦、孔子、尼采等智者对话，
                  让更多视角照亮你的人生决策。
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
            “每一个生命，都值得拥有自己的宇宙。”
          </p>
        </motion.blockquote>
      </section>
    </main>
  );
}

export default HomeContent;
