import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AVAILABLE_THEMES } from './themes.js';

// System under test — a faithful mirror of AudioRel's `suggestThemes`
// (GPT-4o-mini, temperature 0.3, top-100 themes in the prompt, JSON-array out).
//
// In production you would point this adapter at your REAL flow or endpoint
// (import the function, or fetch the API) so the eval grades what actually
// ships. This self-contained mirror keeps the example runnable with only an
// OPENAI_API_KEY.
const FALLBACK = ['adventure', 'friendship'];

function buildPrompt(title, synopsis) {
  const themesForPrompt = AVAILABLE_THEMES.slice(0, 100).join(', ');
  return `You are a children's literature expert. Given a story's title and synopsis, suggest 2-4 appropriate themes from the available catalog.

AVAILABLE THEMES (you MUST choose ONLY from this list):
${themesForPrompt}

STORY TITLE: ${title}

STORY SYNOPSIS: ${synopsis || 'No synopsis available - base suggestion on title only'}

Instructions:
1. Choose 2-4 themes that best represent this story's moral lessons and content
2. Only use themes from the AVAILABLE THEMES list - do not invent new ones
3. Prioritize themes that are educational for children
4. Return ONLY a JSON array of theme strings, nothing else

Example response: ["friendship", "courage", "family"]`;
}

function parseThemes(text) {
  if (!text) return [];
  let s = text.trim();
  if (s.startsWith('```')) s = s.replace(/```json\n?/, '').replace(/```\n?/, '').replace(/```$/, '').trim();
  const m = s.match(/\[[\s\S]*\]/);
  try {
    const arr = JSON.parse(m ? m[0] : s);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function suggestThemes({ title, synopsis }) {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: buildPrompt(title, synopsis),
      temperature: 0.3,
      maxOutputTokens: 200
    });
    const themes = parseThemes(text);
    return themes.length ? themes : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
