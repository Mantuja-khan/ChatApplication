import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.onrender.com' 
  : 'http://localhost:3000';

let socket;
let reconnectTimer;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;
const RECONNECT_DELAY = 2000;

export const initSocket = (userId) => {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      userId
    },
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY,
    timeout: 10000,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    reconnectAttempts = 0;
    clearTimeout(reconnectTimer);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    handleReconnect();
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    handleReconnect();
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    handleReconnect();
  });

  // Listen for real-time events
  socket.on('user_status', (data) => {
    console.log('User status update:', data);
    // Handle user online/offline status
  });

  socket.on('user_typing', (data) => {
    console.log('User typing:', data);
    // Handle typing indicators
  });

  return socket;
};

const handleReconnect = () => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectAttempts++;
      console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      if (socket) {
        socket.connect();
      }
    }, RECONNECT_DELAY * reconnectAttempts); // Exponential backoff
  } else {
    console.log('Max reconnection attempts reached');
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    clearTimeout(reconnectTimer);
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

// Helper functions for common socket operations
export const emitNewMessage = (message) => {
  if (socket?.connected) {
    socket.emit('new_message', message);
    return true;
  }
  console.warn('Socket not connected, message not sent');
  return false;
};

export const emitMessagesSeen = (messageIds, seenBy) => {
  if (socket?.connected) {
    socket.emit('messages_seen', { messageIds, seenBy });
    return true;
  }
  console.warn('Socket not connected, seen status not sent');
  return false;
};

export const emitMessageDeleted = (messageId, deletedBy) => {
  if (socket?.connected) {
    socket.emit('delete_message', { messageId, deletedBy });
    return true;
  }
  return false;
};

export const emitTyping = (senderId, receiverId, isTyping) => {
  if (socket?.connected) {
    socket.emit('typing', { senderId, receiverId, isTyping });
    return true;
  }
  return false;
};

// New function to emit active chat status
export const emitActiveChatUser = (userId, activeUserId) => {
  if (socket?.connected) {
    socket.emit('active_chat', { userId, activeUserId });
    return true;
  }
  return false;
};