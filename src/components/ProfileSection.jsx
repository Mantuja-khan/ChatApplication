import React, { useState, useEffect } from 'react'
import Avatar from './Avatar'
import ProfileEditModal from './ProfileEditModal'
import UserProfileModal from './UserProfileModal'
import { supabase } from '../lib/supabase'

export default function ProfileSection({ currentUser, compact = false, isEditing = false, onCloseEdit }) {
  const [user, setUser] = useState(currentUser)
  const [showProfile, setShowProfile] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    setUser(currentUser)

    const channel = supabase
      .channel(`profile-${currentUser.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`
        },
        (payload) => {
          setUser(payload.new)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [currentUser])

  const displayName = user?.name || user?.email?.split('@')[0]

  if (compact) {
    return (
      <>
        <div className="flex items-center">
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative group"
            onClick={() => setShowProfile(true)}
          >
            <Avatar 
              url={user?.avatar_url}
              name={displayName}
              size="md"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-all duration-200" />
          </button>
        </div>
        
        {showProfile && (
          <UserProfileModal
            user={user}
            currentUserId={user.id}
            onClose={() => setShowProfile(false)}
            isOwnProfile={true}
            onEditClick={() => {
              setShowProfile(false)
              setShowEditModal(true)
            }}
          />
        )}

        {(isEditing || showEditModal) && (
          <ProfileEditModal
            user={user}
            onClose={() => {
              setShowEditModal(false)
              onCloseEdit?.()
            }}
            onUpdate={(updatedUser) => {
              setUser(updatedUser)
              setShowEditModal(false)
              onCloseEdit?.()
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar 
            url={user?.avatar_url}
            name={displayName}
            size="lg"
          />
          <div>
            <div className="font-semibold dark:text-gray-200">{displayName}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {showEditModal && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={setUser}
        />
      )}
    </div>
  )
}