# DOPE — Decide Once, Paint Everywhere

### *It's not done until it's **DopeDone**.*

**A production-tested architecture for shipping features across backend + iOS + Android + web with AI agents — from one engineer's real codebase, scars included.**

This is not a framework. It's a **[paper](PAPER.md) + a playbook + an executable Claude Code skill + the story of how it evolved**, extracted from [AudioRel](https://www.audiorel.com) — an AI-powered audio stories platform for children in 20 languages, built and operated by a single engineer with AI agents (Claude Code).

> **Every decision is made once, on the server. The clients only paint.**

A *decision* is anything that could differ between platforms if each did it itself — a computation, a **validation**, a **gate**, a **canonicalization**. All of them live in one tested place; the clients are mirrors that render the verdict. A mirror can't drift from the truth, because it doesn't own it.

**COPE — "Compute Once, Paint Everywhere" — was the first name, and it's the *compute* case of DOPE.** We discovered the pattern computing a listening streak (chapter 1); then a validation ("that's not a real name"), a canonicalization (favorites), a gate (daily limit) turned out to be the *same shape*. The umbrella is **Decide** Once; **Compute** is one of its letters. Read the full argument — and how DOPE differs from microservices — in **[the paper](PAPER.md)**.

## Why this exists

In July 2026 we shipped a unified listening streak (Duolingo's 🔥, for children's audiobooks) across four codebases — Node backend, SwiftUI iOS, Compose Android, Next.js web — in one day, with one engineer driving one AI agent. Seven PRs, ~1,100 lines, four production bugs caught along the way.

That wasn't luck. It worked because the codebase was **architected for agents**: single sources of truth, verifiable contracts, graceful fallbacks, and linters instead of magic. This repo documents that architecture so you can steal it.

## The four principles

1. **The server computes, the clients paint.** Any logic that could drift between platforms (dates, timezones, streaks, counters, gates) is computed once, server-side, as a pure function with unit tests. Clients render numbers.
2. **Contract before code.** No client model is written before seeing the real JSON with `curl` against production. Mirroring a contract *audits the original* — most of our production bugs were found this way.
3. **Graceful fallback decouples merges from deploys.** Every client is born tolerating that its endpoint doesn't exist yet. PRs land in any order; the switch to server data is automatic and invisible.
4. **Review redesigns before multiplying.** A cross-platform feature multiplies whatever you build by 4 — including design mistakes. Human review of the backend contract happens *before* the three clients are written.

Full detail: **[the paper](PAPER.md)** · **[playbook.md](playbook.md)**

### The lifecycle: PLAN → CODE, gated by DopeDone

DOPE runs as a two-phase loop, each an executable skill:

- **[`/dope-plan`](skill/dope-plan.md)** — a need → the **contract** (the one server-side decision) + the **QA plan** (Gherkin + the four-rung proof). No client code; you define how you'll prove it DONE before you write it.
- **[`/dope-code`](skill/dope-code.md)** — execute the contract on the server + mirror it on every client, then run the four rungs (unit → contract → render → guardian) until **DopeDone**. (Evolves [`/feature-xplat`](skill/feature-xplat.md).)

## Evolution log

This repo is a journal, not a snapshot. Each chapter is a real production milestone; the pattern grows as it survives contact with reality.

| Chapter | Date | What happened | Artifacts |
|---------|------|---------------|-----------|
| **1. The streak** | 2026-07-10 | One feature shipped across 4 codebases in a day. Pattern validated, playbook + skill codified. Human review caught 3 locale bugs the AI introduced in all 3 clients (Buddhist calendar on iOS, Eastern Arabic digits on Android, UTC merge on web) → rule: *protocol material always uses a fixed locale*. | [playbook.md](playbook.md) · [wiki/post-1](wiki/post-1-the-pattern.md) |
| **2. The audit** | 2026-07-10 | Asked the agent to close an i18n gap; it discovered the gap didn't exist. 17 stale dictionary JSONs — imported by nothing — had been lying to audits for months. Deliverable: a deletion PR + a unified API client. Lesson: *dead code actively lies to AI audits*. | [wiki/post-2](wiki/post-2-the-audit.md) |
| **3. The heartbeat** | 2026-07-10 | Stood up three-layer observability in one afternoon: errors (Sentry, verified by *injecting* synthetic events — silence is not success), uptime (a 15-min GitHub Action managing one deduped alert issue), and product heartbeat (Amplitude monitors built agent-side via MCP). The data killed two designs before they shipped: a sign-up monitor (2 sign-ups/month — nothing to monitor) and per-PR mobile E2E (macOS runners bill 10× on private repos). | [wiki/post-3](wiki/post-3-the-heartbeat.md) |
| **4. The wording trunk** | proposed | Unify UI wording into one trunk (backend constants) feeding all three clients; bottom-up flow becomes explicit *promotion* enforced by an orphan-key linter — never automated write-back. | (coming) |
| **6. The lying test** | in progress | The cross-platform acceptance test passed — then a real-simulator run showed every assertion was `optional: true` (a green light wired to nothing), running as a guest, hiding a real iOS render bug (a favorite saved on web didn't render on iPhone). A vacuous test is worse than none. Fix: favorites become authenticated-only, which closed the bug, the fake test, and the anonymous-vs-auth question at once. | [wiki/post-6](wiki/post-6-the-lying-test.md) |
| **5. The iPhone** | in progress | An architecture review asked one question — "where does the source of truth live?" — and the answer was *on the customer's iPhone*: cover prompt in Swift, story in device storage, the paid-audio flag a local boolean. Fix: one endpoint (`POST /api/personal-stories`, server orchestrates, `status: generating→ready`). The "async notifications" roadmap item became a field. Backend PR open; client PRs next. | [wiki/post-5 (draft)](wiki/post-5-the-iphone.md) |

## What's in the box

```
PAPER.md                 What DOPE is, DOPE vs microservices, and the DopeDone method (Gherkin + 4-rung DONE)
playbook.md              The pattern in full: principles, preconditions, case studies, anti-patterns
skill/dope-plan.md       Claude Code skill: PLAN phase — need → contract + QA plan
skill/dope-code.md       Claude Code skill: CODE phase — execute + prove until DopeDone (evolves feature-xplat)
skill/feature-xplat.md   Claude Code skill: the original cross-platform fan-out (now the core of /dope-code)
skill/cope-post.md       Claude Code skill: how the chapters + posts themselves get written (structure, honest clickbait, visual signature)
wiki/                    The article series (English + Spanish)
```

## Honest limitations

- PR numbers throughout reference our **private** monorepo. They're kept for narrative honesty, not for you to click.
- This is one team's (well, one person's) pattern, extracted from one product. It's production-tested, not universal truth.
- The skill assumes Claude Code and a monorepo-ish layout. Adapt the paths; keep the principles.

## Who

Built by [Jesús Hurtado](https://www.linkedin.com/in/jesushurtadomolina/) — 30 years shipping software (BBVA → Sky London → founder), now building AudioRel solo with AI agents and writing about it. More at [jesushurtado.dev](https://jesushurtado.dev).

## License

MIT — take it, adapt it, ship it.
