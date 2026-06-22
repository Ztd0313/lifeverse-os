'use client';

import * as React from 'react';
import { useI18nStore, applyLocaleToDocument } from '@/stores/i18n-store';
import type { Locale } from './types';

/**
 * useTranslation Hook
 *
 * 返回当前 locale、setLocale 方法和 t 翻译函数。
 *
 * 使用方式：
 * ```tsx
 * function MyComponent() {
 *   const { t, locale, setLocale } = useTranslation();
 *   return <h1>{t('nav.home')}</h1>;
 * }
 * ```
 */
export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  const t = useI18nStore((state) => state.t);

  return { t, locale, setLocale } as {
    t: (key: string, vars?: Record<string, string | number>) => string;
    locale: Locale;
    setLocale: (locale: Locale) => void;
  };
}

/**
 * I18nProvider 组件
 *
 * 包裹整个应用，负责：
 * 1. 从 i18n-store 获取当前 locale
 * 2. 将 locale 同步到 <html lang="..."> 属性
 * 3. 通过 Context 向子组件提供翻译能力（可选，主要靠 useTranslation hook）
 *
 * 使用方式：
 * ```tsx
 * <I18nProvider>
 *   <App />
 * </I18nProvider>
 * ```
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useI18nStore((state) => state.locale);

  // locale 变化时同步到 <html lang="...">
  React.useEffect(() => {
    applyLocaleToDocument(locale);
  }, [locale]);

  return <>{children}</>;
}

export default I18nProvider;
