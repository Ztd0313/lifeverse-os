'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, MessageSquareHeart } from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RELATION_AGENTS } from '@/lib/agents';
import { fadeInUp, staggerContainer, cardItem } from '@/lib/motion/variants';
import type { Persona } from '@/types';

/**
 * 关系型 Agent 卡片
 *
 * 展示单个关系型 Agent 的 avatar、name、relationLabel、philosophy、speakingStyle。
 */
interface RelationAgentCardProps {
  agent: Persona;
  onStart: () => void;
}

function RelationAgentCard({ agent, onStart }: RelationAgentCardProps) {
  return (
    <motion.div variants={cardItem}>
      <Card className="group flex h-full flex-col gap-5">
        {/* 头部：avatar + 名称 + 关系标签 */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-dim bg-gold-soft text-3xl transition-all duration-300 group-hover:shadow-[0_0_24px_var(--shadow-gold-strong)]">
            <span aria-hidden="true">{agent.avatar}</span>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-text">
              {agent.name}
            </h3>
            <span className="text-sm font-medium text-gold">
              {agent.nameEn}
            </span>
            {agent.relationLabel && (
              <Badge variant="blue" className="mt-1 w-fit">
                {agent.relationLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* 哲学 + 说话风格 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-16 shrink-0 text-xs text-text-dim">
              哲学
            </span>
            <p className="flex-1 text-sm leading-relaxed text-text-soft">
              {agent.philosophy}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-16 shrink-0 text-xs text-text-dim">
              说话风格
            </span>
            <p className="flex-1 text-sm leading-relaxed text-text-soft">
              {agent.speakingStyle}
            </p>
          </div>
        </div>

        {/* 开始重逢按钮 */}
        <div className="mt-auto pt-2">
          <Button
            variant="gold"
            size="md"
            className="w-full"
            onClick={onStart}
          >
            <MessageSquareHeart className="h-4 w-4" />
            开始重逢
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * 重逢页面 Reunion
 *
 * 展示 2 个关系型 Agent（父亲、母亲），用于与已经离开的人重逢，
 * 完成未完成的对话，温柔地告别。
 *
 * 结构：
 * - ParticleBackground：全屏金色粒子背景
 * - Header：全局头部导航
 * - Hero：标题 + 副标题
 * - 2 个关系型 Agent 卡片
 * - 返回首页按钮
 *
 * 深色主题，金色点缀，使用 Framer Motion 动画。
 */
export default function ReunionPage() {
  const [notice, setNotice] = React.useState<string | null>(null);

  const handleStartReunion = () => {
    setNotice('重逢对话功能即将上线，敬请期待。');
    window.setTimeout(() => setNotice(null), 2500);
  };

  return (
    <>
      <ParticleBackground />
      <Header />

      <main className="relative z-10 min-h-screen bg-[#060710] px-6 pb-24 pt-32">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mx-auto flex max-w-4xl flex-col items-center gap-12"
        >
          {/* ===== Hero 区域 ===== */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Badge variant="gold" className="px-4 py-1 text-xs tracking-widest">
              <HeartHandshake className="mr-1.5 h-3 w-3" />
              Reunion
            </Badge>

            <h1 className="h-display text-4xl text-gradient-gold sm:text-5xl md:text-6xl">
              重逢 Reunion
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-text-soft sm:text-lg">
              与已经离开的人重逢，完成未完成的对话，温柔地告别
            </p>
          </motion.div>

          {/* ===== 关系型 Agent 卡片网格 ===== */}
          <motion.div
            variants={staggerContainer}
            className="grid w-full grid-cols-1 gap-6 md:grid-cols-2"
          >
            {RELATION_AGENTS.map((agent) => (
              <RelationAgentCard
                key={agent.id}
                agent={agent}
                onStart={handleStartReunion}
              />
            ))}
          </motion.div>

          {/* ===== 提示 toast ===== */}
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg border border-gold-dim bg-bg-card px-4 py-2 text-sm text-gold shadow-lg glow-gold"
            >
              {notice}
            </motion.div>
          )}
        </motion.div>
      </main>
    </>
  );
}
