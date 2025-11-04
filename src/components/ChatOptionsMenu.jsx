import React, { useState, useRef, useEffect } from 'react'
import { BsTrash, BsMoon, BsSun, BsShieldSlash } from 'react-icons/bs'
import { deleteChat } from '../utils/messageUtils'
import { blockUser, isUserBlocked } from '../utils/userUtils'
import { useTheme } from '../hooks/useTheme'
import DeleteChatModal from './DeleteChatModal'

export default function ChatOptionsMenu({ user, currentUserId, onClose }) {
  const menuRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    // Check if user is blocked
    const checkBlockStatus = async () => {
      const blocked = await isUserBlocked(currentUserId, user.id)
      setIsBlocked(blocked)
    }
    
    checkBlockStatus()
    
    // Handle clicks outside the menu
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBlockUser = async () => {
    if (window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) {
      setLoading(true)
      try {
        await blockUser(currentUserId, user.id, !isBlocked)
        setIsBlocked(!isBlocked)
        onClose()
      } catch (error) {
        console.error('Error blocking user:', error)
        alert(`Failed to ${isBlocked ? 'unblock' : 'block'} user. Please try again.`)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <div 
        ref={menuRef}
        className="absolute right-2 top-16 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-48 overflow-hidden"
      >
        <div className="py-1">
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            <BsTrash className="mr-2" />
            Delete all chats
          </button>
          
          <button
            onClick={toggleDarkMode}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            {darkMode ? (
              <>
                <BsSun className="mr-2" />
                Light mode
              </>
            ) : (
              <>
                <BsMoon className="mr-2" />
                Dark mode
              </>
            )}
          </button>
          
          <button
            onClick={handleBlockUser}
            disabled={loading}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            <BsShieldSlash className="mr-2" />
            {isBlocked ? 'Unblock user' : 'Block user'}
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteChatModal
          user={user}
          currentUserId={currentUserId}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            setShowDeleteModal(false)
            onClose()
          }}
        />
      )}
    </>
  )
}