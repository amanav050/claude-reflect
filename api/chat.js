const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'
const REFLECTION_MODEL = 'openai/gpt-oss-120b'
const FALLBACK_MODEL = 'openai/gpt-oss-120b'

const REFLECTION_SYSTEM_PROMPT = `You are an AI reasoning analyst. You MUST return ONLY a valid JSON object.

CRITICAL RULES:
- Start your response with { and end with }
- No markdown backticks
- No text before or after the JSON
- No explanation outside the JSON
- No \`\`\`json wrapper
- Be genuinely honest about confidence levels
- Do not default to high confidence on everything
- Flag real uncertainties and identify real gaps`

const REFLECTION_JSON_SCHEMA = `{
  "reasoning_skeleton": [
    {"step": "Description of reasoning step", "label": "from_input | general_knowledge | inference | assumption", "detail": "Brief basis explanation"}
  ],
  "uncertainty_flags": [
    {"sentence": "Exact sentence from the response", "reason": "Why confidence is lower", "severity": "low | medium | high"}
  ],
  "gaps": [
    {"topic": "What was not covered", "reason": "Why it was omitted"}
  ],
  "critical_question": {
    "question": "One sharp question challenging the user to think before acting",
    "context": "Why this question matters"
  },
  "sentence_labels": [
    {"sentence": "Each sentence from the response", "label": "confident | inference | assumption | uncertain", "basis": "What this is based on"}
  ]
}`

function parseRequestBody(body) {
  if (body == null) return null
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return null }
  }
  if (typeof body === 'object') return body
  return null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callGroq(apiKey, messages, options = {}, attempt = 0, usedFallback = false) {
  const {
    temperature = 0.7,
    max_tokens = 1500,
    model = MODEL,
    allowFallback = false,
  } = options

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    })

    if (groqRes.status === 429 && attempt < 2) {
      await sleep(attempt === 0 ? 1000 : 2000)
      return callGroq(apiKey, messages, options, attempt + 1, usedFallback)
    }

    if (!groqRes.ok && allowFallback && !usedFallback && model !== FALLBACK_MODEL) {
      return callGroq(apiKey, messages, { ...options, model: FALLBACK_MODEL }, 0, true)
    }

    return groqRes
  } catch (err) {
    if (allowFallback && !usedFallback && model !== FALLBACK_MODEL) {
      return callGroq(apiKey, messages, { ...options, model: FALLBACK_MODEL }, 0, true)
    }
    throw err
  }
}

async function extractContent(groqRes, res) {
  if (groqRes.status === 429) {
    res.status(429).json({ error: 'Rate limit reached. Try again in a moment.' })
    return null
  }

  let data
  try { data = await groqRes.json() } catch {
    res.status(500).json({ error: 'Could not parse response. Please retry.' })
    return null
  }

  if (!groqRes.ok) {
    res.status(500).json({ error: 'Service unavailable. Please retry.' })
    return null
  }

  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.length === 0) {
    res.status(500).json({ error: 'Empty response. Please retry.' })
    return null
  }

  return content
}

async function handleMain(apiKey, body, res) {
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request. Missing required fields.' })
  }

  const systemMsg = {
    role: 'system',
    content: 'You are a helpful, thoughtful AI assistant. Respond thoroughly and naturally. Use markdown formatting — headers, bold, numbered lists, bullet points — for clear, well-structured responses.',
  }

  const groqRes = await callGroq(apiKey, [systemMsg, ...body.messages], {
    temperature: 0.7,
    max_tokens: 1500,
    model: MODEL,
  })

  const content = await extractContent(groqRes, res)
  if (content === null) return
  return res.status(200).json({ response: content })
}

async function handleReflection(apiKey, body, res) {
  if (!body.query || !body.response) {
    return res.status(400).json({ error: 'Invalid request. Missing required fields.' })
  }

  const userPrompt = `Original user query:
"${body.query}"

AI response to analyze:
"""
${body.response}
"""

Return a JSON object matching this exact schema. Remember: output ONLY the JSON, nothing else.
${REFLECTION_JSON_SCHEMA}`

  const groqRes = await callGroq(
    apiKey,
    [
      { role: 'system', content: REFLECTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.3,
      max_tokens: 2000,
      model: REFLECTION_MODEL,
      allowFallback: true,
    },
  )

  const content = await extractContent(groqRes, res)
  if (content === null) return

  // Clean up common issues — strip markdown fences, leading text, trailing text
  let cleaned = content.trim()
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '')

  // Find the first { and last } to extract JSON
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }

  // Validate it's parseable JSON before sending
  try {
    JSON.parse(cleaned)
  } catch {
    // If still not valid JSON, try the fallback model
    if (groqRes._model !== FALLBACK_MODEL) {
      const fallbackRes = await callGroq(
        apiKey,
        [
          { role: 'system', content: REFLECTION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.2,
          max_tokens: 2000,
          model: FALLBACK_MODEL,
        },
      )
      const fallbackContent = await extractContent(fallbackRes, res)
      if (fallbackContent === null) return

      let fallbackCleaned = fallbackContent.trim()
        .replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
        .replace(/^```\s*/i, '').replace(/```\s*$/i, '')
      const fb = fallbackCleaned.indexOf('{')
      const lb = fallbackCleaned.lastIndexOf('}')
      if (fb !== -1 && lb !== -1) fallbackCleaned = fallbackCleaned.slice(fb, lb + 1)

      return res.status(200).json({ reflection: fallbackCleaned })
    }

    return res.status(200).json({ reflection: cleaned })
  }

  return res.status(200).json({ reflection: cleaned })
}

async function handleFollowup(apiKey, body, res) {
  if (!body.query || !body.criticalQuestion) {
    return res.status(400).json({ error: 'Invalid request. Missing required fields.' })
  }

  const briefSummary = body.briefSummary || (body.response ? body.response.slice(0, 150) : '')

  const groqRes = await callGroq(
    apiKey,
    [
      {
        role: 'system',
        content: "You are a thoughtful AI assistant helping a user think critically about a previous AI response. Be specific, practical, and genuinely helpful. Don't be generic.",
      },
      {
        role: 'user',
        content: `Original query: "${body.query}"\n\nBrief summary: ${briefSummary}\n\nCritical question: "${body.criticalQuestion}"\n\nHelp me think through this. What should I consider? What might I be missing?`,
      },
    ],
    {
      temperature: 0.5,
      max_tokens: 800,
      model: MODEL,
      allowFallback: true,
    },
  )

  const content = await extractContent(groqRes, res)
  if (content === null) return
  return res.status(200).json({ followup: content })
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Server misconfigured' })

    const body = parseRequestBody(req.body)
    if (!body || !body.type) {
      return res.status(400).json({ error: 'Invalid request. Missing required fields.' })
    }

    switch (body.type) {
      case 'main': return await handleMain(apiKey, body, res)
      case 'reflection': return await handleReflection(apiKey, body, res)
      case 'followup': return await handleFollowup(apiKey, body, res)
      default: return res.status(400).json({ error: 'Invalid request type.' })
    }
  } catch {
    return res.status(500).json({ error: 'Something went wrong. Please retry.' })
  }
}