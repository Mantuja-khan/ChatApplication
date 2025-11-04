import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getUsers, subscribeToUserChanges } from '../utils/userUtils'
import { handleLogout } from '../utils/authUtils'
import { getLatestMessages, subscribeToNewMessages, getUnreadMessageCount } from '../utils/messageUtils'
import { subscribeFriendRequests, getPendingFriendRequests } from '../utils/friendUtils'
import UserListItem from './UserListItem'
import ProfileSection from './ProfileSection'
import ErrorMessage from './ErrorMessage'
import SearchBar from './SearchBar'
import MenuButton from './MenuButton'
import FriendRequestList from './FriendRequestList'
import BottomNavbar from './BottomNavbar'
import MembersList from './MembersList'
import MyContactsList from './MyContactsList'
import BlockedUsersList from './BlockedUsersList'
import { BsArrowLeft, BsPeople } from 'react-icons/bs'

export default function ChatList({ currentUser, onSelectUser, activeView, onViewChange }) {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [latestMessages, setLatestMessages] = useState({})
  const [unreadCounts, setUnreadCounts] = useState({})
  const [friendRequests, setFriendRequests] = useState([])
  const [friendIds, setFriendIds] = useState([])
  const [blockedUsers, setBlockedUsers] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchFriendRequests()
    fetchBlockedUsers()

    const messagesSubscription = subscribeToNewMessages(currentUser.id, handleNewMessage)
    const userChangesSubscription = subscribeToUserChanges(handleUserChange)
    const friendRequestsSubscription = subscribeFriendRequests(currentUser.id, handleFriendRequestChange)

    return () => {
      if (messagesSubscription) messagesSubscription.unsubscribe()
      if (userChangesSubscription) userChangesSubscription.unsubscribe()
      if (friendRequestsSubscription) friendRequestsSubscription.unsubscribe()
    }
  }, [currentUser.id])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: users, error } = await getUsers(currentUser.id)
      if (error) throw error
      setUsers(users)
      setFilteredUsers(users)

      // Fetch latest messages and unread counts
      const { data: messages } = await getLatestMessages(currentUser.id)
      const latestMsgs = {}
      messages.forEach(msg => {
        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id
        latestMsgs[otherId] = msg
      })
      setLatestMessages(latestMsgs)

      // Get unread counts
      const unreadCountsObj = {}
      for (const user of users) {
        const { count } = await getUnreadMessageCount(currentUser.id, user.id)
        if (count > 0) {
          unreadCountsObj[user.id] = count
        }
      }
      setUnreadCounts(unreadCountsObj)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchFriendRequests = async () => {
    const { data } = await getPendingFriendRequests(currentUser.id)
    setFriendRequests(data || [])
  }

  const fetchBlockedUsers = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('blocked_users')
      .eq('id', currentUser.id)
      .single()

    if (profile?.blocked_users?.length) {
      const { data: blockedProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profile.blocked_users)

      setBlockedUsers(blockedProfiles || [])
    } else {
      setBlockedUsers([])
    }
  }

  const handleNewMessage = (message) => {
    setLatestMessages(prev => ({
      ...prev,
      [message.sender_id === currentUser.id ? message.receiver_id : message.sender_id]: message
    }))

    if (message.sender_id !== currentUser.id && !message.is_seen) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.sender_id]: (prev[message.sender_id] || 0) + 1
      }))
    }
  }

  const handleUserChange = (payload) => {
    if (payload.eventType === 'UPDATE') {
      setUsers(prev => prev.map(user => 
        user.id === payload.new.id ? { ...user, ...payload.new } : user
      ))
      setFilteredUsers(prev => prev.map(user => 
        user.id === payload.new.id ? { ...user, ...payload.new } : user
      ))
    }
  }

  const handleFriendRequestChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      setFriendRequests(prev => [...prev, payload.new])
    } else if (payload.eventType === 'UPDATE') {
      setFriendRequests(prev => prev.filter(req => req.id !== payload.new.id))
    }
  }

  const handleFriendRequestHandled = (requestId, status) => {
    setFriendRequests(prev => prev.filter(req => req.id !== requestId))
    if (status === 'accepted') {
      fetchUsers()
    }
  }

  const handleUserRemoved = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId))
    setFilteredUsers(prev => prev.filter(user => user.id !== userId))
  }

  const handleUserUnblocked = (userId) => {
    setBlockedUsers(prev => prev.filter(user => user.id !== userId))
    fetchUsers()
  }

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const renderContent = () => {
    switch (activeView) {
      case 'blocked':
        return (
          <BlockedUsersList
            blockedUsers={blockedUsers}
            currentUserId={currentUser.id}
            onBack={() => onViewChange('chats')}
            onUserUnblocked={handleUserUnblocked}
          />
        )

      case 'requests':
        return (
          <div className="flex-1 flex flex-col">
            <div className="h-[72px] flex items-center px-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <button
                onClick={() => onViewChange('chats')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-2"
              >
                <BsArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h2 className="text-xl font-semibold dark:text-gray-200">Friend Requests</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FriendRequestList 
                requests={friendRequests} 
                onRequestHandled={handleFriendRequestHandled} 
              />
            </div>
          </div>
        )

      case 'contacts':
        return (
          <MyContactsList 
            currentUserId={currentUser.id} 
            onBack={() => onViewChange('chats')}
            onSelectUser={(user) => {
              onSelectUser(user)
              onViewChange('chats')
            }}
          />
        )

      case 'members':
        return (
          <MembersList 
            currentUserId={currentUser.id} 
            onBack={() => onViewChange('chats')}
          />
        )

      default:
        return (
          <>
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800">
              <div className="h-[72px] flex items-center justify-between px-4 border-b dark:border-gray-700">
                <ProfileSection 
                  currentUser={currentUser} 
                  compact={true} 
                  isEditing={showProfileEdit}
                  onCloseEdit={() => setShowProfileEdit(false)}
                />
                <div className="flex-1 px-4">
                  <SearchBar 
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search or start new chat"
                  />
                </div>
                <MenuButton 
                  onEditProfile={() => setShowProfileEdit(true)}
                  onToggleFriendRequests={() => onViewChange('requests')}
                  onToggleMyContacts={() => onViewChange('contacts')}
                  onToggleMembers={() => onViewChange('members')}
                  onToggleBlockedUsers={() => onViewChange('blocked')}
                  friendRequestCount={friendRequests.length}
                />
              </div>
            </div>

            {error && <ErrorMessage message={error} onRetry={() => fetchUsers()} />}

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 dark:text-gray-400">
                  <BsPeople className="w-16 h-16 mb-4" />
                  <p className="text-xl font-semibold mb-2">No chats found</p>
                  <p className="text-sm">
                    Start a new conversation or check your friend requests
                  </p>
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <UserListItem
                      key={user.id}
                      user={user}
                      onSelect={() => {
                        onSelectUser(user)
                        setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }))
                      }}
                      currentUserId={currentUser.id}
                      lastMessage={latestMessages[user.id]}
                      onRemoved={() => handleUserRemoved(user.id)}
                      unreadCount={unreadCounts[user.id] || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 w-full md:w-1/3 border-r dark:border-gray-700 flex flex-col h-full">
      {renderContent()}
      
      {isMobile && (
        <div className="sticky bottom-0 z-10">
          <BottomNavbar 
            onToggleChats={() => onViewChange('chats')}
            onToggleMyContacts={() => onViewChange('contacts')}
            onToggleMembers={() => onViewChange('members')}
            onToggleFriendRequests={() => onViewChange('requests')}
            friendRequestCount={friendRequests.length}
            activeTab={activeView}
          />
        </div>
      )}
    </div>
  )
}