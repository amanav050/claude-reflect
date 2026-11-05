const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parseBody(body) {
  if (!body) return null
  if (typeof body === 'string') { try { return JSON.parse(body) } catch { return null } }
  if (typeof body === 'object') return body
  return null
}

function extractJSON(text) {
  if (!text) return null
  let s = text.trim()
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  s = s.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a === -1 || b === -1 || b <= a) return null
  const candidate = s.slice(a, b + 1)
  try { JSON.parse(candidate); return candidate } catch { return null }
}

const MINIMAL_REFLECTION = JSON.stringify({
  reasoning_skeleton: [
    { step: "Analyzed user query", label: "from_input", detail: "Based on the user's question" },
    { step: "Generated response from training data", label: "general_knowledge", detail: "Used general knowledge to construct answer" },
    { step: "Made interpretive judgments", label: "inference", detail: "Some claims involve interpretation beyond stated facts" },
  ],
  uncertainty_flags: [
    { sentence: "Some claims in this response may require verification.", reason: "AI responses can contain inaccuracies", severity: "medium" },
  ],
  gaps: [
    { topic: "Alternative perspectives", reason: "Response may not cover all viewpoints" },
    { topic: "Source verification", reason: "Claims are not cited to specific sources" },
  ],
  critical_question: {
    question: "What assumptions are you making about the accuracy of this response?",
    context: "AI responses should be verified against authoritative sources before acting on them",
  },
  sentence_labels: [],
})

async function callGroq(apiKey, messages, temperature, maxTokens) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: maxTokens }),
      })
      if (res.status === 429) {
        await sleep(attempt === 0 ? 1000 : 2000)
        continue
      }
      return res
    } catch {
      if (attempt < 2) { await sleep(1000); continue }
      return null
    }
  }
  return null
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Server misconfigured' })
    const body = parseBody(req.body)
    if (!body || !body.type) return res.status(400).json({ error: 'Invalid request.' })

    // ── MAIN ──
    if (body.type === 'main') {
      if (!Array.isArray(body.messages)) return res.status(400).json({ error: 'Missing messages.' })
      const groqRes = await callGroq(apiKey, [
        { role: 'system', content: 'You are a helpful AI assistant. Respond thoroughly using clean markdown — headers (##), **bold**, numbered lists, bullet points. Never use HTML tags like <br> or <p>. Never use <think> tags. Write naturally structured responses.' },
        ...body.messages,
      ], 0.7, 1500)
      if (!groqRes) return res.status(500).json({ error: 'Could not reach AI service.' })
      const data = await groqRes.json().catch(() => null)
      if (!data || !groqRes.ok) return res.status(500).json({ error: 'AI service error.' })
      const content = data?.choices?.[0]?.message?.content
      if (!content) return res.status(500).json({ error: 'Empty response.' })
      return res.status(200).json({ response: content })
    }

    // ── REFLECTION ──
    if (body.type === 'reflection') {
      if (!body.query || !body.response) return res.status(400).json({ error: 'Missing fields.' })

      try {
        const groqRes = await callGroq(apiKey, [
          { role: 'system', content: 'Output ONLY raw JSON. No <think> tags. No markdown. No backticks. No explanation. Just a JSON object starting with { and ending with }.' },
          { role: 'user', content: `Analyze this AI response in detail. Return ONLY a JSON object.

User query: "${body.query}"

AI response to analyze:
"""
${body.response.slice(0, 2000)}
"""

Return this exact JSON structure with thorough, specific analysis. Include 3-5 reasoning steps, flag 2-3 uncertain sentences with exact quotes, identify 2-3 gaps, and ask one sharp critical question:
{"reasoning_skeleton":[{"step":"description","label":"from_input|general_knowledge|inference|assumption","detail":"explanation"}],"uncertainty_flags":[{"sentence":"exact quote from response","reason":"why uncertain","severity":"low|medium|high"}],"gaps":[{"topic":"what was missed","reason":"why omitted"}],"critical_question":{"question":"one tough question","context":"why it matters"},"sentence_labels":[{"sentence":"each key sentence from response","label":"confident|inference|assumption|uncertain","basis":"what it is based on"}]}` },
        ], 0.2, 1500)

        if (groqRes) {
          const data = await groqRes.json().catch(() => null)
          if (data && groqRes.ok) {
            const content = data?.choices?.[0]?.message?.content
            if (content) {
              const json = extractJSON(content)
              if (json) return res.status(200).json({ reflection: json })
            }
          }
        }
      } catch {}

      return res.status(200).json({ reflection: MINIMAL_REFLECTION })
    }

    // ── FOLLOWUP ──
    if (body.type === 'followup') {
      if (!body.query || !body.criticalQuestion) return res.status(400).json({ error: 'Missing fields.' })

      const answer = (body.response || body.briefSummary || '').slice(0, 1200)

      const groqRes = await callGroq(apiKey, [
        {
          role: 'system',
          content: 'You help users think critically about an AI answer before they act on it. Reply in plain text only. No markdown, no # headings, no ** bold, no tables, no HTML, no <think> tags. Use only the • symbol for bullets.',
        },
        {
          role: 'user',
          content: `The user asked: "${body.query}"

The AI answered:
"""
${answer}
"""

Critical question to think through: "${body.criticalQuestion}"

Reply in exactly this format and nothing else:

Why this matters:
• [one short sentence]

Things to check:
• [one short sentence]
• [one short sentence]
• [one short sentence]

Your next step:
• [one short sentence]

Rules:
- Maximum 90 words in total.
- Plain, everyday English. No jargon.
- Be specific to this question and answer, not generic advice.
- No intro line and no closing line.`,
        },
      ], 0.3, 500)

      if (!groqRes) return res.status(500).json({ error: 'Could not reach AI.' })
      const data = await groqRes.json().catch(() => null)
      if (!data || !groqRes.ok) return res.status(500).json({ error: 'AI error.' })
      const content = data?.choices?.[0]?.message?.content
      if (!content) return res.status(500).json({ error: 'Empty response.' })
      const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<[^>]+>/g, '').trim()
      return res.status(200).json({ followup: clean })
    }

    return res.status(400).json({ error: 'Invalid type.' })
  } catch {
    return res.status(500).json({ error: 'Server error.' })
  }
}