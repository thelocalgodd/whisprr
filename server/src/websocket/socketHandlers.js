const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');
const Session = require('../models/Session');

const connectedUsers = new Map();
const userSockets = new Map();

const authenticateSocket = async (socket, token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -security');
    
    if (!user || !user.isActive || user.isBanned) {
      throw new Error('Authentication failed');
    }
    
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const handleConnection = async (socket, io) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await authenticateSocket(socket, token);
    
    socket.userId = user._id.toString();
    socket.user = user;
    
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: user,
      status: 'online',
      lastSeen: new Date()
    });
    
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);
    
    await User.findByIdAndUpdate(user._id, {
      'status.isOnline': true,
      'status.lastSeen': new Date()
    });
    
    socket.emit('connected', {
      message: 'Connected successfully',
      userId: user._id,
      status: 'online'
    });
    
    const userGroups = await Group.find({
      'members.user': user._id,
      isActive: true
    }, '_id');
    
    userGroups.forEach(group => {
      socket.join(`group:${group._id}`);
    });
    
    socket.broadcast.emit('user:online', {
      userId: user._id,
      username: user.username,
      status: 'online'
    });
    
    console.log(`User ${user.username} connected - Socket: ${socket.id}`);
    
  } catch (error) {
    console.error('Socket authentication failed:', error);
    socket.emit('auth:error', { message: 'Authentication failed' });
    socket.disconnect();
  }
};

const handleDisconnection = async (socket) => {
  if (socket.userId) {
    const userSocketSet = userSockets.get(socket.userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      
      if (userSocketSet.size === 0) {
        userSockets.delete(socket.userId);
        connectedUsers.delete(socket.userId);
        
        await User.findByIdAndUpdate(socket.userId, {
          'status.isOnline': false,
          'status.lastSeen': new Date()
        });
        
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: new Date()
        });
      }
    }
    
    console.log(`User ${socket.userId} disconnected - Socket: ${socket.id}`);
  }
};

const handleJoinRoom = (socket, { roomId, roomType }) => {
  try {
    if (roomType === 'conversation') {
      socket.join(`conversation:${roomId}`);
    } else if (roomType === 'group') {
      socket.join(`group:${roomId}`);
    } else if (roomType === 'call') {
      socket.join(`call:${roomId}`);
    }
    
    socket.emit('room:joined', { roomId, roomType });
  } catch (error) {
    socket.emit('room:error', { message: 'Failed to join room' });
  }
};

const handleLeaveRoom = (socket, { roomId, roomType }) => {
  try {
    if (roomType === 'conversation') {
      socket.leave(`conversation:${roomId}`);
    } else if (roomType === 'group') {
      socket.leave(`group:${roomId}`);
    } else if (roomType === 'call') {
      socket.leave(`call:${roomId}`);
    }
    
    socket.emit('room:left', { roomId, roomType });
  } catch (error) {
    socket.emit('room:error', { message: 'Failed to leave room' });
  }
};

const handleSendMessage = async (socket, io, messageData) => {
  try {
    const { recipient, group, content, messageType = 'text', replyTo } = messageData;
    
    if (!recipient && !group) {
      socket.emit('message:error', { message: 'Recipient or group required' });
      return;
    }
    
    let conversationId;
    let roomName;
    
    if (recipient) {
      const targetUser = await User.findById(recipient);
      if (!targetUser || !targetUser.isActive) {
        socket.emit('message:error', { message: 'Recipient not found' });
        return;
      }
      
      conversationId = [socket.userId, recipient].sort().join('-');
      roomName = `conversation:${conversationId}`;
    } else {
      const targetGroup = await Group.findById(group);
      if (!targetGroup || !targetGroup.isActive) {
        socket.emit('message:error', { message: 'Group not found' });
        return;
      }
      
      if (!targetGroup.isMember(socket.userId)) {
        socket.emit('message:error', { message: 'You are not a member of this group' });
        return;
      }
      
      conversationId = group;
      roomName = `group:${group}`;
    }
    
    const message = new Message({
      sender: socket.userId,
      recipient: recipient || undefined,
      group: group || undefined,
      conversationId,
      messageType,
      content: {
        text: content.text || ''
      },
      metadata: {
        replyTo: replyTo || undefined
      }
    });
    
    const crisisKeywords = (process.env.CRISIS_KEYWORDS || 'suicide,kill myself,end it all,harm myself,self-harm').split(',');
    const detectedKeywords = message.checkForCrisisKeywords(crisisKeywords);
    
    await message.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profile role counselorInfo.isVerified')
      .populate('recipient', 'username profile role')
      .populate('group', 'name type')
      .populate('metadata.replyTo', 'sender content.text createdAt');
    
    io.to(roomName).emit('message:new', {
      message: populatedMessage,
      crisisDetected: detectedKeywords.length > 0
    });
    
    if (recipient) {
      const recipientSocketIds = userSockets.get(recipient);
      if (recipientSocketIds) {
        recipientSocketIds.forEach(socketId => {
          io.to(socketId).emit('notification:message', {
            type: 'private_message',
            sender: {
              id: socket.userId,
              username: socket.user.username,
              profile: socket.user.profile
            },
            preview: content.text?.substring(0, 100) || 'New message',
            conversationId
          });
        });
      }
    }
    
    if (detectedKeywords.length > 0) {
      io.to('admin').emit('crisis:detected', {
        messageId: message._id,
        userId: socket.userId,
        keywords: detectedKeywords,
        severity: message.crisis.severity,
        conversationId
      });
    }
    
  } catch (error) {
    console.error('Send message error:', error);
    socket.emit('message:error', { message: 'Failed to send message' });
  }
};

