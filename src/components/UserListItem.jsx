import React from 'react'
import { formatLastSeen } from '../utils/userUtils'
import { formatMessagePreview } from '../utils/messageUtils'
import Avatar from './Avatar'
import { BsCheck, BsCheckAll } from 'react-icons/bs'

export default function UserListItem({ user, onSelect, currentUserId, lastMessage, onRemoved, unreadCount }) {
  const displayName = user?.active ? (user?.name || user?.email?.split('@')[0]) : 'V-Chat User'
  const lastSeen = formatLastSeen(user?.last_seen)
  const isOnline = user?.active && new Date(user?.last_seen) > new Date(Date.now() - 5 * 60 * 1000)

  const messagePreview = lastMessage ? formatMessagePreview(lastMessage) : ''
  const messageTime = lastMessage ? formatLastSeen(lastMessage.created_at) : ''
  const isMessageSeen = lastMessage?.is_seen
  const isOwnMessage = lastMessage?.sender_id === currentUserId

  if (!user) return null

  return (
    <div
      onClick={onSelect}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
        !user.active ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="relative flex-shrink-0">
          <Avatar 
            url={user.active ? user.avatar_url : null}
            name={displayName}
            size="lg"
            showOnlineStatus={user.active}
            isOnline={isOnline}
          />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg">
              {unreadCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </h3>
            {messageTime && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {messageTime}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-sm truncate ${
              isOwnMessage 
                ? 'text-gray-500 dark:text-gray-400' 
                : (!isMessageSeen ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400')
            }`}>
              {messagePreview || (isOnline ? 'Online' : `Last seen ${lastSeen}`)}
            </p>
            {isOwnMessage && lastMessage && (
              <span className={isMessageSeen ? "text-sky-500 drop-shadow-sm" : "text-gray-500 dark:text-gray-400"}>
                {isMessageSeen ? <BsCheckAll size={16} /> : <BsCheck size={16} />}
              </span>
            )}
          </div>
          {!user.active && (
            <span className="text-xs text-red-500 dark:text-red-400">
              Account deleted
            </span>
          )}
        </div>
      </div>
    </div>
  )
}