# /feature-xplat — Cross-Platform Feature (backend + Android + iOS + web)

> **What this is**: a [Claude Code](https://claude.com/claude-code) skill — a markdown workflow the agent loads and executes step by step. This is the sanitized, generalized version of the one we run in production at AudioRel; adapt paths, build commands and tool names to your stack. The principles are the part you shouldn't change.
>
> **Install**: drop this file into `.claude/commands/feature-xplat.md` in your repo, then run `/feature-xplat <feature description>`.

Moves one feature through all four layers using the pattern validated in production on 2026-07-10 (listening-streak system — see [playbook.md](../playbook.md)).

## Principles (why the steps are in this order)

1. **The server computes, the clients paint.** Any logic that could diverge between platforms (dates, timezones, streaks, counters, gates) is computed ONCE server-side as a **pure function with unit tests**. Clients render the result.
2. **Contract before code.** Never write a client model without having seen the real JSON via curl. Mirroring audits the original (this is how we caught destroyed Dates, a destructive CRM identify, and a cloud-billing outage).
3. **Graceful fallback = order-free merges.** Every client is born tolerating that its endpoint doesn't exist yet (feature hidden + log warning + old code path). This decouples merges from deploys: nobody waits for anybody.
4. **PRs always target `main`.** Stacked-PR merges land in their base branch, NOT in main (GitHub only retargets if you delete the base branch — if your team keeps branches, that never happens). We learned this by shipping two phases into a branch nobody deployed.

## STEP 1 — Contract and backend

1. If the endpoint exists: `curl` production and dump the real shape. If it doesn't: design the JSON contract first (fields as plain strings/numbers; **NEVER return raw `Date`/`Timestamp`** — serialize to ISO strings; middlewares that reconstruct response objects will silently destroy anything richer).
2. Logic as an exported pure function in your services layer + unit tests. Inject `now`/`tz` into the signature so tests never flake.
3. Timezone: accept `?tz=` (IANA) and bucket local days/hours **server-side**. Device locale is for painting, never for protocol.
4. Thin route handler — **no side effects in GETs** (CRM/marketing syncs belong in the POST that writes the event). If your CRM has a full-identify call, prefer the partial-attributes API: full identify with defaults **wipes existing profile fields**.
5. Don't leak `error.message` into 500 responses.
6. PR against main (use a git worktree if your tree has WIP). Merge per your team's flow.

## STEP 2 — Android (first: fastest verification loop)

1. `@Serializable` model **with defaults** (missing fields must not crash old clients) + endpoint in the API interface.
2. A shared Repository if several screens consume it.
3. UI + **graceful fallback** if the backend isn't deployed yet.
4. Analytics: emit through your fan-out helper with the SAME event names as iOS.
5. Strings: generate from your canonical wording source; anything without a source goes to an explicit `UNTRANSLATED` list (marked debt, fails loudly).
6. Build with the **pinned toolchain** (`./gradlew`, pinned JDK — never the global gradle), then **verify E2E in the emulator** (adb + uiautomator + screenshot). Don't trust the compile.
7. PR against main.

## STEP 3 — iOS (mirror of the pattern already validated on Android)

1. Watch for tooling quirks when editing existing Swift files (in our setup, scripted edits via `python3`/`sed` are more reliable than editor-integrated tools that hooks may revert).
2. New files must be registered in `project.pbxproj` (4 entries). New strings need ALL supported languages in the strings catalog or the build fails.
3. Mirror service (same fetch + same graceful degradation as Android).
4. `xcodebuild` against the simulator; know your project's pre-existing errors so you don't chase ghosts.
5. **Fixed locale on protocol material**: any `DateFormatter` that parses/formats API data uses `en_US_POSIX` — a device-locale formatter renders a Buddhist calendar for Thai users and breaks your date math.
6. PR against main.

## STEP 4 — Web

1. Components consume the backend ONLY through the unified API client module (one place for base URL, auth headers, internal-token bypass). No hand-rolled fetches in pages/components.
2. tz from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
3. Analytics through the fan-out helper (same event names) — not through a single-destination client, or one platform silently loses the event.
4. Typecheck (`npx tsc --noEmit`) and compare the error count against the base branch — zero NEW errors.
5. PR against main (the hosting preview is your visual verification).

## STEP 5 — Close the loop

1. **Integral E2E** once everything deploys: feature live in the Android emulator + **verify the data in the destination system** (DB / CRM / analytics — don't trust the 200, look at the stored record).
2. Documentation: an article or per-domain entry in your architecture wiki, written at merge time, not "later".
3. Record any new gotcha that bit you — the next feature reuses this file.

## Anti-patterns that actually bit us (don't repeat)

| Anti-pattern | Real consequence |
|---|---|
| Date/streak logic in clients | 3 divergent implementations, one per device timezone |
| Returning raw `Date` from an endpoint | Silent `{}` after middleware (a client feature broken for months) |
| CRM full-identify for single attributes | Wiped locale & subscription tier on real user profiles |
| Side effects (CRM sync) in a GET | An identify + 300 DB reads per Home-screen open |
| Stacked PRs without retargeting | main silently missed two phases of work |
| `limit(N)` as a time window | Undercounted data for heavy users |
| Trusting the HTTP 200 | A "working" write stored the doc under the wrong user ID |
| Device locale on protocol material | Buddhist calendar, Eastern Arabic digits, UTC drift — one per platform |


## Definition of Done (non-negotiable) — same user, three surfaces

A cross-platform feature is NOT "done" because each client builds and works in
isolation. It's done when an **automated test proves the same authenticated user
performs the action identically across all three surfaces AND state written on
one surface renders on the other two.** Because the backend is the single source
of truth, this is the only test that actually validates the pattern.

- **Web** → Playwright · **iOS/Android** → Maestro.
- **Shared test identity**: one dedicated user/token all three automations reuse
  (a custom token, or a sandbox user). Without shared identity you don't test
  the crossing.
- **Canonical scenario = write on A, assert on B and C**: favorite a story on
  web → assert it appears favorited on iOS and Android for the same UID (source
  of truth: `userFavorites/{uid}`). Same shape for onboarding prefs, creation.
- Verify the DATA in the destination system (DB/CRM/analytics), not just the 200
  or one platform's UI.

**Honest corollary**: "verified in the Android emulator + iOS build + web
browser" is *per-platform verification* — one rung below the DoD. Name the
difference; don't mark "done" until the cross-user test passes. The bugs that
break the crossing (a non-canonical key, divergent event props, a CORS preflight
only the browser exercises) are invisible to per-platform verification.

## The analytics contract (event props ARE the contract)

Event properties are part of the contract. Real divergences caught in review:
- position 0-based on one client, 1-based on another (a prompt bug).
- a source field hardcoded differently per platform.
- values as LOCALIZED labels on one client ("sleepy dragon" vs "dragón dormilón"
  never group) vs stable IDs on another.
- an intent event fired only after the server 202 on some clients (undercounting
  rate-limits and network failures) vs at-tap on others.
**Canon**: identical names · values = stable IDs (never labels) · intent events
at-tap · spell out name+props+values with examples in the agent's prompt · diff
all three clients at once.