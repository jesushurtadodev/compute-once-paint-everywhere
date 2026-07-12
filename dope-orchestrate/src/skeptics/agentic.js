import { query } from '@anthropic-ai/claude-agent-sdk';

// A tool-using skeptic — the differentiator of /dope-orchestrate. Built on the
// Claude Agent SDK: each skeptic is an autonomous subagent that can Read files,
// run Bash (grep code, curl production), and investigate BEFORE ruling. It
// verifies against reality, not against the claim's own wording — the discipline
// of the sibling series, Battling.
//
// The Agent SDK has no first-class structured output, so we instruct-and-parse:
// the system prompt pins an exact JSON shape and we parse the final `result`.
//
// Requires ANTHROPIC_API_KEY (the SDK bills per use; it cannot use a Claude
// subscription). Runs headless via permissionMode: 'bypassPermissions'.
export function agenticSkeptic({ model = 'sonnet', tools = ['Read', 'Bash', 'Grep'], maxTurns = 8, cwd } = {}) {
  return async ({ lens, claim, context }) => {
    const toolLine = tools.length
      ? `You may use tools (${tools.join(', ')}) to inspect code, run commands, grep, or curl production and gather real evidence. Verify against reality, not against how the claim is worded.`
      : `Judge from the evidence provided in the context below.`;
    const systemPrompt = `You are a skeptical ${lens.name} auditor. Your job is to REFUTE the claim — actively look for grounds to reject it, never take it at face value.

${toolLine}

LENS: ${lens.instruction}

When finished, output ONLY a JSON object (no prose, no markdown fence) of exactly this shape:
{"refuted": <boolean>, "confidence": <number 0..1>, "severity": "none"|"low"|"medium"|"high", "target": "<the part of the claim you attacked, or ''>", "evidence": "<what you actually checked and found>"}
The "evidence" must cite what you inspected. A verdict without concrete evidence is invalid.`;

    const prompt = `CLAIM:\n${claim}\n\nCONTEXT:\n${context || '(none)'}\n\nInvestigate, then return your JSON verdict.`;

    let resultText = null;
    for await (const message of query({
      prompt,
      options: {
        model,
        systemPrompt,
        allowedTools: tools,
        permissionMode: 'bypassPermissions',
        maxTurns,
        ...(cwd ? { cwd } : {})
      }
    })) {
      if (message.type === 'result') {
        resultText = message.result;
        break;
      }
    }
    if (resultText == null) throw new Error('agentic skeptic returned no result message');
    return parseVerdict(resultText);
  };
}

function parseVerdict(text) {
  let s = String(text).trim();
  if (s.startsWith('```')) s = s.replace(/```json\n?/, '').replace(/```\n?/, '').replace(/```$/, '').trim();
  const m = s.match(/\{[\s\S]*\}/);
  if (!m && !s.startsWith('{')) {
    // The SDK returned prose instead of a verdict — almost always an API/billing
    // error surfaced as the result text (e.g. "Credit balance is too low").
    throw new Error(`agent returned non-JSON (likely an API/billing error): ${s.slice(0, 120)}`);
  }
  const obj = JSON.parse(m ? m[0] : s);
  return {
    refuted: !!obj.refuted,
    confidence: typeof obj.confidence === 'number' ? obj.confidence : 0,
    severity: ['none', 'low', 'medium', 'high'].includes(obj.severity) ? obj.severity : 'none',
    target: obj.target || '',
    evidence: obj.evidence || ''
  };
}
