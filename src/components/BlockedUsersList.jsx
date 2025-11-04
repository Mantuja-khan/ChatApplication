import React from 'react';
import { BsArrowLeft, BsShieldSlash } from 'react-icons/bs';
import Avatar from './Avatar';
import { blockUser } from '../utils/userUtils';

export default function BlockedUsersList({ blockedUsers, currentUserId, onBack, onUserUnblocked }) {
  const handleUnblock = async (user) => {
    if (window.confirm(`Are you sure you want to unblock ${user.name || user.email}?`)) {
      const { error } = await blockUser(currentUserId, user.id, false);
      if (!error) {
        onUserUnblocked(user.id);
      }
    }
  };

  if (!blockedUsers?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 flex flex-col h-full">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-2"
          >
            <BsArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-semibold dark:text-gray-200">Blocked Users</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <BsShieldSlash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No blocked users</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex items-center">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-2"
        >
          <BsArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-semibold dark:text-gray-200">Blocked Users</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {blockedUsers.map(user => (
          <div key={user.id} className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar 
                  url={user.avatar_url}
                  name={user.name || user.email}
                  size="lg"
                />
                <div className="ml-3">
                  <div className="font-semibold dark:text-gray-200">
                    {user.name || user.email.split('@')[0]}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleUnblock(user)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Unblock
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}