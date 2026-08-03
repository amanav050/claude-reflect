const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'
const REFLECTION_MODEL = 'qwen/qwen3.6-27b'
const FALLBACK_MODEL = 'openai/gpt-oss-120b'

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
  // Strip <think>...</think> blocks
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  // Strip markdown fences
  s = s.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  // Extract from first { to last }
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a === -1 || b === -1 || b <= a) return null
  const candidate = s.slice(a, b + 1)
  try { JSON.parse(candidate); return candidate } catch { return null }
}

async function callGroq(apiKey, messages, model, temperature, maxTokens, attempt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  })
  if (res.status === 429 && (attempt || 0) < 2) {
    await sleep((attempt || 0) === 0 ? 1000 : 2000)
    return callGroq(apiKey, messages, model, temperature, maxTokens, (attempt || 0) + 1)
  }
  return res
}

async function getContent(apiKey, messages, model, temperature, maxTokens) {
  const res = await callGroq(apiKey, messages, model, temperature, maxTokens, 0)
  if (res.status === 429) return { error: 'Rate limit reached. Try again in a moment.', status: 429 }
  let data
  try { data = await res.json() } catch { return { error: 'Bad response from AI.', status: 500 } }
  if (!res.ok) return { error: 'AI service error.', status: 500 }
  const content = data?.choices?.[0]?.message?.content
  if (!content) return { error: 'Empty response.', status: 500 }
  return { content }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Server misconfigured' })
    const body = parseBody(req.body)
    if (!body || !body.type) return res.status(400).json({ error: 'Invalid request.' })

    // ── MAIN RESPONSE ──
    if (body.type === 'main') {
      if (!Array.isArray(body.messages)) return res.status(400).json({ error: 'Missing messages.' })
      const result = await getContent(apiKey, [
        { role: 'system', content: 'You are a helpful, thoughtful AI assistant. Respond thoroughly and naturally. Use markdown formatting — headers, bold, numbered lists, bullet points — for clear, well-structured responses.' },
        ...body.messages,
      ], MODEL, 0.7, 1500)
      if (result.error) return res.status(result.status).json({ error: result.error })
      return res.status(200).json({ response: result.content })
    }

    // ── REFLECTION ──
    if (body.type === 'reflection') {
      if (!body.query || !body.response) return res.status(400).json({ error: 'Missing query/response.' })

      const sysPrompt = `You are an AI reasoning analyst. Return ONLY a valid JSON object. No markdown fences. No backticks. No text before or after. No thinking tags. Start with { end with }. Be honest about confidence — flag real uncertainties.`

      const userPrompt = `Analyze this AI response. Return ONLY JSON.

User asked: "${body.query}"

AI responded:
"""
${body.response}
"""

JSON schema to follow exactly:
{"reasoning_skeleton":[{"step":"...","label":"from_input|general_knowledge|inference|assumption","detail":"..."}],"uncertainty_flags":[{"sentence":"exact sentence","reason":"why uncertain","severity":"low|medium|high"}],"gaps":[{"topic":"not covered","reason":"why"}],"critical_question":{"question":"sharp question","context":"why it matters"},"sentence_labels":[{"sentence":"each sentence","label":"confident|inference|assumption|uncertain","basis":"basis"}]}`

      const result = await getContent(apiKey, [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ], REFLECTION_MODEL, 0.3, 2000)

      if (result.error) return res.status(result.status).json({ error: result.error })

      // Extract and validate JSON server-side
      let json = extractJSON(result.content)

      // If primary model failed to produce