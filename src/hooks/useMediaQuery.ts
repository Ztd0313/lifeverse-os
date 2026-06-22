'use client';
import { useState, useEffect } from 'react';

/**
 * 响应式媒体查询 Hook
 *
 * 监听指定的媒体查询字符串，返回当前是否匹配。
 * 在 SSR 阶段返回 false，挂载后同步为真实值。
 *
 * @param query 媒体查询字符串，如 '(max-width: 1023px)'
 * @returns 当前是否匹配该媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * 是否为移动端视口（宽度 < 1024px）
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

/**
 * 是否为桌面端视口（宽度 >= 1024px）
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
