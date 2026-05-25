function stripMarkdownFences(raw) {
  if (typeof raw !== 'string') return ''
  let text = raw.trim()
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  }
  return text
}

function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback
}

function asCriticalQuestion(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      question: typeof value.question === 'string' ? value.question : '',
      context: typeof value.context === 'string' ? value.context : '',
    }
  }
  return { question: '', context: '' }
}

/**
 * Parses raw reflection text from Groq into a validated object, or null on failure.
 */
export function parseReflection(raw) {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return null
  }

  const cleaned = stripMarkdownFences(raw)

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }

  return {
    reasoning_skeleton: asArray(parsed.reasoning_skeleton),
    uncertainty_flags: asArray(parsed.uncertainty_flags),
    gaps: asArray(parsed.gaps),
    critical_question: asCriticalQuestion(parsed.critical_question),
    sentence_labels: asArray(parsed.sentence_labels),
  }
}
