// Aggregate independent refutations into one verdict.
//
// A claim SURVIVES only if it withstands the skeptics. A refutation "counts"
// only if the skeptic is confident enough (>= minConfidence) — a half-hearted
// doubt doesn't kill a claim. The claim is KILLED when the number of counting
// refuters reaches the kill threshold (default: a majority of lenses).
export function consensus(verdicts, { minConfidence = 0.5, killThreshold } = {}) {
  const total = verdicts.length;
  const counting = verdicts.filter((v) => v.refuted && (v.confidence ?? 0) >= minConfidence);
  const threshold = killThreshold ?? Math.ceil(total / 2);
  const killed = total > 0 && counting.length >= threshold;

  return {
    killed,
    survives: !killed,
    refuters: counting.length,
    total,
    threshold,
    minConfidence,
    // strongest refutation first — the reason a reviewer reads next
    topRefutation: counting.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0] || null
  };
}
