# The Playbook — Compute Once, Paint Everywhere

How a feature moves through four layers (backend + Android + iOS + web) without the platforms drifting apart. Pattern validated in production on 2026-07-10 with the listening-streak system (case study 1 below). Executable version: [skill/feature-xplat.md](skill/feature-xplat.md).

> Context: AudioRel is an audio-stories platform for children in 20 languages — Node/Express backend on Firestore, SwiftUI iOS app, Jetpack Compose Android app, Next.js web app. One engineer, AI agents (Claude Code) doing the multiplication. PR numbers reference our private monorepo.

## The four principles

### 1. The server computes, the clients paint

Any logic that could diverge between platforms (dates, timezones, streaks, counters, feature gates) is computed **once, server-side**, as a pure function with unit tests. Clients only render.

> Real case: iOS, Android and web each computed the listening streak locally, each with the device's timezone. A listen at 23:50 Madrid time was "today" on the phone and "tomorrow" in UTC → different streaks per platform. The fix wasn't repairing three calculations — it was **deleting them** (`computeListeningSummary()` on the server, clients send `?tz=`).

Rules that fall out of this:

- The pure function takes `now` and `tz` as **parameters** — testable without flakiness.
- The endpoint accepts `?tz=` (IANA) and buckets days/hours server-side.
- **Never return raw `Date`/`Timestamp` objects** from an endpoint. Serialize to ISO strings. (A URL-rewriting middleware in our stack reconstructed response objects via `Object.keys` and silently turned Dates into `{}` — the iOS calendar was broken in production for months and nobody knew.)
- No side effects in GETs. Marketing-profile syncs, counters, etc. belong in the POST that writes the event, not in the GET that reads the summary. (We shipped a GET that fired a CRM identify + 300 Firestore reads *per Home screen open*. Review caught it.)

### 2. Contract before code

No client model gets written before seeing the **real JSON with `curl` against production**. The contract is the spec; the clients are mirrors.

The unexpected payoff: **mirroring audits the original.** Building the Android calendar against the real API exposed, in one afternoon:

- `playedAt: {}` — the destroyed-Dates bug above (iOS had been silently broken for months);
- a destructive CRM `identifyUser` call that reset users' locale and subscription tier to defaults whenever it synced one attribute (fix: partial-update API instead);
- a cloud-billing failure returning 403s on storage (a business incident found via a 403 on a cover image).

A second client is the cheapest audit your API will ever get.

### 3. Graceful fallback decouples merges from deploys

Every client is born tolerating that its endpoint doesn't exist yet: feature hidden + a log warning + the old code path. Consequences:

- PRs merge **in any order** — nobody waits for anybody;
- deploys happen when they happen;
- the switch to server data is automatic and invisible.

In the streak rollout this fired four times (Android pre-deploy, web pre-redesign, iOS, and the per-month calendar). Zero coordination meetings, zero broken builds.

### 4. Review redesigns before multiplying

A cross-platform feature multiplies whatever you build ×4 — including design mistakes. Human review of the backend contract happens **before** the three clients are written.

> Real case: review of the first summary endpoint produced "the chip and the calendar share **logic, not a window**" — which split the API into `/summary` (rolling 90 days) and `/calendar?month=` (unbounded history) with shared bucketing. All three clients were then born with the right shape, instead of being reshaped three times.

And review keeps mattering *after* the multiplication: a second review round caught **the same class of locale bug in all three clients** — the AI had used device-locale formatters on protocol material (a `DateFormatter` without a fixed locale on iOS renders a Buddhist calendar for Thai users; `String.format` without `Locale.ROOT` on Android emits Eastern Arabic digits; the web merged history in UTC). Rule burned in:

> **Protocol material always uses a fixed locale** — `en_US_POSIX` (iOS), `Locale.ROOT` (Android), server-side tz bucketing (web). Device locale is for *painting*, never for *protocol*.

## Single sources of truth (the precondition)

The pattern only works if every fact has exactly one home:

| What | Source | Consumers |
|------|--------|-----------|
| UI wording, 20 languages | One canonical store per tree (see chapter 3) | iOS natively; Android via codegen; web via API at runtime |
| Supported languages | One config file, helper functions, **never hardcoded lists** | All |
| Content (stories, collections) | The content API | All |
| Analytics event names | The iOS set (`story_view`, `scene_play`, `streak_viewed`…) | Shared cross-platform analytics project |
| Identity | Firebase UID, one project | Auth, entitlements, CRM, analytics |

This is why a complete native Android app was built in a day: no product was created — an existing one was **mirrored** against single sources of truth.

## Case study 1: the listening streak 🔥 (2026-07-10)

```
backend PR   /summary endpoint + computeListeningSummary (11 tests) + CRM attributes
hotfix PR    partial-update CRM API (identify was wiping profile fields)
android PR   🔥 chip on Home + calendar (pre-deploy fallback verified in emulator)
ios PR       chip + fetchSummary + per-month calendar
review PR    real 90d window, /calendar?month=, CRM sync moved to the write path (16 tests)
web PR       StreakChip + ProfileStats (fixed its own UTC bug in passing)
android PR   per-month calendar + tz on the tracking call
```

**7 PRs, ~1,100 lines, one day.** Production bugs caught along the way: 4 (cloud billing, middleware-destroyed Dates, destructive CRM identify, web UTC bucketing).

## Case study 2: the audit that destroyed its own finding (2026-07-10)

An architecture audit flagged the web app as missing three language dictionaries (Hebrew, Danish, Norwegian — the 2026 expansion markets). Priority 1: add them.

The agent started implementing and stopped: the `dictionaries/` directory (17 JSON files) was **imported by nothing**. The real chain loads wording from the backend API (444 keys × 20 languages — Hebrew/Danish/Norwegian verified live in production), with a hardcoded-English dictionary as the failure fallback. The JSONs were a fossil from a previous iteration of the system, stale for months, acting as a decoy for any auditor — human or AI.

Deliverables:

1. **A deletion PR** + a header comment documenting where the truth lives.
2. A **unified API client**: nine files were hand-rolling the same internal-auth header pattern while the shared helper sat unimported in `lib/api.ts`. All migrated; rule established ("every new backend fetch goes through this module").
3. **A decision NOT to build**: the temptation was to clone the iOS→Android string-generation script for the web. Verdict: unnecessary — the web already had its own complete pipeline. The best tool is the one you don't have to maintain.

Lessons:

- **Dead code isn't neutral — it actively lies to whoever audits the system.** Repo hygiene stops being aesthetics and becomes *agent accuracy*.
- An agent that verifies its own findings against production before implementing is worth twice one that follows orders.
- Sometimes the best PR removes lines.

## Anti-patterns (all of these actually bit us)

| Anti-pattern | Real consequence |
|---|---|
| Date/streak logic in clients | 3 divergent implementations, one per device timezone |
| Returning raw `Date` from an endpoint | Silent `{}` after middleware — iOS calendar broken for months |
| CRM full-identify for single attributes | Wiped users' locale & subscription tier |
| Side effects (CRM sync) in a GET | An identify + 300 DB reads per Home open |
| Stacked PRs not re-targeted to main | Merges landed in the base branch; main silently missed two phases |
| `limit(N)` as a time window | Streak undercounted for heavy users |
| Trusting the HTTP 200 | A "working" write was storing the document under the wrong user ID |
| Device locale on protocol material | Buddhist calendar (iOS), Eastern Arabic digits (Android), UTC drift (web) |
| Dead code left in the repo | Lied to an architecture audit; almost caused pointless work |

---

*Living document — grows with the [evolution log](README.md#evolution-log).*
