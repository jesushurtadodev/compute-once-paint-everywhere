# /cope-post — Write a chapter + LinkedIn post for your build-in-public series

> A [Claude Code](https://claude.com/claude-code) skill: the style guide behind
> the *DOPE* series, as an executable workflow.
> Drop into `.claude/commands/cope-post.md` and run `/cope-post <what happened>`.
> Adapt names and paths; keep the rules.

## The golden rule

**The scar, not the promise.** A chapter publishes when its PRs are merged and
its numbers are real. Work in progress still gets written — with `[PENDING]`
markers and a `🚧 DRAFT` banner, committed to the repo so it can't be lost —
but it does NOT go to LinkedIn until it's true end to end.

## Post structure (the one that works)

1. **Double hook** — clickbait headline + a first line that re-hooks with your
   second-best hook. *"We were storing the product on a customer's iPhone." /
   "The fix was a refactor that ate a feature off our roadmap."*
2. **Gentle context** (2 lines): what the feature is, why it looked fine.
3. **The turn**: the discovery — ideally ONE question or ONE number.
4. **Anatomy in beats** (3-5 emoji bullets 🔍): short facts, ending on the one
   that hurts most.
5. **The absolution** (when there's blame): *"nobody decided this — it grew."*
   The reader drops their guard and shares, because it happens to everyone.
6. **Consequences**: 2-3, closing with the EMOTIONAL one (a child's lost story
   beats an unauditable entitlement).
7. **The fix in one line** (code block if it fits).
8. **The quantified climax**: real numbers + one stealable sentence
   (*"the best refactors don't compete with your roadmap; they eat it"*).
9. **The codified lesson**: what got written into rules/memory/linters so it
   no longer depends on human recall.
10. **Mirror question** to the reader — specific, never generic.

## Fun clickbait — the formula

Three molds (pick ONE):
- **Literally true + sounds like a disaster**: "We were storing the product on
  a customer's iPhone" — they click expecting an incident, they get architecture.
- **Apparent contradiction**: "The audit that destroyed its own finding" ·
  "Your uptime is 100%. Is anyone listening?"
- **Naked numbers**: "One feature. Four codebases. One day."

Banned: mystery without payoff ("You won't believe…"), empty promises ("This
ONE trick"), any hook paragraph 2 doesn't cash. **The test**: would a skeptical
senior engineer click AND not feel cheated afterwards? Both, always.

## The mother rule: clickbait WITH the receipt

The headline stops the scroll; the data earns the trust. A headline with no
receipt is vapor; a receipt with no headline goes unread. Both together is the
rare part — and the whole edge of this series. RULE: every big claim in the
post is anchored to verifiable evidence, screenshot-able where possible:

| Claim (the hook) | Receipt (the data/image) |
|---|---|
| "114 PRs in a week" | the `gh pr list` that counts them |
| "it froze mid-sentence" | the screenshot of the quota at 100%, in red |
| "it cost €20" | balance €180.63 → €160.52, captured |
| "it caught a real bug" | the 404 loop + its 3-line fix |
| "dead code lies" | the `grep` with no results |
| "silence is not success" | the synthetic event you had to inject |

Cost IS post material, not a weakness: giving the MARGINAL cost (the overage
above a flat subscription) reads stronger than the total, and anchoring it to a
deliverable ("€20 for the round that caught the 404") ties price to value. The
reader finishes the comparison themselves ("€20 vs. an hour of a senior").

## The honesty that makes clickbait credible

- Tell what you did NOT build, and why (the unmonitorable metric, the tool
  that wasn't needed).
- Admit your own mistakes and your AI's (the locale bugs, the wrong prompt).
- Name the real limitations (free tiers, CI pricing, quota math).

## LinkedIn mechanics

- Body in English, NO links (the algorithm punishes external links in-body).
- 1st comment: translated version notice + repo link + personal site.
- 2nd comment: the full translation.
- Cadence: 4-7 days between posts; NEVER two the same day.
- After publishing: reply to EVERY comment — each reply re-injects the post.

## Visual signature (retro-terminal aesthetic)

- Hero image 1200×675, built as HTML → `npx playwright screenshot`.
- Palette: background `#0d1117`, text `#e6edf3`, phosphor green `#3fb950`,
  purple `#d2a8ff`/`#6f42c1`, red `#f85149` for the "before"/errors.
- **A ZX Spectrum rainbow stripe as the footer** — the signature, ALWAYS.
- Two molds: terminal card (investigations, diffs, green tests) and
  before/after diagram (architecture, red/green columns).

## The workflow

1. Verify the scar (merged PRs, real numbers) — else DRAFT mode.
2. Write the post (original + translation) with the structure above.
3. Generate the hero image (+ carousel cards: diff-stat, tests, real system
   screenshots).
4. Commit to the public journal repo: `wiki/post-N.md` + `wiki/assets/` +
   a new row in the README's Evolution log.
5. Working copies wherever you stage your publishing.
6. Voice: first person, warm, zero hollow jargon — in our case: *the 80s kid
   with 2026 tools.*
