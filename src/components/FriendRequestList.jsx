import React, { useState } from 'react';
import { UserPlus, Check, X, Clock, Bell } from 'lucide-react';
import Avatar from './Avatar';
import { acceptFriendRequest, rejectFriendRequest } from '../utils/friendUtils';

export default function FriendRequestList({ requests = [], onRequestHandled }) {
  const [processingIds, setProcessingIds] = useState(new Set());
  
  const handleAccept = async (requestId) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    
    // Store current user info for notification
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    const { error } = await acceptFriendRequest(requestId);
    if (!error) {
      onRequestHandled?.(requestId, 'accepted');
    }
    setProcessingIds(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(requestId);
      return newSet;
    });
  };

  const handleReject = async (requestId) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    const { error } = await rejectFriendRequest(requestId);
    if (!error) {
      onRequestHandled?.(requestId, 'rejected');
    }
    setProcessingIds(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(requestId);
      return newSet;
    });
  };

  if (!requests?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
        <div className="bg-white p-4 rounded-full shadow-md mb-5 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <p className="text-lg font-bold text-gray-800 text-center">No Pending Requests</p>
        <p className="text-sm mt-2 text-gray-500 text-center max-w-sm">When someone adds you as a friend, their request will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 transition-all duration-300">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-base font-bold text-gray-800 flex items-center">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-2 shadow-sm">
            <Bell className="w-4 h-4 text-white" />
          </div>
          Friend Requests
          <span className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full shadow-sm">
            {requests.length}
          </span>
        </h3>
      </div>
      
      <div className="grid gap-4">
        {requests.map((request) => {
          const isProcessing = processingIds.has(request.id);
          const timeAgo = getTimeAgo(request.created_at || new Date());
          
          return (
            <div 
              key={request.id} 
              className="group relative overflow-hidden flex flex-col sm:flex-row items-center sm:justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              {/* Instagram-like gradient border */}
              <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-75 -m-0.5" style={{ zIndex: -1 }} />
              
              <div className="flex items-center space-x-4 mb-4 sm:mb-0 w-full sm:w-auto">
                <div className="relative flex-shrink-0">
                  <div className="rounded-full p-0.5 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                    <Avatar 
                      url={request.profiles?.avatar_url}
                      name={request.profiles?.name || request.profiles?.email || 'User'}
                      size="md"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:text-left">
                  <div className="text-sm md:text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {request.profiles?.name || (request.profiles?.email?.split('@')[0])}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center mt-0.5">
                    <Clock className="w-3 h-3 mr-1 text-gray-400" />
                    {timeAgo}
                  </div>
                  <div className="text-xs md:text-sm text-purple-600 font-medium mt-1">
                    Wants to connect with you
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 w-full sm:w-auto mt-3 sm:mt-0">
                <button
                  onClick={() => handleAccept(request.id)}
                  disabled={isProcessing}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 focus:ring-2 focus:ring-pink-200 transition-all duration-300 shadow-sm ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Accept
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-5 py-2 border border-gray-200 bg-white text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-100 transition-all duration-300 ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Add a style block for custom animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .pulse-animation {
          animation: pulse 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Helper function to format time
function getTimeAgo(date) {
  if (!date) return 'Recently';
  
  const now = new Date();
  const pastDate = new Date(date);
  const seconds = Math.floor((now - pastDate) / 1000);
  
  if (isNaN(seconds)) return 'Recently';
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}