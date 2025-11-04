import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { emailRouter } from './routes/email.js';
import { pushRouter, sendPushNotification } from './routes/push.js';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/email', emailRouter);
app.use('/api/push', pushRouter);

// Get VAPID public key
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// Track online users and their active chats
const onlineUsers = new Map();
const activeChats = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  
  if (userId) {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`User ${userId} connected`);
    
    // Broadcast user online status
    io.emit('user_status', { userId, status: 'online' });
  }

  // Handle active chat updates
  socket.on('active_chat', ({ userId, activeUserId }) => {
    if (userId && activeUserId) {
      activeChats.set(userId, activeUserId);
    } else {
      activeChats.delete(userId);
    }
  });

  // Handle new messages
  socket.on('new_message', async (message) => {
    const receiverSocket = onlineUsers.get(message.receiver_id);
    if (receiverSocket) {
      io.to(receiverSocket).emit('message_received', message);
      
      // Check if receiver has sender's chat open
      const receiverActiveChat = activeChats.get(message.receiver_id);
      if (receiverActiveChat !== message.sender_id) {
        // Send push notification since chat isn't active
        await sendPushNotification(
          message.receiver_id,
          message.sender_name || 'New Message',
          message.content,
          `${process.env.CLIENT_URL}?chat=${message.sender_id}`
        );
      }
    } else {
      // User is offline, send push notification
      await sendPushNotification(
        message.receiver_id,
        message.sender_name || 'New Message',
        message.content,
        `${process.env.CLIENT_URL}?chat=${message.sender_id}`
      );
    }
  });

  // Handle message seen status
  socket.on('messages_seen', ({ messageIds, seenBy }) => {
    socket.broadcast.emit('message_seen', { messageIds, seenBy });
  });

  // Handle message deletion
  socket.on('delete_message', ({ messageId, deletedBy }) => {
    socket.broadcast.emit('message_deleted', { messageId, deletedBy });
  });

  // Handle typing status
  socket.on('typing', ({ senderId, receiverId, isTyping }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('user_typing', { senderId, isTyping });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (userId) {
      onlineUsers.delete(userId);
      activeChats.delete(userId);
      console.log(`User ${userId} disconnected`);
      
      // Broadcast user offline status
      io.emit('user_status', { userId, status: 'offline' });
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});