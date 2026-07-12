#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { orchestrate } from './src/runner.js';

const name = process.argv[2];
const backend = (process.argv.find((a) => a.startsWith('--backend=')) || '').split('=')[1] || 'stateless';
if (!name) {
  console.error('usage: node run.js <example> [--backend=stateless|agentic]');
  process.exit(2);
}

const { default: ex } = await import(`./examples/${name}/case.js`);

let skeptic;
if (backend === 'agentic') {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set — the agentic backend (Claude Agent SDK) needs it.');
    process.exit(2);
  }
  const { agenticSkeptic } = await import('./src/skeptics/agentic.js');
  skeptic = agenticSkeptic({ cwd: ex.cwd, ...(ex.agentic || {}) });
} else {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set — the stateless backend needs it.');
    process.exit(2);
  }
  const { statelessSkeptic } = await import('./src/skeptics/stateless.js');
  skeptic = statelessSkeptic();
}

console.log(`\n▶ dope-orchestrate: ${ex.name}  ·  ${ex.lenses.length} lenses  ·  backend=${backend}\n`);
console.log(`CLAIM: ${ex.claim}\n`);

const report = await orchestrate({
  claim: ex.claim,
  context: ex.context,
  lenses: ex.lenses,
  skeptic,
  killThreshold: ex.killThreshold,
  minConfidence: ex.minConfidence
});

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('lens', 18), pad('verdict', 9), pad('conf', 6), 'target');
console.log('─'.repeat(60));
for (const v of report.verdicts) {
  console.log(pad(v.lens, 18), pad(v.refuted ? 'REFUTE' : 'survives', 9), pad((v.confidence ?? 0).toFixed(2), 6), v.target || '');
}
console.log('─'.repeat(60));
console.log(`refuters ${report.refuters}/${report.total}  ·  kill≥${report.threshold}  ·  minConf ${report.minConfidence}`);
if (report.topRefutation) console.log(`top refutation (${report.topRefutation.lens}): ${report.topRefutation.evidence.slice(0, 160)}`);

mkdirSync('reports', { recursive: true });
writeFileSync(`reports/${name}.json`, JSON.stringify(report, null, 2));
console.log(`report → reports/${name}.json`);

console.log(report.killed ? '\n🔴 CLAIM KILLED — did not survive refutation' : '\n🟢 CLAIM SURVIVES');

// Self-checking demo: if the example declares what should happen, verify it.
if (typeof ex.expectKilled === 'boolean') {
  const ok = report.killed === ex.expectKilled;
  console.log(ok
    ? `\n✅ DEMO PASS — expected ${ex.expectKilled ? 'kill' : 'survive'}, got it.\n`
    : `\n❌ DEMO FAIL — expected ${ex.expectKilled ? 'kill' : 'survive'}, got the opposite.\n`);
  process.exit(ok ? 0 : 1);
}
process.exit(report.killed ? 1 : 0);
