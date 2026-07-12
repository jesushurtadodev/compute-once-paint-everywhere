# /dope-code — DOPE Phase 2: execute the contract → prove it everywhere

> **What this is**: a [Claude Code](https://claude.com/claude-code) skill — the **CODE** half of the [DOPE](../PAPER.md) lifecycle. It takes the contract + QA plan from [`/dope-plan`](dope-plan.md), implements the server decision and the client mirrors, and runs the four-rung proof until **DopeDone**. It is the evolution of [`/feature-xplat`](feature-xplat.md) — same client fan-out, now gated by an explicit DONE.
>
> **Install**: drop into `.claude/commands/dope-code.md`, then run `/dope-code <path to the PLAN, or the plan inline>`.

DOPE-CODE never invents the shape — it mirrors the plan. Server first (the decision + its guardian), then the clients paint it, then the proof runs. The exit is not "it builds"; it's all four rungs green.

## Principles

1. **The server computes/decides; the clients paint.** Implement the decision once as a **pure function with unit tests**. Clients render its verdict and hold no authoritative state.
2. **Graceful fallback decouples merges from deploys.** Every client is born tolerating that its endpoint doesn't exist yet (feature hidden + warning + old path). PRs merge in any order; nobody waits for anybody.
3. **The proof is the point.** You centralized the decision *so that* one proof covers every surface. Run all four rungs; don't stop at the build.
4. **Verify against production, not your config.** Don't trust the build, the token, the plausible cause, or your local `.env`. (The discipline of the sibling series, *[Battling](https://github.com/jesushurtadodev/battling-agentic-enterprise)*.)

## STEP 1 — Server: the decision + the guardian

1. Implement the contract as an **exported pure function** in the services layer + **unit tests** covering the plan's Step-4 unit cases (all locales). Inject `now`/`tz`.
2. Thin route handler — **no side effects in GETs**; serialize (never a raw `Date`); don't leak `error.message` into 500s.
3. **Guardian**: the endpoint enforces the decision even if a client skips it (validate inputs, reject bad/unauthorized).
4. PR against `main`. It's the source of truth every client mirrors.

## STEP 2/3/4 — Clients: mirror the contract (fan out)

For **each** client (Android first — fastest loop — then iOS, then web), a small agent that:
1. Models the contract **with defaults** (a missing field must not crash an old client).
2. Renders the verdict; mirrors the same rule for instant UX (disable/inline error) — but the server stays the guardian.
3. **Graceful fallback** if the endpoint isn't deployed yet.
4. **Analytics**: emit through the fan-out helper with **identical event names + props** (stable IDs, never localized labels; intent events at-tap, not after the 202).
5. Build with the pinned toolchain, register new files, translate new strings to all locales.
6. PR against `main`.

## STEP 5 — Run the proof (the four rungs → DopeDone)

Execute the QA plan from `/dope-plan`, in order. Each must be **non-vacuous** (a test whose assertions are all `optional:true` is a green light wired to nothing — worse than no test):

1. **Unit** — green (already from Step 1).
2. **Contract** — headless: sign in as the shared test identity, fire **each client's exact payload**, assert convergence (`mark[A] → visible[B] · visible[C]`). Must discriminate — run it before the fix to watch it fail red.
3. **Render** — the shared identity (a minted custom token / auth-seed) drives web (Playwright) and iOS/Android (Maestro); state written on one surface is asserted on the others.
4. **Guardian** — verify the server rejects a bypassed client (curl without the client-side guard).

**Gate: DopeDone.** Merge the client PRs only when all mandatory rungs are green. "Verified in the emulator + build + browser" is *per-platform verification* — one rung below DopeDone; name the difference.

## Anti-patterns

| Anti-pattern | Real consequence |
|---|---|
| Marking done on green builds | A live crash a render test would have caught ships |
| Vacuous test (all-`optional` assertions) | A green light wired to nothing |
| Trusting the token / `.env` / plausible cause | A valid-but-useless token, a "dead CI" that was really a stale config |
| A client owning authoritative state | It diverges from the server truth; two owners, one bug |
| Localized labels as analytics values | "sleepy dragon" vs "dragón dormilón" never group |
| Silent skip of a step (dSYMs, a locale) | Looks shipped; a gap only production reveals |
