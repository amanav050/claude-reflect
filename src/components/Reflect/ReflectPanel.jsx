import { useState } from 'react'
import ReasoningSkeleton from './ReasoningSkeleton.jsx'
import UncertaintyFlags from './UncertaintyFlags.jsx'
import GapDisclosure from './GapDisclosure.jsx'
import CriticalQuestion from './CriticalQuestion.jsx'
import ClaudeLogo from '../ClaudeLogo.jsx'

function ReflectPanel({
  reflection,
  isLoading,
  activeFlagId,
  onFlagClick,
  originalQuery,
  mainResponse,
  showGlow,
  theme,
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
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(83, 74, 183, 0.1)' }}>
        <ClaudeLogo size={20} style={{ color: 'var(--color-accent-reflect)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Reflect</p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Transparency on demand</p>
    </div>
  )

  const ThemeTabs = () => (
    <div className="flex items-center rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      <button
        onClick={() => theme !== 'light' && onToggleTheme()}
        className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200"
        style={{
          backgroundColor: theme === 'light' ? 'var(--color-bg-card)' : 'transparent',
          color: theme === 'light' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          boxShadow: theme === 'light' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        }}
      >☀ Light</button>
      <button
        onClick={() => theme !== 'dark' && onToggleTheme()}
        className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--color-bg-card)' : 'transparent',
          color: theme === 'dark' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
        }}
      >● Dark</button>
    </div>
  )

  const panelContent = (
    <div className="h-full overflow-y-auto px-4 py-4">
      {!reflection && !isLoading && <EmptyState />}
      {isLoading && <Skeleton />}
      {hasData && (
        <div className="space-y-4 animate-fade-in">
          {reflection.reasoning_skeleton?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>Reasoning</p>
              <ReasoningSkeleton steps={reflection.reasoning_skeleton} />
            </div>
          )}
          <div style={{ borderBottom: '1px solid var(--color-border)' }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>Uncertainty</p>
            <UncertaintyFlags flags={reflection.uncertainty_flags || []} activeFlagId={activeFlagId} onFlagClick={onFlagClick} />
          </div>
          <div style={{ borderBottom: '1px solid var(--color-border)' }} />
          {reflection.gaps?.length > 0 && (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>Not Covered</p>
                <GapDisclosure gaps={reflection.gaps} />
              </div>
              <div style={{ borderBottom: '1px solid var(--color-border)' }} />
            </>
          )}
          {reflection.critical_question && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium mb-2.5" style={{ color: 'var(--color-text-tertiary)' }}>Before You Act</p>
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
      <div
        className={`hidden lg:flex flex-col h-full shrink-0 transition-all duration-300 ${showGlow ? 'animate-glow' : ''}`}
        style={{
          width: '460px',
          backgroundColor: 'var(--color-bg-reflect)',
          borderLeft: hasData ? '2px solid var(--color-accent-reflect)' : '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <ClaudeLogo size={16} style={{ color: 'var(--color-accent-reflect)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-accent-reflect)' }}>Reflect</span>
          </div>
          <ThemeTabs />
        </div>
        {panelContent}
      </div>

      <div className="lg:hidden" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-between w-full px-4 py-3"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex items-center gap-2">
            <ClaudeLogo size={12} style={{ color: 'var(--color-accent-reflect)' }} />
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