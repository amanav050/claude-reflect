import { useEffect } from 'react'
import { SEVERITY_STYLES } from '../../utils/constants.js'

function UncertaintyFlags({ flags, activeFlagId, onFlagClick }) {
  const items = Array.isArray(flags) ? flags : []

  useEffect(() => {
    if (!activeFlagId) return
    const el = document.querySelector(`[data-flag-id="${activeFlagId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeFlagId])

  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
        Uncertainty Flags
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-text-tertiary italic">
          No specific concerns flagged for this response.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((flag, index) => {
            const id = `flag-${index}`
            const severity = flag?.severity ?? 'medium'
            const severityClass =
              SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.medium
            const isActive = activeFlagId === id

            return (
              <li key={id}>
                <button
                  type="button"
                  data-flag-id={id}
                  onClick={() => onFlagClick?.(index)}
                  className={[
                    'w-full text-left border-l-2 border-confidence-amber pl-3 pr-2 py-2 rounded-lg transition-colors duration-300 min-h-[44px]',
                    isActive ? 'bg-confidence-amber/20' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {flag?.sentence && (
                    <p className="text-sm italic text-text-primary mb-1">
                      &ldquo;{flag.sentence}&rdquo;
                    </p>
                  )}
                  {flag?.reason && (
                    <p className="text-xs text-text-secondary">{flag.reason}</p>
                  )}
                  <span
                    className={`inline-block mt-2 rounded-lg text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 ${severityClass}`}
                  >
                    {severity}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default UncertaintyFlags
