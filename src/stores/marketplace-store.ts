/**
 * 人物市场（Agent Marketplace）Zustand Store
 *
 * 管理购物车、已拥有 Agent、结算弹窗、支付历史等状态。
 * 使用 persist 中间件持久化 ownedAgents 和 paymentHistory。
 *
 * 支付流程为 mock 实现：
 * - checkout() 模拟 2 秒延迟后随机成功/失败（90% 成功率）
 * - 成功后将购物车中的 Agent 加入 ownedAgents，并记录支付历史
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';

// ===== 类型定义 =====

/**
 * 支付方式
 */
export type PaymentMethod = 'wechat' | 'alipay' | 'credit_card';

/**
 * 支付状态
 */
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

/**
 * 支付记录
 */
export interface PaymentRecord {
  /** 订单 ID */
  orderId: string;
  /** 购买的 Agent ID 列表 */
  agentIds: string[];
  /** Agent 名称列表（冗余，方便展示） */
  agentNames: string[];
  /** 支付金额（人民币） */
  amount: number;
  /** 支付方式 */
  method: PaymentMethod;
  /** 支付状态 */
  status: PaymentStatus;
  /** 支付时间（ISO 字符串） */
  paidAt: string;
  /** 优惠码（可选） */
  couponCode?: string;
  /** 优惠金额 */
  discount: number;
}

/**
 * 结算状态
 */
export type CheckoutPhase = 'idle' | 'processing' | 'success' | 'failed';

// ===== Store 接口 =====

interface MarketplaceStore {
  // ===== State =====
  /** 已拥有的 Agent ID 列表 */
  ownedAgents: string[];
  /** 购物车中的 Agent ID 列表 */
  cart: string[];
  /** 购物车是否展开 */
  isCartOpen: boolean;
  /** 结算弹窗是否展开 */
  isCheckoutOpen: boolean;
  /** 结算阶段 */
  checkoutPhase: CheckoutPhase;
  /** 支付历史 */
  paymentHistory: PaymentRecord[];
  /** 当前结算使用的支付方式 */
  currentMethod: PaymentMethod;
  /** 当前使用的优惠码 */
  couponCode: string;
  /** 优惠码对应的折扣金额 */
  discount: number;

  // ===== Actions =====
  /** 加入购物车 */
  addToCart: (agentId: string) => void;
  /** 从购物车移除 */
  removeFromCart: (agentId: string) => void;
  /** 清空购物车 */
  clearCart: () => void;
  /** 检查是否拥有某 Agent */
  ownsAgent: (agentId: string) => boolean;
  /** 检查是否在购物车中 */
  isInCart: (agentId: string) => boolean;
  /** 打开购物车 */
  openCart: () => void;
  /** 关闭购物车 */
  closeCart: () => void;
  /** 打开结算弹窗 */
  openCheckout: () => void;
  /** 关闭结算弹窗 */
  closeCheckout: () => void;
  /** 设置支付方式 */
  setPaymentMethod: (method: PaymentMethod) => void;
  /** 设置优惠码 */
  setCouponCode: (code: string) => void;
  /** 验证优惠码（mock） */
  applyCoupon: () => void;
  /** Mock 结算流程 */
  checkout: (agentNames: string[], amount: number) => Promise<boolean>;
  /** 重置结算状态 */
  resetCheckout: () => void;
  /** 退款（mock） */
  refund: (orderId: string) => void;
}

// ===== Mock 优惠码 =====

const COUPONS: Record<string, number> = {
  LIFEVERSE10: 0.1, // 9 折
  NEWUSER20: 0.2, // 8 折
  GOLD50: 0.5, // 5 折（测试用）
};

// ===== 初始已拥有的 Agent（免费 Agent）=====

const INITIAL_OWNED_AGENTS = [
  'musk',
  'buffett',
  'jobs',
  'socrates',
  'wangyangming',
  'future20',
  'future50',
  'father',
  'mother',
];

export const useMarketplaceStore = create<MarketplaceStore>()(
  persist(
    (set, get) => ({
      // ===== Initial State =====
      ownedAgents: INITIAL_OWNED_AGENTS,
      cart: [],
      isCartOpen: false,
      isCheckoutOpen: false,
      checkoutPhase: 'idle',
      paymentHistory: [],
      currentMethod: 'wechat',
      couponCode: '',
      discount: 0,

      // ===== Actions =====

      addToCart: (agentId) =>
        set((state) => {
          if (state.cart.includes(agentId)) return state;
          if (state.ownedAgents.includes(agentId)) return state;
          return { cart: [...state.cart, agentId] };
        }),

      removeFromCart: (agentId) =>
        set((state) => ({
          cart: state.cart.filter((id) => id !== agentId),
        })),

      clearCart: () => set({ cart: [] }),

      ownsAgent: (agentId) => get().ownedAgents.includes(agentId),

      isInCart: (agentId) => get().cart.includes(agentId),

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      openCheckout: () => set({ isCheckoutOpen: true, checkoutPhase: 'idle' }),
      closeCheckout: () =>
        set({ isCheckoutOpen: false, checkoutPhase: 'idle', couponCode: '', discount: 0 }),

      setPaymentMethod: (method) => set({ currentMethod: method }),

      setCouponCode: (code) => set({ couponCode: code }),

      applyCoupon: () => {
        const { couponCode } = get();
        const upperCode = couponCode.trim().toUpperCase();
        if (COUPONS[upperCode]) {
          set({ discount: COUPONS[upperCode] });
        } else {
          set({ discount: 0 });
        }
      },

      checkout: async (agentNames, amount) => {
        set({ checkoutPhase: 'processing' });

        // Mock 2 秒延迟
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 90% 成功率
        const isSuccess = Math.random() < 0.9;

        if (isSuccess) {
          const state = get();
          const { cart, currentMethod, couponCode, discount } = state;
          const finalAmount = Math.round(amount * (1 - discount));

          const record: PaymentRecord = {
            orderId: `ord-${generateId()}`,
            agentIds: [...cart],
            agentNames,
            amount: finalAmount,
            method: currentMethod,
            status: 'success',
            paidAt: new Date().toISOString(),
            couponCode: couponCode || undefined,
            discount,
          };

          set({
            checkoutPhase: 'success',
            ownedAgents: [...state.ownedAgents, ...cart],
            cart: [],
            paymentHistory: [record, ...state.paymentHistory],
          });

          return true;
        } else {
          set({ checkoutPhase: 'failed' });
          return false;
        }
      },

      resetCheckout: () => set({ checkoutPhase: 'idle' }),

      refund: (orderId) =>
        set((state) => ({
          paymentHistory: state.paymentHistory.map((r) =>
            r.orderId === orderId ? { ...r, status: 'refunded' as const } : r
          ),
        })),
    }),
    {
      name: 'lifeverse-marketplace',
      partialize: (state) => ({
        ownedAgents: state.ownedAgents,
        paymentHistory: state.paymentHistory,
      }),
    }
  )
);
