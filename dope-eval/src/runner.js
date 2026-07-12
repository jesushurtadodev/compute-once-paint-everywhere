import { judge as defaultJudge } from './judge.js';

// The generic eval runner — the reusable core of DOPE rung 5.
//
// It is model-, domain-, and provider-agnostic: an eval plugs in its own
// `sut` (system under test), golden `cases`, `deterministic` invariants, and
// `rubric`. The runner enforces the two rules that make an eval trustworthy:
//   1. Deterministic-first — code invariants gate BEFORE the judge is paid.
//      A whitelist/schema/structure failure fails the case outright; the judge
//      is never asked to bless malformed output.
//   2. Non-vacuous — a judge `pass` with no real evidence is downgraded to a
//      fail. A green light wired to nothing is worse than no test.
//
// config: {
//   name, cases:[{ id, ... }],
//   sut(case) -> output,
//   deterministic?(output, case) -> { passed, failures[] },
//   rubric(case, output) -> string,          // the judge prompt
//   threshold: { meanMin, floor },           // the gate
//   judgeModel?
// }
export async function runEval(config) {
  const { cases, sut, deterministic, rubric, threshold, judgeModel } = config;
  const results = [];

  for (const c of cases) {
    let output = null;
    let det = { passed: true, failures: [] };
    let verdict;
    let error = null;

    try {
      output = await sut(c);
      det = deterministic ? deterministic(output, c) : det;

      if (!det.passed) {
        // Rung 5a failed — never spend the judge on malformed output.
        verdict = {
          score: 0,
          verdict: 'fail',
          evidence: `deterministic rung failed: ${det.failures.join('; ')}`,
          matched: [],
          concerns: det.failures
        };
      } else {
        // Rung 5b — the semantic judge.
        verdict = await defaultJudge(rubric(c, output), { model: judgeModel });

        // Non-vacuous guard: a pass must carry real evidence.
        if (verdict.verdict === 'pass' && (!verdict.evidence || verdict.evidence.trim().length < 20)) {
          verdict = {
            ...verdict,
            verdict: 'fail',
            score: Math.min(verdict.score ?? 0, 0.49),
            concerns: [...(verdict.concerns || []), 'vacuous: pass without evidence — rejected']
          };
        }
      }
    } catch (e) {
      error = e.message;
      det = { passed: false, failures: [e.message] };
      verdict = { score: 0, verdict: 'fail', evidence: `error: ${e.message}`, matched: [], concerns: ['threw'] };
    }

    results.push({ id: c.id, output, deterministic: det, ...verdict, error });
  }

  const scores = results.map((r) => r.score);
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const min = scores.length ? Math.min(...scores) : 0;
  const passes = results.filter((r) => r.verdict === 'pass').length;

  const meanMin = threshold?.meanMin ?? 0.75;
  const floor = threshold?.floor ?? 0;
  const gate = mean >= meanMin && min >= floor;

  return { name: config.name, results, mean, min, passes, total: results.length, threshold: { meanMin, floor }, gate };
}
