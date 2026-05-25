const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const FALLBACK_MODEL = 'llama-3.1-8b-instant'

const REFLECTION_SYSTEM_PROMPT =
  'You are an AI reasoning analyst. Analyze the given AI response and return a structured JSON assessment. Be genuinely honest about confidence levels — do not default to high confidence on everything. Flag real uncertainties. Identify real gaps. Ask a genuinely challenging critical question. Return ONLY valid JSON. No markdown backticks. No preamble.'

const REFLECTION_JSON_SCHEMA = `{
  "reasoning_skeleton": [
    {
      "step": "Description of this reasoning step",
      "label": "from_input | general_knowledge | inference | assumption",
      "detail": "Brief explanation of the basis for this step"
    }
  ],
  "uncertainty_flags": [
    {
      "sentence": "The exact sentence from the response that is flagged",
      "reason": "Why confidence is lower on this specific claim",
      "severity": "low | medium | high"
    }
  ],
  "gaps": [
    {
      "topic": "What was not covered",
      "reason": "Why it was omitted or could not be addressed"
    }
  ],
  "critical_question": {
    "question": "One specific, sharp question that challenges the user to think before acting",
    "context": "Why this question matters for the user's specific situation"
  },
  "sentence_labels": [
    {
      "sentence": "Each sentence from the response",
      "label": "confident | inference | assumption | uncertain",
      "basis": "What this claim is based on"
    }
  ]
}`

function parseRequestBody(body) {
  if (body == null) return null
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return null
    }
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

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  })

  if (groqRes.status === 429 && attempt < 2) {
    const backoffMs = attempt === 0 ? 1000 : 2000
    await sleep(backoffMs)
    return callGroq(apiKey, messages, options, attempt + 1, usedFallback)
  }

  if (
    groqRes.status === 429 &&
    allowFallback &&
    !usedFallback &&
    model !== FALLBACK_MODEL
  ) {
    return callGroq(
      apiKey,
      messages,
      { ...options, model: FALLBACK_MODEL },
      0,
      true,
    )
  }

  return groqRes
}

async function extractGroqContent(groqRes, res) {
  if (groqRes.status === 429) {
    res.status(429).json({
      error: 'Rate limit reached. Try again in a moment.',
    })
    return null
  }

  let groqData
  try {
    groqData = await groqRes.json()
  } catch {
    res.status(500).json({
      error: 'Reflection unavailable. Please retry.',
    })
    return null
  }

  if (!groqRes.ok) {
    res.status(500).json({
      error: 'Reflection unavailable. Please retry.',
    })
    return null
  }

  const content = groqData?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.length === 0) {
    res.status(500).json({
      error: 'Reflection unavailable. Please retry.',
    })
    return null
  }

  return content
}

async function handleMain(apiKey, body, res) {
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({
      error: 'Invalid request. Missing required fields.',
    })
  }

  const groqRes = await callGroq(apiKey, body.messages, {
    temperature: 0.7,
    max_tokens: 1500,
  })

  const content = await extractGroqContent(groqRes, res)
  if (content === null) return undefined

  return res.status(200).json({ response: content })
}

async function handleReflection(apiKey, body, res) {
  if (
    typeof body.query !== 'string' ||
    body.query.trim().length === 0 ||
    typeof body.response !== 'string' ||
    body.response.trim().length === 0
  ) {
    return res.status(400).json({
      error: 'Invalid request. Missing required fields.',
    })
  }

  const userPrompt = `Original user query:
${body.query}

AI response to analyze:
${body.response}

Return JSON matching this exact schema:
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
      allowFallback: true,
    },
  )

  const content = await extractGroqContent(groqRes, res)
  if (content === null) return undefined

  return res.status(200).json({ reflection: content })
}

const FOLLOWUP_SYSTEM_PROMPT =
  'You are a thoughtful AI assistant helping a user think critically about a previous AI response. Be specific, practical, and genuinely helpful. Don\'t be generic.'

async function handleFollowup(apiKey, body, res) {
  if (
    typeof body.query !== 'string' ||
    body.query.trim().length === 0 ||
    typeof body.criticalQuestion !== 'string' ||
    body.criticalQuestion.trim().length === 0
  ) {
    return res.status(400).json({
      error: 'Invalid request. Missing required fields.',
    })
  }

  const briefSummary =
    typeof body.briefSummary === 'string' && body.briefSummary.trim().length > 0
      ? body.briefSummary.trim()
      : typeof body.response === 'string'
        ? body.response.slice(0, 150)
        : ''

  const userPrompt = `Original user query:
${body.query.trim()}

Brief summary of the AI response:
${briefSummary}

Critical question to explore:
${body.criticalQuestion.trim()}

Help me think through this question. What should I consider? What might I be missing?`

  const groqRes = await callGroq(
    apiKey,
    [
      { role: 'system', content: FOLLOWUP_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.5,
      max_tokens: 800,
    },
  )

  const content = await extractGroqContent(groqRes, res)
  if (content === null) return undefined

  return res.status(200).json({ followup: content })
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Server misconfigured' })
    }

    const body = parseRequestBody(req.body)
    if (!body || typeof body.type !== 'string') {
      return res.status(400).json({
        error: 'Invalid request. Missing required fields.',
      })
    }

    switch (body.type) {
      case 'main':
        return await handleMain(apiKey, body, res)
      case 'reflection':
        return await handleReflection(apiKey, body, res)
      case 'followup':
        return await handleFollowup(apiKey, body, res)
      default:
        return res.status(400).json({
          error: 'Invalid request. Missing required fields.',
        })
    }
  } catch {
    return res.status(500).json({
      error: 'Reflection unavailable. Please retry.',
    })
  }
}
