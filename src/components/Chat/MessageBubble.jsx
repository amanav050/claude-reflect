import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const mdComponents = {
  h1: ({ children }) => <h1 className="text-xl font-medium mt-5 mb-2" style={{ color: 'var(--color-text-primary)' }}>{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-medium mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-medium mt-3 mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-medium mt-3 mb-1" style={{ color: 'var(--color-text-primary)' }}>{children}</h4>,
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-[1.75]">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 pl-5 space-y-1 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 pl-5 space-y-1 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="leading-[1.7] pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  code: ({ inline, className, children }) => {
    if (inline) return <code className="px-1.5 py-0.5 rounded text-[12px] font-mono" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-confidence-red)' }}>{children}</code>
    return <pre className="mb-3 p-4 rounded-xl overflow-x-auto text-[12px] font-mono leading-relaxed" style={{ backgroundColor: 'var(--color-bg-sidebar)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}><code className={className}>{children}</code></pre>
  },
  blockquote: ({ children }) => <blockquote className="mb-3 pl-4 italic" style={{ borderLeft: '3px solid var(--color-accent-reflect)', color: 'var(--color-text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr className="my-4" style={{ borderColor: 'var(--color-border)' }} />,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-knowledge-blue)' }}>{children}</a>,
  table: ({ children }) => <div className="mb-3 overflow-x-auto rounded-lg" style={{ border: '1px solid var(--color-border)' }}><table className="w-full text-sm border-collapse">{children}</table></div>,
  thead: ({ children }) => <thead style={{ backgroundColor: 'var(--color-bg-sidebar)' }}>{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-medium" style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>{children}</td>,
  tr: ({ children }) => <tr className="even:bg-[rgba(0,0,0,0.02)]">{children}</tr>,
}

function ConfidenceSummary({ sentenceLabels }) {
  if (!sentenceLabels || sentenceLabels.length === 0) return null

  const counts = { confident: 0, inference: 0, assumption: 0, uncertain: 0 }
  sentenceLabels.forEach(l => { counts[l.label] = (counts[l.label] || 0) + 1 })

  const flagged = sentenceLabels.filter(l => l.label !== 'confident')
  if (flagged.length === 0) return null

  return (
    <div className="mt-3 mb-1 flex flex-wrap gap-3 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
      {counts.confident > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-confidence-green)' }} />
          {counts.confident} confident
        </span>
      )}
      {counts.inference > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-confidence-amber)' }} />
          {counts.inference} inference
        </span>
      )}
      {counts.assumption > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-confidence-red)' }} />
          {counts.assumption} assumption
        </span>
      )}
      {counts.uncertain > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-confidence-amber)', opacity: 0.7 }} />
          {counts.uncertain} uncertain
        </span>
      )}
    </div>
  )
}

function MessageBubble({ message, sentenceLabels }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <article className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>You</p>
        <p className="text-[13.5px] leading-[1.75] whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>{message.content}</p>
      </article>
    )
  }

  const hasLabels = Array.isArray(sentenceLabels) && sentenceLabels.length > 0
  const content = (message.content || '')
  .replace(/<think>[\s\S]*?<\/think>/gi, '')
  .replace(/<br\s*\/?>/g, '\n')
  .replace(/<\/?p>/gi, '\n\n')
  .replace(/<\/?[^>]+(>|$)/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

  return (
    <article className="mb-6">
      <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
        <span style={{ color: 'var(--color-sparkle)' }}>✦ </span>Claude Reflect
      </p>
      <div className="text-[13.5px] leading-[1.75]" style={{ color: 'var(--color-text-primary)' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {content}
        </ReactMarkdown>
      </div>
      {hasLabels && (
        <ConfidenceSummary sentenceLabels={sentenceLabels} />
      )}
    </article>
  )
}

export default MessageBubble