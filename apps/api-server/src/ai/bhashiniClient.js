/**
 * @file bhashiniClient.js — Government of India Bhashini Multilingual Service Client
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Official Indian Government API pipeline for Translation, Text-to-Speech (TTS),
 * and Speech-to-Text (ASR) across Telugu, Kannada, Hindi, Marathi, and English.
 */

import fetch from 'node-fetch';

const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID || '';
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY || '';
const BHASHINI_PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || '';
const BHASHINI_PIPELINE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
const TIMEOUT_MS = 6000;

/**
 * Translate clinical/patient text via Bhashini ULCA pipeline
 *
 * @param {string} text
 * @param {string} sourceLang - 'en' | 'hi' | 'te' | 'kn' | 'mr'
 * @param {string} targetLang - 'en' | 'hi' | 'te' | 'kn' | 'mr'
 * @returns {Promise<string | null>}
 */
export async function bhashiniTranslate(text, sourceLang = 'en', targetLang = 'te') {
  if (!text || !BHASHINI_API_KEY || !BHASHINI_USER_ID) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(BHASHINI_PIPELINE_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BHASHINI_API_KEY,
        'userID': BHASHINI_USER_ID
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
              }
            }
          }
        ],
        inputData: {
          input: [{ source: text }]
        }
      })
    });

    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json();
    const translated = data?.pipelineResponse?.[0]?.output?.[0]?.target;
    return translated || null;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}
