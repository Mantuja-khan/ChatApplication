import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { initSocket, disconnectSocket } from './lib/socket'
import { initializeNotifications } from './utils/notificationUtils'
import Auth from './components/Auth'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import { updateUserStatus } from './utils/userUtils'
import { getUserProfile } from './utils/profileUtils'
import { useTheme } from './hooks/useTheme'
import BottomNavMenu from './components/BottomNavMenu'

export default function App() {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const { darkMode } = useTheme()
  const [activeView, setActiveView] = useState('chats')
  const [themeKey, setThemeKey] = useState(0) // Force re-render on theme change

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Listen for theme changes and force re-render
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeKey(prev => prev + 1)
    }
    
    window.addEventListener('themeChanged', handleThemeChange)
    return () => window.removeEventListener('themeChanged', handleThemeChange)
  }, [])
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        // Store current user for notifications
        localStorage.setItem('currentUser', JSON.stringify(session.user))
        fetchUserProfile(session.user.id)
        initSocket(session.user.id)
        initializeNotifications()
      }
    })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        localStorage.setItem('currentUser', JSON.stringify(session.user))
        fetchUserProfile(session.user.id)
        initSocket(session.user.id)
        initializeNotifications()
      } else {
        setUserProfile(null)
        localStorage.removeItem('currentUser')
        disconnectSocket()
      }
    })

    if (session?.user) {
      updateUserStatus()
      const interval = setInterval(updateUserStatus, 60000)
      return () => {
        clearInterval(interval)
        disconnectSocket()
      }
    }
  }, [session?.user?.id])

  // Handle URL parameters for direct chat opening
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const chatUserId = urlParams.get('chat')
    const shouldReply = urlParams.get('reply')
    
    if (chatUserId && userProfile) {
      // Find user and open chat
      // This would need to be implemented based on your user fetching logic
      console.log('Opening chat with user:', chatUserId, 'Reply mode:', shouldReply)
    }
  }, [userProfile])

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'OPEN_CHAT') {
          const userId = event.data.userId
          const focusInput = event.data.focusInput
          
          // Handle opening chat from notification
          console.log('Opening chat from notification:', userId, 'Focus input:', focusInput)
          // Implement chat opening logic here
        }
      })
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    const { data } = await getUserProfile(userId)
    if (data) {
      setUserProfile(data)
    }
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div key={themeKey} className={`flex h-screen ${darkMode ? 'dark' : ''} theme-transition`}>
      {(!isMobile || !selectedUser) && (
        <ChatList 
          currentUser={userProfile || session.user} 
          onSelectUser={(user) => {
            setSelectedUser(user)
          }}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      )}
      {(!isMobile || selectedUser) && (
        <ChatWindow 
          currentUser={userProfile || session.user} 
          selectedUser={selectedUser}
          onBack={() => setSelectedUser(null)}
          isMobile={isMobile}
        />
      )}
      {!isMobile && (
        <BottomNavMenu
          onToggleChats={() => setActiveView('chats')}
          onToggleMyContacts={() => setActiveView('contacts')}
          onToggleMembers={() => setActiveView('members')}
          onToggleFriendRequests={() => setActiveView('requests')}
          friendRequestCount={0} // You'll need to pass the actual count here
        />
      )}
    </div>
  )
}