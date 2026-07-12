#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { runEval } from './src/runner.js';

const name = process.argv[2];
if (!name) {
  console.error('usage: node run.js <eval-name>   (e.g. theme-suggestion)');
  process.exit(2);
}
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set. Export it (or add it as a CI secret) before running.');
  process.exit(2);
}

const { default: config } = await import(`./evals/${name}/eval.config.js`);
console.log(`\n▶ dope-eval: ${config.name}  (${config.cases.length} golden cases)\n`);

const report = await runEval(config);

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('case', 26), pad('det', 6), pad('score', 7), 'verdict');
console.log('─'.repeat(56));
for (const r of report.results) {
  console.log(pad(r.id, 26), pad(r.deterministic.passed ? 'ok' : 'FAIL', 6), pad(r.score.toFixed(2), 7), r.verdict);
}
console.log('─'.repeat(56));
console.log(
  `mean ${report.mean.toFixed(3)}  min ${report.min.toFixed(3)}  pass ${report.passes}/${report.total}` +
  `  ·  gate: mean≥${report.threshold.meanMin} floor≥${report.threshold.floor}`
);

mkdirSync('reports', { recursive: true });
writeFileSync(`reports/${name}.json`, JSON.stringify(report, null, 2));
console.log(`report → reports/${name}.json`);

console.log(report.gate ? '\n✅ GATE PASS\n' : '\n❌ GATE FAIL\n');
process.exit(report.gate ? 0 : 1);
