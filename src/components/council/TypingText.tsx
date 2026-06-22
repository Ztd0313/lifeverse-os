'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * 打字机组件 Props
 */
export interface TypingTextProps {
  /** 要逐字显示的完整文本 */
  text: string;
  /** 打字速度，单位 ms/字符，默认 40 */
  speed?: number;
  /** 是否启用光标，默认 true */
  cursor?: boolean;
  /** 光标字符，默认 ▊ */
  cursorChar?: string;
  /** 是否自动开始，默认 true */
  autoStart?: boolean;
  /** 开始延迟，单位 ms，默认 0 */
  startDelay?: number;
  /** 是否允许点击跳过，默认 true */
  skippable?: boolean;
  /** 标点符号处停顿时长，单位 ms，默认 120 */
  punctuationPause?: number;
  /** 打字完成回调 */
  onComplete?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 文本样式类名 */
  textClassName?: string;
}

/**
 * 需要停顿的标点符号
 */
const PAUSE_PUNCTUATION = ['，', '。', '！', '？', '；', '：', ',', '.', '!', '?', ';', ':', '\n'];

/**
 * 打字机文本组件
 *
 * 模拟 Agent 发言时的逐字显示效果，营造「正在实时表达」的沉浸感。
 * 支持可调打字速度、光标闪烁、标点停顿和点击跳过。
 *
 * @example
 * ```tsx
 * <TypingText
 *   text="你好，世界。"
 *   speed={40}
 *   onComplete={() => console.log('done')}
 * />
 * ```
 */
export function TypingText({
  text,
  speed = 40,
  cursor = true,
  cursorChar = '▊',
  autoStart = true,
  startDelay = 0,
  skippable = true,
  punctuationPause = 120,
  onComplete,
  className,
  textClassName,
}: TypingTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  // 保持回调引用最新
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /** 计算当前字符的延迟 */
  const getCharDelay = useCallback(
    (char: string): number => {
      let delay = speed;
      // 标点符号处额外停顿
      if (PAUSE_PUNCTUATION.includes(char)) {
        delay += punctuationPause;
      }
      // 模拟人类打字的轻微随机变化
      delay *= 0.85 + Math.random() * 0.3;
      return Math.max(delay, 10);
    },
    [speed, punctuationPause]
  );

  /** 打字核心逻辑 */
  const typeNext = useCallback(() => {
    if (indexRef.current >= text.length) {
      setIsTyping(false);
      setIsDone(true);
      onCompleteRef.current?.();
      return;
    }

    const char = text[indexRef.current];
    const newText = text.substring(0, indexRef.current + 1);
    setDisplayText(newText);
    indexRef.current += 1;

    const delay = getCharDelay(char);
    timerRef.current = setTimeout(typeNext, delay);
  }, [text, getCharDelay]);

  /** 开始打字 */
  const start = useCallback(() => {
    if (isTyping) return;
    setIsTyping(true);
    setIsDone(false);
    indexRef.current = 0;
    setDisplayText('');
    timerRef.current = setTimeout(typeNext, startDelay);
  }, [isTyping, startDelay, typeNext]);

  /** 跳过：直接显示全部文本 */
  const skip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayText(text);
    indexRef.current = text.length;
    setIsTyping(false);
    setIsDone(true);
    onCompleteRef.current?.();
  }, [text]);

  // 自动开始 & 文本变化时重置
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    indexRef.current = 0;
    setDisplayText('');
    setIsDone(false);

    if (autoStart && text) {
      setIsTyping(true);
      timerRef.current = setTimeout(typeNext, startDelay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  /** 点击跳过 */
  const handleClick = useCallback(() => {
    if (skippable && isTyping) {
      skip();
    }
  }, [skippable, isTyping, skip]);

  /** 键盘跳过 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <span
      className={cn('inline', className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={skippable && isTyping ? 'button' : undefined}
      tabIndex={skippable && isTyping ? 0 : undefined}
      aria-label={text}
    >
      <span className={textClassName}>{displayText}</span>
      {cursor && !isDone && (
        <span
          className={cn(
            'inline-block ml-0.5 text-gold font-bold',
            isTyping && 'animate-pulse'
          )}
          aria-hidden="true"
          style={{ animationDuration: '530ms' }}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
}

export default TypingText;