const handleTyping = (socket, io, { conversationId, isTyping }) => {
  const roomName = conversationId.includes('-') ? 
    `conversation:${conversationId}` : `group:${conversationId}`;
    
  socket.to(roomName).emit('user:typing', {
    userId: socket.userId,
    username: socket.user.username,
    isTyping,
    conversationId
  });
};

const handleMessageRead = async (socket, io, { messageId, conversationId }) => {
  try {
    await Message.findByIdAndUpdate(messageId, {
      'status.read': true,
      'status.readAt': new Date()
    });
    
    const roomName = conversationId.includes('-') ? 
      `conversation:${conversationId}` : `group:${conversationId}`;
      
    socket.to(roomName).emit('message:read', {
      messageId,
      readBy: socket.userId,
      readAt: new Date()
    });
    
  } catch (error) {
    console.error('Mark message read error:', error);
  }
};

const handleStatusUpdate = async (socket, io, { status, customMessage }) => {
  try {
    const validStatuses = ['online', 'away', 'busy', 'invisible'];
    if (!validStatuses.includes(status)) {
      socket.emit('status:error', { message: 'Invalid status' });
      return;
    }
    
    const userData = connectedUsers.get(socket.userId);
    if (userData) {
      userData.status = status;
      userData.customMessage = customMessage;
    }
    
    socket.broadcast.emit('user:status', {
      userId: socket.userId,
      status,
      customMessage
    });
    
    socket.emit('status:updated', { status, customMessage });
    
  } catch (error) {
    socket.emit('status:error', { message: 'Failed to update status' });
  }
};

const handleCallSignaling = (socket, io, signalData) => {
  const { type, target, signal, callId } = signalData;
  
  const targetSocketIds = userSockets.get(target);
  if (targetSocketIds) {
    targetSocketIds.forEach(socketId => {
      io.to(socketId).emit('call:signal', {
        type,
        signal,
        callId,
        from: socket.userId,
        fromUsername: socket.user.username
      });
    });
  }
};

const handleCallControl = (socket, io, { callId, action, data }) => {
  const roomName = `call:${callId}`;
  
  switch (action) {
    case 'join':
      socket.join(roomName);
      socket.to(roomName).emit('call:user-joined', {
        userId: socket.userId,
        username: socket.user.username
      });
      break;
      
    case 'leave':
      socket.leave(roomName);
      socket.to(roomName).emit('call:user-left', {
        userId: socket.userId,
        username: socket.user.username
      });
      break;
      
    case 'mute':
    case 'unmute':
    case 'video-on':
    case 'video-off':
      socket.to(roomName).emit('call:user-update', {
        userId: socket.userId,
        action,
        data
      });
      break;
  }
};

const handleGroupUpdate = (socket, io, { groupId, action, data }) => {
  const roomName = `group:${groupId}`;
  
  socket.to(roomName).emit('group:update', {
    groupId,
    action,
    data,
    updatedBy: socket.userId
  });
};

const handleAdminEvent = (socket, io, eventData) => {
  if (socket.user.role !== 'admin') {
    socket.emit('admin:error', { message: 'Admin access required' });
    return;
  }
  
  io.to('admin').emit('admin:event', {
    type: eventData.type,
    data: eventData.data,
    adminId: socket.userId,
    timestamp: new Date()
  });
};

const handleEmergencyAlert = async (socket, io, { type, severity, details }) => {
  try {
    const alertData = {
      id: require('crypto').randomBytes(16).toString('hex'),
      type,
      severity,
      details,
      userId: socket.userId,
      username: socket.user.username,
      timestamp: new Date()
    };
    
    io.to('crisis-team').emit('emergency:alert', alertData);
    
    io.to('admin').emit('emergency:alert', alertData);
    
    socket.emit('emergency:sent', {
      message: 'Emergency alert sent successfully',
      alertId: alertData.id
    });
    
  } catch (error) {
    socket.emit('emergency:error', { message: 'Failed to send emergency alert' });
  }
};

const setupSocketHandlers = (socket, io) => {
  socket.on('room:join', (data) => handleJoinRoom(socket, data));
  socket.on('room:leave', (data) => handleLeaveRoom(socket, data));
  socket.on('message:send', (data) => handleSendMessage(socket, io, data));
  socket.on('message:typing', (data) => handleTyping(socket, io, data));
  socket.on('message:read', (data) => handleMessageRead(socket, io, data));
  socket.on('status:update', (data) => handleStatusUpdate(socket, io, data));
  socket.on('call:signal', (data) => handleCallSignaling(socket, io, data));
  socket.on('call:control', (data) => handleCallControl(socket, io, data));
  socket.on('group:update', (data) => handleGroupUpdate(socket, io, data));
  socket.on('admin:event', (data) => handleAdminEvent(socket, io, data));
  socket.on('emergency:alert', (data) => handleEmergencyAlert(socket, io, data));
  
  socket.on('disconnect', () => handleDisconnection(socket));
};

module.exports = {
  handleConnection,
  setupSocketHandlers,
  connectedUsers,
  userSockets
};