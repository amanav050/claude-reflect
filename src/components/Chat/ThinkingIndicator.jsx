function ThinkingIndicator() {
  return (
    <article className="mb-6">
      <p className="text-xs text-text-tertiary mb-1">
        <span aria-hidden="true">✦ </span>
        Claude Reflect
      </p>
      <div className="flex items-center gap-1 py-1" aria-label="Thinking">
        <span
          className="w-2 h-2 rounded-full bg-text-tertiary animate-pulse-dot"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-text-tertiary animate-pulse-dot"
          style={{ animationDelay: '0.2s' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-text-tertiary animate-pulse-dot"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    </article>
  )
}

export default ThinkingIndicator
