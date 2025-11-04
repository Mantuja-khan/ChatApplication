import { supabase } from '../lib/supabase'

export async function sendFriendRequest(senderId, receiverId) {
  try {
    // First check if a request already exists in either direction
    const { data: existingRequest, error: checkError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)

    if (checkError && checkError.code !== 'PGRST116') throw checkError
    
    // If request exists, return it
    if (existingRequest?.length > 0) {
      return { data: existingRequest[0], error: null }
    }

    // If no request exists, create new one
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error sending friend request:', error)
    return { 
      data: null, 
      error: new Error(
        error.code === '23505' 
          ? 'Friend request already sent'
          : 'Failed to send friend request. Please try again.'
      )
    }
  }
}

export async function getFriendshipStatus(userId1, userId2) {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)

    if (error && error.code !== 'PGRST116') throw error
    
    // Return first request if exists
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error getting friendship status:', error)
    return { data: null, error }
  }
}

export async function acceptFriendRequest(requestId) {
  try {
    // Get the request details before accepting
    const { data: requestData, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .eq('id', requestId)
      .single()

    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from('friend_requests')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    // Show notification to the sender that their request was accepted
    if (requestData && requestData.sender) {
      showFriendRequestAcceptedNotification(requestData.receiver, requestData.sender)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error accepting friend request:', error)
    return { data: null, error }
  }
}

// Show notification when friend request is accepted
function showFriendRequestAcceptedNotification(accepter, sender) {
  // Only show if the current user is the sender (person who sent the request)
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  
  if (currentUser.id === sender.id) {
    const accepterName = accepter.name || accepter.email?.split('@')[0] || 'Someone'
    
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `
      fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg
      transform translate-x-full transition-transform duration-300 ease-in-out
      flex items-center space-x-3 max-w-sm
    `
    
    notification.innerHTML = `
      <div class="flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-semibold">Friend Request Accepted!</p>
        <p class="text-sm opacity-90">${accepterName} accepted your friend request</p>
      </div>
      <button class="flex-shrink-0 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 300)
    }, 3000)
    
    // Play notification sound if available
    try {
      const audio = new Audio()
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore errors
    } catch (error) {
      // Ignore audio errors
    }
  }
}

export async function rejectFriendRequest(requestId) {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error rejecting friend request:', error)
    return { data: null, error }
  }
}

export async function getPendingFriendRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*, profiles:sender_id(*)')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    return { data: [], error }
  }
}

let friendRequestSubscription = null

export function subscribeFriendRequests(userId, callback) {
  // Clean up existing subscription if any
  if (friendRequestSubscription) {
    friendRequestSubscription.unsubscribe()
    friendRequestSubscription = null
  }

  friendRequestSubscription = supabase
    .channel(`friend_requests:${userId}`)
    .on('postgres_changes', 
      { 
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
      }, 
      callback
    )
    .subscribe()

  return friendRequestSubscription
}