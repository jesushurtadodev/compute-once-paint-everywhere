# DOPE — Decide Once, Paint Everywhere

*A paper on where decisions live in a multi-client product, and how you prove a user story is actually done.*

---

## Abstract

Most "architecture" advice is about how to split the **server**. This paper is about a different axis: the line between the **server** and its **clients**. DOPE is one sentence:

> **Every decision is made once, on the server. The clients only paint.**

A "decision" is anything that could differ between platforms if each platform did it itself: a computation, a validation, a gate, a canonicalization, a permission. In DOPE all of them live in exactly one place — a pure, tested function on the server — and iOS, Android and web are **mirrors** that render the verdict. Because a mirror doesn't own the truth, it cannot drift from it and cannot lie about it.

DOPE is the architecture of a **single engineer with many client surfaces**, multiplied by AI agents. Its companion, **DONE**, is how you prove a story shipped correctly across all of them. Together they earn a verb: **DopeDone** — *it's not done until it's DopeDone.*

---

## The five principles

1. **Decide Once.** Any logic that could diverge between platforms (dates, streaks, counters, **validations**, **gates**, **canonicalizations**, permissions) is computed once, server-side, as a **pure function with unit tests**. `compute` is just one kind of decision — `validate`, `gate`, `canonicalize` are others.
2. **Paint Everywhere.** Clients render the server's verdict. They hold **no authoritative state** — only cache and pixels. A client can be wrong about the screen; it can never be wrong about the truth, because it doesn't have it.
3. **The server is the guardian.** The decision is enforced even if a client skips it. The web form disables the button for a bad name *and* the server still rejects it — because clients can be bypassed, tampered, or simply old.
4. **Contract before code.** The reusable unit is the **contract** (the shape and the rule), not the implementation. Three clients are three mirrors of one contract; you write the client model only after seeing the real JSON from production.
5. **Verify against production.** The judgment that keeps it honest: don't trust the build, the token, the plausible cause, or your local `.env`. (This is the thesis of the sibling series, *[Battling: Agentic Enterprise-Quality Software](https://github.com/jesushurtadodev/battling-agentic-enterprise)*.)

---

## DOPE vs. Microservices

They look like cousins. They operate on **orthogonal axes**, and that is the whole point.

