import { useState } from 'react'

const STORAGE_KEY = 'claude_reflect_callout_dismissed'

function FirstTimeCallout() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  })

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  return (
    <div className="relative flex items-center justify-center px-4 py-2.5 bg-accent-reflect/[0.08] shrink-0">
      <p className="text-sm text-text-secondary text-center pr-8">
        Claude Reflect shows you how this response was built so you can decide
        what to trust.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 text-text-tertiary hover:text-text-secondary transition-colors duration-200"
        aria-label="Dismiss callout"
      >
        ×
      </button>
    </div>
  )
}

export default FirstTimeCallout
