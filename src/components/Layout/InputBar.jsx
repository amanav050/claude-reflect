import { useState, useRef, useEffect } from 'react'

const CATEGORY_CHIPS = [
  { id: 'write', label: 'Write', icon: '✏️' },
  { id: 'code', label: 'Code', icon: '</>' },
  { id: 'research', label: 'Research', icon: '🔍' },
  { id: 'life', label: 'Life stuff', icon: '📋' },
]

const SUB_CHIPS = {
  write: [
    'Draft a LinkedIn post about...',
    'Write a cold email to...',
    'Help me write a cover letter for...',
    'Create a blog post on...',
  ],
  code: [
    'Debug this error: ',
    'Build a React component that...',
    'Explain this code: ',
    'Review my code for...',
  ],
  research: [
    'Compare the pros and cons of...',
    'Summarize the latest on...',
    'What should I know before...',
    'Break down how... works',
  ],
  life: [
    'Plan a weekly routine for...',
    'Help me decide between...',
    'Create a budget for...',
    'Write a message to...',
  ],
}

const chipButtonClass =
  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs transition-all duration-200 hover:scale-[1.03]'

const chipButtonStyle = {
  backgroundColor: 'var(--color-bg-card)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
}

/* Check if browser supports Web Speech API */
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

function InputBar({ onSend, disabled, showChips = false }) {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [chipState, setChipState] = useState('categories')
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  /* ── Voice recognition setup ── */
  useEffect(() => {
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setText((prev) => (prev ? prev + ' ' + transcript : transcript))
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleSubChipClick = (prompt) => {
    setText(prompt)
    setChipState('categories')
    inputRef.current?.focus()
  }

  const hasText = text.trim().length > 0

  return (
    <div className="px-4 py-3">
      {/* ── Main input container ── */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all duration-200"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {/* Plus icon */}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-tertiary)' }}
          aria-label="Attach"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 3v12M3 9h12" />
          </svg>
        </button>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="How can I help you today?"
          className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-text-primary)' }}
        />

        {/* Voice button */}
        {SpeechRecognition && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={disabled}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-200 ${
              isListening ? 'animate-mic-pulse' : 'hover:opacity-70'
            }`}
            style={{
              color: isListening ? 'var(--color-sparkle)' : 'var(--color-text-tertiary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="1" width="6" height="9" rx="3" />
              <path d="M2.5 7.5a5.5 5.5 0 0 0 11 0" />
              <path d="M8 13.5V15" />
            </svg>
          </button>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !hasText}
          aria-label="Send message"
          className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
          style={{
            backgroundColor: hasText ? 'var(--color-accent-reflect)' : 'transparent',
            color: hasText ? '#FFFFFF' : 'var(--color-text-tertiary)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </div>

      {/* ── Quick-action chips (only in welcome state) ── */}
      {showChips && (
        <div className="mt-3">
          {chipState === 'categories' ? (
            <div
              key="categories"
              className="flex items-center justify-center gap-2 flex-wrap animate-fade-in"
            >
              {CATEGORY_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setChipState(chip.id)}
                  className={chipButtonClass}
                  style={chipButtonStyle}
                >
                  <span className="text-sm">{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div key={chipState} className="animate-fade-in">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {SUB_CHIPS[chipState].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSubChipClick(prompt)}
                    className={chipButtonClass}
                    style={chipButtonStyle}
                  >
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setChipState('categories')}
                className="block mx-auto mt-2 text-xs transition-colors duration-200 hover:opacity-80"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InputBar
