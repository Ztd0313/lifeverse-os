'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Crown, Sparkles, Zap, HelpCircle } from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MembershipBadge } from '@/components/membership/MembershipBadge';
import { useMembershipStore } from '@/stores/membership-store';
import {
  TIER_CONFIGS,
  type MembershipTier,
  type BillingCycle,
  formatPriceWithCycle,
  AGENT_SEAT_PRICE,
} from '@/types/membership';
import { cn } from '@/lib/utils';

/**
 * 会员方案页面
 *
 * 结构：
 * 1. 顶部区域：标题"会员方案"，副标题，当前会员等级标识
 * 2. 计费周期切换：月度 / 年度（年度显示折扣）
 * 3. 三档定价卡片：免费用户 / 基础会员 / Pro 高级会员
 * 4. Agent 席位购买区：显示当前席位，购买额外席位
 * 5. 常见问题 FAQ
 *
 * 深色主题，金色点缀，使用 Framer Motion 动画。
 */

// ===== FAQ 数据 =====

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: '什么是 Agent 席位？',
    answer:
      'Agent 席位是你可以自定义的 Agent 数量。每个会员等级都包含一定数量的免费席位（免费 2 个、基础 4 个、Pro 6 个），你也可以按需额外购买席位（¥9/月/席位）。额外购买的席位在升级或降级时都会保留。',
  },
  {
    question: '如何取消订阅？',
    answer:
      '你可以随时在当前方案卡片上点击"取消订阅"按钮。取消后，你的会员权益将持续到当前订阅周期结束，之后将降级为免费用户。已购买的额外 Agent 席位将完整保留。',
  },
  {
    question: '年度订阅有什么优惠？',
    answer:
      '选择年度订阅可享受约 17% 的折扣，相比月度订阅更划算。例如 Pro 会员月度 ¥59/月，年度 ¥588/年（相当于 ¥49/月）。年度订阅自动续费，可随时取消。',
  },
  {
    question: '升级后已购买的席位会保留吗？',
    answer:
      '升级会员等级后，你额外购买的 Agent 席位将完整保留，同时获得新等级赠送的免费席位数。降级时，额外购买的席位同样保留，仅免费席位数调整为新等级的标准。',
  },
];

// ===== 工具函数 =====

/**
 * 计算年度折扣百分比
 */
function getYearlyDiscount(monthlyCents: number, yearlyCents: number): number {
  if (monthlyCents === 0) return 0;
  const fullYearly = monthlyCents * 12;
  return Math.round(((fullYearly - yearlyCents) / fullYearly) * 100);
}

// ===== 按钮信息类型 =====

interface TierButtonInfo {
  label: string;
  disabled: boolean;
  isCurrent: boolean;
  isDowngrade: boolean;
}

// ===== 主页面组件 =====

