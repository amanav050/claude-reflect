import { useState, useMemo, useCallback, useEffect } from 'react'

const CHATS_STORAGE_KEY = 'claude_reflect_chats'
const ACTIVE_CHAT_STORAGE_KEY = 'claude_reflect_active_chat'

function createEmptyChat() {
  const id = crypto.randomUUID()
  return {
    id,
    title: 'New chat',
    messages: [],
    reflection: null,
    sentenceLabels: [],
    createdAt: Date.now(),
  }
}

function getStartOfTodayMs() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

export function groupChatsByDate(chats) {
  const today = []
  const previous = []
  const todayMs = getStartOfTodayMs()

  const sorted = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt)

  for (const chat of sorted) {
    if (chat.createdAt >= todayMs) {
      today.push(chat)
    } else {
      previous.push(chat)
    }
  }

  return { today, previous }
}

function truncateTitle(text, max = 30) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function isValidChatsObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entries = Object.entries(value)
  if (entries.length === 0) return false
  return entries.every(
    ([id, chat]) =>
      chat &&
      typeof chat === 'object' &&
      chat.id === id &&
      Array.isArray(chat.messages) &&
      typeof chat.createdAt === 'number'
  )
}

function getMostRecentChatId(chats) {
  const sorted = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt)
  return sorted[0]?.id ?? null
}

let cachedInitialState = null

function getPersistedInitialState() {
  if (cachedInitialState) return cachedInitialState

  try {
    const raw = localStorage.getItem(CHATS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isValidChatsObject(parsed)) {
        const ids = Object.keys(parsed)
        let activeId = localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY)
        if (!activeId || !parsed[activeId]) {
          activeId = getMostRecentChatId(parsed)
        }
        cachedInitialState = { chats: parsed, activeChatId: activeId }
        return cachedInitialState
      }
    }
  } catch {
    /* fall through to default */
  }

  const initialChat = createEmptyChat()
  cachedInitialState = {
    chats: { [initialChat.id]: initialChat },
    activeChatId: initialChat.id,
  }
  return cachedInitialState
}

export function useChatHistory() {
  const [{ chats, activeChatId }, setChatState] = useState(getPersistedInitialState)

  const setChats = useCallback((updater) => {
    setChatState((prev) => {
      const nextChats = typeof updater === 'function' ? updater(prev.chats) : updater
      return { ...prev, chats: nextChats }
    })
  }, [])

  const setActiveChatId = useCallback((id) => {
    setChatState((prev) => ({ ...prev, activeChatId: id }))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))
    } catch {
      /* storage full or unavailable */
    }
  }, [chats])

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeChatId)
    } catch {
      /* storage full or unavailable */
    }
  }, [activeChatId])

  const activeChat = chats[activeChatId] ?? null

  const groupedChats = useMemo(() => groupChatsByDate(chats), [chats])

  const createChat = useCallback(() => {
    const chat = createEmptyChat()
    setChats((prev) => ({ ...prev, [chat.id]: chat }))
    setActiveChatId(chat.id)
    return chat.id
  }, [setChats, setActiveChatId])

  const selectChat = useCallback(
    (id) => {
      setActiveChatId(id)
    },
    [setActiveChatId]
  )

  const appendMessage = useCallback(
    (role, content) => {
      setChats((prev) => {
        const chat = prev[activeChatId]
        if (!chat) return prev

        const message = {
          id: crypto.randomUUID(),
          role,
          content,
        }

        const isFirstUserMessage =
          role === 'user' && chat.messages.filter((m) => m.role === 'user').length === 0

        const updatedChat = {
          ...chat,
          title: isFirstUserMessage ? truncateTitle(content) : chat.title,
          messages: [...chat.messages, message],
        }

        return { ...prev, [activeChatId]: updatedChat }
      })
    },
    [activeChatId, setChats]
  )

  const attachReflection = useCallback(
    (reflection, sentenceLabels) => {
      setChats((prev) => {
        const chat = prev[activeChatId]
        if (!chat) return prev

        return {
          ...prev,
          [activeChatId]: {
            ...chat,
            reflection,
            sentenceLabels: sentenceLabels ?? [],
          },
        }
      })
    },
    [activeChatId, setChats]
  )

  const deleteChat = useCallback(
    (chatId) => {
      setChats((prev) => {
        if (!prev[chatId]) return prev

        const rest = { ...prev }
        delete rest[chatId]

        const remaining = Object.values(rest)
        if (remaining.length === 0) {
          const chat = createEmptyChat()
          setActiveChatId(chat.id)
          return { [chat.id]: chat }
        }

        if (activeChatId === chatId) {
          const next = remaining.sort((a, b) => b.createdAt - a.createdAt)[0]
          setActiveChatId(next.id)
        }

        return rest
      })
    },
    [activeChatId, setChats, setActiveChatId]
  )

  const clearAllChats = useCallback(() => {
    const chat = createEmptyChat()
    const nextChats = { [chat.id]: chat }
    setChats(nextChats)
    setActiveChatId(chat.id)
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(nextChats))
      localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, chat.id)
    } catch {
      /* storage full or unavailable */
    }
  }, [setChats, setActiveChatId])

  return {
    chats,
    activeChatId,
    activeChat,
    groupedChats,
    createChat,
    selectChat,
    appendMessage,
    attachReflection,
    deleteChat,
    clearAllChats,
  }
}
