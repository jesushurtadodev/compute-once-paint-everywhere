import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isValidTheme } from './themes.js';
import { suggestThemes } from './sut.js';

const here = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(join(here, 'golden.json'), 'utf8'));

// DOPE rung 5 for AudioRel's theme-suggestion flow (GPT-4o-mini).
// A pure test can't grade this: the output is non-deterministic, and "does this
// theme fit the story?" is a judgment. So: deterministic invariants first,
// then a scored semantic judge.
export default {
  name: 'theme-suggestion',
  cases: golden,
  judgeModel: 'gpt-4o',
  threshold: { meanMin: 0.75, floor: 0.5 },

  sut: (c) => suggestThemes({ title: c.title, synopsis: c.synopsis }),

  // Rung 5a — deterministic invariants (assert in code, before paying the judge)
  deterministic(output, _c) {
    const failures = [];
    if (!Array.isArray(output) || output.length === 0) {
      failures.push('no themes returned');
      return { passed: false, failures };
    }
    const invalid = output.filter((t) => !isValidTheme(t));
    if (invalid.length) failures.push(`off-whitelist: ${invalid.join(', ')}`);
    if (output.length < 2 || output.length > 4) failures.push(`count ${output.length} not in 2..4`);
    if (new Set(output.map((t) => t.toLowerCase())).size !== output.length) failures.push('duplicate themes');
    return { passed: failures.length === 0, failures };
  },

  // Rung 5b — semantic fit, judged with required evidence
  rubric(c, output) {
    return `You are a strict children's-literature editor scoring THEME SUGGESTIONS for a story.

STORY: ${c.title}
SYNOPSIS: ${c.synopsis}

REFERENCE themes an expert considered fitting (guidance, not exhaustive): ${c.acceptableThemes.join(', ')}

THEMES SUGGESTED BY THE SYSTEM: ${JSON.stringify(output)}

Score 0..1 how well the SUGGESTED themes fit THIS story, judged against the synopsis. The reference list is guidance, not the only correct answer — a suggested theme genuinely grounded in the synopsis counts even if it is not in the reference.

Rules:
- 1.0 only if every suggested theme is clearly supported by the synopsis.
- Penalise any suggested theme with no textual support in the synopsis.
- A theme that is valid vocabulary but irrelevant to THIS story is a concern, not a pass.

You MUST cite specific words or events from the synopsis in "evidence". A verdict without concrete evidence is invalid.`;
  }
};
