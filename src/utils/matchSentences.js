const VALID_LABELS = new Set(['confident', 'inference', 'assumption', 'uncertain'])

export function normalize(text) {
  if (typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Simple split on ". ", "! ", "? " while keeping terminal punctuation on each chunk. */
export function splitSentences(text) {
  if (!text?.trim()) return []

  const parts = text
    .replace(/(\.\s|!\s|\?\s)/g, (match) => `${match}|||`)
    .split('|||')
    .map((s) => s.trim())
    .filter(Boolean)

  return parts.length > 0 ? parts : [text.trim()]
}

function sentencesMatch(normA, normB) {
  if (!normA || !normB) return false
  return normA.includes(normB) || normB.includes(normA)
}

function findBestLabelMatch(normSentence, sentenceLabels) {
  let best = null
  let bestLen = 0

  for (const entry of sentenceLabels) {
    if (!entry || typeof entry.sentence !== 'string') continue
    const normLabel = normalize(entry.sentence)
    if (!sentencesMatch(normSentence, normLabel)) continue

    const matchLen = Math.min(normSentence.length, normLabel.length)
    if (matchLen > bestLen) {
      bestLen = matchLen
      best = entry
    }
  }

  return best
}

/**
 * Maps each response sentence to a label segment for inline indicators.
 */
export function matchSentences(responseText, sentenceLabels) {
  const labels = Array.isArray(sentenceLabels) ? sentenceLabels : []
  const sentences = splitSentences(responseText)

  return sentences.map((text, index) => {
    const normSentence = normalize(text)
    const matched = findBestLabelMatch(normSentence, labels)

    const label =
      matched && VALID_LABELS.has(matched.label) ? matched.label : 'confident'
    const basis =
      matched && typeof matched.basis === 'string' ? matched.basis : ''

    return {
      id: `s-${index}`,
      text,
      label,
      basis,
    }
  })
}

/** Find a labeled segment id whose text fuzzy-matches the given flag sentence. */
export function findSentenceIdForFlagText(flagText, sentenceLabels) {
  const normFlag = normalize(flagText)
  if (!normFlag || !Array.isArray(sentenceLabels)) return null

  for (const segment of sentenceLabels) {
    const normSegment = normalize(segment?.text)
    if (sentencesMatch(normFlag, normSegment)) {
      return segment.id
    }
  }
  return null
}

/** Find uncertainty flag index whose sentence fuzzy-matches labeled segment text. */
export function findFlagIndexForSentenceText(sentenceText, flags) {
  const normSentence = normalize(sentenceText)
  if (!normSentence || !Array.isArray(flags)) return -1

  for (let index = 0; index < flags.length; index += 1) {
    const normFlag = normalize(flags[index]?.sentence)
    if (sentencesMatch(normSentence, normFlag)) {
      return index
    }
  }
  return -1
}
