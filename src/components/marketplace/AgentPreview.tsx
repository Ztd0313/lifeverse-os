'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Check, Quote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RadarChart } from '@/components/charts/RadarChart';
import { TypingText } from '@/components/council/TypingText';
import { VoiceTrial } from '@/components/membership/VoiceTrial';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { useMembershipStore } from '@/stores/membership-store';
import type { MarketplaceAgent } from '@/lib/marketplace-data';
import { cn } from '@/lib/utils';

/**
 * Agent 试听弹窗组件 Props
 */
export interface AgentPreviewProps {
  /** 当前预览的 Agent（null 时不显示） */
  agent: MarketplaceAgent | null;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * Agent 试听弹窗组件
 *
 * Modal 弹窗，展示 Agent 的示例发言（打字机效果）、雷达图、哲学和说话风格。
 * 包含"购买"按钮。
 */
export function AgentPreview({ agent, onClose }: AgentPreviewProps) {
  const { ownedAgents, cart, addToCart, removeFromCart } = useMarketplaceStore();
  const { membership } = useMembershipStore();
  const isMember = membership.tier !== 'free';

  // ESC 键关闭
  React.useEffect(() => {
    if (!agent) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agent, onClose]);

  // 锁定滚动
  React.useEffect(() => {
    if (!agent) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [agent]);

  const isOwned = agent ? ownedAgents.includes(agent.id) : false;
  const isInCart = agent ? cart.includes(agent.id) : false;

  const handlePurchase = () => {
    if (!agent || isOwned || isInCart) return;
    addToCart(agent.id);
  };

  const handleRemoveFromCart = () => {
    if (!agent) return;
    removeFromCart(agent.id);
  };

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'w-full max-w-2xl overflow-hidden rounded-2xl border bg-bg-card shadow-2xl',
              agent.isLimited ? 'border-gold-dim' : 'border-border'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="relative flex items-center gap-4 border-b border-border px-6 py-5">
              {/* 头像 */}
              <div
                className={cn(
                  'flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border text-4xl',
                  agent.isLimited
                    ? 'border-gold-dim bg-gold-soft/30'
                    : 'border-border bg-bg-soft'
                )}
              >
                {agent.avatar}
              </div>

              {/* 名称 + 标签 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-text">{agent.name}</h2>
                  {agent.isLimited && (
                    <Badge variant="gold" className="gap-1">
                      <Quote className="h-2.5 w-2.5" />
                      LIMITED
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gold">{agent.nameEn}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge variant="gold">{agent.philosophy}</Badge>
                  {agent.isFree ? (
                    <Badge variant="green">免费</Badge>
                  ) : (
                    <Badge variant="blue">¥{agent.price}</Badge>
                  )}
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-soft transition-colors hover:bg-bg-soft hover:text-text"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* 左侧：示例发言 + 描述 */}
                <div className="space-y-4">
                  {/* 示例发言 */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-text-dim">
                        <Quote className="h-3 w-3" />
                        示例发言
                      </h3>
                      {/* 语音试听 — 会员可用，非会员点击跳转升级 */}
                      <VoiceTrial
                        text={agent.sample}
                        enabled={isMember || agent.isFree}
                        onUpgradeClick={() => {
                          onClose();
                          window.location.href = '/membership';
                        }}
                        size="sm"
                      />
                    </div>
                    <div className="rounded-lg border border-border bg-bg-soft p-4">
                      <div className="flex gap-2">
                        <span className="text-lg leading-tight">{agent.avatar}</span>
                        <p className="flex-1 text-sm leading-relaxed text-text">
                          <TypingText
                            text={agent.sample}
                            speed={35}
                            cursor={true}
                            cursorChar="▊"
                          />
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 描述 */}
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-dim">
                      简介
                    </h3>
                    <p className="text-sm leading-relaxed text-text-soft">
                      {agent.description}
                    </p>
                  </div>

                  {/* 说话风格 */}
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-dim">
                      说话风格
                    </h3>
                    <p className="text-sm leading-relaxed text-text-soft">
                      {agent.speakingStyle}
                    </p>
                  </div>
                </div>

                {/* 右侧：雷达图 */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-dim">
                    价值雷达
                  </h3>
                  <RadarChart
                    data={agent.radar}
                    size={220}
                    showLabels={true}
                    showGrid={true}
                    showValues={false}
                    animated={true}
                  />
                </div>
              </div>
            </div>

            {/* 底部：价格 + 购买按钮 */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div className="flex items-baseline gap-1">
                {agent.isFree ? (
                  <span className="font-serif text-xl font-semibold text-green">免费</span>
                ) : (
                  <>
                    <span className="text-sm text-text-dim">¥</span>
                    <span className="font-serif text-2xl font-bold text-gold">
                      {agent.price}
                    </span>
                  </>
                )}
              </div>

              {isOwned ? (
                <Button variant="ghost" size="md" disabled>
                  <Check className="h-4 w-4" />
                  已拥有
                </Button>
              ) : isInCart ? (
                <Button variant="gold" size="md" onClick={handleRemoveFromCart}>
                  <Check className="h-4 w-4" />
                  已加入议会
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePurchase}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {agent.isFree ? '加入议会' : `购买 ¥${agent.price}`}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AgentPreview;
