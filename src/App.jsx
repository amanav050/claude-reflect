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
    chats,
    activeChatId,
    activeChat,
    createChat,
    selectChat,
    appendMessage,
    attachReflection,
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
  useEffect(() => {
    latestChatIdRef.current = activeChatId
  }, [activeChatId])

  useEffect(() => {
    if (activeSentenceId) {
      const t = setTimeout(() => setActiveSentenceId(null), 1500)
      return () => clearTimeout(t)
    }
  }, [activeSentenceId])

  useEffect(() => {
    if (activeFlagId) {
      const t = setTimeout(() => setActiveFlagId(null), 1500)
      return () => clearTimeout(t)
    }
  }, [activeFlagId])

  const handleSendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return

      setError(null)
      setIsLoading(true)

      appendMessage('user', text)

      const currentMessages = [
        ...(activeChat?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: text },
      ]

      const mainResult = await sendMainQuery(currentMessages)

      if (!mainResult.ok) {
        setError(mainResult.error || 'Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      const responseText = mainResult.data.response
      appendMessage('assistant', responseText)
      setIsLoading(false)
      setQueryCount((c) => c + 1)

      setIsReflecting(true)
      const chatIdAtSend = latestChatIdRef.current

      getReflection(text, responseText)
        .then((reflResult) => {
          if (latestChatIdRef.current !== chatIdAtSend) return
          if (reflResult.ok) {
            const parsed = parseReflection(reflResult.data.reflection)
            if (parsed) {
              const labels = matchSentences(responseText, parsed.sentence_labels || [])
              attachReflection(parsed, labels)
            } else {
              attachReflection(null, [])
            }
          } else {
            attachReflection(null, [])
          }
        })
        .catch(() => {
          attachReflection(null, [])
        })
        .finally(() => {
          setIsReflecting(false)
        })
    },
    [isLoading, activeChat, appendMessage, sendMainQuery, getReflection, attachReflection]
  )

  const handleSentenceClick = useCallback((sentenceId) => {
    setActiveFlagId(sentenceId)
    const flagEl = document.querySelector(`[data-flag-id="${sentenceId}"]`)
    if (flagEl) flagEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleFlagClick = useCallback((flagId) => {
    setActiveSentenceId(flagId)
    const sentenceEl = document.getElementById(flagId)
    if (sentenceEl) sentenceEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleDismissCallout = useCallback(() => {
    setShowCallout(false)
    localStorage.setItem('claude_reflect_callout_dismissed', 'true')
  }, [])

  const groupedChats = chats
  const showGlow = queryCount > 0 && queryCount <= 3

  const lastUserMessage = activeChat?.messages
    ?.filter((m) => m.role === 'user')
    .slice(-1)[0]?.content || ''

  const lastAssistantMessage = activeChat?.messages
    ?.filter((m) => m.role === 'assistant')
    .slice(-1)[0]?.content || ''

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-page)' }}
    >
      <Sidebar
        chats={groupedChats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={createChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 h-screen">
        <div className="shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center rounded-lg transition-opacity hover:opacity-70"
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

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ChatArea
            chat={activeChat}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
            activeSentenceId={activeSentenceId}
            onSentenceClick={handleSentenceClick}
          />
          <ReflectPanel
            reflection={activeChat?.reflection}
            isLoading={isReflecting}
            activeFlagId={activeFlagId}
            onFlagClick={handleFlagClick}
            originalQuery={lastUserMessage}
            mainResponse={lastAssistantMessage}
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