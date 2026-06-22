'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMarketplaceStore, type PaymentMethod } from '@/stores/marketplace-store';
import { getMarketAgentById } from '@/lib/marketplace-data';
import { cn } from '@/lib/utils';

/**
 * 支付方式配置
 */
const PAYMENT_METHODS: {
  key: PaymentMethod;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: 'wechat', label: '微信支付', icon: '💬', color: '#5de8a0' },
  { key: 'alipay', label: '支付宝', icon: '💰', color: '#5da0e8' },
  { key: 'credit_card', label: '信用卡', icon: '💳', color: '#e8a05d' },
];

/**
 * 结算弹窗组件
 *
 * Modal 弹窗，展示订单摘要、支付方式选择、优惠码输入。
 * 点击"确认支付"后模拟 2 秒延迟，展示支付成功/失败状态。
 * 支付成功：打勾动画 + "已解锁 X 位智者"。
 * 支付失败：错误提示 + 重试按钮。
 */
export function CheckoutModal() {
  const {
    isCheckoutOpen,
    checkoutPhase,
    cart,
    currentMethod,
    couponCode,
    discount,
    closeCheckout,
    setPaymentMethod,
    setCouponCode,
    applyCoupon,
    checkout,
    resetCheckout,
  } = useMarketplaceStore();

  // 购物车中的 Agent 列表
  const cartAgents = React.useMemo(
    () =>
      cart
        .map((id) => getMarketAgentById(id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined),
    [cart]
  );

  // 原始总价
  const originalPrice = React.useMemo(
    () => cartAgents.reduce((sum, a) => sum + a.price, 0),
    [cartAgents]
  );

  // 折后价
  const finalPrice = Math.round(originalPrice * (1 - discount));
  const discountAmount = originalPrice - finalPrice;

  // 优惠码是否已应用
  const [couponApplied, setCouponApplied] = React.useState(false);

  // 处理优惠码应用
  const handleApplyCoupon = () => {
    applyCoupon();
    setCouponApplied(true);
  };

  // 处理支付
  const handlePay = async () => {
    const agentNames = cartAgents.map((a) => a.name);
    await checkout(agentNames, originalPrice);
  };

  // 处理重试
  const handleRetry = () => {
    resetCheckout();
  };

  // 处理关闭
  const handleClose = () => {
    closeCheckout();
    setCouponApplied(false);
  };

  // ESC 键关闭（仅在非处理中状态）
  React.useEffect(() => {
    if (!isCheckoutOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && checkoutPhase !== 'processing') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutOpen, checkoutPhase]);

  // 锁定滚动
  React.useEffect(() => {
    if (!isCheckoutOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isCheckoutOpen]);

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={checkoutPhase === 'processing' ? undefined : handleClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== 处理中状态 ===== */}
            {checkoutPhase === 'processing' && (
              <div className="flex flex-col items-center justify-center gap-6 px-6 py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-dim border-t-gold"
                >
                  <Loader2 className="h-7 w-7 animate-spin text-gold" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-text">支付处理中</h3>
                  <p className="mt-1 text-sm text-text-soft">正在安全处理您的支付...</p>
                </div>
              </div>
            )}

            {/* ===== 成功状态 ===== */}
            {checkoutPhase === 'success' && (
              <div className="flex flex-col items-center justify-center gap-6 px-6 py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-green bg-[rgba(93,232,160,0.12)]"
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Check className="h-10 w-10 text-green" strokeWidth={3} />
                  </motion.div>
                </motion.div>
                <div className="text-center">
                  <h3 className="font-serif text-xl font-semibold text-gradient-gold">
                    支付成功
                  </h3>
                  <p className="mt-2 text-sm text-text-soft">
                    已解锁 <span className="font-semibold text-gold">{cartAgents.length}</span> 位智者，他们已加入你的议会
                  </p>
                </div>
                <div className="w-full rounded-lg border border-border bg-bg-soft p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-dim">支付金额</span>
                    <span className="font-semibold text-text">¥{finalPrice}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-text-dim">支付方式</span>
                    <span className="text-text-soft">
                      {PAYMENT_METHODS.find((m) => m.key === currentMethod)?.label}
                    </span>
                  </div>
                </div>
                <Button variant="primary" size="lg" className="w-full" onClick={handleClose}>
                  完成
                </Button>
              </div>
            )}

            {/* ===== 失败状态 ===== */}
            {checkoutPhase === 'failed' && (
              <div className="flex flex-col items-center justify-center gap-6 px-6 py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-red bg-[rgba(232,93,93,0.12)]"
                >
                  <AlertCircle className="h-10 w-10 text-red" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-red">支付失败</h3>
                  <p className="mt-1 text-sm text-text-soft">
                    支付过程中出现问题，请重试或更换支付方式
                  </p>
                </div>
                <div className="flex w-full gap-3">
                  <Button variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
                    取消
                  </Button>
                  <Button variant="primary" size="lg" className="flex-1" onClick={handleRetry}>
                    <RotateCcw className="h-4 w-4" />
                    重试
                  </Button>
                </div>
              </div>
            )}

            {/* ===== 正常状态（订单摘要 + 支付） ===== */}
            {checkoutPhase === 'idle' && (
              <>
                {/* 头部 */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-base font-semibold text-text">结算</h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-soft transition-colors hover:bg-bg-soft hover:text-text"
                    aria-label="关闭"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* 内容区 */}
                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                  {/* 订单摘要 */}
                  <div className="mb-5">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-dim">
                      订单摘要
                    </h3>
                    <div className="space-y-2">
                      {cartAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 rounded-lg border border-border-soft bg-bg-soft p-2.5"
                        >
                          <span className="text-xl">{agent.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-text">
                                {agent.name}
                              </span>
                              {agent.isLimited && (
                                <Badge variant="gold" className="shrink-0 text-[9px]">
                                  LIMITED
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-text-dim">
                              {agent.philosophy}
                            </p>
                          </div>
                          <span className="font-serif text-sm font-semibold text-gold">
                            ¥{agent.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 优惠码 */}
                  <div className="mb-5">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-dim">
                      优惠码
                    </h3>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponApplied(false);
                          }}
                          placeholder="输入优惠码（试试 LIFEVERSE10）"
                          className="w-full rounded-lg border border-border bg-bg-soft py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
                          disabled={couponApplied && discount > 0}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || (couponApplied && discount > 0)}
                      >
                        {couponApplied && discount > 0 ? '已应用' : '应用'}
                      </Button>
                    </div>
                    {couponApplied && discount === 0 && couponCode.trim() && (
                      <p className="mt-1.5 text-xs text-red">优惠码无效</p>
                    )}
                    {couponApplied && discount > 0 && (
                      <p className="mt-1.5 text-xs text-green">
                        已享受 {Math.round(discount * 100)}% 折扣
                      </p>
                    )}
                  </div>

                  {/* 支付方式 */}
                  <div className="mb-5">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-dim">
                      支付方式
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.key}
                          type="button"
                          onClick={() => setPaymentMethod(method.key)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all',
                            currentMethod === method.key
                              ? 'border-gold bg-gold-soft/30'
                              : 'border-border bg-bg-soft hover:border-gold-dim'
                          )}
                        >
                          <span className="text-2xl">{method.icon}</span>
                          <span
                            className={cn(
                              'text-xs',
                              currentMethod === method.key ? 'text-gold' : 'text-text-soft'
                            )}
                          >
                            {method.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 价格明细 */}
                  <div className="rounded-lg border border-border bg-bg-soft p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-soft">商品合计</span>
                      <span className="text-text-soft">¥{originalPrice}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-green">优惠折扣</span>
                        <span className="text-green">-¥{discountAmount}</span>
                      </div>
                    )}
                    <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-text">实付金额</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-sm text-text-dim">¥</span>
                        <span className="font-serif text-2xl font-bold text-gold">
                          {finalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className="border-t border-border px-6 py-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handlePay}
                    disabled={cartAgents.length === 0}
                  >
                    确认支付 ¥{finalPrice}
                  </Button>
                  <p className="mt-2 text-center text-[11px] text-text-dim">
                    支付即表示同意 LifeVerse 服务条款 · 模拟支付环境
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CheckoutModal;
