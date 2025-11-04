import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'v-chats-pwa'
    }
  }
})

// Add connection state management
let isConnected = false
let connectionPromise = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_INTERVAL = 2000

// Create a channel for connection status
const statusChannel = supabase.channel('status')

const initializeStatusChannel = () => {
  if (statusChannel.state === 'joined') {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    statusChannel
      .on('presence', { event: 'sync' }, () => {
        isConnected = true
        reconnectAttempts = 0
        resolve(true)
      })
      .on('presence', { event: 'join' }, () => {
        isConnected = true
        reconnectAttempts = 0
      })
      .on('presence', { event: 'leave' }, () => {
        isConnected = false
        handleReconnect()
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isConnected = true
          reconnectAttempts = 0
          resolve(true)
        }
      })
  })
}

export const waitForConnection = async () => {
  if (isConnected) return true
  
  if (!connectionPromise) {
    connectionPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        connectionPromise = null
        resolve(false)
      }, 10000) // 10 second timeout

      initializeStatusChannel().then(() => {
        clearTimeout(timeout)
        resolve(true)
      })
    })
  }

  return connectionPromise
}

const handleReconnect = () => {
  if (!isConnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
    
    setTimeout(() => {
      if (!isConnected) {
        statusChannel.unsubscribe()
        initializeStatusChannel()
      }
    }, RECONNECT_INTERVAL * reconnectAttempts) // Exponential backoff
  }
}

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && !isConnected) {
    initializeStatusChannel()
  } else if (event === 'SIGNED_OUT') {
    statusChannel.unsubscribe()
    isConnected = false
    reconnectAttempts = 0
  }
})

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!isConnected) {
      initializeStatusChannel()
    }
  })
  
  window.addEventListener('offline', () => {
    isConnected = false
  })
}

// Channel subscription cache
const channelSubscriptions = new Map()

export const getChannel = (channelName, options = {}) => {
  const key = `${channelName}-${JSON.stringify(options)}`
  
  if (channelSubscriptions.has(key)) {
    const existingChannel = channelSubscriptions.get(key)
    if (existingChannel.state === 'closed') {
      channelSubscriptions.delete(key)
    } else {
      return existingChannel
    }
  }
  
  const channel = supabase.channel(channelName)
  channelSubscriptions.set(key, channel)
  return channel
}

export const cleanupChannel = (channelName, options = {}) => {
  const key = `${channelName}-${JSON.stringify(options)}`
  const channel = channelSubscriptions.get(key)
  
  if (channel) {
    if (channel.state !== 'closed') {
      channel.unsubscribe()
    }
    channelSubscriptions.delete(key)
  }
}