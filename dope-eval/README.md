# dope-eval — DOPE rung 5

A small, reusable **eval harness** for model-produced output. It's the executable
form of the fifth [DopeDone](../PAPER.md) rung: the one that fires when a decision's
output comes from a model (an LLM call, image/audio generation, a Genkit flow) and a
`assertEqual` therefore can't judge its **quality**.

Built on the [Vercel AI SDK](https://sdk.vercel.ai). Model-, domain- and provider-agnostic.

## Why it exists

Unit and E2E tests prove *deterministic* behaviour. They stay green while a prompt
tweak quietly degrades a translation or a set of suggested themes. dope-eval turns
that invisible drift into a **scored, versioned, CI-gated** signal.

Two rules make an eval trustworthy, and the runner enforces both:

1. **Deterministic-first.** Code invariants (schema, whitelist, structure) gate
   *before* the judge is paid. Malformed output fails outright; the judge is never
   asked to bless it.
2. **Non-vacuous.** The verdict schema *requires* evidence, and a judge `pass` with
   no real evidence is downgraded to a fail. A green light wired to nothing is worse
   than no test (DOPE chapter 6, "the lying test").

## Run it

```bash
cd dope-eval
npm install
export OPENAI_API_KEY=sk-...
node run.js theme-suggestion
```

Exit code `0` = gate pass, `1` = gate fail — so it drops straight into CI. A JSON
report lands in `reports/<name>.json`.

## Layout

```
dope-eval/
├── src/
│   ├── schema.js   # the verdict every judged case returns (evidence required)
│   ├── judge.js    # generic LLM-as-judge (generateObject + the schema)
│   └── runner.js   # deterministic-first → judge → non-vacuous guard → gate
├── run.js          # CLI: node run.js <eval-name>  → table + report + exit code
└── evals/
    └── theme-suggestion/
        ├── themes.js       # the 204-theme whitelist (mirrored from AudioRel)
        ├── sut.js          # system under test (point at your real flow in prod)
        ├── golden.json     # 8 classic stories + acceptable themes
        └── eval.config.js  # deterministic invariants + rubric + threshold
```

## Writing a new eval

Drop a folder under `evals/<name>/` exporting a default config:

```js
export default {
  name: 'my-eval',
  cases: [/* golden inputs */],
  sut:   (c) => /* run the thing under test → output */,
  deterministic(output, c) { return { passed, failures: [] }; },  // rung 5a
  rubric(c, output) { return `…score 0..1, cite evidence…`; },     // rung 5b
  threshold: { meanMin: 0.75, floor: 0.5 }                         // the gate
};
```

The `sut` is where you plug in reality — import your production function, or `fetch`
your API. The example mirrors AudioRel's `suggestThemes` prompt so it runs with only
an `OPENAI_API_KEY`.

## Notes

- The judge defaults to a model at least as strong as the SUT (here `gpt-4o` judging
  `gpt-4o-mini`). A judge weaker than what it grades is a rubber stamp.
- The judge fan-out / consensus layer is the planned sibling skill `/dope-orchestrate`;
  this harness is its first application.
