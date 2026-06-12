import { useState, useRef, useEffect } from 'react'

const CATEGORIES = [
  { label: 'Write', icon: '✏️', key: 'write' },
  { label: 'Code', icon: '</>', key: 'code' },
  { label: 'Research', icon: '🔍', key: 'research' },
  { label: 'Life stuff', icon: '📋', key: 'life' },
]
const SUB_CHIPS = {
  write: ['Draft a LinkedIn post about...', 'Write a cold email to...', 'Help me write a cover letter for...', 'Create a blog post on...'],
  code: ['Debug this error: ', 'Build a React component that...', 'Explain this code: ', 'Review my code for...'],
  research: ['Compare the pros and cons of...', 'Summarize the latest on...', 'What should I know before...', 'Break down how... works'],
  life: ['Plan a weekly routine for...', 'Help me decide between...', 'Create a budget for...', 'Write a message to...'],
}

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

function InputBar({ onSend, disabled, showChips = false }) {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [chipState, setChipState] = useState('categories')
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!SpeechRecognition) return
    try {
      const r = new SpeechRecognition()
      r.continuous = false
      r.interimResults = false
      r.lang = 'en-US'
      r.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        setText((prev) => (prev ? prev + ' ' + transcript : transcript))
        setIsListening(false)
      }
      r.onerror = () => setIsListening(false)
      r.onend = () => setIsListening(false)
      recognitionRef.current = r
    } catch {
      recognitionRef.current = null
    }
    return () => {
      try { recognitionRef.current?.abort() } catch {}
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    try {
      if (isListening) {
        recognitionRef.current.stop()
        setIsListening(false)
      } else {
        recognitionRef.current.start()
        setIsListening(true)
      }
    } catch {
      setIsListening(false)
    }
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    setChipState('categories')
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    submit()
  }

  const handleChipClick = (prompt) => {
    setText(prompt)
    setChipState('categories')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const hasText = text.trim().length > 0

  return (
    <div className="px-3 py-3 sm:px-4">
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2 rounded-2xl px-3 py-2 sm:py-2.5 transition-all duration-200"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {/* Plus icon */}
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full shrink-0 hover:opacity-70 active:opacity-50 transition-opacity"
          style={{ color: 'var(--color-text-tertiary)' }}
          aria-label="Attach"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 3v12M3 9h12" />
          </svg>
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder="How can I help you today?"
          autoComplete="off"
          autoCorrect="on"
          enterKeyHint="send"
          className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
          style={{ color: 'var(--color-text-primary)', fontSize: '16px' }}
        />

        {/* Voice button */}
        {SpeechRecognition && recognitionRef.current && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={disabled}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className={`flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full shrink-0 transition-all active:opacity-50 ${
              isListening ? 'animate-mic-pulse' : 'hover:opacity-70'
            }`}
            style={{
              color: isListening ? 'var(--color-sparkle)' : 'var(--color-text-tertiary)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="1" width="6" height="9" rx="3" />
              <path d="M2.5 7.5a5.5 5.5 0 0 0 11 0" />
              <path d="M8 13.5V15" />
            </svg>
          </button>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !hasText}
          aria-label="Send message"
          className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full shrink-0 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
          style={{
            backgroundColor: hasText ? 'var(--color-accent-reflect)' : 'transparent',
            color: hasText ? '#FFFFFF' : 'var(--color-text-tertiary)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </form>

      {/* Quick-action chips */}
      {showChips && (
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap animate-fade-in px-1">
          {chipState === 'categories' ? (
            CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setChipState(c.key)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs transition-all active:scale-95 hover:scale-[1.03]"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span className="text-sm">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))
          ) : (
            <>
              <button
                type="button"
                onClick={() => setChipState('categories')}
                className="text-[11px] px-2.5 py-2 rounded-full active:opacity-50"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ← Back
              </button>
              {SUB_CHIPS[chipState]?.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChipClick(prompt)}
                  className="px-3 py-2.5 rounded-full text-xs transition-all active:scale-95 hover:scale-[1.03]"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default InputBar