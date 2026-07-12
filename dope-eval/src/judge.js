import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { verdictSchema } from './schema.js';

// The generic LLM-as-judge. The rubric prompt is supplied per eval; the schema
// (imported here) is fixed, so every eval speaks the same verdict language.
//
// The judge defaults to a model at least as strong as the system under test —
// a judge weaker than what it grades is a rubber stamp. temperature: 0 for a
// stable, reproducible score.
export async function judge(rubricPrompt, { model = 'gpt-4o' } = {}) {
  const { object } = await generateObject({
    model: openai(model),
    schema: verdictSchema,
    prompt: rubricPrompt,
    temperature: 0
  });
  return object;
}