|  | Microservices | DOPE |
|---|---|---|
| **The cut** | horizontal, *inside* the server | vertical, *server ↔ clients* |
| **The "many"** | many **services** | many **client platforms** |
| **Core instinct** | **decentralize** — spread ownership across services | **centralize** — consolidate decisions into one place |
| **Problem it solves** | team scale, independent deploy/scale (Conway's law) | **client divergence** — 3 platforms drifting, logic duplicated, one bug per surface |
| **Effect on complexity** | **adds** it (network, distributed transactions, eventual consistency) | **removes** it (one place for logic, dumb edges) |
| **Data** | database-per-service | one source of truth; clients keep none |

**They are not rivals — they coexist.** DOPE governs the client↔server boundary; microservices (if you use them) govern the server's *internal* structure. You can run DOPE over a monolith (we do) or over a mesh of services — the clients never know how many services sit behind the contract.

Where they **agree**: one owner per truth (no shared DB / no shared client state); the contract is the sacred boundary; distrust the caller (a service validates its inputs; the server validates the client's).

Where they **differ** most sharply: on the **decision layer**, DOPE is the *opposite* instinct. Microservices says *"decompose and distribute ownership."* DOPE says *"consolidate the truth and make the edges dumb, so they can't diverge."*

**The honest corollary for a solo builder:** microservices would be an anti-pattern here — all the operational overhead of a distributed system with no large team to justify it. DOPE is the consolidation that *fits in one person multiplied by agents*. If AudioRel ever grows into teams, the two don't collide: DOPE keeps ruling the edge while the server splits into services underneath.

---

## DopeDone: a story isn't done because it builds

DOPE tells you *where* a decision lives. **DONE** tells you *how you prove* the story shipped correctly across every surface. The two are inseparable — the reason to centralize the decision is so you can write **one** proof that all clients honor it — and together they earn a verb: **DopeDone**.

Agile already has *"done-done"*: finished for real, not merely claimed. **DopeDone is the DOPE-native version of done-done** — done, *and* proven across surfaces the way the architecture demands. It's the question you ask before shipping: not *"does it build?"* but *"is it DopeDone?"*

> A user story is **DopeDone** when an automated test shows the **same user** performing the action **identically on all surfaces**, AND state written on one surface renders on the others — because the server is the single source of truth, this is the only test that actually validates the pattern.

### The per-story template

Every user story carries five things. Ideally the story is written **before** the code, and the Gherkin *is* the acceptance test.

1. **Story** — one sentence, in the user's voice.
2. **Gherkin** — `Given / When / Then`. The behavior contract, executable.
3. **Problem it solves** — why it's worth the money and the risk.
4. **The shared contract** — the single server-side decision the clients mirror (the *Decide Once*).
5. **Validations for DONE** — the automated proofs, in four rungs:
   - **Unit** — the pure decision function, every edge case (including all supported locales).
   - **Contract** — the *data* converges: the same identity, hit with each client's real payload, resolves to the same server truth. Headless, seconds.
   - **Render** — the *pixels* converge: the same seeded user does it on web (Playwright) and iOS/Android (Maestro), and state written on one surface appears on the others.
   - **Guardian** — the server rejects a bypassed client.

   The story is DONE only when all four are green. "Builds on three platforms" is one rung below — it's *per-platform verification*, not DONE.

---

### Worked example 1 — Favorites (the flagship)

**Story.** As a signed-in user, I favorite a story on one device and find it on all my devices.

**Gherkin.**
```gherkin
Given I am signed in as the same user on web, iOS and Android
When I favorite "The Judgment of Solomon" on web
Then it appears in my Favorites on iOS and Android

Given I am a guest
When I tap the heart
Then I am asked to sign in, and the favorite is applied after login
```

**Problem.** A favorite keyed by a non-canonical id diverges per client — web sends a localized slug, mobile sends the base slug — so the *same* story favorited on web never shows on the phone. Silent, per-surface, invisible to a build.

**Shared contract.** `resolveFavoriteKey(storyId, { lang }) → baseSlug`, decided server-side. Clients send their native id plus hints; the server canonicalizes. One decision, three mirrors.

**Validations for DONE.**
- *Unit*: tests on the key resolver (all four id shapes → baseSlug).
- *Contract*: a headless verifier signs in as the test user and marks the favorite with **each client's exact payload**, asserting convergence — `mark[A] → visible[B] · visible[C]`. Went `0/6` (bug live) → `6/6` (fixed).
- *Render*: Maestro (iOS + Android) + Playwright (web), **one seeded identity** (a minted custom token), favorite on one surface → asserted rendered on the others. *This is the rung that caught a live Android crash a green build had hidden.*
- *Guardian*: favorites are auth-only; the server returns `401` for guests and stores under `userFavorites/{uid}` regardless of what the client claims.

---

### Worked example 2 — The name that wasn't a name

**Story.** As a parent, I create a personalized story for my child.

**Gherkin.**
```gherkin
Given the "create a story" form
When I enter "Lkklkk" (random keystrokes) as the child's name
Then it is rejected before anything is generated — on every client — and no money is spent

When I enter a real name in any of the 20 supported languages
Then it is accepted
```

**Problem.** The form accepted garbage, **spent money** generating text and a cover from it, and baked "Lkklkk" into the artwork. It "worked" — and shipped a broken story a parent paid for.

**Shared contract.** `validateChildName(name) → { valid, code }`, decided server-side. i18n-aware: the "random keystrokes" heuristic (Latin script with no vowel) applies only to Latin names — محمد, 太郎, 민준, आरव, שרה, Ольга are all valid.

**Validations for DONE.**
- *Unit*: 10 cases — `Lkklkk` → rejected, the six non-Latin scripts accepted, short consonant names (`Ng`, `Xu`) accepted, symbols rejected.
- *Guardian*: the server returns `400` before generation — so even a client that forgot to validate cannot burn money.
- *Render (paint)*: web and iOS disable the submit button and show an inline reason. Same rule, three implementations, mirrored from the contract.

---

## Why one engineer consolidates instead of decomposing

The industry's default advice — decompose, distribute, one service per bounded context — is written for organizations solving *coordination* problems. A single builder with an iOS app, an Android app, a web app and a backend has the **opposite** problem: not too many teams, but too many **surfaces** that can each be subtly wrong in their own way.

For that problem the winning move is not to split further. It is to **collapse every decision into one tested place and turn the clients into glass.** Fewer places for a bug to live; one proof that all surfaces obey; a pattern an AI agent can mirror across three codebases in an afternoon without inventing a fourth source of truth.

Microservices scale an organization. **DOPE scales an individual.**

---

*Part of the DOPE family: this paper (the architecture) · the [evolution log](README.md#evolution-log) (how it emerged, compute-first) · [Battling](https://github.com/jesushurtadodev/battling-agentic-enterprise) (the discipline that keeps it honest) · [`/feature-xplat`](skill/feature-xplat.md) (the skill that executes it).*

*Built by [Jesús Hurtado](https://www.linkedin.com/in/jesushurtadomolina/) — [jesushurtado.dev](https://jesushurtado.dev). MIT License. Context: [AudioRel](https://www.audiorel.com).*
