# /dope-plan — DOPE Phase 1: need → contract + QA plan

> **What this is**: a [Claude Code](https://claude.com/claude-code) skill — a markdown workflow the agent loads and executes step by step. It's the **PLAN** half of the [DOPE](../PAPER.md) lifecycle. It produces the *contract* and the *QA plan* for a need — **no client code**. Its output is the input to [`/dope-code`](dope-code.md).
>
> **Install**: drop into `.claude/commands/dope-plan.md`, then run `/dope-plan <the need, in the user's words>`.

DOPE-PLAN turns a fuzzy need into two hard artifacts: the **contract** (the single server-side decision the clients will mirror) and the **QA plan** (how you'll *prove* it done before you write it). Nothing is coded here. This is the thinking phase — cheap to redo, and the last place a human reviews the shape before it multiplies across three clients.

## Principles

1. **Decide what the server owns.** Any logic that could differ between platforms — a computation, a **validation**, a **gate**, a **canonicalization**, a permission — is a *decision*, and decisions live once, server-side. Name every decision in the need.
2. **Contract before code.** The reusable unit is the contract, not the implementation. If the endpoint exists, `curl` production and dump the real JSON before designing anything.
3. **Define DONE before building.** The acceptance test (Gherkin) and the four-rung validation plan are written *now*, not after. If you can't say how you'd prove it, you don't understand it yet.
4. **Review before you multiply.** A human (or a second agent) reviews the contract's shape here — because a mistake in PLAN becomes the same mistake in three clients.

## STEP 1 — Frame the need as a user story

One sentence, in the user's voice: *"As a ⟨role⟩, I ⟨action⟩ so that ⟨value⟩."* If it can't be said in one sentence, split it.

## STEP 2 — Write the Gherkin (the acceptance behavior)

`Given / When / Then`, covering the happy path **and** the failure/edge the need implies. This *is* the acceptance test — write it so it could be automated verbatim.

```gherkin
Given ⟨the starting state / who the user is⟩
When ⟨the action⟩
Then ⟨the observable outcome⟩
And ⟨cross-surface expectation, if any⟩
```

Include the cross-surface line whenever the feature touches user state (favorites, prefs, creation): *"…and it appears on my other devices."*

## STEP 3 — Name the decisions and design the contract

For each decision the need contains, specify the server-side contract:
- **Signature** — inputs → output, as plain strings/numbers. **Never a raw `Date`/`Timestamp`** (serialize to ISO). Inject `now`/`tz` as parameters so it's testable and timezone-correct.
- **Shape** — the exact JSON the clients will consume (field names, types).
- **Rules** — the actual logic, in prose precise enough to unit-test. i18n-aware where relevant (a "looks random" name check applies only to Latin script; a streak buckets days by `?tz=`).
- **Guardian note** — the contract is enforced server-side even if a client skips it.

If the endpoint already exists: `curl` production first — mirroring the real shape audits it.

## STEP 4 — Write the QA plan (the four rungs of DONE)

For each rung, list the concrete cases — this is the plan `/dope-code` will execute:

1. **Unit** — the pure decision function, every edge case, **including every supported locale**.
2. **Contract** — the *data* converges: the same identity, hit with **each client's real payload**, resolves to the same server truth. Headless. Spell out the matrix (`mark[A] → visible[B] · visible[C]`).
3. **Render** — the *pixels* converge: one seeded identity, the action on web (Playwright) and iOS/Android (Maestro), state written on one surface asserted on the others.
4. **Guardian** — the server rejects a bypassed/tampered client.

Note explicitly which rungs are *mandatory* for this story (a pure-compute feature may not need render; anything touching user state across surfaces does).

## STEP 5 — Human review, then hand off

Present the artifact — story · Gherkin · contract · QA plan — for review **before** any code. Fix the shape here. Then hand the plan to [`/dope-code`](dope-code.md).

## Output

A `PLAN.md` (or issue) containing exactly: the story, the Gherkin, the contract spec, and the four-rung QA plan. That document is the single source of truth `/dope-code` mirrors.

## Anti-patterns

| Anti-pattern | Why it bites |
|---|---|
| Writing a client model before the contract | Three mirrors of a shape you hadn't audited |
| Defining DONE as "it builds" | Per-platform verification masquerading as done |
| A decision left on the client "just for now" | It diverges the moment a second client does it differently |
| Skipping the human review of the contract | The mistake multiplies ×3 in CODE |
| Returning a raw `Date` in the contract | Middlewares silently destroy it; a client breaks for months |
