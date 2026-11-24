/**
 * @file lnklingClient.js — Public API for multilingual clinical triage support
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Priority Order:
 * 1. OpenRouter (Primary: thinkingmachines/inkling-small:free -> nemotron-3-super -> gemini-flash)
 * 2. Sarvam AI (Indic quality for Telugu & Kannada)
 * 3. Bhashini (Government API fallback)
 * 4. Deterministic Clinical CDS (offline/fail-safe)
 */

import { SYSTEM_PROMPT, buildUserMessage, parseModelResponse } from './prompts.js';
import { fallbackMock } from './fallbackMock.js';
import { callOpenRouterChat, OPENROUTER_MODELS } from './openrouterClient.js';
import { sarvamTranslate, sarvamChat } from './sarvamClient.js';
import { bhashiniTranslate } from './bhashiniClient.js';

const ENABLED = process.env.LNKLING_ENABLED !== 'false';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 50;

// ─── In-memory LRU cache ───────────────────────────────────────────────────────
const _cache = new Map();

function cacheKey(input) {
  return `${(input.chiefComplaint || '').slice(0, 80)}|${input.language}|${input.pregnant ? 'P' : ''}`;
}

function cacheGet(input) {
  const k = cacheKey(input);
  const entry = _cache.get(k);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(k); return null; }
  return entry.result;
}

function cacheSet(input, result) {
  if (_cache.size >= CACHE_MAX) {
    const firstKey = _cache.keys().next().value;
    _cache.delete(firstKey);
  }
  _cache.set(cacheKey(input), { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Analyze symptoms using the multilingual model pipeline.
 *
 * Always resolves — never throws. Falls back cleanly on any API failure.
 *
 * @param {import('./types.js').LnklingInput} input
 * @returns {Promise<import('./types.js').LnklingTriageResult>}
 */
export async function analyzeSymptoms(input) {
  const targetLang = ['en', 'hi', 'mr', 'te', 'kn'].includes(input.language) ? input.language : 'en';
  input.language = targetLang;

  // 1. Check feature flag
  if (!ENABLED) {
    return fallbackMock(input);
  }

  // 2. Cache hit
  const cached = cacheGet(input);
  if (cached) return cached;

  // 3. Try OpenRouter (Inkling Small -> Nemotron Super -> Gemini Flash)
  try {
    const chatResult = await callOpenRouterChat({
      models: [
        OPENROUTER_MODELS.NEMOTRON_LIGHTNING,
        OPENROUTER_MODELS.NEMOTRON_NANO,
        OPENROUTER_MODELS.NEMOTRON_ULTRA
      ],
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(input) }
      ],
      temperature: 0.2,
      maxTokens: 1024,
      timeoutMs: 8000,
      title: 'ArogyaLink Multilingual Triage (Inkling)'
    });

    if (chatResult && chatResult.content) {
      const parsed = parseModelResponse(chatResult.content, input);
      if (parsed) {
        parsed.model = chatResult.model;
        cacheSet(input, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[lnkling] OpenRouter triage attempt failed:', err.message);
  }

  // 4. Try Sarvam AI for Telugu / Kannada conversational response if needed
  if (targetLang === 'te' || targetLang === 'kn') {
    try {
      const sarvamReply = await sarvamChat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(input) }
      ], targetLang);

      if (sarvamReply) {
        const parsed = parseModelResponse(sarvamReply, input);
        if (parsed) {
          parsed.model = 'sarvam-2b';
          cacheSet(input, parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[lnkling] Sarvam fallback failed:', err.message);
    }
  }

  // 5. Deterministic clinical CDS fallback (guaranteed valid localized response)
  const fallback = fallbackMock(input);
  cacheSet(input, fallback);
  return fallback;
}

/**
 * Translate helper with OpenRouter -> Sarvam -> Bhashini -> Direct Text pipeline
 *
 * @param {string} text
 * @param {'en' | 'hi' | 'mr' | 'te' | 'kn'} targetLang
 * @param {'en' | 'hi' | 'mr' | 'te' | 'kn'} [sourceLang='en']
 * @returns {Promise<string>}
 */
export async function translateText(text, targetLang = 'te', sourceLang = 'en') {
  if (!text || targetLang === sourceLang) return text;

  // 1. Try Sarvam for Telugu & Kannada
  if (targetLang === 'te' || targetLang === 'kn' || targetLang === 'hi') {
    const sarvamResult = await sarvamTranslate(text, sourceLang, targetLang);
    if (sarvamResult) return sarvamResult;
  }

  // 2. Try OpenRouter
  const langNames = { te: 'Telugu', kn: 'Kannada', mr: 'Marathi', hi: 'Hindi', en: 'English' };
  const targetName = langNames[targetLang] || 'English';

  try {
    const res = await callOpenRouterChat({
      models: [
        OPENROUTER_MODELS.NEMOTRON_LIGHTNING,
        OPENROUTER_MODELS.NEMOTRON_SUPER,
        OPENROUTER_MODELS.NEMOTRON_NANO
      ],
      messages: [
        {
          role: 'system',
          content: `You are a translator for a public health system. Translate the text into ${targetName}. Return ONLY the translated string with no quotes or explanation.`
        },
        { role: 'user', content: text.slice(0, 500) }
      ],
      temperature: 0.1,
      maxTokens: 256,
      timeoutMs: 4000,
      title: 'ArogyaLink Translation'
    });

    if (res && res.content) {
      return res.content.trim();
    }
  } catch (_) {}

  // 3. Try Bhashini
  const bhashiniResult = await bhashiniTranslate(text, sourceLang, targetLang);
  if (bhashiniResult) return bhashiniResult;

  return text;
}
