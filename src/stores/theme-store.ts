/**
 * 主题 Store（Zustand + persist）
 *
 * 管理深色 / 浅色主题切换，状态持久化到 localStorage。
 *
 * 使用方式：
 * ```tsx
 * import { useThemeStore } from '@/stores/theme-store';
 *
 * const { theme, toggleTheme, setTheme } = useThemeStore();
 * ```
 *
 * 主题应用：在 `app/layout.tsx` 中读取 theme 并设置 `data-theme` 属性到 <html> 或 <body>，
 * globals.css 中通过 `[data-theme="light"]` 选择器覆盖 CSS 变量。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

interface ThemeStore {
  /** 当前主题 */
  theme: Theme;
  /** 切换深色 / 浅色主题 */
  toggleTheme: () => void;
  /** 设置指定主题 */
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'lifeverse-theme',
      // 仅持久化 theme 字段
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

/**
 * 将当前主题应用到 document.documentElement 的 data-theme 属性。
 *
 * 在客户端组件挂载时调用，确保 SSR 后主题能正确同步到 DOM。
 */
export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}
