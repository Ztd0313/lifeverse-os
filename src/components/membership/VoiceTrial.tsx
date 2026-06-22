'use client';

import * as React from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 语音试听组件
 *
 * 使用浏览器原生 Web Speech API (SpeechSynthesis) 实现文本朗读。
 * 会员可使用语音试听功能，免费用户显示升级提示。
 *
 * 用法：
 * <VoiceTrial text="试听文字" enabled={true} />
 */

interface VoiceTrialProps {
  /** 要朗读的文本 */
  text: string;
  /** 是否启用（会员校验） */
  enabled: boolean;
  /** 语言 */
  lang?: string;
  /** 按钮尺寸 */
  size?: 'sm' | 'md';
  /** 自定义类名 */
  className?: string;
  /** 升级回调 */
  onUpgradeClick?: () => void;
}

export function VoiceTrial({
  text,
  enabled,
  lang = 'zh-CN',
  size = 'sm',
  className,
  onUpgradeClick,
}: VoiceTrialProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // 组件卸载时停止朗读
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!enabled) {
      onUpgradeClick?.();
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    // 如果正在播放，停止
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    // 创建语音合成请求
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border transition-all',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        enabled
          ? 'border-gold-dim bg-gold-soft/50 text-gold hover:bg-gold-soft interactive'
          : 'border-border bg-bg-card/50 text-text-dim hover:text-text-soft cursor-pointer',
        className
      )}
      aria-label={enabled ? (isPlaying ? '停止试听' : '语音试听') : '升级解锁语音试听'}
      title={enabled ? (isPlaying ? '停止试听' : '语音试听') : '升级会员解锁语音试听'}
    >
      {isLoading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : isPlaying ? (
        <Square size={iconSize} className="fill-current" />
      ) : (
        <Volume2 size={iconSize} />
      )}
      <span>{enabled ? (isPlaying ? '停止' : '试听') : '试听'}</span>
      {!enabled && (
        <span className="text-[10px] text-gold/60">PRO</span>
      )}
    </button>
  );
}

export default VoiceTrial;
