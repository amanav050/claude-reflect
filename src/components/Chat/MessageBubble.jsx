import ConfidenceIndicator from './ConfidenceIndicator.jsx'

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInlineMarkdown(text) {
  const escaped = escapeHtml(text)
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
}

function MarkdownContent({ content }) {
  const blocks = []
  const sections = content.split(/\n\n+/)

  sections.forEach((section) => {
    const trimmed = section.trim()
    if (!trimmed) return

    const lines = trimmed.split('\n')

    /* Check if it's a numbered list */
    const isNumberedList = lines.every((l) => /^\s*\d+[\.\)]\s/.test(l))
    if (isNumberedList) {
      blocks.push({
        type: 'ol',
        items: lines.map((l) => l.replace(/^\s*\d+[\.\)]\s*/, '')),
      })
      return
    }

    /* Check if it's a bullet list */
    const isBulletList = lines.every((l) => /^\s*[-•*]\s/.test(l))
    if (isBulletList) {
      blocks.push({
        type: 'ul',
        items: lines.map((l) => l.replace(/^\s*[-•*]\s*/, '')),
      })
      return
    }

    /* Check if first line is a heading (### or **Heading:**) */
    const headingMatch = lines[0].match(/^#{1,4}\s+(.+)/)
    const boldHeadingMatch = lines[0].match(/^\*\*(.+?):\*\*$/)

    if (headingMatch || boldHeadingMatch) {
      const headingText = headingMatch ? headingMatch[1] : boldHeadingMatch[1]
      blocks.push({ type: 'heading', text: headingText })
      /* Remaining lines become a paragraph */
      const rest = lines.slice(1).join('\n').trim()
      if (rest) {
        blocks.push({ type: 'p', text: rest })
      }
      return
    }

    /* Default: paragraph */
    blocks.push({ type: 'p', text: lines.join('\n') })
  })

  return (
    <div className="text-[13.5px] leading-[1.75] space-y-3" style={{ color: 'var(--color-text-primary)' }}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h4 key={`h-${i}`} className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-primary)' }}>
              {block.text}
            </h4>
          )
        }

        if (block.type === 'ol') {
          return (
            <ol key={`ol-${i}`} className="list-decimal pl-5 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={`li-${i}-${j}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
              ))}
            </ol>
          )
        }

        if (block.type === 'ul') {
          return (
            <ul key={`ul-${i}`} className="list-disc pl-5 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={`li-${i}-${j}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
              ))}
            </ul>
          )
        }

        return (
          <p
            key={`p-${i}`}
            dangerouslySetInnerHTML={{
              __html: formatInlineMarkdown(block.text).replace(/\n/g, '<br />'),
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Groups sentence labels into paragraphs based on double-newline
 * boundaries in the original text, so labeled content keeps structure.
 */
function groupSentencesIntoParagraphs(sentenceLabels) {
  const paragraphs = []
  let current = []

  sentenceLabels.forEach((segment) => {
    /* If the sentence text starts or ends with a double newline, break */
    const hasBreakBefore = segment.text.startsWith('\n')
    const hasBreakAfter = segment.text.endsWith('\n')

    if (hasBreakBefore && current.length > 0) {
      paragraphs.push(current)
      current = []
    }

    current.push(segment)

    if (hasBreakAfter) {
      paragraphs.push(current)
      current = []
    }
  })

  if (current.length > 0) {
    paragraphs.push(current)
  }

  /* If grouping produced only 1 paragraph, try splitting every 3-4 sentences */
  if (paragraphs.length <= 1 && sentenceLabels.length > 4) {
    const chunks = []
    const chunkSize = Math.ceil(sentenceLabels.length / Math.ceil(sentenceLabels.length / 4))
    for (let i = 0; i < sentenceLabels.length; i += chunkSize) {
      chunks.push(sentenceLabels.slice(i, i + chunkSize))
    }
    return chunks
  }

  return paragraphs
}

function LabeledAssistantContent({
  sentenceLabels,
  onSentenceClick,
  activeSentenceId,
}) {
  const paragraphs = groupSentencesIntoParagraphs(sentenceLabels)

  return (
    <div className="text-[13.5px] leading-[1.75] space-y-3" style={{ color: 'var(--color-text-primary)' }}>
      {paragraphs.map((group, pIndex) => (
        <p key={`p-${pIndex}`} className="leading-[1.75]">
          {group.map((segment, sIndex) => {
            const isActive = activeSentenceId === segment.id
            return (
              <span
                key={segment.id}
                id={segment.id}
                className={`inline transition-colors duration-300 rounded ${
                  isActive ? 'animate-highlight' : ''
                }`}
              >
                <ConfidenceIndicator
                  label={segment.label}
                  sentenceId={segment.id}
                  onSentenceClick={onSentenceClick}
                />
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatInlineMarkdown(segment.text),
                  }}
                />
                {sIndex < group.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </p>
      ))}
    </div>
  )
}

function MessageBubble({
  message,
  sentenceLabels,
  onSentenceClick,
  activeSentenceId,
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <article className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>You</p>
        <p className="text-[13.5px] font-normal leading-[1.75] whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
          {message.content}
        </p>
      </article>
    )
  }

  const hasLabels = Array.isArray(sentenceLabels) && sentenceLabels.length > 0

  return (
    <article className="mb-6">
      <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
        <span style={{ color: 'var(--color-sparkle)' }} aria-hidden="true">✦ </span>
        Claude Reflect
      </p>
      {hasLabels ? (
        <LabeledAssistantContent
          sentenceLabels={sentenceLabels}
          onSentenceClick={onSentenceClick}
          activeSentenceId={activeSentenceId}
        />
      ) : (
        <MarkdownContent content={message.content} />
      )}
    </article>
  )
}

export default MessageBubble