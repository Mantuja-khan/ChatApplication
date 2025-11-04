import React, { useState, useEffect, useRef } from 'react'
import { BsArrowLeft, BsPalette } from 'react-icons/bs'
import { supabase } from '../lib/supabase'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import EmptyChatState from './EmptyChatState'
import { getMessages, subscribeToMessages } from '../utils/messageUtils'
import { isUserBlocked } from '../utils/userUtils'
import ErrorMessage from './ErrorMessage'
import { emitActiveChatUser, emitMessagesSeen } from '../lib/socket'

const CHAT_THEMES = [
  { name: 'Default', background: 'bg-[#efeae2]', pattern: null },
  { name: 'Dark', background: 'bg-gray-900', pattern: null },
  { name: 'Ocean', background: 'bg-blue-100', pattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { name: 'Forest', background: 'bg-green-100', pattern: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23059669" fill-opacity="0.1" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Ccircle cx="13" cy="13" r="3"/%3E%3C/g%3E%3C/svg%3E")' },
  { name: 'Sunset', background: 'bg-orange-100', pattern: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23EA580C" fill-opacity="0.1" fill-rule="evenodd"%3E%3Cpath d="m0 40l40-40V0H0v40z"/%3E%3C/g%3E%3C/svg%3E")' },
  { name: 'Purple', background: 'bg-purple-100', pattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%237C3AED" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }
]

export default function ChatWindow({ currentUser, selectedUser, onBack, isMobile }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(CHAT_THEMES[0])
  const messageSubscription = useRef(null)

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('chat-theme')
    if (savedTheme) {
      const theme = CHAT_THEMES.find(t => t.name === savedTheme) || CHAT_THEMES[0]
      setCurrentTheme(theme)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    if (selectedUser) {
      fetchMessages()
      checkBlockStatus()
      
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe()
        messageSubscription.current = null
      }

      emitActiveChatUser(currentUser.id, selectedUser.id)

      messageSubscription.current = subscribeToMessages(
        currentUser.id, 
        selectedUser.id, 
        (payload) => {
          if (!mounted) return
          handleMessageUpdate(payload)
        }
      )

      markMessagesAsSeen()
    }

    return () => {
      mounted = false
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe()
        messageSubscription.current = null
      }
      emitActiveChatUser(currentUser.id, null)
    }
  }, [selectedUser?.id])

  const markMessagesAsSeen = async () => {
    if (!selectedUser) return

    const unseenMessages = messages.filter(msg => 
      msg.sender_id === selectedUser.id && 
      msg.receiver_id === currentUser.id && 
      !msg.is_seen
    )

    if (unseenMessages.length > 0) {
      const { error } = await supabase
        .from('messages')
        .update({ is_seen: true })
        .in('id', unseenMessages.map(msg => msg.id))

      if (!error) {
        // Emit seen status for real-time updates
        emitMessagesSeen(unseenMessages.map(msg => msg.id), currentUser.id)
        
        // Update local state
        setMessages(prev => prev.map(msg => 
          unseenMessages.some(unseen => unseen.id === msg.id)
            ? { ...msg, is_seen: true }
            : msg
        ))
      }
    }
  }

  const checkBlockStatus = async () => {
    if (!selectedUser) return
    const blocked = await isUserBlocked(currentUser.id, selectedUser.id)
    setIsBlocked(blocked)
  }

  const handleMessageUpdate = (payload) => {
    if (payload.eventType === 'DELETE') {
      setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
    } else if (payload.eventType === 'UPDATE' && payload.new.deleted_for_everyone) {
      setMessages(prev => prev.map(msg => 
        msg.id === payload.new.id 
          ? { ...msg, deleted_for_everyone: true, content: 'This message was deleted' }
          : msg
      ))
    } else if (payload.eventType === 'INSERT') {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === payload.new.id)
        if (exists) return prev
        
        const newMessages = [...prev, payload.new].sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        )
        
        // Auto-mark as seen if message is from the other user
        if (payload.new.sender_id === selectedUser.id) {
          setTimeout(() => markMessagesAsSeen(), 100)
        }
        
        return newMessages
      })
    } else if (payload.eventType === 'BULK_UPDATE') {
      // Handle bulk seen updates
      setMessages(prev => prev.map(msg => 
        payload.messageIds.includes(msg.id)
          ? { ...msg, ...payload.updates }
          : msg
      ))
    }
  }

  const fetchMessages = async () => {
    if (!selectedUser) return
    
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await getMessages(currentUser.id, selectedUser.id)
      
      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Unable to load messages. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMessageSent = (newMessage) => {
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id)
      if (exists) return prev
      
      return [...prev, newMessage].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )
    })
  }

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme)
    localStorage.setItem('chat-theme', theme.name)
    setShowThemeSelector(false)
    
    // Force immediate re-render for theme change
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 0)
  }

  const handleMessageReaction = async (messageId, emoji) => {
    try {
      // Update message with reaction in database
      const { error } = await supabase
        .from('messages')
        .update({ 
          reactions: { 
            ...messages.find(m => m.id === messageId)?.reactions,
            [currentUser.id]: emoji 
          }
        })
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              reactions: { 
                ...msg.reactions,
                [currentUser.id]: emoji 
              }
            }
          : msg
      ))
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  if (!selectedUser) {
    return <EmptyChatState />
  }

  const backgroundStyle = currentTheme.pattern 
    ? { backgroundImage: currentTheme.pattern }
    : {}

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="h-[72px] flex items-center bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
        {isMobile && (
          <button
            onClick={onBack}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            aria-label="Back to chat list"
          >
            <BsArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
        <div className="flex-1">
          <ChatHeader 
            user={selectedUser} 
            currentUserId={currentUser.id}
            showOnlineStatus={!isBlocked}
          />
        </div>
        <button
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-2"
          title="Change Theme"
        >
          <BsPalette size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Theme Selector */}
      {showThemeSelector && (
        <div className="absolute top-[72px] right-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-4 w-64">
          <h3 className="font-medium mb-3 dark:text-gray-200">Chat Theme</h3>
          <div className="grid grid-cols-2 gap-2">
            {CHAT_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleThemeChange(theme)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  currentTheme.name === theme.name 
                    ? 'border-green-500 ring-2 ring-green-200' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div 
                  className={`w-full h-8 rounded ${theme.background} mb-2`}
                  style={theme.pattern ? { backgroundImage: theme.pattern } : {}}
                />
                <span className="text-xs font-medium dark:text-gray-200">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchMessages} />}
      
      <div 
        className={`flex-1 overflow-y-auto ${currentTheme.background} dark:bg-gray-900`}
        style={backgroundStyle}
      >
        <div className={isMobile ? 'pb-20' : ''}>
        <MessageList 
          messages={messages}
          currentUserId={currentUser.id}
          loading={loading}
          onReact={handleMessageReaction}
        />
        </div>
      </div>
      
      <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0' : 'sticky bottom-0'} w-full bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-40`}>
        <MessageInput 
          currentUser={currentUser}
          selectedUser={selectedUser}
          onMessageSent={handleMessageSent}
          disabled={isBlocked}
        />
      </div>
    </div>
  )
}