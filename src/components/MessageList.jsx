import React, { useRef, useEffect, useState } from 'react'
import Message from './Message'
import { deleteMessage } from '../utils/messageUtils'
import { BsTrash, BsX, BsArrowLeft } from 'react-icons/bs'

export default function MessageList({ messages, currentUserId, loading, onReact }) {
  const messagesEndRef = useRef(null)
  const [selectedMessages, setSelectedMessages] = useState(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState({
    me: false,
    everyone: false
  })
  const [messageStates, setMessageStates] = useState({})
  const isMobile = window.innerWidth <= 768

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle real-time message updates
  useEffect(() => {
    const newStates = {}
    messages.forEach(message => {
      newStates[message.id] = {
        is_seen: message.is_seen,
        is_delivered: message.is_delivered,
        reactions: message.reactions || {}
      }
    })
    setMessageStates(newStates)
  }, [messages])

  const handleDeleteSelected = async (type) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [type]: true }))
      const promises = Array.from(selectedMessages).map(messageId => 
        deleteMessage(messageId, type, currentUserId)
      )
      await Promise.all(promises)
      setSelectedMessages(new Set())
      setIsSelectionMode(false)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting messages:', error)
      alert('Failed to delete some messages. Please try again.')
    } finally {
      setDeleteLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleLongPress = () => {
    if (!isSelectionMode) {
      setIsSelectionMode(true)
    }
  }

  const handleSelectAll = () => {
    const allMessageIds = messages.map(msg => msg.id)
    setSelectedMessages(new Set(allMessageIds))
  }

  const handleDeselectAll = () => {
    setSelectedMessages(new Set())
  }

  const handleMessageReaction = (messageId, emoji) => {
    setMessageStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        reactions: {
          ...prev[messageId]?.reactions,
          [currentUserId]: emoji
        }
      }
    }))
    
    // Call parent handler
    onReact?.(messageId, emoji)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
        <div>
          <p className="mb-2">No messages yet</p>
          <p className="text-sm">Send a message to start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isSelectionMode && (
        <div className={`${isMobile ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 p-4 flex justify-between items-center border-b dark:border-gray-700 shadow-md`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedMessages(new Set())
                setIsSelectionMode(false)
              }}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              {isMobile ? <BsArrowLeft size={24} /> : <BsX size={24} />}
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {selectedMessages.size} message{selectedMessages.size !== 1 ? 's' : ''} selected
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedMessages.size < messages.length && (
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Select All
              </button>
            )}
            {selectedMessages.size > 0 && (
              <>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Deselect All
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <BsTrash size={16} />
                  Delete ({selectedMessages.size})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isSelectionMode && isMobile ? 'pt-20' : ''}`}>
        {messages.map((message) => {
          const messageState = messageStates[message.id] || message
          return (
            <Message
              key={message.id}
              message={{
                ...message,
                ...messageState
              }}
              isOwn={message.sender_id === currentUserId}
              onDelete={async (messageId, type) => {
                try {
                  const { error } = await deleteMessage(messageId, type, currentUserId)
                  if (error) throw error
                } catch (error) {
                  console.error('Error deleting message:', error)
                }
              }}
              isSelectionMode={isSelectionMode}
              isSelected={selectedMessages.has(message.id)}
              onSelect={() => {
                const newSelected = new Set(selectedMessages)
                if (newSelected.has(message.id)) {
                  newSelected.delete(message.id)
                } else {
                  newSelected.add(message.id)
                }
                setSelectedMessages(newSelected)
                
                if (newSelected.size === 0) {
                  setIsSelectionMode(false)
                }
              }}
              onLongPress={handleLongPress}
              onReact={handleMessageReaction}
              currentUserId={currentUserId}
            />
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-semibold mb-4 dark:text-gray-200">
              Delete {selectedMessages.size} message{selectedMessages.size !== 1 ? 's' : ''}?
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDeleteSelected('me')}
                disabled={deleteLoading.me}
                className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 flex items-center justify-between"
              >
                <span>Delete for me</span>
                {deleteLoading.me && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                )}
              </button>
              <button
                onClick={() => handleDeleteSelected('everyone')}
                disabled={deleteLoading.everyone}
                className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-600 flex items-center justify-between"
              >
                <span>Delete for everyone</span>
                {deleteLoading.everyone && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}