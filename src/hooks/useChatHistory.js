import { useState, useMemo, useCallback } from 'react'

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

function groupChatsByDate(chats) {
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

export function useChatHistory() {
  const initialChat = createEmptyChat()
  const [chats, setChats] = useState({ [initialChat.id]: initialChat })
  const [activeChatId, setActiveChatId] = useState(initialChat.id)

  const activeChat = chats[activeChatId] ?? null

  const groupedChats = useMemo(() => groupChatsByDate(chats), [chats])

  const createChat = useCallback(() => {
    const chat = createEmptyChat()
    setChats((prev) => ({ ...prev, [chat.id]: chat }))
    setActiveChatId(chat.id)
    return chat.id
  }, [])

  const selectChat = useCallback((id) => {
    setActiveChatId(id)
  }, [])

  const appendMessage = useCallback((role, content) => {
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
  }, [activeChatId])

  const attachReflection = useCallback((reflection, sentenceLabels) => {
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
  }, [activeChatId])

  return {
    chats,
    activeChatId,
    activeChat,
    groupedChats,
    createChat,
    selectChat,
    appendMessage,
    attachReflection,
  }
}
