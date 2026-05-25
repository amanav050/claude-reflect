import { useEffect, useState } from 'react'
import {
  REASONING_DOT_COLORS,
  REASONING_LABEL_NAMES,
  REASONING_TAG_DARK,
  REASONING_TAG_LIGHT,
} from '../../utils/constants.js'

function getTagClasses(label, isDark) {
  const map = isDark ? REASONING_TAG_DARK : REASONING_TAG_LIGHT
  return map[label] ?? map.inference
}

function getDotClass(label) {
  return REASONING_DOT_COLORS[label] ?? REASONING_DOT_COLORS.inference
}

function getLabelName(label) {
  return REASONING_LABEL_NAMES[label] ?? REASONING_LABEL_NAMES.inference
}

function ReasoningSkeleton({ steps }) {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false,
  )

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'))
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (!Array.isArray(steps) || steps.length === 0) {
    return null
  }

  return (
    <ul className="space-y-2.5">
      {steps.map((step, index) => {
        const label = step?.label ?? 'inference'
        return (
          <li
            key={`step-${index}`}
            className="flex gap-3 rounded-xl p-3 transition-colors duration-150"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${getDotClass(label)}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={`inline-block rounded-lg text-[11px] font-medium px-2.5 py-0.5 ${getTagClasses(label, isDark)}`}
                >
                  {getLabelName(label)}
                </span>
              </div>
              {step?.step && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                  {step.step}
                </p>
              )}
              {step?.detail && (
                <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {step.detail}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ReasoningSkeleton