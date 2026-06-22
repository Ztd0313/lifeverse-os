'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * 打字机组件 Props
 */
export interface TypingTextProps {
  /** 要逐字显示的完整文本 */
  text: string;
  /** 打字速度，单位 ms/字符，默认 50 */
  speed?: number;
  /** 打字完成回调 */
  onComplete?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 是否显示光标，默认 true */
  showCursor?: boolean;
}

/**
 * 标点停顿规则
 * - 逗号（中/英）：停 200ms
 * - 句号（中/英）：停 400ms
 * - 其他标点（！？；：）：停 200ms
 */
function getPunctuationPause(char: string): number {
  if (char === '。' || char === '.') return 400;
  if (char === '，' || char === ',') return 200;
  if (['！', '!', '？', '?', '；', ';', '：', ':'].includes(char)) {
    return 200;
  }
  return 0;
}

/**
 * 打字机效果组件
 *
 * 特性：
 * - 逐字显示文本
 * - 使用 setTimeout 链式调用（支持变速）
 * - 光标闪烁动画
 * - 标点符号处自动停顿（逗号 200ms，句号 400ms）
 * - 尊重 prefers-reduced-motion：启用时直接显示全文
 * - 组件卸载时清理定时器，无内存泄漏
 * - 文本变化时自动重置并重新开始
 */
export function TypingText({
  text,
  speed = 50,
  onComplete,
  className,
  showCursor = true,
}: TypingTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  // 保持回调最新引用，避免重新触发打字循环
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /** 清理当前定时器 */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** 打字核心逻辑：递归 setTimeout */
  const typeNext = useCallback(() => {
    if (indexRef.current >= text.length) {
      setIsDone(true);
      onCompleteRef.current?.();
      return;
    }

    const char = text[indexRef.current];
    const nextText = text.substring(0, indexRef.current + 1);
    setDisplayText(nextText);
    indexRef.current += 1;

    // 计算下一字符延迟：基础速度 + 标点停顿
    const pause = getPunctuationPause(char);
    const delay = Math.max(speed + pause, 10);
    timerRef.current = setTimeout(typeNext, delay);
  }, [text, speed]);

  useEffect(() => {
    // 重置状态
    clearTimer();
    indexRef.current = 0;
    setDisplayText('');
    setIsDone(false);

    if (!text) {
      setIsDone(true);
      onCompleteRef.current?.();
      return;
    }

    // 尊重 prefers-reduced-motion：直接显示全文
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayText(text);
      indexRef.current = text.length;
      setIsDone(true);
      onCompleteRef.current?.();
      return;
    }

    // 启动打字
    timerRef.current = setTimeout(typeNext, speed);

    return () => {
      clearTimer();
    };
    // 仅在 text 或 speed 变化时重新触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return (
    <span
      className={cn('inline-block', className)}
      role="text"
      aria-label={text}
    >
      <span aria-hidden="true">{displayText}</span>
      {showCursor && (
        <span
          className={cn(
            'inline-block ml-0.5 font-bold text-gold',
            isDone ? 'animate-blink-done' : 'animate-blink'
          )}
          aria-hidden="true"
          style={{
            animation: isDone
              ? 'blink 1.2s step-end infinite'
              : 'blink 0.8s step-end infinite',
          }}
        >
          ▊
        </span>
      )}
    </span>
  );
}

export default TypingText;
