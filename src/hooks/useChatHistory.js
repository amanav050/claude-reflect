import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'claude_reflect_chats'
const ACTIVE_KEY = 'claude_reflect_active_chat'
const MAX_CHATS = 20

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function safeGetStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage full or unavailable — silently fail */
  }
}

function createEmptyChat() {
  return {
    id: generateId(),
    title: 'New chat',
    messages: [],
    reflection: null,
    sentenceLabels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function loadInitialChats() {
  const stored = safeGetStorage(STORAGE_KEY)
  if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
    return stored
  }
  const chat = createEmptyChat()
  return { [chat.id]: chat }
}

function loadInitialActiveId(chats) {
  const stored = safeGetStorage(ACTIVE_KEY)
  if (stored && chats[stored]) return stored
  /* Pick the most recently updated chat */
  const sorted = Object.values(chats).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  return sorted[0]?.id || null
}

export function useChatHistory() {
  const [chats, setChats] = useState(() => {
    const initial = loadInitialChats()
    return initial
  })

  const [activeChatId, setActiveChatId] = useState(() => loadInitialActiveId(loadInitialChats()))

  /* Persist chats to localStorage whenever they change */
  useEffect(() => {
    safeSetStorage(STORAGE_KEY, chats)
  }, [chats])

  /* Persist active chat ID */
  useEffect(() => {
    if (activeChatId) {
      safeSetStorage(ACTIVE_KEY, activeChatId)
    }
  }, [activeChatId])

  const activeChat = chats[activeChatId] || null

  /* ── Enforce max chat limit ── */
  const enforceLimit = useCallback((chatsObj) => {
    const entries = Object.values(chatsObj)
    if (entries.length <= MAX_CHATS) return chatsObj

    const sorted = entries.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
    const toRemove = sorted.slice(0, entries.length - MAX_CHATS)
    const cleaned = { ...chatsObj }
    for (const chat of toRemove) {
      delete cleaned[chat.id]
    }
    return cleaned
  }, [])

  /* ── Create a new chat ── */
  const createChat = useCallback(() => {
    const chat = createEmptyChat()
    setChats((prev) => {
      const updated = { ...prev, [chat.id]: chat }
      return enforceLimit(updated)
    })
    setActiveChatId(chat.id)
  }, [enforceLimit])

  /* ── Select a chat ── */
  const selectChat = useCallback((id) => {
    setActiveChatId(id)
  }, [])

  /* ── Append a message to the active chat ── */
  const appendMessage = useCallback((role, content) => {
    setChats((prev) => {
      const chat = prev[activeChatId]
      if (!chat) return prev

      const newMessage = {
        id: generateId(),
        role,
        content,
      }

      const isFirstUserMessage = role === 'user' && chat.messages.length === 0
      const newTitle = isFirstUserMessage
        ? content.slice(0, 35) + (content.length > 35 ? '...' : '')
        : chat.title

      return {
        ...prev,
        [activeChatId]: {
          ...chat,
          messages: [...chat.messages, newMessage],
          title: newTitle,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }, [activeChatId])

  /* ── Attach reflection data to the active chat ── */
  const attachReflection = useCallback((reflection, sentenceLabels) => {
    setChats((prev) => {
      const chat = prev[activeChatId]
      if (!chat) return prev

      return {
        ...prev,
        [activeChatId]: {
          ...chat,
          reflection,
          sentenceLabels: sentenceLabels || [],
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }, [activeChatId])

  /* ── Delete a single chat ── */
  const deleteChat = useCallback((chatId) => {
    setChats((prev) => {
      const updated = { ...prev }
      delete updated[chatId]

      /* If we deleted the active chat, switch to most recent */
      if (chatId === activeChatId) {
        const remaining = Object.values(updated)
        if (remaining.length === 0) {
          const fresh = createEmptyChat()
          updated[fresh.id] = fresh
          setActiveChatId(fresh.id)
        } else {
          const sorted = remaining.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          setActiveChatId(sorted[0].id)
        }
      }

      return updated
    })
  }, [activeChatId])

  /* ── Clear all chats ── */
  const clearAllChats = useCallback(() => {
    const fresh = createEmptyChat()
    setChats({ [fresh.id]: fresh })
    setActiveChatId(fresh.id)
    safeSetStorage(STORAGE_KEY, { [fresh.id]: fresh })
  }, [])

  return {
    chats,
    activeChatId,
    activeChat,
    createChat,
    selectChat,
    appendMessage,
    attachReflection,
    deleteChat,
    clearAllChats,
  }
}