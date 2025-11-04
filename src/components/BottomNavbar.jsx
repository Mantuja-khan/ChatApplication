import React from 'react';
import { BsPersonLinesFill, BsPeople, BsPersonPlus, BsChatDots } from 'react-icons/bs';

export default function BottomNavbar({ 
  onToggleMyContacts, 
  onToggleMembers, 
  onToggleFriendRequests, 
  onToggleChats,
  friendRequestCount = 0,
  activeTab = 'chats'
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center z-40 h-12">
      <button
        onClick={onToggleChats}
        className={`flex flex-col items-center justify-center p-1 ${activeTab === 'chats' ? 'text-green-500' : 'text-gray-600'}`}
      >
        <BsChatDots className="h-5 w-5" />
        <span className="text-xs">Chats</span>
      </button>
      
      <button
        onClick={onToggleMyContacts}
        className={`flex flex-col items-center justify-center p-1 ${activeTab === 'contacts' ? 'text-green-500' : 'text-gray-600'}`}
      >
        <BsPersonLinesFill className="h-5 w-5" />
        <span className="text-xs">Contacts</span>
      </button>
      
      <button
        onClick={onToggleMembers}
        className={`flex flex-col items-center justify-center p-1 ${activeTab === 'members' ? 'text-green-500' : 'text-gray-600'}`}
      >
        <BsPeople className="h-5 w-5" />
        <span className="text-xs">Members</span>
      </button>
      
      <button
        onClick={onToggleFriendRequests}
        className={`flex flex-col items-center justify-center p-1 relative ${activeTab === 'requests' ? 'text-green-500' : 'text-gray-600'}`}
      >
        <BsPersonPlus className="h-5 w-5" />
        {friendRequestCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {friendRequestCount}
          </span>
        )}
        <span className="text-xs">Requests</span>
      </button>
    </div>
  );
}