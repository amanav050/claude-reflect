import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ConfidenceIndicator from './ConfidenceIndicator.jsx'

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl font-medium mt-5 mb-2" style={{ color: 'var(--color-text-primary)' }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-medium mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-medium mt-3 mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-medium mt-3 mb-1" style={{ color: 'var(--color-text-primary)' }}>{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-[1.75]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 pl-5 space-y-1.5 list-disc" style={{ color: 'var(--color-text-primary)' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 pl-5 space-y-1.5 list-decimal" style={{ color: 'var(--color-text-primary)' }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-[1.7] pl-1">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{children}</strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  code: ({ inline, className, children }) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded text-[12.5px] font-mono" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-confidence-red)' }}>
          {children}
        </code>
      )
    }
    return (
      <pre className="mb-3 p-4 rounded-xl overflow-x-auto text-[12.5px] font-mono leading-relaxed" style={{ backgroundColor: 'var(--color-bg-sidebar)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
        <code className={className}>{children}</code>
      </pre>
    )
  },
  blockquote: ({ children }) => (
    <blockquote className="mb-3 pl-4 italic" style={{ borderLeft: '3px solid var(--color-accent-reflect)', color: 'var(--color-text-secondary)' }}>
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4" style={{ borderColor: 'var(--color-border)' }} />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: 'var(--color-knowledge-blue)' }}>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ backgroundColor: 'var(--color-bg-sidebar)' }}>{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-medium" style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>{children}</td>
  ),
}

function MarkdownContent({ content }) {
  return (
    <div className="text-[13.5px] leading-[1.75]" style={{ color: 'var(--color-text-primary)' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

function parseContentIntoBlocks(content) {
  const blocks = []
  const sections = content.split(/\n\n+/)
  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed) continue
    const lines = trimmed.split('\n')
    if (trimmed.startsWith('```')) { blocks.push({ type: 'code', text: trimmed }); continue }
    const headingMatch = lines[0].match(/^(#{1,4})\s+(.+)/)
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] })
      const rest = lines.slice(1).join('\n').trim()
      if (rest) blocks.push({ type: 'text', text: rest })
      continue
    }
    const boldHeading = lines[0].match(/^\*\*(.+?):\*\*\s*$/)
    if (boldHeading && lines.length === 1) { blocks.push({ type: 'heading', level: 4, text: boldHeading[1] }); continue }
    if (lines.every((l) => /^\s*\d+[\.\)]\s/.test(l.trim()))) {
      blocks.push({ type: 'ol', items: lines.map((l) => l.replace(/^\s*\d+[\.\)]\s*/, '').trim()) }); continue
    }
    if (lines.every((l) => /^\s*[-•*]\s/.test(l.trim()))) {
      blocks.push({ type: 'ul', items: lines.map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()) }); continue
    }
    blocks.push({ type: 'text', text: trimmed })
  }
  return blocks
}

function renderInlineMarkdown(text) {
  if (!text) return text
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIndex = 0
  let match
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[2]) parts.push(<strong key={key++} className="font-medium">{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>)
    else if (match[4]) parts.push(<code key={key++} className="px-1 py-0.5 rounded text-[12px] font-mono" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-confidence-red)' }}>{match[4]}</code>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : text
}

function findLabelForText(text, sentenceLabels) {
  if (!text || !sentenceLabels || sentenceLabels.length === 0) return null
  const norm = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
  if (norm.length < 5) return null
  for (const label of sentenceLabels) {
    const ln = label.text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
    if (norm.includes(ln) || ln.includes(norm) || (norm.length > 15 && ln.length > 15 && norm.slice(0, 20) === ln.slice(0, 20))) return label
  }
  return null
}

