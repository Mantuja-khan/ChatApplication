import React, { useState, useEffect } from 'react'
import { sendFriendRequest, getFriendshipStatus } from '../utils/friendUtils'

export default function FriendRequestButton({ currentUserId, otherUserId, onRequestSent }) {
  const [status, setStatus] = useState('none') // none, pending, accepted, rejected
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkFriendshipStatus()
  }, [currentUserId, otherUserId])

  const checkFriendshipStatus = async () => {
    const { data } = await getFriendshipStatus(currentUserId, otherUserId)
    if (data) {
      setStatus(data.status)
    } else {
      setStatus('none')
    }
  }

  const handleSendRequest = async () => {
    setLoading(true)
    setError(null)
    const { error } = await sendFriendRequest(currentUserId, otherUserId)
    if (error) {
      setError(error.message)
    } else {
      setStatus('pending')
      onRequestSent?.()
    }
    setLoading(false)
  }

  if (status === 'accepted') {
    return (
      <button
        className="px-4 py-2 bg-green-100 text-green-600 rounded-lg"
      >
        Friends
      </button>
    )
  }

  if (status === 'pending') {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg"
      >
        Request Pending
      </button>
    )
  }

  if (status === 'rejected') {
    return (
      <button
        onClick={handleSendRequest}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
      >
        {loading ? 'Sending Request...' : 'Send Friend Request Again'}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        onClick={handleSendRequest}
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Sending Request...' : 'Send Friend Request'}
      </button>
    </div>
  )
}