import React, { useState, useEffect } from 'react'
import { BsCamera, BsX, BsEnvelope } from 'react-icons/bs'
import { supabase } from '../lib/supabase'
import { updateProfile } from '../utils/profileUtils'
import Avatar from './Avatar'

export default function ProfileEditModal({ user, onClose, onUpdate }) {
  const [name, setName] = useState(user.name || '')
  const [about, setAbout] = useState(user.about || '')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' or 'about'

  useEffect(() => {
    setName(user.name || '')
    setAbout(user.about || '')
    setAvatarPreview(user.avatar_url)
  }, [user])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let avatarUrl = user.avatar_url

      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      const updates = {}
      if (name !== user.name) updates.name = name
      if (about !== user.about) updates.about = about
      if (avatarUrl !== user.avatar_url) updates.avatar_url = avatarUrl
      
      if (Object.keys(updates).length > 0) {
        updates.id = user.id
        
        const { error: updateError } = await updateProfile(updates)
        if (updateError) throw updateError
      }

      onUpdate?.({ ...user, ...updates })
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <BsX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'profile'
                ? 'text-green-500 border-b-2 border-green-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'about'
                ? 'text-green-500 border-b-2 border-green-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'profile' ? (
            <>
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <Avatar 
                    url={avatarPreview}
                    name={name || user.email}
                    size="lg"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <BsCamera className="text-white text-2xl" />
                  </label>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Change Profile Photo</span>
              </div>

              {/* Email Display */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BsEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>

              {/* Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-300 transition-all"
                  placeholder="Your name"
                />
              </div>
            </>
          ) : (
            /* About Section */
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                About
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-300 transition-all resize-none"
                placeholder="Hey there! I am using WhatsApp Clone"
                rows={5}
                maxLength={500}
              />
              <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400 mt-1">
                {500 - (about?.length || 0)} characters remaining
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}