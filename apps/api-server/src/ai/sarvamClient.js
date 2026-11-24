/**
 * @file sarvamClient.js — Sarvam AI Integration for Indian Languages
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Best quality natural language generation & translation for Telugu (te),
 * Kannada (kn), and Hindi (hi) in rural public health contexts.
 */

import fetch from 'node-fetch';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_TRANSLATE_URL = 'https://api.sarvam.ai/translate';
const SARVAM_CHAT_URL = 'https://api.sarvam.ai/v1/chat/completions';
const TIMEOUT_MS = 6000;

const SARVAM_LANG_CODES = {
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN'
};

/**
 * Translate text using Sarvam AI
 *
 * @param {string} text - Source text
 * @param {string} sourceLang - 'en' | 'hi' | 'te' | 'kn' | 'mr'
 * @param {string} targetLang - 'en' | 'hi' | 'te' | 'kn' | 'mr'
 * @returns {Promise<string | null>}
 */
export async function sarvamTranslate(text, sourceLang = 'en', targetLang = 'te') {
  if (!text || !SARVAM_API_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(SARVAM_TRANSLATE_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY
      },
      body: JSON.stringify({
        input: text,
        source_language_code: SARVAM_LANG_CODES[sourceLang] || 'en-IN',
        target_language_code: SARVAM_LANG_CODES[targetLang] || 'te-IN',
        speaker_gender: 'Female',
        mode: 'formal',
        model: 'mayura:v1'
      })
    });

    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json();
    return data?.translated_text || null;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Chat completion in Indian languages using Sarvam
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} targetLang
 * @returns {Promise<string | null>}
 */
export async function sarvamChat(messages, targetLang = 'te') {
  if (!SARVAM_API_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(SARVAM_CHAT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: 'sarvam-2b',
        messages,
        temperature: 0.2,
        max_tokens: 400
      })
    });

    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}
