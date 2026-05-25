import { useState } from 'react'
import ClaudeLogo from '../ClaudeLogo.jsx'
import ReasoningSkeleton from './ReasoningSkeleton.jsx'
import UncertaintyFlags from './UncertaintyFlags.jsx'
import GapDisclosure from './GapDisclosure.jsx'
import CriticalQuestion from './CriticalQuestion.jsx'

function ReflectPanel({
  reflection,
  isLoading,
  activeFlagId,
  onFlagClick,
  originalQuery,
  mainResponse,
  showGlow,
  theme,
  onThemeChange,
  onToggleTheme,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const hasData = reflection && !isLoading

  const Skeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 rounded-full w-1/3" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="h-3 rounded-full w-full" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="h-3 rounded-full w-2/3" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>
      ))}
    </div>
  )

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: 'rgba(83, 74, 183, 0.1)' }}
      >
        <ClaudeLogo size={20} className="text-accent-reflect opacity-60" />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Reflect</p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Transparency on demand</p>
    </div>
  )

  const setTheme = (mode) => {
    if (onThemeChange) {
      onThemeChange(mode)
      return
    }
    if (theme !== mode && onToggleTheme) onToggleTheme()
  }

  const ThemeTabs = () => (
    <div
      className="flex items-center rounded-lg p-0.5 gap-0.5 bg-page"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={[
          'px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
          theme === 'light'
            ? 'bg-card text-text-primary shadow-sm'
            : 'text-text-tertiary hover:text-text-secondary',
        ].join(' ')}
        aria-pressed={theme === 'light'}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={[
          'px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
          theme === 'dark'
            ? 'bg-card text-text-primary shadow-sm'
            : 'text-text-tertiary hover:text-text-secondary',
        ].join(' ')}
        aria-pressed={theme === 'dark'}
      >
        Dark
      </button>
    </div>
  )

  const panelContent = (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
      {!reflection && !isLoading && <EmptyState />}
      {isLoading && <Skeleton />}
      {hasData && (
        <div className="space-y-4 animate-fade-in">
          {reflection.reasoning_skeleton?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Reasoning
              </p>
              <ReasoningSkeleton steps={reflection.reasoning_skeleton} />
            </div>
          )}
          <div style={{ borderBottom: '1px solid var(--color-border)' }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Uncertainty
            </p>
            <UncertaintyFlags flags={reflection.uncertainty_flags || []} activeFlagId={activeFlagId} onFlagClick={onFlagClick} />
          </div>
          <div style={{ borderBottom: '1px solid var(--color-border)' }} />
          {reflection.gaps?.length > 0 && (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  Not Covered
                </p>
                <GapDisclosure gaps={reflection.gaps} />
              </div>
              <div style={{ borderBottom: '1px solid var(--color-border)' }} />
            </>
          )}
          {reflection.critical_question && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Before You Act
              </p>
              <CriticalQuestion
                question={reflection.critical_question.question}
                context={reflection.critical_question.context}
                originalQuery={originalQuery}
                mainResponse={mainResponse}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop panel */}
      <div
        className={[
          'hidden lg:flex flex-col h-full min-h-0 shrink-0 transition-all duration-300',
          showGlow ? 'animate-glow' : '',
        ].join(' ')}
        style={{
          width:'480px',
          backgroundColor: 'var(--color-bg-reflect)',
          borderLeft: hasData ? '2px solid var(--color-accent-reflect)' : '1px solid var(--color-border)',
        }}
      >
        {/* Header with Reflect label + theme tabs */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <ClaudeLogo size={14} className="text-accent-reflect" />
            <span className="text-xs font-medium" style={{ color: 'var(--color-accent-reflect)' }}>Reflect</span>
          </div>
          <ThemeTabs />
        </div>
        <div className="flex flex-col flex-1 min-h-0">{panelContent}</div>
      </div>

      {/* Mobile accordion */}
      <div className="lg:hidden" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-between w-full px-4 py-3"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex items-center gap-2">
            <ClaudeLogo size={12} className="text-accent-reflect" />
            <span className="text-xs font-medium" style={{ color: 'var(--color-accent-reflect)' }}>Reflect</span>
            {hasData && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-confidence-green)' }} />}
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{mobileOpen ? '▾' : '▸'}</span>
        </button>
        {mobileOpen && (
          <div style={{ backgroundColor: 'var(--color-bg-reflect)', maxHeight: '50vh', overflowY: 'auto' }}>
            {panelContent}
          </div>
        )}
      </div>
    </>
  )
}

export default ReflectPanel