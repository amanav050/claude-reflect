import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './components/Layout/Sidebar.jsx'
import ChatArea from './components/Chat/ChatArea.jsx'
import ReflectPanel from './components/Reflect/ReflectPanel.jsx'
import FirstTimeCallout from './components/Onboarding/FirstTimeCallout.jsx'
import { useTheme } from './hooks/useTheme.js'
import { useChatHistory } from './hooks/useChatHistory.js'
import { useGroqAPI } from './hooks/useGroqAPI.js'
import { parseReflection } from './utils/parseReflection.js'
import { matchSentences } from './utils/matchSentences.js'

function App() {
  const [theme, toggleTheme] = useTheme()
  const {
    chats, activeChatId, activeChat, createChat, selectChat,
    appendMessage, attachReflection, deleteChat, clearAllChats,
  } = useChatHistory()
  const { sendMainQuery, getReflection } = useGroqAPI()

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [isLoading, setIsLoading] = useState(false)
  const [isReflecting, setIsReflecting] = useState(false)
  const [error, setError] = useState(null)
  const [queryCount, setQueryCount] = useState(0)
  const [activeSentenceId, setActiveSentenceId] = useState(null)
  const [activeFlagId, setActiveFlagId] = useState(null)
  const [showCallout, setShowCallout] = useState(
    () => localStorage.getItem('claude_reflect_callout_dismissed') !== 'true'
  )

  const latestChatIdRef = useRef(activeChatId)
  useEffect(() => { latestChatIdRef.current = activeChatId }, [activeChatId])
  useEffect(() => { if (activeSentenceId) { const t = setTimeout(() => setActiveSentenceId(null), 1500); return () => clearTimeout(t) } }, [activeSentenceId])
  useEffect(() => { if (activeFlagId) { const t = setTimeout(() => setActiveFlagId(null), 1500); return () => clearTimeout(t) } }, [activeFlagId])

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return
    setError(null)
    setIsLoading(true)

    const userMsg = text.trim()
    appendMessage('user', userMsg)

    const history = [
      ...(activeChat?.messages || []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMsg },
    ]

    try {
      const mainResult = await sendMainQuery(history)
      if (!mainResult.ok) {
        setError(mainResult.error || 'Something went wrong.')
        setIsLoading(false)
        return
      }

      const responseText = mainResult.data.response
      appendMessage('assistant', responseText)
      setIsLoading(false)
      setQueryCount((c) => c + 1)

      setIsReflecting(true)
      const chatIdAtSend = latestChatIdRef.current

      getReflection(userMsg, responseText)
        .then((r) => {
          if (latestChatIdRef.current !== chatIdAtSend) return
          if (r.ok) {
            const parsed = parseReflection(r.data.reflection)
            if (parsed) {
              attachReflection(parsed, matchSentences(responseText, parsed.sentence_labels || []))
            } else { attachReflection(null, []) }
          } else { attachReflection(null, []) }
        })
        .catch(() => { attachReflection(null, []) })
        .finally(() => { setIsReflecting(false) })
    } catch {
      setError('Connection lost. Please try again.')
      setIsLoading(false)
    }
  }, [isLoading, activeChat, appendMessage, sendMainQuery, getReflection, attachReflection])

  const handleSentenceClick = useCallback((id) => {
    setActiveFlagId(id)
    const el = document.querySelector(`[data-flag-id="${id}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleFlagClick = useCallback((id) => {
    setActiveSentenceId(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleDismissCallout = useCallback(() => {
    setShowCallout(false)
    localStorage.setItem('claude_reflect_callout_dismissed', 'true')
  }, [])

  const showGlow = queryCount > 0 && queryCount <= 3
  const lastUserMsg = activeChat?.messages?.filter((m) => m.role === 'user').slice(-1)[0]?.content || ''
  const lastAsstMsg = activeChat?.messages?.filter((m) => m.role === 'assistant').slice(-1)[0]?.content || ''

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={createChat}
        onDeleteChat={deleteChat}
        onClearAll={clearAllChats}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 h-[100dvh]">
        {/* Top area */}
        <div className="shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-3 left-3 z-10 w-11 h-11 flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 active:opacity-50"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
          )}
          {showCallout && <FirstTimeCallout onDismiss={handleDismissCallout} />}
        </div>

        {/* Main content — column on mobile, row on desktop */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Chat area — takes all available space */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ChatArea
              chat={activeChat}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              error={error}
              activeSentenceId={activeSentenceId}
              onSentenceClick={handleSentenceClick}
            />
          </div>

          {/* Reflect panel */}
          <ReflectPanel
            reflection={activeChat?.reflection}
            isLoading={isReflecting}
            activeFlagId={activeFlagId}
            onFlagClick={handleFlagClick}
            originalQuery={lastUserMsg}
            mainResponse={lastAsstMsg}
            showGlow={showGlow}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>
      </div>
    </div>
  )
}

export default App