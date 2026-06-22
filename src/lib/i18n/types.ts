/**
 * i18n 类型定义
 *
 * 定义支持的语言类型和翻译字典结构。
 */

/**
 * 支持的语言
 *
 * - zh: 中文（简体）
 * - en: English
 * - ja: 日本語
 * - ko: 한국어
 */
export type Locale = 'zh' | 'en' | 'ja' | 'ko';

/**
 * 支持的语言列表（用于语言切换器渲染）
 */
export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'zh', label: '中文（简体）', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

/**
 * 翻译字典类型（嵌套结构）
 *
 * 支持任意层级的嵌套对象，叶子节点为字符串。
 * 通过点号路径访问，如 t('nav.home')。
 */
export type TranslationDict = {
  [key: string]: string | TranslationDict;
};

/**
 * 翻译字典集合：每种语言对应一个翻译字典
 */
export type Translations = Record<Locale, TranslationDict>;
