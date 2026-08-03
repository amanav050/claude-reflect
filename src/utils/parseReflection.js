export function parseReflection(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    console.error('[Reflect] No raw text received')
    return null
  }

  try {
    let cleaned = rawText.trim()

    // Strip <think>...</think> reasoning tags (some models wrap output in these)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

    // Strip markdown fences
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '')

    // Strip any leading text before the first {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error('[Reflect] No JSON object found in response:', cleaned.slice(0, 200))
      return null
    }

    cleaned = cleaned.slice(firstBrace, lastBrace + 1)

    const p = JSON.parse(cleaned)

    return {
      reasoning_skeleton: Array.isArray(p.reasoning_skeleton) ? p.reasoning_skeleton : [],
      uncertainty_flags: Array.isArray(p.uncertainty_flags) ? p.uncertainty_flags : [],
      gaps: Array.isArray(p.gaps) ? p.gaps : [],
      critical_question:
        p.critical_question && typeof p.critical_question === 'object'
          ? p.critical_question
          : { question: '', context: '' },
      sentence_labels: Array.isArray(p.sentence_labels) ? p.sentence_labels : [],
    }
  } catch (err) {
    console.error('[Reflect] JSON parse failed:', err.message)
    console.error('[Reflect] Raw text (first 500 chars):', rawText.slice(0, 500))
    return null
  }
}