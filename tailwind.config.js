/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--color-bg-page)',
        card: 'var(--color-bg-card)',
        sidebar: 'var(--color-bg-sidebar)',
        assistant: 'var(--color-bg-assistant)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        border: 'var(--color-border)',
        'accent-reflect': 'var(--color-accent-reflect)',
        'confidence-green': 'var(--color-confidence-green)',
        'confidence-amber': 'var(--color-confidence-amber)',
        'confidence-red': 'var(--color-confidence-red)',
        'knowledge-blue': 'var(--color-knowledge-blue)',
        sparkle: 'var(--color-sparkle)',
      },
    },
  },
  plugins: [],
}