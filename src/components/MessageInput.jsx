import React, { useState, useRef } from 'react'
import { IoSend, IoImage } from 'react-icons/io5'
import { BsEmojiSmile } from 'react-icons/bs'
import EmojiPicker from 'emoji-picker-react'
import { sendMessage } from '../utils/messageUtils'
import { supabase } from '../lib/supabase'
import { playMessageSound, isAudioOn } from '../utils/soundUtils'

export default function MessageInput({ currentUser, selectedUser, onMessageSent, disabled }) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)
  const [selectedEmojis, setSelectedEmojis] = useState([])
  const fileInputRef = useRef(null)
  const emojiButtonRef = useRef(null)
  const isMobile = window.innerWidth <= 768

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Send selected emojis first if any
    if (selectedEmojis.length > 0) {
      const emojiMessage = selectedEmojis.join(' ')
      setSending(true)
      try {
        const { data, error } = await sendMessage(currentUser.id, selectedUser.id, emojiMessage)
        if (error) throw error
        if (data) {
          // Play sound only if audio is enabled
          if (isAudioOn()) {
            playMessageSound()
          }
          onMessageSent(data)
        }
        setSelectedEmojis([])
      } catch (error) {
        console.error('Error sending emojis:', error)
      }
      setSending(false)
    }

    // Send text message if any
    if (newMessage.trim() && !disabled) {
      const messageContent = newMessage.trim()
      setNewMessage('')
      setSending(true)

      try {
        const { data, error } = await sendMessage(currentUser.id, selectedUser.id, messageContent)
        if (error) throw error
        if (data) {
          // Play sound only if audio is enabled
          if (isAudioOn()) {
            playMessageSound()
          }
          onMessageSent(data)
        }
      } catch (error) {
        console.error('Error sending message:', error)
        setNewMessage(messageContent)
      } finally {
        setSending(false)
      }
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || disabled) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setPendingImage(URL.createObjectURL(file))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${currentUser.id}/${fileName}`

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      const { error: uploadError, data } = await supabase.storage
        .from('message-images')
        .upload(filePath, file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(filePath)

      const { data: message, error: messageError } = await sendMessage(
        currentUser.id,
        selectedUser.id,
        'Image',
        'image',
        publicUrl
      )

      if (messageError) throw messageError
      if (message) {
        playMessageSound()
        onMessageSent(message)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setPendingImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const onEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji
    
    // Add emoji to selected emojis array
    setSelectedEmojis(prev => [...prev, emoji])
    
    // Don't close picker to allow multiple selections
    // setShowEmojiPicker(false)
  }

  const removeEmoji = (index) => {
    setSelectedEmojis(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllEmojis = () => {
    setSelectedEmojis([])
  }

  return (
    <div className={`border-t bg-white dark:bg-gray-800 dark:border-gray-700 ${isMobile ? 'fixed bottom-0 left-0 right-0 z-40' : ''}`}>
      {/* Upload Progress */}
      {uploading && pendingImage && (
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
              <img 
                src={pendingImage} 
                alt="Uploading..." 
                className="w-full h-full object-cover filter blur-sm"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-xs font-medium">{Math.round(uploadProgress)}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Uploading image...
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Emojis Display */}
      {selectedEmojis.length > 0 && (
        <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Emojis ({selectedEmojis.length})
            </span>
            <button
              onClick={clearAllEmojis}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedEmojis.map((emoji, index) => (
              <div
                key={index}
                className="relative bg-white dark:bg-gray-600 rounded-lg p-2 shadow-sm"
              >
                <span className="text-lg">{emoji}</span>
                <button
                  onClick={() => removeEmoji(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${isMobile ? 'p-2' : 'p-3 md:p-4'} flex gap-2 relative`}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending || disabled}
          className={`${isMobile ? 'p-1.5' : 'p-2'} text-gray-500 hover:text-green-500 transition-colors flex-shrink-0 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Send Image"
        >
          <IoImage size={isMobile ? 20 : 24} />
        </button>

        <button
          type="button"
          ref={emojiButtonRef}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled || uploading}
          className={`${isMobile ? 'p-1.5' : 'p-2'} text-gray-500 hover:text-green-500 transition-colors flex-shrink-0 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''} ${selectedEmojis.length > 0 ? 'text-green-500' : ''}`}
          title="Add Emoji"
        >
          <BsEmojiSmile size={isMobile ? 20 : 24} />
          {selectedEmojis.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedEmojis.length}
            </span>
          )}
        </button>

        {showEmojiPicker && (
          <div className={`absolute ${isMobile ? 'bottom-full left-0 right-0' : 'bottom-full left-0'} mb-2 z-50`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
              <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm font-medium dark:text-gray-200">
                  Select Multiple Emojis
                </span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
                theme="light"
                width={isMobile ? window.innerWidth - 20 : 300}
                height={400}
              />
            </div>
          </div>
        )}

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            disabled ? 'Messaging unavailable' : 
            uploading ? 'Uploading image...' : 
            selectedEmojis.length > 0 ? 'Add text or send emojis...' :
            'Type a message...'
          }
          disabled={sending || uploading || disabled}
          className={`flex-1 rounded-full border border-gray-300 dark:border-gray-600 ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base md:text-lg'} focus:outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-300 ${disabled || uploading ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
        />
        
        <button
          type="submit"
          disabled={sending || uploading || (!newMessage.trim() && selectedEmojis.length === 0) || disabled}
          className={`${isMobile ? 'p-1.5' : 'p-2'} ${
            sending || uploading || (!newMessage.trim() && selectedEmojis.length === 0) || disabled ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
          } text-white rounded-full p-2 transition-colors flex-shrink-0 ${disabled || uploading ? 'cursor-not-allowed' : ''}`}
        >
          <IoSend size={isMobile ? 16 : 20} />
        </button>
      </form>
    </div>
  )
}