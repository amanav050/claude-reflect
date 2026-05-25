import { useEffect, useRef, useMemo } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ThinkingIndicator from './ThinkingIndicator.jsx'
import InputBar from '../Layout/InputBar.jsx'
import ClaudeLogo from '../ClaudeLogo.jsx'

function getLastAssistantMessageId(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'assistant') return messages[i].id
  }
  return null
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return { line1: 'Morning, champ', line2: "Let's build something great today." }
  if (hour < 17) return { line1: 'Hey there, rockstar', line2: 'What are we tackling today?' }
  return { line1: 'Evening, legend', line2: "Let's make this count." }
}

function ChatArea({
  chat,
  onSendMessage,
  isLoading,
  error,
  activeSentenceId,
  onSentenceClick,
}) {
  const scrollRef = useRef(null)
  const messages = chat?.messages ?? []
  const isEmpty = messages.length === 0 && !isLoading
  const lastAssistantId = getLastAssistantMessageId(messages)
  const sentenceLabels = chat?.sentenceLabels ?? []
  const greeting = useMemo(() => getGreeting(), [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, isLoading])

  if (isEmpty) {
    return (
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <div className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
          <ClaudeLogo size={48} style={{ color: 'var(--color-sparkle)' }} className="mb-5" />
          <h1 className="text-3xl font-medium mb-1.5 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            {greeting.line1} <span style={{ color: 'var(--color-sparkle)' }}>✦</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            {greeting.line2}
          </p>
          <div className="w-full max-w-[620px]">
            <InputBar onSend={onSendMessage} disabled={isLoading} showChips />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-[680px] mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              sentenceLabels={message.id === lastAssistantId ? sentenceLabels : undefined}
              onSentenceClick={onSentenceClick}
              activeSentenceId={activeSentenceId}
            />
          ))}
          {isLoading && <ThinkingIndicator />}
        </div>
      </div>
      {error && (
        <p className="px-4 pb-2 text-sm text-center max-w-[680px] mx-auto" style={{ color: 'var(--color-confidence-red)' }}>
          {error}
        </p>
      )}
      <div className="w-full max-w-[680px] mx-auto">
        <InputBar onSend={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}

export default ChatArea