/**
 * @file openrouterClient.js — Unified OpenRouter API Client
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Primary Models:
 * - Triage & Multilingual Conversation: thinkingmachines/inkling-small:free
 * - Hospital Ranking & Clinical Reasoning: nvidia/nemotron-3-ultra-550b-a55b:free
 *
 * Fallbacks:
 * - nvidia/nemotron-3-super-120b-a12b:free
 * - google/gemini-2.0-flash-lite-preview-02-05:free
 * - meta-llama/llama-3.3-70b-instruct:free
 */

import fetch from 'node-fetch';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY ||
  process.env.OPENROUTER_NEMOTRON_API_KEY ||
  '';

export const OPENROUTER_MODELS = {
  NEMOTRON_LIGHTNING: 'nvidia/nemotron-3.5-lightning:free',
  NEMOTRON_NANO: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  NEMOTRON_ULTRA: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  NEMOTRON_SUPER: 'nvidia/nemotron-3-super-120b-a12b:free'
};

/**
 * Send a chat completion request to OpenRouter with automatic model fallback
 *
 * @param {Object} options
 * @param {string[]} options.models - Array of model names in priority order
 * @param {Array<{role: string, content: string}>} options.messages
 * @param {number} [options.temperature=0.2]
 * @param {number} [options.maxTokens=1024]
 * @param {number} [options.timeoutMs=5000]
 * @param {string} [options.title='ArogyaLink Multilingual CDS']
 * @returns {Promise<{content: string, model: string} | null>}
 */
export async function callOpenRouterChat({
  models = [
    OPENROUTER_MODELS.NEMOTRON_LIGHTNING,
    OPENROUTER_MODELS.NEMOTRON_NANO,
    OPENROUTER_MODELS.NEMOTRON_ULTRA
  ],
  messages,
  temperature = 0.2,
  maxTokens = 1024,
  timeoutMs = 2500,
  title = 'ArogyaLink Multilingual CDS'
}) {
  if (!API_KEY) {
    console.warn('[OpenRouter] No API key provided');
    return null;
  }

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://arogyalink.gov.in',
          'X-Title': title
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.warn(`[OpenRouter] Model ${model} returned ${res.status}: ${errorText.slice(0, 150)}. Trying next fallback...`);
        continue;
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (content && content.trim().length > 0) {
        return { content: content.trim(), model };
      }
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[OpenRouter] Model ${model} failed (${err.name === 'AbortError' ? 'timeout' : err.message}). Trying fallback...`);
    }
  }

  return null;
}