export default function MembershipPage() {
  const { membership, subscribe, cancelSubscription, purchaseAgentSeat } =
    useMembershipStore();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [justSubscribed, setJustSubscribed] = useState<MembershipTier | null>(
    null
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const currentTier = membership.tier;
  const tiers = Object.values(TIER_CONFIGS).sort(
    (a, b) => a.priority - b.priority
  );

  // 年度折扣（用于计费切换按钮上的徽章）
  const yearlyDiscount = getYearlyDiscount(
    TIER_CONFIGS.basic.priceMonthly,
    TIER_CONFIGS.basic.priceYearly
  );

  // ===== 事件处理 =====

  /** 订阅会员 */
  const handleSubscribe = (tier: MembershipTier) => {
    subscribe(tier, billingCycle);
    setJustSubscribed(tier);
    // 3 秒后自动隐藏成功提示
    setTimeout(() => setJustSubscribed(null), 3000);
  };

  /** 取消订阅 */
  const handleCancel = () => {
    cancelSubscription();
    setJustSubscribed(null);
  };

  /** 购买额外 Agent 席位 */
  const handlePurchaseSeat = () => {
    purchaseAgentSeat();
  };

  /**
   * 获取某个等级卡片的按钮信息
   *
   * - 当前等级：显示"当前方案"（免费）或"取消订阅"（付费）
   * - 更低等级：显示"降级方案"（禁用）
   * - 更高等级：显示升级按钮
   */
  const getTierButton = (tier: MembershipTier): TierButtonInfo => {
    const config = TIER_CONFIGS[tier];

    if (tier === currentTier) {
      return { label: '当前方案', disabled: true, isCurrent: true, isDowngrade: false };
    }

    if (config.priority < TIER_CONFIGS[currentTier].priority) {
      return { label: '降级方案', disabled: true, isCurrent: false, isDowngrade: true };
    }

    // 更高等级 - 根据当前等级显示对应的升级按钮文案
    if (currentTier === 'free') {
      if (tier === 'basic') {
        return { label: '升级基础会员', disabled: false, isCurrent: false, isDowngrade: false };
      }
      if (tier === 'pro') {
        return { label: '升级Pro会员', disabled: false, isCurrent: false, isDowngrade: false };
      }
    }

    if (currentTier === 'basic' && tier === 'pro') {
      return { label: '升级Pro', disabled: false, isCurrent: false, isDowngrade: false };
    }

    return {
      label: `升级到${config.name}`,
      disabled: false,
      isCurrent: false,
      isDowngrade: false,
    };
  };

  return (
    <>
      {/* 全屏粒子背景 */}
      <ParticleBackground />

      {/* 全局头部导航 */}
      <Header />

      {/* 主内容 */}
      <main className="relative z-10 min-h-screen pt-16">
        {/* ===== 顶部区域：标题 + 副标题 ===== */}
        <section className="mx-auto max-w-7xl px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            {/* 顶部小标签 */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
              <Crown className="h-3 w-3" />
              MEMBERSHIP
            </span>

            {/* 标题 */}
            <h1 className="h-display text-5xl text-gradient-gold sm:text-6xl">
              会员方案
            </h1>
            <p className="h-subtitle text-lg text-text-soft sm:text-xl">
              Membership Plans
            </p>

            {/* 副标题 */}
            <p className="mt-2 max-w-2xl text-base text-text sm:text-lg">
              选择适合你的方案，解锁更深度的生命宇宙探索体验
            </p>

            {/* 当前会员等级标识 */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-text-dim">当前等级：</span>
              <MembershipBadge tier={currentTier} size="lg" showEn />
            </div>
          </motion.div>
        </section>

        {/* ===== 计费周期切换 ===== */}
        <section className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-card/50 p-1">
              {/* 月度按钮 */}
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'interactive rounded-full px-6 py-2 text-sm font-medium transition-all',
                  billingCycle === 'monthly'
                    ? 'border border-gold bg-gold-soft/30 text-gold shadow-[0_0_16px_var(--shadow-gold)]'
                    : 'border border-transparent text-text-soft hover:text-text'
                )}
              >
                月度订阅
              </button>

              {/* 年度按钮 */}
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'interactive rounded-full px-6 py-2 text-sm font-medium transition-all',
                  billingCycle === 'yearly'
                    ? 'border border-gold bg-gold-soft/30 text-gold shadow-[0_0_16px_var(--shadow-gold)]'
                    : 'border border-transparent text-text-soft hover:text-text'
                )}
              >
                年度订阅
                <span className="ml-1.5 inline-flex items-center rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                  节省{yearlyDiscount}%
                </span>
              </button>
            </div>
          </motion.div>
        </section>

        {/* ===== 三档定价卡片 ===== */}
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {tiers.map((config, index) => {
              const buttonInfo = getTierButton(config.tier);
              const isCurrent = config.tier === currentTier;
              const isPro = config.tier === 'pro';
              const price =
                billingCycle === 'monthly'
                  ? config.priceMonthly
                  : config.priceYearly;
              const discount = getYearlyDiscount(
                config.priceMonthly,
                config.priceYearly
              );

              return (
                <motion.div
                  key={config.tier}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className={cn(isPro && 'md:scale-105 md:-translate-y-2')}
                >
                  <Card
                    hover={false}
                    className={cn(
                      'card-hover interactive relative flex h-full flex-col overflow-hidden',
                      isPro
                        ? 'border-gold shadow-[0_0_32px_var(--shadow-gold)]'
                        : 'border-border',
                      isCurrent && 'border-gold'
                    )}
                  >
                    {/* 顶部渐变条 */}
                    <div
                      className="absolute left-0 right-0 top-0 h-1"
                      style={{ background: config.gradient }}
                    />

                    {/* 当前方案徽章 */}
                    {isCurrent && (
                      <div className="absolute right-4 top-4 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-bg">
                          <Check className="h-3 w-3" />
                          当前方案
                        </span>
                      </div>
                    )}

                    {/* Pro 推荐徽章 */}
                    {isPro && !isCurrent && (
                      <div className="absolute right-4 top-4 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full border border-gold-dim bg-gold-soft/30 px-3 py-1 text-xs font-semibold text-gold">
                          <Sparkles className="h-3 w-3" />
                          推荐
                        </span>
                      </div>
                    )}

                    {/* 卡片内容 */}
                    <div className="flex flex-1 flex-col pt-4">
                      {/* 图标 + 名称 */}
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                          style={{
                            background: `${config.color}15`,
                            border: `1px solid ${config.color}30`,
                          }}
                        >
                          {config.icon}
                        </div>
                        <div>
                          <h3
                            className="h-title text-lg font-semibold"
                            style={{ color: config.color }}
                          >
                            {config.name}
                          </h3>
                          <p className="text-xs text-text-dim">{config.nameEn}</p>
                        </div>
                      </div>

                      {/* 价格 */}
                      <div className="mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className="h-display text-4xl font-bold text-text">
                            {formatPriceWithCycle(price, billingCycle)}
                          </span>
                          {config.tier !== 'free' &&
                            billingCycle === 'yearly' &&
                            discount > 0 && (
                              <span className="inline-flex items-center rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold">
                                节省 {discount}%
                              </span>
                            )}
                        </div>
                        {config.tier !== 'free' && (
                          <p className="mt-1 text-xs text-text-dim">
                            {billingCycle === 'monthly'
                              ? '按月付费，随时取消'
                              : '按年付费，更优惠'}
                          </p>
                        )}
                      </div>

                      {/* 标语 */}
                      <p className="mb-5 text-sm text-text-soft">
                        {config.tagline}
                      </p>

                      {/* 分隔线 */}
                      <div className="mb-4 h-px bg-border" />

                      {/* 功能列表 */}
                      <ul className="mb-6 flex-1 space-y-3">
                        {config.features.map((feature, fIndex) => (
                          <li
                            key={fIndex}
                            className="flex items-start gap-2.5"
                          >
                            {feature.included ? (
                              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gold/20">
                                <Check className="h-3 w-3 text-gold" />
                              </span>
                            ) : (
                              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-bg-card">
                                <X className="h-3 w-3 text-text-dim" />
                              </span>
                            )}
                            <span
                              className={cn(
                                'text-sm',
                                feature.included
                                  ? 'text-text'
                                  : 'text-text-dim line-through'
                              )}
                            >
                              {feature.label}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* 操作按钮 */}
                      <div className="mt-auto">
                        {buttonInfo.isCurrent ? (
                          config.tier !== 'free' ? (
                            <Button
                              variant="secondary"
                              className="w-full"
                              onClick={handleCancel}
                            >
                              取消订阅
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              className="w-full"
                              disabled
                            >
                              当前方案
                            </Button>
                          )
                        ) : buttonInfo.isDowngrade ? (
                          <Button
                            variant="ghost"
                            className="w-full"
                            disabled
                          >
                            {buttonInfo.label}
                          </Button>
                        ) : (
                          <Button
                            variant={isPro ? 'gold' : 'primary'}
                            className="w-full"
                            onClick={() => handleSubscribe(config.tier)}
                          >
                            {buttonInfo.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* 订阅成功提示 */}
          <AnimatePresence>
            {justSubscribed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mx-auto mt-8 max-w-md"
              >
                <div className="flex items-center justify-center gap-2 rounded-xl border border-gold-dim bg-gold-soft/20 px-6 py-3 text-center">
                  <Check className="h-5 w-5 flex-shrink-0 text-gold" />
                  <span className="text-sm text-gold">
                    订阅成功！已升级为 {TIER_CONFIGS[justSubscribed].name}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ===== Agent 席位购买区 ===== */}
        <section className="mx-auto max-w-7xl px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card
              hover={false}
              className="card-hover interactive overflow-hidden"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* 左侧：信息 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gold-dim bg-gold-soft">
                    <Zap className="h-7 w-7 text-gold" />
                  </div>
                  <div>
                    <h3 className="h-title mb-1 text-lg font-semibold text-text">
                      Agent 席位购买
                    </h3>
                    <p className="mb-2 text-sm text-text-soft">
                      额外购买自定义 Agent 席位，扩展你的生命宇宙
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="text-text-dim">
                        当前席位：
                        <span className="font-semibold text-gold">
                          {' '}
                          {TIER_CONFIGS[currentTier].agentSeats +
                            membership.purchasedSeats}{' '}
                          个
                        </span>
                      </span>
                      <span className="text-text-dim">|</span>
                      <span className="text-text-dim">
                        会员赠送：
                        <span className="text-text">
                          {' '}
                          {TIER_CONFIGS[currentTier].agentSeats} 个
                        </span>
                      </span>
                      <span className="text-text-dim">|</span>
                      <span className="text-text-dim">
                        额外购买：
                        <span className="text-text">
                          {' '}
                          {membership.purchasedSeats} 个
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 右侧：价格 + 购买按钮 */}
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="text-right">
                    <p className="h-display text-3xl font-bold text-gradient-gold">
                      {formatPriceWithCycle(AGENT_SEAT_PRICE, 'monthly')}
                    </p>
                    <p className="text-xs text-text-dim">每个席位</p>
                  </div>
                  <Button
                    variant="gold"
                    onClick={handlePurchaseSeat}
                    className="interactive"
                  >
                    <Zap className="h-4 w-4" />
                    购买席位
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* ===== 常见问题 FAQ ===== */}
        <section className="mx-auto max-w-3xl px-6 py-10 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {/* 标题 */}
            <div className="mb-8 text-center">
              <h2 className="h-display mb-2 text-3xl text-gradient-gold">
                常见问题
              </h2>
              <p className="text-sm text-text-soft">
                Frequently Asked Questions
              </p>
            </div>

            {/* FAQ 列表 */}
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, index) => (
                <div
                  key={index}
                  className="card-hover interactive overflow-hidden rounded-[14px] border border-border bg-bg-card/50"
                >
                  {/* 问题行 */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={openFaqIndex === index}
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 flex-shrink-0 text-gold" />
                      <span className="text-sm font-medium text-text">
                        {item.question}
                      </span>
                    </div>
                    <motion.span
                      animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 text-text-dim"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </motion.span>
                  </button>

                  {/* 答案展开 */}
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-3 px-5 pb-4">
                          <div className="w-5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed text-text-soft">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <Footer />
      </main>
    </>
  );
}
