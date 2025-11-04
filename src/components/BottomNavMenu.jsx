import React, { useState, useRef, useEffect } from 'react'
import { BsThreeDotsVertical, BsChatDots, BsPeople, BsPersonPlus, BsPersonLinesFill } from 'react-icons/bs'

export default function BottomNavMenu({ onToggleChats, onToggleMyContacts, onToggleMembers, onToggleFriendRequests, friendRequestCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleMenuClick = (callback) => {
    callback()
    setIsOpen(false)
  }

  return (
    <div className="fixed left-4 bottom-4 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-lg relative"
      >
        <BsThreeDotsVertical className="h-6 w-6" />
        {friendRequestCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {friendRequestCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 bg-white rounded-lg shadow-xl w-48 overflow-hidden">
          <button
            onClick={() => handleMenuClick(onToggleChats)}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <BsChatDots className="h-5 w-5 mr-2" />
            Chats
          </button>

          <button
            onClick={() => handleMenuClick(onToggleMyContacts)}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <BsPersonLinesFill className="h-5 w-5 mr-2" />
            My Contacts
          </button>

          <button
            onClick={() => handleMenuClick(onToggleMembers)}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <BsPeople className="h-5 w-5 mr-2" />
            Members
          </button>

          <button
            onClick={() => handleMenuClick(onToggleFriendRequests)}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center">
              <BsPersonPlus className="h-5 w-5 mr-2" />
              Friend Requests
            </div>
            {friendRequestCount > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                {friendRequestCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}