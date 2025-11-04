import React, { useState } from 'react'
import { deleteChat } from '../utils/messageUtils'

export default function DeleteChatModal({ user, currentUserId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const displayName = user.name || user.email.split('@')[0]

  const handleDeleteAllChats = async () => {
    setLoading(true)
    try {
      const { error } = await deleteChat(currentUserId, user.id)
      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error('Error deleting chats:', error)
      alert('Failed to delete chats. Please try again.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-xl font-semibold mb-4">Delete All Chats</h3>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete all chat history with {displayName}? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAllChats}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}