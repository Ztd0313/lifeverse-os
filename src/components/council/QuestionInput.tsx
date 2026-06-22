'use client';

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

/**
 * 问题输入组件 Props
 */
interface QuestionInputProps {
  /** 提交回调，接收问题文本 */
  onSubmit: (question: string) => void;
  /** 输入框占位提示文本 */
  placeholder?: string;
  /** 预设问题标签列表，点击可快速填入 */
  presets?: string[];
  /** 最大字数，默认 500 */
  maxLength?: number;
  /** 是否禁用输入 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 默认占位文本翻译 key
 */
const DEFAULT_PLACEHOLDER_KEY = 'council.questionInput.placeholder';

/**
 * 默认预设问题翻译 keys
 */
const DEFAULT_PRESET_KEYS: string[] = [
  'council.questionInput.preset1',
  'council.questionInput.preset2',
  'council.questionInput.preset3',
  'council.questionInput.preset4',
];

/**
 * 问题输入组件
 *
 * 用于议会开始前收集用户的人生议题。包含大文本输入框、
 * 字数统计、预设问题标签和发光提交按钮。
 * 支持回车提交、Shift+回车换行。
 *
 * @example
 * ```tsx
 * <QuestionInput
 *   onSubmit={(q) => console.log(q)}
 *   presets={['我应该换工作吗？']}
 * />
 * ```
 */
export function QuestionInput({
  onSubmit,
  placeholder,
  presets,
  maxLength = 500,
  disabled = false,
  className,
}: QuestionInputProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t(DEFAULT_PLACEHOLDER_KEY);
  const resolvedPresets = presets ?? DEFAULT_PRESET_KEYS.map((key) => t(key));
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const canSubmit = value.trim().length > 0 && !disabled;
  const isNearLimit = charCount >= maxLength * 0.9;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
    textareaRef.current?.blur();
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter 提交，Shift+Enter 换行
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handlePresetClick = useCallback(
    (preset: string) => {
      setValue(preset);
      textareaRef.current?.focus();
    },
    []
  );

  return (
    <motion.div
      className={cn(
        'relative w-full rounded-xl border bg-bg-card/80 backdrop-blur-sm',
        'transition-colors duration-300',
        isFocused ? 'border-gold-dim' : 'border-border',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* 聚焦时金色发光 */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow:
                '0 0 24px rgba(201, 168, 76, 0.15), inset 0 0 1px rgba(201, 168, 76, 0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* 预设问题标签 */}
      {resolvedPresets.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {resolvedPresets.map((preset, idx) => (
            <motion.button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'rounded-full border px-3 py-2 text-xs',
                'border-border bg-bg-soft text-text-soft',
                'hover:border-gold-dim hover:text-gold',
                'transition-colors duration-200'
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {preset}
            </motion.button>
          ))}
        </div>
      )}

      {/* 文本输入区 */}
      <div className="relative px-4 pt-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={resolvedPlaceholder}
          maxLength={maxLength}
          rows={4}
          disabled={disabled}
          className={cn(
            'w-full resize-none bg-transparent text-text',
            'placeholder:text-text-dim',
            'focus:outline-none',
            'text-sm leading-relaxed',
            'min-h-[100px]'
          )}
          aria-label={t('council.questionInput.ariaLabel')}
        />
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        {/* 字数统计 */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs tabular-nums transition-colors duration-200',
              isNearLimit ? 'text-orange' : 'text-text-dim'
            )}
          >
            {charCount}
            <span className="text-text-dim"> / {maxLength}</span>
          </span>
        </div>

        {/* 提交按钮 */}
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'relative flex items-center gap-2 rounded-lg px-5 py-2.5 sm:py-2',
            'text-sm font-medium transition-all duration-300',
            canSubmit
              ? 'bg-gold text-bg hover:bg-gold/90'
              : 'bg-bg-soft text-text-dim cursor-not-allowed'
          )}
          whileHover={canSubmit ? { scale: 1.03 } : {}}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          aria-label={t('council.questionInput.submitLabel')}
        >
          {/* 发光效果 */}
          {canSubmit && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-lg"
              animate={{
                boxShadow: [
                  '0 0 12px rgba(201, 168, 76, 0.3)',
                  '0 0 24px rgba(201, 168, 76, 0.5)',
                  '0 0 12px rgba(201, 168, 76, 0.3)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
          <span className="relative">{t('council.questionInput.submitButton')}</span>
          <svg
            className="relative h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default QuestionInput;
