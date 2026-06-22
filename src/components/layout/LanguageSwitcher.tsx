'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LOCALES } from '@/lib/i18n/types';
import type { Locale } from '@/lib/i18n/types';

/**
 * 语言切换器组件
 *
 * 功能：
 * - 显示当前语言图标/缩写
 * - 点击展开下拉菜单，显示 4 个语言选项（中文、English、日本語、한국어）
 * - 每个选项有国旗 emoji
 * - 使用 Framer Motion 动画
 * - 样式与 Header 一致（深色主题、金色点缀）
 * - 独立可用，方便集成到 Header / Footer
 *
 * 使用方式：
 * ```tsx
 * <LanguageSwitcher />
 * ```
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // ESC 键关闭
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // 当前语言的信息
  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  /** 选择语言 */
  const handleSelect = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('language.title')}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-full px-3 text-sm transition-all lg:h-9',
          'text-text-soft hover:bg-bg-card hover:text-gold',
          open && 'bg-bg-card text-gold'
        )}
      >
        <Globe size={16} />
        <span className="text-xs font-medium">
          {currentLocale.flag}
        </span>
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute right-0 top-full z-50 mt-2 min-w-[160px]',
              'overflow-hidden rounded-xl border border-border bg-bg-card shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
              'backdrop-blur-md'
            )}
            role="listbox"
            aria-label={t('language.title')}
          >
            <div className="py-1">
              {LOCALES.map((l) => {
                const isActive = l.code === locale;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleSelect(l.code)}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-4 py-3 text-sm transition-colors',
                      isActive
                        ? 'bg-gold-soft/30 text-gold'
                        : 'text-text-soft hover:bg-bg-soft hover:text-text'
                    )}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span className="flex-1 text-left">{l.label}</span>
                    {isActive && <Check size={14} className="text-gold" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSwitcher;
