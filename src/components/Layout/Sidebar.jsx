import { useEffect, useMemo } from 'react'
import ClaudeLogo from '../ClaudeLogo.jsx'
import { groupChatsByDate } from '../../hooks/useChatHistory.js'

function CollapseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M6 2v12" />
    </svg>
  )
}

function NewChatIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M7 2v10M2 7h10" />
    </svg>
  )
}

function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClearAllChats,
  isOpen,
  onClose,
  onToggleSidebar,
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const { today, previous } = useMemo(() => {
    if (chats && (Array.isArray(chats.today) || Array.isArray(chats.previous))) {
      return {
        today: chats.today ?? [],
        previous: chats.previous ?? [],
      }
    }
    return groupChatsByDate(chats ?? {})
  }, [chats])

  const hasChats = today.length > 0 || previous.length > 0

  const ChatItem = ({ chat }) => {
    const isActive = chat.id === activeChatId
    return (
      <div
        className={[
          'group flex items-center rounded-lg transition-colors duration-200',
          isActive ? 'bg-card' : 'hover:bg-card',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => {
            onSelectChat(chat.id)
            if (window.innerWidth < 1024) onClose()
          }}
          className={[
            'flex-1 min-w-0 text-left px-3 py-2 rounded-lg text-sm truncate transition-colors duration-200',
            isActive ? 'text-text-primary' : 'text-text-secondary',
          ].join(' ')}
        >
          <span className="flex items-center gap-2">
            {isActive && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 bg-accent-reflect"
                aria-hidden="true"
              />
            )}
            <span className="truncate">{chat.title || 'New chat'}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteChat(chat.id)
          }}
          className="shrink-0 w-7 h-7 mr-1 flex items-center justify-center rounded-md text-xs text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-secondary transition-all duration-200"
          aria-label={`Delete ${chat.title || 'chat'}`}
        >
          ×
        </button>
      </div>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full py-3 px-2 bg-sidebar">
      <div className="flex items-center gap-2 px-2 mb-4 shrink-0">
        <ClaudeLogo size={20} className="shrink-0 text-sparkle" />
        <span className="text-[15px] font-medium text-text-primary flex-1 truncate">
          Claude Reflect
        </span>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-card transition-colors duration-200"
          aria-label="Collapse sidebar"
        >
          <CollapseIcon />
        </button>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="flex items-center gap-2 w-full px-3 py-2 mb-3 rounded-lg text-sm text-text-secondary hover:bg-card transition-colors duration-200 shrink-0"
      >
        <NewChatIcon />
        <span>New chat</span>
      </button>

      <div className="mx-2 mb-2 border-b border-border shrink-0" />

      <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
        {today.length > 0 && (
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wider font-medium px-3 mb-1 text-text-tertiary">
              Today
            </p>
            <div className="space-y-0.5">
              {today.map((c) => (
                <ChatItem key={c.id} chat={c} />
              ))}
            </div>
          </div>
        )}
        {previous.length > 0 && (
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wider font-medium px-3 mb-1 mt-3 text-text-tertiary">
              Previous
            </p>
            <div className="space-y-0.5">
              {previous.map((c) => (
                <ChatItem key={c.id} chat={c} />
              ))}
            </div>
          </div>
        )}
        {!hasChats && (
          <p className="text-xs px-3 py-4 text-center text-text-tertiary">
            No conversations yet
          </p>
        )}
      </div>

      {hasChats && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Clear all conversations?')) {
              onClearAllChats()
            }
          }}
          className="shrink-0 mt-2 mx-2 px-3 py-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-200 text-left"
        >
          Clear all
        </button>
      )}
    </div>
  )

  const collapsedRail = (
    <div className="flex flex-col items-center h-full py-4 gap-3 bg-sidebar border-r border-border w-14 shrink-0">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-card transition-colors duration-200"
        aria-label="Expand sidebar"
      >
        <CollapseIcon />
      </button>
      <button
        type="button"
        onClick={onNewChat}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-card transition-colors duration-200"
        aria-label="New chat"
      >
        <NewChatIcon />
      </button>
    </div>
  )

  return (
    <>
      <div
        className="hidden lg:flex shrink-0 h-full transition-all duration-200 ease-in-out overflow-hidden"
        style={{ width: isOpen ? '220px' : '56px' }}
      >
        {isOpen ? (
          <div className="w-[220px] h-full border-r border-border">{sidebarContent}</div>
        ) : (
          collapsedRail
        )}
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-label="Close sidebar"
          />
          <div className="relative w-[260px] h-full shadow-2xl border-r border-border">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
