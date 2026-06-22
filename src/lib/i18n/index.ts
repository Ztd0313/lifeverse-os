/**
 * i18n 模块统一导出
 *
 * 使用方式：
 * ```tsx
 * import { useTranslation, I18nProvider, type Locale } from '@/lib/i18n';
 * ```
 */

export type { Locale, TranslationDict, Translations } from './types';
export { LOCALES } from './types';
export {
  zhTranslations,
  enTranslations,
  jaTranslations,
  koTranslations,
} from './translations';
export { useTranslation, I18nProvider } from './provider';
