'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageSquare } from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RadarChart } from '@/components/charts/RadarChart';
import { INNER_PERSONAS } from '@/lib/agents';
import { fadeInUp, staggerContainer, cardItem } from '@/lib/motion/variants';
import type { Persona } from '@/types';

/**
 * 内心人格卡片
 *
 * 展示单个内心人格的 avatar、name、nameEn、philosophy、speakingStyle，
 * 并通过 RadarChart 可视化其 5 维价值倾向。
 */
interface PersonaCardProps {
  persona: Persona;
  index: number;
}

function PersonaCard({ persona, index }: PersonaCardProps) {
  return (
    <motion.div variants={cardItem}>
      <Card className="group flex h-full flex-col gap-4">
        {/* 头部：avatar + 名称 */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-dim bg-gold-soft text-2xl transition-all duration-300 group-hover:shadow-[0_0_20px_var(--shadow-gold-strong)]">
            <span aria-hidden="true">{persona.avatar}</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-text">
              {persona.name}
            </h3>
            <span className="text-sm font-medium text-gold">
              {persona.nameEn}
            </span>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="flex justify-center">
          <RadarChart
            data={persona.radar}
            size={200}
            showValues={false}
            animated
          />
        </div>

        {/* 哲学 + 说话风格 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-xs text-text-dim">哲学</span>
            <p className="flex-1 text-sm text-text-soft">
              {persona.philosophy}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-xs text-text-dim">说话风格</span>
            <p className="flex-1 text-sm text-text-soft">
              {persona.speakingStyle}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * 内心世界页面 Inner World
 *
 * 展示 6 个内心人格（野心、理性、安全感、恐惧、爱、自由），
 * 每个人格配有 5 维价值雷达图。
 *
 * 结构：
 * - ParticleBackground：全屏金色粒子背景
 * - Header：全局头部导航
 * - Hero：标题 + 副标题
 * - 6 个内心人格卡片网格（含 RadarChart）
 * - 开始内心对话 / 返回首页按钮
 *
 * 深色主题，金色点缀，使用 Framer Motion 动画。
 */
export default function InnerPage() {
  const [notice, setNotice] = React.useState<string | null>(null);

  const handleStartDialog = () => {
    setNotice('内心对话功能即将上线，敬请期待。');
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
          className="mx-auto flex max-w-6xl flex-col items-center gap-12"
        >
          {/* ===== Hero 区域 ===== */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Badge variant="gold" className="px-4 py-1 text-xs tracking-widest">
              <Brain className="mr-1.5 h-3 w-3" />
              Inner World
            </Badge>

            <h1 className="h-display text-4xl text-gradient-gold sm:text-5xl md:text-6xl">
              内心世界 Inner World
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-text-soft sm:text-lg">
              6 个内心人格共存，检测冲突与渴望，看见自己的全貌
            </p>
          </motion.div>

          {/* ===== 6 个内心人格卡片网格 ===== */}
          <motion.div
            variants={staggerContainer}
            className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {INNER_PERSONAS.map((persona, index) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                index={index}
              />
            ))}
          </motion.div>

          {/* ===== 操作按钮 ===== */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-4 sm:flex-row"
          >
            <Button
              variant="gold"
              size="lg"
              onClick={handleStartDialog}
            >
              <MessageSquare className="h-4 w-4" />
              开始内心对话
            </Button>
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
