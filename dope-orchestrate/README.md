# dope-orchestrate — multi-agent refutation + consensus

A small, reusable harness that **fans out skeptics to try to REFUTE a claim** —
each from a distinct lens — and keeps the claim only if it **survives** them.
The engine behind "sessions review each other": adversarial verification as
deterministic, headless infrastructure.

Two backends, one core:

- **agentic** (Claude Agent SDK) — each skeptic is an autonomous subagent that
  can **Read code, run Bash, curl production** and investigate before ruling.
  Verifies against reality, not the claim's wording. *Needs `ANTHROPIC_API_KEY`.*
- **stateless** (Vercel AI SDK) — each skeptic reasons over the evidence it is
  given (a finding + its diff, a suggestion + its synopsis). No tools. *Needs
  `OPENAI_API_KEY`.*

## Why it exists

A single reviewer — human or model — rubber-stamps. A panel of **independent**
skeptics, each hunting for a different failure and each forced to cite evidence,
does not. dope-orchestrate makes that panel a repeatable, gate-able artifact:

- **Parallel & independent** — no skeptic sees another's verdict (no groupthink).
- **Consensus kills, not one voice** — a claim dies only when enough confident
  refuters agree (default: a majority of lenses).
- **Non-vacuous** — a verdict with no real evidence is neutralised; it can
  neither kill a claim nor count as a genuine "survives".

It's the sibling of [`dope-eval`](../dope-eval): eval *scores* model output
against golden cases; orchestrate *refutes* a single claim by consensus. The
`dope-eval` judge fan-out is meant to run on this.

## Run it

```bash
cd dope-orchestrate
npm install

# stateless backend (evidence is in the case; no tools)
export OPENAI_API_KEY=sk-...
node run.js theme-fit --backend=stateless

# agentic backend (tool-using subagents; bills per use)
export ANTHROPIC_API_KEY=sk-ant-...
node run.js theme-fit --backend=agentic
```

Exit `0` = the claim survived (or the self-checking demo met its expectation),
`1` = it was killed / the demo failed — so it drops into CI. Report → `reports/<name>.json`.

### The bundled demo

`theme-fit` asserts *all four* themes fit "The Tortoise and the Hare" — but
`bravery` has no support in the synopsis. A working panel **kills** the
over-broad claim (`expectKilled: true`). Live run, stateless backend:

```
lens               verdict   conf   target
textual-support    REFUTE    1.00   bravery
over-reach         REFUTE    0.90   bravery
moral-core         REFUTE    0.90   bravery
refuters 3/3 · kill≥2  →  🔴 CLAIM KILLED  →  ✅ DEMO PASS
```

## Writing a case

```js
export default {
  name: 'my-claim',
  claim: 'The thing you want stress-tested, in one sentence.',
  context: 'Evidence the stateless backend reads (a diff, a synopsis, logs).',
  cwd: '/path/to/repo',           // for the agentic backend: where tools run
  lenses: [
    { name: 'correctness', instruction: 'Refute on logical/behavioural grounds…' },
    { name: 'security',    instruction: 'Refute on safety/abuse grounds…' },
    { name: 'reproduces',  instruction: 'Try to reproduce the failure it denies — check the real artifact…' }
  ],
  killThreshold: 2,               // claim dies if >= 2 lenses refute (default: majority)
  minConfidence: 0.5,             // a refutation only counts above this confidence
  expectKilled: false             // optional: makes the run a self-checking demo
};
```

For the **agentic** backend, lenses that say "check the real endpoint / read the
file / grep the code" are where the tool use pays off — the skeptic goes and
looks instead of trusting the claim.

## Layout

```
dope-orchestrate/
├── src/
│   ├── schema.js            verdict per skeptic (evidence required)
│   ├── consensus.js         majority-refute aggregation
│   ├── runner.js            parallel fan-out + non-vacuous guard → consensus
│   └── skeptics/
│       ├── stateless.js     Vercel AI SDK skeptic (no tools)
│       └── agentic.js       Claude Agent SDK skeptic (Read/Bash/Grep, headless)
├── run.js                   CLI: node run.js <case> [--backend=…]
└── examples/theme-fit/      the self-checking demo
```

## Notes

- The agentic backend uses `permissionMode: 'bypassPermissions'` and real tools
  (Read/Bash/Grep) — scope `cwd` and the tool list to what a skeptic should touch.
- The Claude Agent SDK bills per use and **cannot** use a Claude subscription;
  it requires `ANTHROPIC_API_KEY`.
