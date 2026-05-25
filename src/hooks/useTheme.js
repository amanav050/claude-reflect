import { useState, useLayoutEffect, useCallback } from 'react'

const STORAGE_KEY = 'claude-reflect-theme'

function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

function getSystemTheme() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function getInitialTheme() {
  return getStoredTheme() ?? getSystemTheme()
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useLayoutEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const setThemeMode = useCallback((mode) => {
    if (mode === 'light' || mode === 'dark') setTheme(mode)
  }, [])

  return [theme, toggleTheme, setThemeMode]
}
