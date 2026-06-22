'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AgentMarketCard } from '@/components/marketplace/AgentMarketCard';
import { CartDrawer } from '@/components/marketplace/CartDrawer';
import { CheckoutModal } from '@/components/marketplace/CheckoutModal';
import { AgentPreview } from '@/components/marketplace/AgentPreview';
import {
  MARKETPLACE_AGENTS,
  FILTER_TABS,
  getAgentsByFilterTab,
  type MarketFilterTab,
  type MarketplaceAgent,
} from '@/lib/marketplace-data';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

/**
 * 人物市场页面
 *
 * 结构：
 * 1. 顶部区域：标题"人物市场 Marketplace"，副标题"解锁更多智者，扩展你的议会"
 * 2. 分类标签：全部 / 智慧议会 / 未来议会 / 内心世界 / 重逢 / 限定
 * 3. Agent 卡片网格：展示所有可购买的 Agent
 * 4. 购物车浮窗：右下角购物车按钮，点击展开购物车
 * 5. 结算弹窗：点击结算时弹出支付确认
 *
 * 深色主题，金色点缀，使用 Framer Motion 动画。
 */
export default function MarketplacePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<MarketFilterTab>('all');
  const [previewAgent, setPreviewAgent] = React.useState<MarketplaceAgent | null>(null);

  const { cart, openCart } = useMarketplaceStore();

  // 根据当前标签筛选 Agent
  const filteredAgents = React.useMemo(
    () => getAgentsByFilterTab(activeTab),
    [activeTab]
  );

  // 购物车数量
  const cartCount = cart.length;

  return (
    <>
      {/* 全屏粒子背景 */}
      <ParticleBackground />

      {/* 全局头部导航 */}
      <Header />

      {/* 主内容 */}
      <main className="relative z-10 min-h-screen pt-16">
        {/* ===== 顶部区域 ===== */}
        <section className="mx-auto max-w-7xl px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            {/* 顶部小标签 */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
              <Sparkles className="h-3 w-3" />
              AGENT MARKETPLACE
            </span>

            {/* 标题 */}
            <h1 className="h-display text-5xl text-gradient-gold sm:text-6xl">
              {t('marketplace.title')}
            </h1>
            <p className="h-subtitle text-lg text-text-soft sm:text-xl">
              {t('marketplace.subtitle')}
            </p>

            {/* 副标题 */}
            <p className="mt-2 text-base text-text sm:text-lg">
              {t('marketplace.description')}
            </p>
          </motion.div>
        </section>

        {/* ===== 分类标签 ===== */}
        <section className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-all duration-300',
                  activeTab === tab.key
                    ? 'border-gold bg-gold-soft/30 text-gold shadow-[0_0_16px_var(--shadow-gold)]'
                    : 'border-border bg-bg-card/50 text-text-soft hover:border-gold-dim hover:text-text'
                )}
              >
                {tab.label}
                {tab.key === 'limited' && (
                  <span className="ml-1 text-[10px] text-gold">★</span>
                )}
              </button>
            ))}
          </motion.div>
        </section>

        {/* ===== Agent 卡片网格 ===== */}
        <section className="mx-auto max-w-7xl px-6 py-10">
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <AgentMarketCard
                    agent={agent}
                    index={index}
                    onPreview={(a) => setPreviewAgent(a)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* 空状态 */}
          {filteredAgents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-text-dim">{t('marketplace.emptyCategory')}</p>
            </div>
          )}
        </section>

        {/* ===== 底部统计 ===== */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-center">
            <div>
              <p className="font-serif text-2xl font-semibold text-gold">
                {MARKETPLACE_AGENTS.length}
              </p>
              <p className="text-xs text-text-dim">{t('marketplace.sagesCount')}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-serif text-2xl font-semibold text-gold">
                {MARKETPLACE_AGENTS.filter((a) => a.isFree).length}
              </p>
              <p className="text-xs text-text-dim">{t('marketplace.freeCount')}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-serif text-2xl font-semibold text-gold">
                {MARKETPLACE_AGENTS.filter((a) => a.isLimited).length}
              </p>
              <p className="text-xs text-text-dim">{t('marketplace.limitedCount')}</p>
            </div>
          </div>
        </section>

        <Footer />
      </main>

      {/* ===== 购物车浮窗（右下角按钮） ===== */}
      <motion.button
        type="button"
        onClick={openCart}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-gold-dim bg-bg-card text-gold shadow-[0_0_24px_var(--shadow-gold)] transition-all hover:bg-gold-soft/30"
        aria-label={t('marketplace.openCart')}
      >
        <ShoppingBag className="h-6 w-6" />
        {cartCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-bg"
          >
            {cartCount}
          </motion.span>
        )}
      </motion.button>

      {/* ===== 购物车抽屉 ===== */}
      <CartDrawer />

      {/* ===== 结算弹窗 ===== */}
      <CheckoutModal />

      {/* ===== Agent 试听弹窗 ===== */}
      <AgentPreview
        agent={previewAgent}
        onClose={() => setPreviewAgent(null)}
      />
    </>
  );
}
