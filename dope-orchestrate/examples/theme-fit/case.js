// A claim that is deliberately over-broad: it asserts ALL four themes fit, but
// "bravery" has no support in the synopsis. A good refutation panel should KILL
// it. This ties dope-orchestrate to dope-eval — the same weak theme the eval
// judge docked, here refuted by consensus.
//
// Runs on the stateless backend (no tools needed — the evidence is in `context`).
export default {
  name: 'theme-fit',
  expectKilled: true, // the harness works if it kills this over-broad claim

  claim: 'For the story "The Tortoise and the Hare", ALL of these suggested themes fit the story: bravery, determination, perseverance, humility.',

  context: 'SYNOPSIS: An overconfident hare mocks a slow tortoise and challenges him to a race. The hare naps mid-race certain of winning, while the tortoise plods on steadily and crosses the finish line first.',

  lenses: [
    { name: 'textual-support', instruction: 'Refute by finding any listed theme with NO support in the synopsis text. Quote the synopsis (or point at its absence) as evidence.' },
    { name: 'over-reach', instruction: 'Refute by finding a theme that sounds plausible for the genre but is not actually demonstrated by the events described.' },
    { name: 'moral-core', instruction: 'Refute by checking whether each theme reflects the story\'s central lesson, not a peripheral or absent trait.' }
  ],

  killThreshold: 2, // claim dies if >= 2 lenses refute it (with confidence)
  minConfidence: 0.5,

  // Agentic-backend overrides for THIS case: the evidence is in `context`, so no
  // tools / minimal turns → a fast single-shot that still exercises the Claude
  // Agent SDK query() path. (A case that needs investigation would keep tools.)
  agentic: { tools: [], maxTurns: 2 }
};
