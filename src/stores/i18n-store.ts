/**
 * i18n Store（Zustand + persist）
 *
 * 管理当前语言（locale），状态持久化到 localStorage。
 * 提供 `t(key)` 翻译函数，支持点号嵌套路径（如 `t('nav.home')`）。
 *
 * 使用方式：
 * ```tsx
 * import { useI18nStore } from '@/stores/i18n-store';
 *
 * const { locale, setLocale, t } = useI18nStore();
 * const homeLabel = t('nav.home'); // "首页" / "Home" / ...
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale, TranslationDict } from '@/lib/i18n/types';
import {
  zhTranslations,
  enTranslations,
  jaTranslations,
  koTranslations,
} from '@/lib/i18n/translations';

/** 所有语言的翻译字典映射 */
const TRANSLATIONS: Record<Locale, TranslationDict> = {
  zh: zhTranslations,
  en: enTranslations,
  ja: jaTranslations,
  ko: koTranslations,
};

/**
 * 根据点号路径从翻译字典中获取值
 *
 * @param dict 翻译字典
 * @param key  点号路径，如 'nav.home'
 * @returns 找到的字符串值；未找到时返回 null
 */
function getValueByPath(dict: TranslationDict, key: string): string | null {
  const keys = key.split('.');
  let current: string | TranslationDict = dict;

  for (const k of keys) {
    if (typeof current === 'string' || current === null || current === undefined) {
      return null;
    }
    current = (current as TranslationDict)[k];
    if (current === undefined) {
      return null;
    }
  }

  return typeof current === 'string' ? current : null;
}

/**
 * 简单的模板变量替换
 *
 * 支持将翻译字符串中的 `{varName}` 占位符替换为实际值。
 * 例如：t('profile.seatsUsed', { used: 3, total: 10 }) => "3 / 10 个席位已使用"
 *
 * @param template 含占位符的模板字符串
 * @param vars     变量键值对
 * @returns 替换后的字符串
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value !== undefined ? String(value) : `{${name}}`;
  });
}

interface I18nStore {
  /** 当前语言 */
  locale: Locale;
  /** 设置当前语言 */
  setLocale: (locale: Locale) => void;
  /**
   * 翻译函数
   *
   * @param key  点号路径，如 'nav.home'
   * @param vars 模板变量（可选），用于替换 {varName} 占位符
   * @returns 翻译后的字符串；找不到 key 时返回 key 本身
   */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set, get) => ({
      locale: 'zh',
      setLocale: (locale) => set({ locale }),
      t: (key, vars) => {
        const { locale } = get();
        const dict = TRANSLATIONS[locale] ?? zhTranslations;
        const value = getValueByPath(dict, key);
        if (value === null) {
          // 找不到时返回 key 本身
          return key;
        }
        return interpolate(value, vars);
      },
    }),
    {
      name: 'lifeverse_locale',
      // 仅持久化 locale 字段
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

/**
 * 非 hook 版本的翻译函数
 *
 * 用于 Zustand store 等无法使用 React hook 的场景。
 * 直接从 i18n store 的 state 中获取 locale 和翻译字典，返回 t 函数。
 *
 * 使用方式：
 * ```ts
 * import { getT } from '@/stores/i18n-store';
 * const t = getT();
 * const msg = t('auth.notLoggedIn');
 * ```
 */
export function getT(): (key: string, vars?: Record<string, string | number>) => string {
  const { locale } = useI18nStore.getState();
  const dict = TRANSLATIONS[locale] ?? zhTranslations;
  return (key: string, vars?: Record<string, string | number>) => {
    const value = getValueByPath(dict, key);
    if (value === null) {
      return key;
    }
    return interpolate(value, vars);
  };
}

/**
 * 将当前 locale 同步到 document.documentElement 的 lang 属性。
 *
 * 在客户端组件挂载时调用，确保 SSR 后 lang 属性能正确同步到 DOM。
 */
export function applyLocaleToDocument(locale: Locale): void {
  if (typeof document === 'undefined') return;
  const langMap: Record<Locale, string> = {
    zh: 'zh-CN',
    en: 'en',
    ja: 'ja',
    ko: 'ko',
  };
  document.documentElement.setAttribute('lang', langMap[locale]);
}
