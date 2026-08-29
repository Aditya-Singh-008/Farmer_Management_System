// _shared/gemini.ts — Shared Gemini AI helper for SFMS Edge Functions

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Call Gemini Flash model with a text prompt and get a JSON response.
 * Uses gemini-1.5-flash which is free-tier and fast.
 */
export async function callGeminiFlash(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const url = `${GEMINI_BASE}/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

/**
 * Parse Gemini JSON response safely.
 * Strips markdown code fences if present.
 */
export function parseGeminiJson<T = unknown>(raw: string): T {
  let cleaned = raw.trim();
  // Strip ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as T;
}
