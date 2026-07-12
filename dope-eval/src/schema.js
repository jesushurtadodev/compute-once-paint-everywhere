import { z } from 'zod';

// The verdict every judged case must return. The schema is the anti-vacuous
// device: `evidence` is required and non-trivial, so the model cannot emit a
// bare `pass` wired to nothing (the "lying test", DOPE chapter 6).
export const verdictSchema = z.object({
  score: z.number().min(0).max(1).describe('0..1 — how well the model output fits this specific case, judged against the input.'),
  verdict: z.enum(['pass', 'fail']),
  evidence: z.string().min(20).describe('Cite specific words/events from the input that justify the score. Required — a verdict without concrete evidence is invalid.'),
  matched: z.array(z.string()).describe('Parts of the output judged to genuinely fit.'),
  concerns: z.array(z.string()).describe('Parts judged weak, unsupported, missing, or off-topic.')
});
