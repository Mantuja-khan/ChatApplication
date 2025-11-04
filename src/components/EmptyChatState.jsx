import React from 'react'
import { BsChatDots } from 'react-icons/bs'

export default function EmptyChatState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] p-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <BsChatDots className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Start a Conversation</h3>
        <p className="text-gray-500 max-w-md">
          Select a contact from the left to start chatting. Your messages will appear here.
        </p>
      </div>
    </div>
  )
}