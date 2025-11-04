import { supabase } from '../lib/supabase'

export async function getUsers(currentUserId, searchQuery = '', includeHidden = false, friendIds = []) {
  try {
    // First get the current user's hidden contacts and blocked users
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('hidden_contacts, blocked_users')
      .eq('id', currentUserId)
      .single();

    // Get users who have blocked the current user
    const { data: blockingUsers } = await supabase
      .from('profiles')
      .select('id')
      .contains('blocked_users', [currentUserId]);

    const blockingUserIds = blockingUsers?.map(user => user.id) || [];

    let query = supabase
      .from('profiles')
      .select('id, email, name, last_seen, avatar_url, active, deleted_at, about')
      .neq('id', currentUserId)
      .order('last_seen', { ascending: false });

    // If there's no search query and includeHidden is false, exclude hidden contacts
    if (!searchQuery && !includeHidden && currentUser?.hidden_contacts?.length > 0) {
      query = query.not('id', 'in', `(${currentUser.hidden_contacts.join(',')})`);
    }

    // Always exclude blocked users and users who have blocked the current user
    const excludeIds = [
      ...(currentUser?.blocked_users || []),
      ...blockingUserIds
    ].filter(Boolean);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // If there's a search query, include all users matching the query
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    } else if (!searchQuery && !includeHidden && friendIds.length > 0) {
      // If no search query and not including hidden, only show friends
      query = query.in('id', friendIds);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching users:', error.message);
    return { data: [], error };
  }
}

export function subscribeToUserChanges(callback) {
  return supabase
    .channel('public:profiles')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'profiles' }, 
      callback
    )
    .subscribe();
}

export async function updateUserStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

export function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Never';
  
  const now = new Date();
  const seenDate = new Date(lastSeen);
  const diffMinutes = Math.floor((now - seenDate) / 1000 / 60);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return seenDate.toLocaleDateString();
}

export async function unhideContact(currentUserId, contactId) {
  try {
    // Get current hidden contacts
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('hidden_contacts')
      .eq('id', currentUserId)
      .single();

    if (fetchError) throw fetchError;

    // Remove the contact from hidden contacts array
    const hiddenContacts = profile.hidden_contacts.filter(id => id !== contactId);

    // Update profile with new hidden contacts array
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ hidden_contacts: hiddenContacts })
      .eq('id', currentUserId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error('Error unhiding contact:', error);
    return { error };
  }
}

export async function blockUser(currentUserId, userId, block = true) {
  try {
    // Get current blocked users
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('blocked_users')
      .eq('id', currentUserId)
      .single();

    if (fetchError) throw fetchError;

    let blockedUsers = profile.blocked_users || [];
    
    if (block) {
      // Add user to blocked list if not already blocked
      if (!blockedUsers.includes(userId)) {
        blockedUsers.push(userId);
      }
    } else {
      // Remove user from blocked list
      blockedUsers = blockedUsers.filter(id => id !== userId);
    }

    // Update profile with new blocked users array
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ blocked_users: blockedUsers })
      .eq('id', currentUserId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error('Error updating blocked users:', error);
    return { error };
  }
}

export async function isUserBlocked(currentUserId, userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('blocked_users')
      .eq('id', currentUserId)
      .single();

    if (error) throw error;

    const blockedUsers = profile.blocked_users || [];
    return blockedUsers.includes(userId);
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
}