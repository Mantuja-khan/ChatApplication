import React, { useState, useEffect } from 'react';
import { BsArrowLeft, BsSearch } from 'react-icons/bs';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import { formatLastSeen } from '../utils/userUtils';

export default function MyContactsList({ currentUserId, onBack, onSelectUser }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (contacts.length > 0) {
      setFilteredContacts(
        contacts.filter(contact => 
          contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      // Get accepted friend requests where current user is involved
      const { data: friendRequests, error: friendError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
      
      if (friendError) throw friendError;
      
      if (!friendRequests || friendRequests.length === 0) {
        setContacts([]);
        setFilteredContacts([]);
        setLoading(false);
        return;
      }
      
      // Extract friend IDs
      const friendIds = friendRequests.map(request => 
        request.sender_id === currentUserId ? request.receiver_id : request.sender_id
      );
      
      // Get profiles for these friends
      const { data: contactProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds)
        .eq('active', true)
        .order('last_seen', { ascending: false });
      
      if (profileError) throw profileError;
      
      setContacts(contactProfiles || []);
      setFilteredContacts(contactProfiles || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-base font-semibold text-black dark:text-white">Message</h2>
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
      ) : filteredContacts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
              <BsSearch className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No contacts found</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(contact => {
            const displayName = contact.name || contact.email.split('@')[0];
            const lastSeen = formatLastSeen(contact.last_seen);
            const isOnline = new Date(contact.last_seen) > new Date(Date.now() - 5 * 60 * 1000);
            
            return (
              <div 
                key={contact.id} 
                className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 cursor-pointer"
                onClick={() => onSelectUser(contact)}
              >
                <div className="flex items-center">
                  <Avatar 
                    url={contact.avatar_url}
                    name={displayName}
                    showOnlineStatus={true}
                    isOnline={isOnline}
                    size="md"
                    className="rounded-full"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-semibold text-sm text-black dark:text-white">{displayName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      {isOnline && (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      )}
                      {isOnline ? 'Active now' : `Active ${lastSeen}`}
                    </div>
                    {contact.about && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                        {contact.about.length > 40 ? `${contact.about.substring(0, 40)}...` : contact.about}
                      </div>
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