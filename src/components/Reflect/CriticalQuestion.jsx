import { useState } from 'react'
import { useGroqAPI } from '../../hooks/useGroqAPI.js'

function briefSummaryFromResponse(text) {
  if (typeof text !== 'string' || text.length === 0) return ''
  if (text.length <= 150) return text
  return `${text.slice(0, 150)}...`
}

function CriticalQuestion({ question, context, originalQuery, mainResponse }) {
  const { getFollowup } = useGroqAPI()
  const [acknowledged, setAcknowledged] = useState(false)
  const [followupLoading, setFollowupLoading] = useState(false)
  const [followupText, setFollowupText] = useState('')
  const [followupError, setFollowupError] = useState('')
  const [followupExpanded, setFollowupExpanded] = useState(false)
  const [actionsDisabled, setActionsDisabled] = useState(false)

  const hasContent =
    (typeof question === 'string' && question.trim().length > 0) ||
    (typeof context === 'string' && context.trim().length > 0)

  if (!hasContent) {
    return null
  }

  const handleConsidered = () => {
    setAcknowledged(true)
    setActionsDisabled(true)
  }

  const handleHelpClick = async () => {
    if (actionsDisabled || followupLoading) return

    setFollowupLoading(true)
    setFollowupError('')
    setFollowupExpanded(true)

    const summary = briefSummaryFromResponse(mainResponse)
    const result = await getFollowup(
      originalQuery ?? '',
      mainResponse ?? '',
      question ?? '',
      summary,
    )

    setFollowupLoading(false)

    if (!result.ok) {
      setFollowupError(result.error)
      return
    }

    setFollowupText(result.data.followup ?? '')
  }

  const dimmed = acknowledged || actionsDisabled

  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
        Critical Question
      </h3>
      <div
        className={`rounded-xl border border-accent-reflect bg-accent-reflect/10 p-4 transition-opacity duration-200 ${
          dimmed ? 'opacity-60' : ''
        }`}
      >
      {question && (
        <p className="text-sm font-medium text-text-primary">{question}</p>
      )}
      {context && (
        <p className="text-xs text-text-secondary mt-2">{context}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <button
          type="button"
          onClick={handleConsidered}
          disabled={actionsDisabled}
          className="flex-1 min-h-[44px] px-3 py-2 text-sm border border-current text-text-secondary rounded-lg transition-colors duration-200 hover:bg-card/50 disabled:cursor-default disabled:opacity-70"
        >
          {acknowledged ? '✓ Considered' : "I've considered this"}
        </button>
        <button
          type="button"
          onClick={handleHelpClick}
          disabled={actionsDisabled || followupLoading}
          className="flex-1 min-h-[44px] px-3 py-2 text-sm bg-accent-reflect text-white rounded-lg transition-transform duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {followupLoading ? 'Thinking...' : 'Help me think through this'}
        </button>
      </div>

      {followupExpanded && (
        <div className="mt-3 bg-card rounded-lg p-3 text-text-primary text-sm leading-relaxed">
          {followupLoading && (
            <p className="text-text-secondary">Thinking...</p>
          )}
          {followupError && (
            <p className="text-confidence-red">{followupError}</p>
          )}
          {!followupLoading && followupText && (
            <p className="whitespace-pre-wrap">{followupText}</p>
          )}
        </div>
      )}
      </div>
    </section>
  )
}

export default CriticalQuestion
