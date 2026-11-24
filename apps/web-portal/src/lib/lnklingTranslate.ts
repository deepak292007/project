/**
 * lnklingTranslate.ts — Thin client-side translate helper
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Calls the server's POST /api/ai/translate endpoint.
 * Falls back to the original text if the server is unavailable or
 * lnkling is offline — the app is never blocked.
 */

import type { Lang } from '../types';
import { getBaseUrl } from './api';

/**
 * Translate a short string via the lnkling server endpoint.
 * Always resolves — returns original text on any failure.
 *
 * @param text - Source text to translate (max 500 chars, trimmed server-side)
 * @param targetLang - Target language
 * @returns Translated string (or original if translation failed)
 */
export async function translate(text: string, targetLang: Lang): Promise<string> {
  if (!text) return text;
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return text;
    const json = await res.json();
    return (json?.data?.translated as string) || text;
  } catch {
    return text;
  }
}
