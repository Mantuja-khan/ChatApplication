import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import ProfileModal from './ProfileModal'

export default function ProfileButton({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 w-full"
      >
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold">{user.name || 'My Profile'}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </button>
      
      {isModalOpen && (
        <ProfileModal user={user} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}