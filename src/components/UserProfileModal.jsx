import React, { useState } from 'react'
import { BsX, BsPencil } from 'react-icons/bs'
import Avatar from './Avatar'
import { formatLastSeen } from '../utils/userUtils'
import { deleteChat } from '../utils/messageUtils'
import RemoveContactModal from './RemoveContactModal'

export default function UserProfileModal({ user, onClose, currentUserId, isOwnProfile = false }) {
  const displayName = user.name || user.email.split('@')[0]
  const lastSeen = formatLastSeen(user.last_seen)
  const isOnline = new Date(user.last_seen) > new Date(Date.now() - 5 * 60 * 1000)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const handleDeleteChat = async () => {
    const { error } = await deleteChat(currentUserId, user.id)
    if (error) {
      alert('Failed to delete chat. Please try again.')
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isOwnProfile ? 'Your Profile' : 'Contact Info'}
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <BsX size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Info */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar 
                url={user.avatar_url}
                name={displayName}
                size="lg"
                showOnlineStatus={true}
                isOnline={isOnline}
              />
              {isOwnProfile && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 text-white">
                  <BsPencil size={16} />
                </div>
              )}
            </div>
            <h3 className="text-xl font-semibold mt-4">{displayName}</h3>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              {isOnline ? 'Online' : `Last seen ${lastSeen}`}
            </p>
          </div>

          {/* About Section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
              About
              {isOwnProfile && (
                <button className="text-green-500 hover:text-green-600 text-sm">
                  <BsPencil size={14} />
                </button>
              )}
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">
                {user.about || 'No about information'}
              </p>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <div className="space-y-3">
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left"
              >
                Remove from chat list
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-left"
              >
                Delete Chat History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Delete Chat History</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the chat history with {displayName}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteChat()
                  setShowDeleteConfirm(false)
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Contact Modal */}
      {showRemoveConfirm && (
        <RemoveContactModal
          user={user}
          onClose={() => setShowRemoveConfirm(false)}
          onRemoved={onClose}
        />
      )}
    </div>
  )
}