function LabeledTextBlock({ text, sentenceLabels, onSentenceClick, activeSentenceId }) {
  const sentences = text.split(/(?<=[.!?])\s+|(?<=[.!?])$/).filter((s) => s.trim())
  return (
    <p className="mb-3 last:mb-0 leading-[1.75]">
      {sentences.map((sentence, i) => {
        const label = findLabelForText(sentence, sentenceLabels)
        const segmentId = label?.id || ('u-' + i)
        const isActive = activeSentenceId === segmentId
        return (
          <span key={segmentId + '-' + i} id={label ? segmentId : undefined} className={'inline transition-colors duration-300 rounded ' + (isActive ? 'animate-highlight' : '')}>
            {label && <ConfidenceIndicator label={label.label} sentenceId={segmentId} onSentenceClick={onSentenceClick} />}
            <span>{renderInlineMarkdown(sentence)}</span>
            {i < sentences.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

function LabeledListItem({ text, sentenceLabels, onSentenceClick, activeSentenceId }) {
  const label = findLabelForText(text, sentenceLabels)
  const segmentId = label?.id || ('li-' + text.slice(0, 10))
  const isActive = activeSentenceId === segmentId
  return (
    <li className={'leading-[1.7] pl-1 transition-colors duration-300 rounded ' + (isActive ? 'animate-highlight' : '')} id={label ? segmentId : undefined}>
      {label && <ConfidenceIndicator label={label.label} sentenceId={segmentId} onSentenceClick={onSentenceClick} />}
      <span>{renderInlineMarkdown(text)}</span>
    </li>
  )
}

function LabeledAssistantContent({ content, sentenceLabels, onSentenceClick, activeSentenceId }) {
  const blocks = parseContentIntoBlocks(content)
  return (
    <div className="text-[13.5px] leading-[1.75]" style={{ color: 'var(--color-text-primary)' }}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const Tag = 'h' + Math.min(block.level, 4)
          const sizes = { 1: 'text-xl', 2: 'text-lg', 3: 'text-base', 4: 'text-sm' }
          return <Tag key={'h-' + i} className={(sizes[block.level] || 'text-sm') + ' font-medium mt-3 mb-1.5'}>{renderInlineMarkdown(block.text)}</Tag>
        }
        if (block.type === 'code') {
          const code = block.text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
          return <pre key={'c-' + i} className="mb-3 p-4 rounded-xl overflow-x-auto text-[12.5px] font-mono leading-relaxed" style={{ backgroundColor: 'var(--color-bg-sidebar)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}><code>{code}</code></pre>
        }
        if (block.type === 'ol') {
          return <ol key={'ol-' + i} className="mb-3 pl-5 space-y-1.5 list-decimal">{block.items.map((item, j) => <LabeledListItem key={'oli-' + i + '-' + j} text={item} sentenceLabels={sentenceLabels} onSentenceClick={onSentenceClick} activeSentenceId={activeSentenceId} />)}</ol>
        }
        if (block.type === 'ul') {
          return <ul key={'ul-' + i} className="mb-3 pl-5 space-y-1.5 list-disc">{block.items.map((item, j) => <LabeledListItem key={'uli-' + i + '-' + j} text={item} sentenceLabels={sentenceLabels} onSentenceClick={onSentenceClick} activeSentenceId={activeSentenceId} />)}</ul>
        }
        return <LabeledTextBlock key={'p-' + i} text={block.text} sentenceLabels={sentenceLabels} onSentenceClick={onSentenceClick} activeSentenceId={activeSentenceId} />
      })}
    </div>
  )
}

function MessageBubble({ message, sentenceLabels, onSentenceClick, activeSentenceId }) {
  const isUser = message.role === 'user'
  if (isUser) {
    return (
      <article className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>You</p>
        <p className="text-[13.5px] font-normal leading-[1.75] whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>{message.content}</p>
      </article>
    )
  }
  const hasLabels = Array.isArray(sentenceLabels) && sentenceLabels.length > 0
  return (
    <article className="mb-6">
      <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
        <span style={{ color: 'var(--color-sparkle)' }} aria-hidden="true">✦ </span>Claude Reflect
      </p>
      {hasLabels ? (
        <LabeledAssistantContent content={message.content} sentenceLabels={sentenceLabels} onSentenceClick={onSentenceClick} activeSentenceId={activeSentenceId} />
      ) : (
        <MarkdownContent content={message.content} />
      )}
    </article>
  )
}

export default MessageBubble