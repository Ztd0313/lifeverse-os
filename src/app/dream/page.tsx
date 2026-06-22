'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Clock, MessageCircleHeart, BookHeart } from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fadeInUp, staggerContainer, cardItem } from '@/lib/motion/variants';

/**
 * 梦想档案功能项定义
 */
interface DreamFeature {
  icon: typeof BookHeart;
  title: string;
  description: string;
}

const DREAM_FEATURES: DreamFeature[] = [
  {
    icon: BookHeart,
    title: '记录童年梦想',
    description:
      '把那些藏在记忆深处的儿时梦想一一写下，让它们重新被看见、被珍视。',
  },
  {
    icon: Clock,
    title: '生成梦想时间轴',
    description:
      '将梦想按时间串联成一条专属时间轴，看见自己一路走来的轨迹与变化。',
  },
  {
    icon: MessageCircleHeart,
    title: '与儿时的自己对话',
    description:
      '重逢那个怀揣梦想的小孩，倾听他/她的声音，温柔地回应未完成的期待。',
  },
];

/**
 * 梦想档案页面 Dream Archive
 *
 * 占位页面，展示模块理念与功能预告。
 *
 * 结构：
 * - ParticleBackground：全屏金色粒子背景
 * - Header：全局头部导航
 * - Hero：标题 + 副标题
 * - 即将上线提示卡片
 * - 功能描述卡片网格
 * - 返回首页按钮
 *
 * 深色主题，金色点缀，使用 Framer Motion fadeInUp 动画。
 */
export default function DreamPage() {
  return (
    <>
      <ParticleBackground />
      <Header />

      <main className="relative z-10 min-h-screen bg-[#060710] px-6 pb-24 pt-32">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mx-auto flex max-w-4xl flex-col items-center gap-10"
        >
          {/* ===== Hero 区域 ===== */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Badge variant="gold" className="px-4 py-1 text-xs tracking-widest">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Dream Archive
            </Badge>

            <h1 className="h-display text-4xl text-gradient-gold sm:text-5xl md:text-6xl">
              梦想档案 Dream Archive
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-text-soft sm:text-lg">
              记录儿时梦想，生成梦想时间轴，与儿时的自己重逢对话
            </p>
          </motion.div>

          {/* ===== 即将上线提示卡片 ===== */}
          <motion.div variants={fadeInUp} className="w-full max-w-2xl">
            <Card
              hover={false}
              className="relative overflow-hidden border-gold-dim bg-gold-soft/20 text-center"
            >
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft glow-gold">
                  <Sparkles className="h-7 w-7 text-gold" />
                </div>
                <h2 className="font-serif text-2xl text-gradient-gold">
                  即将上线
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-text-soft">
                  梦想档案正在精心打磨中。我们将帮你重新拾起那些被时光掩埋的儿时梦想，
                  让它们在生命宇宙中重新发光。
                </p>
                <Badge variant="orange" className="mt-1">
                  Coming Soon
                </Badge>
              </div>
            </Card>
          </motion.div>

          {/* ===== 功能描述卡片网格 ===== */}
          <motion.div
            variants={staggerContainer}
            className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {DREAM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={cardItem}>
                  <Card className="group h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-dim bg-gold-soft text-gold transition-all duration-300 group-hover:shadow-[0_0_20px_var(--shadow-gold-strong)]">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-text">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-soft">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ===== 返回首页按钮 ===== */}
          <motion.div variants={fadeInUp}>
            <Button asChild variant="secondary" size="lg">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </>
  );
}
