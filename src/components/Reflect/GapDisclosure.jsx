function GapDisclosure({ gaps }) {
  const items = Array.isArray(gaps) ? gaps : []

  if (items.length === 0) {
    return null
  }

  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
        Not Covered
      </h3>
      <ul className="space-y-3">
        {items.map((gap, index) => (
          <li
            key={`gap-${index}`}
            className="flex gap-2 text-text-tertiary"
          >
            <span className="text-sm shrink-0 mt-0.5" aria-hidden="true">
              ◌
            </span>
            <div className="min-w-0">
              {gap?.topic && (
                <p className="text-sm text-text-secondary">{gap.topic}</p>
              )}
              {gap?.reason && (
                <p className="text-xs text-text-tertiary mt-0.5">{gap.reason}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default GapDisclosure
