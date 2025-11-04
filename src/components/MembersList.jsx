import React, { useState, useEffect } from 'react';
import { BsArrowLeft, BsSearch } from 'react-icons/bs';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import { formatLastSeen } from '../utils/userUtils';
import FriendRequestButton from './FriendRequestButton';
import { getFriendshipStatus } from '../utils/friendUtils';

export default function MembersList({ currentUserId, onBack }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [friendships, setFriendships] = useState({});

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      setFilteredMembers(
        members.filter(member => 
          member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, members]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .eq('active', true)
        .order('last_seen', { ascending: false });
      
      if (error) throw error;
      
      // Fetch friendship status for all members
      const friendshipData = {};
      for (const member of data || []) {
        const { data: status } = await getFriendshipStatus(currentUserId, member.id);
        friendshipData[member.id] = status;
      }
      
      setFriendships(friendshipData);
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSent = () => {
    // Refresh the members list to update UI
    fetchMembers();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center">
        <button
          onClick={onBack}
          className="mr-4"
        >
          <BsArrowLeft className="h-6 w-6 text-black dark:text-white" />
        </button>
        <h2 className="text-base font-semibold text-black dark:text-white">Discover People</h2>
      </div>

      <div className="px-4 py-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <BsSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm rounded-lg focus:outline-none dark:text-white"
            placeholder="Search"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
              <BsSearch className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No people found</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredMembers.map(member => {
            const displayName = member.name || member.email.split('@')[0];
            const lastSeen = formatLastSeen(member.last_seen);
            const isOnline = new Date(member.last_seen) > new Date(Date.now() - 5 * 60 * 1000);
            const isFriend = friendships[member.id]?.status === 'accepted';
            
            return (
              <div key={member.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <Avatar 
                      url={member.avatar_url}
                      name={displayName}
                      showOnlineStatus={true}
                      isOnline={isOnline}
                      size="md"
                      className="rounded-full"
                    />
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="font-semibold text-sm text-black dark:text-white truncate">{displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        {isOnline && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        )}
                        {isOnline ? 'Active now' : `Active ${lastSeen}`}
                      </div>
                      {member.about && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.about}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-2">
                    {isFriend ? (
                      <button
                        className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"
                      >
                        Friends
                      </button>
                    ) : (
                      <FriendRequestButton
                        currentUserId={currentUserId}
                        otherUserId={member.id}
                        onRequestSent={handleRequestSent}
                        className="px-2 py-1 text-xs font-semibold text-blue-500 bg-transparent border border-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}