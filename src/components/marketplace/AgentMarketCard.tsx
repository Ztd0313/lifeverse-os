'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, ShoppingCart, Lock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RadarChart } from '@/components/charts/RadarChart';
import { VoiceTrial } from '@/components/membership/VoiceTrial';
import { cn } from '@/lib/utils';
import type { MarketplaceAgent } from '@/lib/marketplace-data';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { useMembershipStore } from '@/stores/membership-store';

/**
 * Agent 市场卡片组件 Props
 */
export interface AgentMarketCardProps {
  /** Agent 数据 */
  agent: MarketplaceAgent;
  /** 点击试听回调 */
  onPreview?: (agent: MarketplaceAgent) => void;
  /** 卡片索引（用于动画延迟） */
  index?: number;
}

/**
 * Agent 市场卡片组件
 *
 * 展示 Agent 头像、名称、类型、哲学标签、价格、雷达图缩略图。
 * 支持"试听"、"购买"/"已拥有"/"已加入议会"按钮。
 * 限定 Agent 有特殊金色边框 + "LIMITED" 标签。
 * hover 效果：上浮 + 金色光晕。
 */
export function AgentMarketCard({ agent, onPreview, index = 0 }: AgentMarketCardProps) {
  const { ownedAgents, cart, addToCart, removeFromCart } = useMarketplaceStore();
  const { membership } = useMembershipStore();
  const isMember = membership.tier !== 'free';

  const isOwned = ownedAgents.includes(agent.id);
  const isInCart = cart.includes(agent.id);

  const handlePurchase = () => {
    if (isOwned || isInCart) return;
    addToCart(agent.id);
  };

  const handleRemoveFromCart = () => {
    removeFromCart(agent.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
      <Card
        hover={false}
        className={cn(
          'group relative flex h-full flex-col gap-4 overflow-hidden p-5 transition-all duration-300',
          agent.isLimited
            ? 'border-gold-dim hover:border-gold hover:shadow-[0_0_32px_var(--shadow-gold)]'
            : !agent.isFree
              ? 'border-gold-dim/50 hover:border-gold-dim hover:shadow-[0_0_24px_var(--shadow-gold)]'
              : 'hover:border-gold-dim hover:shadow-[0_8px_32px_var(--shadow-gold)]'
        )}
      >
        {/* 限定标签 */}
        {agent.isLimited && (
          <div className="absolute right-3 top-3 z-10">
            <Badge variant="gold" className="gap-1 border-gold bg-gold-soft/50 text-gold">
              <Sparkles className="h-3 w-3" />
              LIMITED
            </Badge>
          </div>
        )}

        {/* 头部：头像 + 名称 */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-3xl transition-all duration-300',
              agent.isLimited
                ? 'border-gold-dim bg-gold-soft/30 group-hover:shadow-[0_0_16px_var(--shadow-gold)]'
                : 'border-border bg-bg-soft group-hover:border-gold-dim'
            )}
          >
            {agent.avatar}
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-base font-semibold text-text">{agent.name}</h3>
            <p className="text-xs font-medium text-gold">{agent.nameEn}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="gold">{agent.philosophy}</Badge>
              {agent.isFree ? (
                <Badge variant="green">免费</Badge>
              ) : isMember ? (
                <Badge
                  variant="gold"
                  className="gap-1 border-gold-dim bg-gold-soft/30 text-gold"
                >
                  <Check className="h-3 w-3" />
                  已解锁
                </Badge>
              ) : (
                <Badge
                  variant="gold"
                  className="gap-1 border-gold-dim bg-gold-soft/30 text-gold"
                >
                  <Lock className="h-3 w-3" />
                  付费
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 描述 */}
        <p className="line-clamp-2 text-xs leading-relaxed text-text-soft">
          {agent.description}
        </p>

        {/* 雷达图缩略图 */}
        <div className="flex items-center justify-center">
          <RadarChart
            data={agent.radar}
            size={120}
            showLabels={false}
            showGrid={true}
            showValues={false}
            animated={false}
          />
        </div>

        {/* 价格 + 操作按钮 */}
        <div className="mt-auto space-y-2.5">
          {/* 价格 */}
          <div className="flex items-baseline gap-1">
            {agent.isFree ? (
              <span className="font-serif text-xl font-semibold text-green">免费</span>
            ) : isMember ? (
              <span className="font-serif text-xl font-semibold text-gold">已解锁</span>
            ) : (
              <>
                <span className="text-sm text-text-dim">¥</span>
                <span className="font-serif text-2xl font-semibold text-gold">
                  {agent.price}
                </span>
              </>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex gap-2">
            {/* 语音试听按钮 */}
            <VoiceTrial
              text={agent.description || agent.name}
              enabled={isMember || agent.isFree}
              onUpgradeClick={() => {
                window.location.href = '/membership';
              }}
              className="flex-1 justify-center"
            />

            {/* 购买/已拥有/已加入按钮 */}
            {isOwned ? (
              <Button variant="ghost" size="sm" className="flex-1" disabled>
                <Check className="h-3.5 w-3.5" />
                已拥有
              </Button>
            ) : isInCart ? (
              <Button
                variant="gold"
                size="sm"
                className="flex-1"
                onClick={handleRemoveFromCart}
              >
                <Check className="h-3.5 w-3.5" />
                已加入议会
              </Button>
            ) : agent.isFree || isMember ? (
              <Button
                variant="primary"
                size="sm"
                className="flex-1 interactive"
                onClick={handlePurchase}
              >
                <Check className="h-3.5 w-3.5" />
                加入议会
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="flex-1 interactive"
                onClick={handlePurchase}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                购买
              </Button>
            )}
          </div>
        </div>

        {/* 限定 Agent 底部金色渐变线 */}
        {agent.isLimited && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
        )}
      </Card>
    </motion.div>
  );
}

export default AgentMarketCard;
