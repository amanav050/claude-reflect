export function ThemeToggle({ theme, toggleTheme }) {
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 text-text-tertiary hover:text-text-secondary transition-colors duration-200"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M10 2v2M10 16v2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M2 10h2M16 10h2M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
          <circle cx="10" cy="10" r="3.5" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
          <path d="M10 1v2M10 17v2M3 10H1M19 10h-2" />
        </svg>
      )}
    </button>
  )
}

export function ReflectBadge() {
  return (
    <span className="px-2 py-0.5 text-xs font-medium text-white bg-accent-reflect rounded-lg">
      Reflect
    </span>
  )
}

function Header({ onToggleSidebar, theme, toggleTheme }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-page border-b border-border transition-colors duration-200">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 text-text-primary hover:text-text-secondary transition-colors duration-200"
        aria-label="Toggle sidebar"
      >
        <span className="text-xl leading-none" aria-hidden="true">
          ☰
        </span>
      </button>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium text-text-primary pointer-events-none">
        Claude Reflect
      </h1>

      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </header>
  )
}

export default Header
