import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;
const userSocketMap = new Map();
const activeUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id, "User:", socket.userId);
    
    // Store user socket mapping
    userSocketMap.set(socket.userId, socket.id);
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      status: "online",
      lastSeen: new Date()
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);
    
    // Notify contacts that user is online
    socket.broadcast.emit("user-online", socket.userId);

    // Join conversation rooms
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle direct messages
    socket.on("send-message", async (data) => {
      const { conversationId, message, recipientId } = data;
      
      // Emit to conversation room
      socket.to(`conversation:${conversationId}`).emit("new-message", {
        conversationId,
        message,
        senderId: socket.userId,
        timestamp: new Date()
      });

      // Emit to specific recipient for notifications
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("notification", {
          type: "message",
          from: socket.userId,
          conversationId,
          message: message.text,
          timestamp: new Date()
        });
      }
    });

    // Handle typing indicators
    socket.on("typing-start", ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit("user-typing", {
        conversationId,
        userId,
        isTyping: true
      });
    });

    socket.on("typing-stop", ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit("user-typing", {
        conversationId,
        userId,
        isTyping: false
      });
    });

    // Handle message read receipts
    socket.on("mark-read", ({ conversationId, messageIds }) => {
      socket.to(`conversation:${conversationId}`).emit("messages-read", {
        conversationId,
        messageIds,
        readBy: socket.userId,
        readAt: new Date()
      });
    });

    // Handle message deletion
    socket.on("delete-message", ({ conversationId, messageId }) => {
      io.to(`conversation:${conversationId}`).emit("message-deleted", {
        conversationId,
        messageId,
        deletedBy: socket.userId
      });
    });

    // Handle message editing
    socket.on("edit-message", ({ conversationId, messageId, newContent }) => {
      io.to(`conversation:${conversationId}`).emit("message-edited", {
        conversationId,
        messageId,
        newContent,
        editedBy: socket.userId,
        editedAt: new Date()
      });
    });

    // WebRTC Signaling for voice/video calls
    socket.on("call-user", ({ targetUserId, signalData, callType }) => {
      io.to(`user:${targetUserId}`).emit("incoming-call", {
        from: socket.userId,
        signalData,
        callType
      });
    });

    socket.on("accept-call", ({ targetUserId, signalData }) => {
      io.to(`user:${targetUserId}`).emit("call-accepted", {
        from: socket.userId,
        signalData
      });
    });

    socket.on("reject-call", ({ targetUserId }) => {
      io.to(`user:${targetUserId}`).emit("call-rejected", {
        from: socket.userId
      });
    });

    socket.on("end-call", ({ targetUserId }) => {
      io.to(`user:${targetUserId}`).emit("call-ended", {
        from: socket.userId
      });
    });

    socket.on("ice-candidate", ({ targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit("ice-candidate", {
        from: socket.userId,
        candidate
      });
    });

    // Handle user status updates
    socket.on("update-status", (status) => {
      activeUsers.set(socket.userId, {
        ...activeUsers.get(socket.userId),
        status,
        lastSeen: new Date()
      });
      
      socket.broadcast.emit("user-status-changed", {
        userId: socket.userId,
        status
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      
      // Update user status
      activeUsers.set(socket.userId, {
        ...activeUsers.get(socket.userId),
        status: "offline",
        lastSeen: new Date()
      });
      
      // Remove from socket map
      userSocketMap.delete(socket.userId);
      
      // Notify contacts that user is offline
      socket.broadcast.emit("user-offline", {
        userId: socket.userId,
        lastSeen: new Date()
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

const getSocketId = (userId) => {
  return userSocketMap.get(userId);
};

const getUserStatus = (userId) => {
  return activeUsers.get(userId) || { status: "offline", lastSeen: null };
};

const emitToUser = (userId, event, data) => {
  const socketId = getSocketId(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

export { 
  initSocket, 
  getIO, 
  getSocketId, 
  getUserStatus, 
  emitToUser, 
  emitToConversation 
};
