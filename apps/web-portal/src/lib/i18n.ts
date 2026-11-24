/**
 * ArogyaLink — i18n hook
 * Usage:  const t = useT();   t('save') → 'जतन करा' (when lang=mr)
 */
import { useSession } from '../store';
import { translations } from '../translations';
import type { Language } from '../translations';

export type TKey = keyof typeof translations['en'];

export function useT() {
  const { lang } = useSession();
  const dict = translations[(lang as Language)] ?? translations['en'];
  return function t(key: TKey, fallback?: string): string {
    return (dict as Record<string, string>)[key] ?? (translations['en'] as Record<string, string>)[key] ?? fallback ?? String(key);
  };
}

/** Non-hook version for use outside React components */
export function getT(lang: Language) {
  const dict = translations[lang] ?? translations['en'];
  return function t(key: TKey, fallback?: string): string {
    return (dict as Record<string, string>)[key] ?? (translations['en'] as Record<string, string>)[key] ?? fallback ?? String(key);
  };
}
