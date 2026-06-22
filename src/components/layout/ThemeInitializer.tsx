'use client';

import { useEffect } from 'react';
import { useThemeStore, applyThemeToDocument } from '@/stores/theme-store';

/**
 * 主题初始化器（客户端组件）
 *
 * 在应用根节点挂载时：
 * 1. 从 localStorage 读取已持久化的主题（由 zustand persist 自动恢复）
 * 2. 将 data-theme 属性同步到 <html> 元素
 * 3. 订阅 theme-store 变化，主题切换时实时更新 DOM
 *
 * 同时在 <head> 中注入一段内联脚本，在 React hydration 之前
 * 根据 localStorage 设置 data-theme，避免主题闪烁（FOUC）。
 */
export function ThemeInitializer() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return null;
}

/**
 * 内联脚本字符串：在 hydration 之前执行，避免主题闪烁。
 *
 * 直接读取 localStorage 中 zustand persist 存储的 theme 值，
 * 并设置 <html data-theme="...">。
 */
export const themeInlineScript = `
(function() {
  try {
    var stored = localStorage.getItem('lifeverse-theme');
    var theme = 'dark';
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.state && parsed.state.theme) {
        theme = parsed.state.theme;
      }
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default ThemeInitializer;
