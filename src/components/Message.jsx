import React, { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { BsCheck2, BsCheck2All, BsEmojiSmile, BsPlus } from 'react-icons/bs'
import MessageDeleteModal from './MessageDeleteModal'
import EmojiPicker from 'emoji-picker-react'
import { playMessageSound } from '../utils/soundUtils'

export default function Message({ 
  message, 
  isOwn, 
  onDelete,
  isSelectionMode,
  isSelected,
  onSelect,
  onLongPress,
  onReact,
  currentUserId
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false)
  const longPressTimer = useRef(null)
  const [isLongPress, setIsLongPress] = useState(false)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 })
  const isMobile = window.innerWidth <= 768
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  // Play sound when message is sent successfully
  useEffect(() => {
    if (message && isOwn && message.created_at) {
      const messageTime = new Date(message.created_at).getTime()
      const now = Date.now()
      // If message was created within last 2 seconds, play sound
      if (now - messageTime < 2000) {
        playMessageSound()
      }
    }
  }, [message, isOwn])
  const handleTouchStart = (e) => {
    if (isMobile) {
      const touch = e.touches[0]
      setTouchStartTime(Date.now())
      setTouchStartPos({ x: touch.clientX, y: touch.clientY })
      longPressTimer.current = setTimeout(() => {
        setIsLongPress(true)
        // Vibrate on long press for mobile feedback
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
        
        if (isSelectionMode) {
          onSelect()
        } else {
          setShowReactions(true)
        }
        onLongPress?.()
      }, 400) // Reduced time for better mobile experience
    }
  }

  const handleTouchEnd = (e) => {
    if (isMobile) {
      const touchDuration = Date.now() - touchStartTime
      const touch = e.changedTouches[0]
      const touchEndPos = { x: touch.clientX, y: touch.clientY }
      const distance = Math.sqrt(
        Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
        Math.pow(touchEndPos.y - touchStartPos.y, 2)
      )
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      
      // Only trigger selection if it's a tap (not a swipe) and not a long press
      if (!isLongPress && distance < 10 && touchDuration < 400 && isSelectionMode) {
        onSelect()
      }
      setIsLongPress(false)
    }
  }

  const handleTouchMove = (e) => {
    // Cancel long press if user moves finger too much
    if (longPressTimer.current) {
      const touch = e.touches[0]
      const distance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.y, 2)
      )
      
      if (distance > 10) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }
  const handleMouseDown = (e) => {
    if (!isMobile) {
      setTouchStartTime(Date.now())
    }
  }

  const handleMouseUp = (e) => {
    if (!isMobile) {
      const clickDuration = Date.now() - touchStartTime
      if (clickDuration > 250) {
        if (isSelectionMode) {
          onSelect()
        } else {
          setShowReactions(true)
        }
        onLongPress?.()
      } else if (isSelectionMode) {
        onSelect()
      }
    }
  }

  const handleReactionSelect = (emoji) => {
    // Vibrate on reaction selection for mobile feedback
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(30)
    }
    
    onReact?.(message.id, typeof emoji === 'string' ? emoji : emoji.emoji)
    setShowReactions(false)
    setShowFullEmojiPicker(false)
  }

  const getMessageStatus = () => {
    if (isOwn) {
      return message.is_seen ? (
        <BsCheck2All className="text-sky-500 drop-shadow-sm" size={16} />
      ) : message.is_delivered ? (
        <BsCheck2All className="text-gray-500 dark:text-gray-400" size={16} />
      ) : (
        <BsCheck2 className="text-gray-500 dark:text-gray-400" size={16} />
      )
    }
    return null
  }

  const handleMessageClick = () => {
    if (isSelectionMode) {
      onSelect()
    } else if (isOwn && !message.deleted_for_everyone && !isMobile) {
      setShowDeleteModal(true)
    }
  }

  const renderContent = () => {
    if (message.deleted_for_everyone) {
      return <p className="italic text-opacity-70 text-sm">This message was deleted</p>
    }

    if (message.type === 'image') {
      return (
        <div className="relative">
          <div className="relative transition-all duration-300">
            <img
              src={message.image_url}
              alt="Shared image"
              className={`max-w-full rounded-lg ${imageLoaded ? 'opacity-100' : 'opacity-0'} max-h-[300px] object-contain cursor-pointer`}
              onLoad={() => setImageLoaded(true)}
              onClick={() => {
                // Open image in full screen
                const newWindow = window.open()
                newWindow.document.write(`
                  <html>
                    <head><title>Image</title></head>
                    <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
                      <img src="${message.image_url}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                    </body>
                  </html>
                `)
              }}
            />
          </div>
          {!imageLoaded && (
            <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          )}
        </div>
      )
    }

    return <p className="break-words text-sm">{message.content}</p>
  }

  return (
    <>
      <div 
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 relative`}
        onClick={handleMessageClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Selection checkbox for mobile */}
        {isSelectionMode && isMobile && (
          <div className="flex items-center mr-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
          </div>
        )}

        <div
          className={`max-w-[70%] md:max-w-[50%] rounded-lg p-2.5 transition-all duration-200 ${
            isOwn 
              ? isSelected 
                ? 'bg-green-600 text-white'
                : 'bg-green-500 text-white' 
              : isSelected
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'bg-white dark:bg-gray-800 dark:text-gray-200'
          } cursor-pointer hover:opacity-90 shadow-sm ${
            isSelectionMode ? 'transform scale-95' : ''
          }`}
        >
          {renderContent()}
          <div className="flex justify-end items-center gap-1.5 mt-1">
            {/* Show reaction if message has one and it's from current user */}
            {message.reactions && message.reactions[currentUserId] && (
              <span className="text-xs bg-white/20 dark:bg-black/20 rounded-full px-1.5 py-0.5 border border-white/30 animate-bounce">
                {message.reactions[currentUserId]}
              </span>
            )}
            <span className="text-[10px] opacity-70">
              {format(new Date(message.created_at), 'h:mm a')}
            </span>
            {getMessageStatus()}
          </div>
        </div>

        {showReactions && (
          <div className={`absolute ${isMobile ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 flex items-center z-50 animate-fadeIn`}>
            {quickEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleReactionSelect(emoji)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-lg transition-transform hover:scale-110 active:scale-95"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => {
                setShowReactions(false)
                setShowFullEmojiPicker(true)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-110 active:scale-95"
            >
              <BsPlus size={20} />
            </button>
          </div>
        )}
      </div>

      {showFullEmojiPicker && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-50 animate-slideUp">
          <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
            <h3 className="font-medium dark:text-gray-200">Choose Reaction</h3>
            <button
              onClick={() => setShowFullEmojiPicker(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <EmojiPicker
            onEmojiClick={handleReactionSelect}
            width="100%"
            height={300}
            searchDisabled
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {showDeleteModal && (
        <MessageDeleteModal
          message={message}
          onDelete={onDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}