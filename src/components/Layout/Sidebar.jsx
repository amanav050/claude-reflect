import { useEffect } from 'react'
import ClaudeLogo from '../ClaudeLogo.jsx'

function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onClearAll, isOpen, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const today = []
  const previous = []
  const now = new Date()

  Object.values(chats).forEach((chat) => {
    const chatDate = new Date(chat.createdAt || now)
    const isToday = chatDate.toDateString() === now.toDateString()
    if (isToday) today.push(chat)
    else previous.push(chat)
  })

  /* Sort within groups by updatedAt descending */
  today.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  previous.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  const ChatItem = ({ chat }) => {
    const isActive = chat.id === activeChatId
    return (
      <div className="group relative">
        <button
          onClick={() => {
            onSelectChat(chat.id)
            if (window.innerWidth < 1024) onClose()
          }}
          className="w-full text-left px-3 py-2 rounded-lg text-[13px] truncate transition-all duration-150 pr-8"
          style={{
            backgroundColor: isActive ? 'var(--color-bg-card)' : 'transparent',
            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = isActive ? 'var(--color-bg-card)' : 'transparent' }}
        >
          <span className="flex items-center gap-2">
            {isActive && <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-sparkle)' }} />}
            <span className="truncate">{chat.title || 'New chat'}</span>
          </span>
        </button>
        {/* Delete button — appears on hover */}
        {onDeleteChat && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteChat(chat.id)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:opacity-80"
            style={{ color: 'var(--color-text-tertiary)' }}
            aria-label="Delete chat"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-screen py-3 px-2.5" style={{ backgroundColor: 'var(--color-bg-sidebar)' }}>
      <div className="flex items-center gap-2.5 px-2 mb-4">
        <ClaudeLogo size={22} style={{ color: 'var(--color-sparkle)' }} />
        <span className="text-[15px] font-medium" style={{ color: 'var(--color-text-primary)' }}>Claude Reflect</span>
        <button
          onClick={onClose}
          className="ml-auto w-6 h-6 flex items-center justify-center rounded transition-opacity hover:opacity-60"
          style={{ color: 'var(--color-text-tertiary)' }}
          aria-label="Close sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M6 2v12" />
          </svg>
        </button>
      </div>

      <button
        onClick={onNewChat}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] mb-3 transition-all duration-150"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M7 2v10M2 7h10" />
        </svg>
        <span>New chat</span>
      </button>

      <div className="mx-2 mb-2" style={{ borderBottom: '1px solid var(--color-border)' }} />

      <div className="flex-1 overflow-y-auto space-y-0.5 px-0.5">
        {today.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] uppercase tracking-[0.08em] font-medium px-3 mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Today</p>
            <div className="space-y-0.5">{today.map((c) => <ChatItem key={c.id} chat={c} />)}</div>
          </div>
        )}
        {previous.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] uppercase tracking-[0.08em] font-medium px-3 mb-1 mt-3" style={{ color: 'var(--color-text-tertiary)' }}>Previous</p>
            <div className="space-y-0.5">{previous.map((c) => <ChatItem key={c.id} chat={c} />)}</div>
          </div>
        )}
        {today.length === 0 && previous.length === 0 && (
          <p className="text-xs px-3 py-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>No conversations yet</p>
        )}
      </div>

      {/* Clear all button at bottom */}
      {onClearAll && Object.keys(chats).length > 1 && (
        <div className="mt-2 pt-2 px-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => {
              if (window.confirm('Clear all conversations?')) onClearAll()
            }}
            className="w-full text-[11px] py-1.5 rounded transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Clear all chats
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div
        className="hidden lg:block shrink-0 overflow-hidden transition-all duration-200 ease-in-out"
        style={{ width: isOpen ? '220px' : '0px', height: '100vh', position: 'sticky', top: 0 }}
      >
        <div className="w-[220px] h-full" style={{ borderRight: '1px solid var(--color-border)' }}>{sidebarContent}</div>
      </div>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative w-[260px] h-full shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}

export default Sidebar