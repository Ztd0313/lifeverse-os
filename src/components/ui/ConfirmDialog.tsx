'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 确认弹窗变体
 *
 * - danger: 危险操作（如删除、清除），红色确认按钮
 * - warning: 警告操作（如导入数据覆盖），橙色确认按钮
 * - info: 普通信息确认，金色确认按钮
 */
type ConfirmVariant = 'danger' | 'warning' | 'info';

/**
 * ConfirmDialog 组件 Props
 */
export interface ConfirmDialogProps {
  /** 是否可见 */
  open: boolean;
  /** 标题 */
  title: string;
  /** 提示消息（可包含 JSX） */
  message: React.ReactNode;
  /** 确认按钮文案，默认 "确认" */
  confirmText?: string;
  /** 取消按钮文案，默认 "取消" */
  cancelText?: string;
  /** 确认回调 */
  onConfirm: () => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 变体，默认 'info' */
  variant?: ConfirmVariant;
  /** 是否禁用确认按钮（如加载中） */
  confirmDisabled?: boolean;
  /** 确认按钮加载状态文案 */
  loadingText?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 变体配置
 */
const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: typeof Info;
    iconColor: string;
    iconBg: string;
    confirmBg: string;
    confirmHover: string;
    ringColor: string;
  }
> = {
  danger: {
    icon: AlertOctagon,
    iconColor: 'text-red',
    iconBg: 'bg-[rgba(232,93,93,0.12)]',
    confirmBg: 'bg-red',
    confirmHover: 'hover:bg-[#f47171]',
    ringColor: 'ring-red/30',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange',
    iconBg: 'bg-[rgba(232,160,93,0.12)]',
    confirmBg: 'bg-orange',
    confirmHover: 'hover:bg-[#f5b878]',
    ringColor: 'ring-orange/30',
  },
  info: {
    icon: Info,
    iconColor: 'text-gold',
    iconBg: 'bg-gold-soft',
    confirmBg: 'bg-gold',
    confirmHover: 'hover:bg-[#d9b85e]',
    ringColor: 'ring-gold/30',
  },
};

/**
 * 通用确认弹窗组件
 *
 * 用于需要二次确认的操作（如删除、清除历史、导入覆盖等）。
 * 使用 AnimatePresence 做入场/退场动画。
 *
 * 特性：
 * - 3 种变体：danger（红色）/ warning（橙色）/ info（金色）
 * - ESC 键关闭
 * - 点击遮罩关闭
 * - 锁定背景滚动
 * - 无障碍：role="dialog" + aria-modal
 *
 * 使用方式：
 * ```tsx
 * <ConfirmDialog
 *   open={open}
 *   title="确认清除历史记录"
 *   message="此操作将删除所有议会记录，不可恢复。确定继续吗？"
 *   variant="danger"
 *   confirmText="确认清除"
 *   onConfirm={handleClear}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'info',
  confirmDisabled = false,
  loadingText,
  className,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  // ESC 键关闭
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDisabled) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel, confirmDisabled]);

  // 锁定背景滚动
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !confirmDisabled && onCancel()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
        >
          <motion.div
            key="confirm-dialog-content"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-md overflow-hidden rounded-[14px] border border-border bg-bg-card shadow-[0_8px_40px_rgba(0,0,0,0.5)]',
              className
            )}
          >
            {/* 顶部装饰条（按变体着色） */}
            <div
              className={cn('h-1 w-full', config.confirmBg)}
              aria-hidden="true"
            />

            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={() => !confirmDisabled && onCancel()}
              aria-label="关闭"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-soft hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 内容区 */}
            <div className="px-6 pb-6 pt-5">
              {/* 图标 + 标题 */}
              <div className="mb-4 flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    config.iconBg
                  )}
                >
                  <Icon className={cn('h-5 w-5', config.iconColor)} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3
                    id="confirm-dialog-title"
                    className="text-base font-semibold text-text"
                  >
                    {title}
                  </h3>
                </div>
              </div>

              {/* 消息 */}
              <div
                id="confirm-dialog-message"
                className="mb-6 text-sm leading-relaxed text-text-soft"
              >
                {message}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={confirmDisabled}
                  className="inline-flex h-10 items-center justify-center rounded-[14px] border border-border bg-bg-card px-5 text-sm font-medium text-text-soft transition-all hover:border-gold-dim hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-60',
                    config.confirmBg,
                    config.confirmHover
                  )}
                >
                  {confirmDisabled && loadingText ? loadingText : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
