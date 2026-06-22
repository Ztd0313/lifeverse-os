'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 管理后台弹窗组件 Props
 */
export interface AdminModalProps {
  /** 是否可见 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 宽度（CSS 值，默认 560px） */
  width?: string;
  /** 是否显示底部按钮区 */
  footer?: React.ReactNode;
  /** 内容 */
  children: React.ReactNode;
}

/**
 * 管理后台弹窗组件
 *
 * 特性：
 * - 居中遮罩 + 毛玻璃弹窗
 * - ESC 键关闭
 * - 点击遮罩关闭
 * - 深色主题
 * - 支持自定义底部按钮
 */
export function AdminModal({
  open,
  onClose,
  title,
  width = '560px',
  footer,
  children,
}: AdminModalProps) {
  // ESC 键关闭
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // 锁定滚动
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          'max-h-[90vh] overflow-hidden rounded-lg border border-border bg-bg-card shadow-2xl',
          'animate-fade-in'
        )}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {title && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-text">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded text-text-soft transition-colors hover:bg-bg-card-hover hover:text-text"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 内容区 */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">{children}</div>

        {/* 底部按钮区 */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminModal;
