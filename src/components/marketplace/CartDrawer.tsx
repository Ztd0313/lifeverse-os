'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { getMarketAgentById } from '@/lib/marketplace-data';
import { cn } from '@/lib/utils';

/**
 * 购物车抽屉组件
 *
 * 右侧滑出抽屉，展示已加入购物车的 Agent 列表。
 * 每个 Agent 可移除，显示总价，有"结算"按钮。
 * 空购物车有提示。使用 AnimatePresence 做滑入/滑出动画。
 */
export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    openCheckout,
  } = useMarketplaceStore();

  // 计算购物车中的 Agent 列表和总价
  const cartAgents = React.useMemo(
    () =>
      cart
        .map((id) => getMarketAgentById(id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined),
    [cart]
  );

  const totalPrice = React.useMemo(
    () => cartAgents.reduce((sum, a) => sum + a.price, 0),
    [cartAgents]
  );

  // 点击结算
  const handleCheckout = () => {
    closeCart();
    openCheckout();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* 抽屉 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-border bg-bg-soft shadow-2xl"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gold" />
                <h2 className="text-base font-semibold text-text">购物车</h2>
                {cartAgents.length > 0 && (
                  <Badge variant="gold">{cartAgents.length}</Badge>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-soft transition-colors hover:bg-bg-card hover:text-text"
                aria-label="关闭购物车"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cartAgents.length === 0 ? (
                /* 空购物车 */
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-bg-card">
                    <ShoppingBag className="h-8 w-8 text-text-dim" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-soft">购物车是空的</p>
                    <p className="mt-1 text-xs text-text-dim">
                      浏览人物市场，解锁更多智者加入你的议会
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={closeCart}>
                    继续浏览
                  </Button>
                </div>
              ) : (
                /* Agent 列表 */
                <div className="space-y-3">
                  <AnimatePresence>
                    {cartAgents.map((agent) => (
                      <motion.div
                        key={agent.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border border-border bg-bg-card p-3 transition-colors hover:border-gold-dim',
                          agent.isLimited && 'border-gold-dim/50'
                        )}
                      >
                        {/* 头像 */}
                        <div
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-2xl',
                            agent.isLimited
                              ? 'border-gold-dim bg-gold-soft/20'
                              : 'border-border bg-bg-soft'
                          )}
                        >
                          {agent.avatar}
                        </div>

                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="truncate text-sm font-medium text-text">
                              {agent.name}
                            </h4>
                            {agent.isLimited && (
                              <Badge variant="gold" className="shrink-0 text-[9px]">
                                LIMITED
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-text-dim">
                            {agent.philosophy}
                          </p>
                          <p className="mt-0.5 font-serif text-sm font-semibold text-gold">
                            ¥{agent.price}
                          </p>
                        </div>

                        {/* 移除按钮 */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(agent.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-red/10 hover:text-red"
                          aria-label={`移除 ${agent.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* 底部：总价 + 结算按钮 */}
            {cartAgents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-border px-5 py-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-text-soft">共 {cartAgents.length} 位智者</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-text-dim">合计</span>
                    <span className="text-sm text-text-dim">¥</span>
                    <span className="font-serif text-2xl font-bold text-gold">
                      {totalPrice}
                    </span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                >
                  结算
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
