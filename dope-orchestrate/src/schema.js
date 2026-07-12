import { z } from 'zod';

// One skeptic's attempt to REFUTE a claim through a single lens.
// `evidence` is required and non-trivial — a refutation (or a "survives") with
// no cited evidence is vacuous and the runner rejects it.
export const refutationSchema = z.object({
  refuted: z.boolean().describe('True if you found concrete grounds to reject the claim through this lens.'),
  confidence: z.number().min(0).max(1).describe('0..1 — your confidence in this verdict.'),
  severity: z.enum(['none', 'low', 'medium', 'high']).describe('Severity of the flaw found; "none" if the claim survived this lens.'),
  target: z.string().describe('The specific part of the claim you attacked, or "" if the claim survived.'),
  evidence: z.string().min(20).describe('Concrete evidence: what you checked and what you found. Required — a verdict without evidence is invalid.')
});
