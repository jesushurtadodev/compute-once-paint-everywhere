import { consensus } from './consensus.js';

// The generic multi-agent refutation runner — the reusable core of
// /dope-orchestrate. It fans out one skeptic per lens IN PARALLEL, each trying
// to REFUTE the claim from its own angle, then aggregates by consensus.
//
// It is backend-agnostic: `skeptic` is injected. A stateless skeptic reasons
// over the provided context; an agentic skeptic (Claude Agent SDK) can use
// tools to read code, run bash, or curl production before ruling — "verify
// against reality, not the claim's own wording".
//
// The two guarantees the runner enforces:
//   - Parallel & independent — no skeptic sees another's verdict (no groupthink).
//   - Non-vacuous — a verdict with no real evidence is neutralised (it cannot
//     kill a claim, nor can a bare "survives" count as a real check).
//
// args: {
//   claim: string,
//   context?: string,
//   lenses: [{ name, instruction }],
//   skeptic: async ({ lens, claim, context }) => { refuted, confidence, severity, target, evidence },
//   killThreshold?, minConfidence?
// }
export async function orchestrate({ claim, context = '', lenses, skeptic, killThreshold, minConfidence }) {
  const verdicts = await Promise.all(
    lenses.map(async (lens) => {
      try {
        const v = await skeptic({ lens, claim, context });
        if (!v || !v.evidence || String(v.evidence).trim().length < 20) {
          // Vacuous: neutralise it — cannot refute, cannot count as a real "survives".
          return { lens: lens.name, refuted: false, confidence: 0, severity: 'none', target: '', evidence: `vacuous: no evidence from lens "${lens.name}" — neutralised`, vacuous: true };
        }
        return { lens: lens.name, refuted: !!v.refuted, confidence: v.confidence ?? 0, severity: v.severity ?? 'none', target: v.target ?? '', evidence: v.evidence };
      } catch (e) {
        return { lens: lens.name, refuted: false, confidence: 0, severity: 'none', target: '', evidence: `error: ${e.message}`, error: e.message };
      }
    })
  );

  const agg = consensus(verdicts, { killThreshold, minConfidence });
  return { claim, context, verdicts, ...agg };
}
