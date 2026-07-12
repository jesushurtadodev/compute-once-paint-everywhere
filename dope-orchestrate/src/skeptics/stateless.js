import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { refutationSchema } from '../schema.js';

// A stateless skeptic — reasons over the evidence it is given, no tools.
// Built on the Vercel AI SDK (structured output via the shared schema).
// Good for refuting claims that come WITH their evidence (a finding + a diff,
// a suggestion + a synopsis). For claims that need investigation, use the
// agentic skeptic.
export function statelessSkeptic({ model = 'gpt-4o' } = {}) {
  return async ({ lens, claim, context }) => {
    const prompt = `You are a skeptical reviewer. Your job is to REFUTE the claim below through ONE lens. Be adversarial — actively look for grounds to reject it. Only set refuted=false if, after genuinely trying, you cannot.

LENS "${lens.name}": ${lens.instruction}

CLAIM:
${claim}

EVIDENCE / CONTEXT:
${context || '(none provided)'}

Cite concrete evidence — quote the context. If the evidence is insufficient to refute, set refuted=false with low confidence and say why. A verdict without concrete evidence is invalid.`;

    const { object } = await generateObject({
      model: openai(model),
      schema: refutationSchema,
      prompt,
      temperature: 0
    });
    return object;
  };
}
