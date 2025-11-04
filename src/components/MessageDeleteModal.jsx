import React from 'react'

export default function MessageDeleteModal({ message, onDelete, onClose }) {
  const [loading, setLoading] = React.useState({
    me: false,
    everyone: false
  })

  const handleDeleteForMe = async () => {
    setLoading({ ...loading, me: true })
    try {
      await onDelete(message.id, 'me')
      onClose()
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message. Please try again.')
    } finally {
      setLoading({ ...loading, me: false })
    }
  }

  const handleDeleteForEveryone = async () => {
    setLoading({ ...loading, everyone: true })
    try {
      await onDelete(message.id, 'everyone')
      onClose()
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message for everyone. Please try again.')
    } finally {
      setLoading({ ...loading, everyone: false })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Delete Message</h3>
        <div className="space-y-3">
          <button
            onClick={handleDeleteForMe}
            disabled={loading.me || loading.everyone}
            className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between"
          >
            <span>Delete for me</span>
            {loading.me && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
            )}
          </button>
          <button
            onClick={handleDeleteForEveryone}
            disabled={loading.me || loading.everyone}
            className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between"
          >
            <span>Delete for everyone</span>
            {loading.everyone && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
            )}
          </button>
        </div>
        <button
          onClick={onClose}
          disabled={loading.me || loading.everyone}
          className="mt-4 w-full p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}