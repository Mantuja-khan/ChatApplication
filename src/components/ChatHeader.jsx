import React, { useState } from 'react'
import { formatLastSeen } from '../utils/userUtils'
import Avatar from './Avatar'
import UserProfileModal from './UserProfileModal'
import { BsThreeDotsVertical } from 'react-icons/bs'
import ChatOptionsMenu from './ChatOptionsMenu'

export default function ChatHeader({ user, currentUserId, showOnlineStatus = true }) {
  const [showProfile, setShowProfile] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const displayName = user.name || user.email.split('@')[0]
  const lastSeen = formatLastSeen(user.last_seen)
  const isOnline = showOnlineStatus && new Date(user.last_seen) > new Date(Date.now() - 5 * 60 * 1000)

  return (
    <>
      <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between">
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg"
          onClick={() => setShowProfile(true)}
        >
          <Avatar 
            url={user.avatar_url}
            name={displayName}
            showOnlineStatus={showOnlineStatus}
            isOnline={isOnline}
          />
          <div className="ml-3 md:ml-4">
            <div className="font-semibold text-base md:text-lg dark:text-gray-200">{displayName}</div>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {showOnlineStatus ? (isOnline ? 'Online' : `Last seen ${lastSeen}`) : 'Offline'}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowOptions(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <BsThreeDotsVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {showProfile && (
        <UserProfileModal
          user={user}
          currentUserId={currentUserId}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showOptions && (
        <ChatOptionsMenu
          user={user}
          currentUserId={currentUserId}
          onClose={() => setShowOptions(false)}
          onBlockStatusChange={setShowOptions}
        />
      )}
    </>
  )
}