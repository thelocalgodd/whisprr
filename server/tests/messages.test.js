const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Message = require('../src/models/Message');

describe('Message Endpoints', () => {
  let userToken, counselorToken, adminToken;
  let userId, counselorId, adminId, groupId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/whisprr_test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
    await Message.deleteMany({});

    // Create test users
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'password123',
        email: 'user@test.com',
        role: 'user'
      });

    const counselorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testcounselor',
        password: 'password123',
        email: 'counselor@test.com',
        role: 'counselor'
      });

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testadmin',
        password: 'password123',
        email: 'admin@test.com',
        role: 'admin'
      });

    await User.findByIdAndUpdate(adminResponse.body.user.id, { role: 'admin' });

    userToken = userResponse.body.tokens.accessToken;
    counselorToken = counselorResponse.body.tokens.accessToken;
    adminToken = adminResponse.body.tokens.accessToken;
    userId = userResponse.body.user.id;
    counselorId = counselorResponse.body.user.id;
    adminId = adminResponse.body.user.id;

    // Create test group
    const group = new Group({
      name: 'Test Support Group',
      description: 'A test group for anxiety support',
      category: 'anxiety',
      creator: counselorId,
      members: [
        { user: userId, role: 'member' },
        { user: counselorId, role: 'admin' }
      ]
    });
    await group.save();
    groupId = group._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/messages', () => {
    test('should send private message successfully', async () => {
      const messageData = {
        recipient: counselorId,
        content: {
          text: 'Hello counselor, I need help with anxiety'
        },
        messageType: 'text'
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Message sent successfully');
      expect(response.body.data.sender._id).toBe(userId);
      expect(response.body.data.recipient._id).toBe(counselorId);
    });

    test('should send group message successfully', async () => {
      const messageData = {
        group: groupId,
        content: {
          text: 'Hello everyone in the group'
        },
        messageType: 'text'
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Message sent successfully');
      expect(response.body.data.group._id).toBe(groupId.toString());
    });

    test('should detect crisis keywords', async () => {
      const messageData = {
        recipient: counselorId,
        content: {
          text: 'I want to kill myself and end it all'
        },
        messageType: 'text'
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.crisisDetected).toBe(true);
      expect(response.body.detectedKeywords.length).toBeGreaterThan(0);
    });

    test('should require recipient or group', async () => {
      const messageData = {
        content: {
          text: 'Hello without recipient'
        }
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Recipient or group required');
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/messages')
        .send({
          recipient: counselorId,
          content: { text: 'Hello' }
        })
        .expect(401);
    });
  });

  describe('GET /api/messages/:conversationId', () => {
    let conversationId;

    beforeEach(async () => {
      // Send a message to create conversation
      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient: counselorId,
          content: { text: 'Test message' }
        });

      conversationId = messageResponse.body.data.conversationId;
    });

    test('should get messages from conversation', async () => {
      const response = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .get(`/api/messages/${conversationId}`)
        .expect(401);
    });

    test('should deny access to unauthorized conversation', async () => {
      const otherConversationId = [adminId, counselorId].sort().join('-');
      
      await request(app)
        .get(`/api/messages/${otherConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/messages/:messageId', () => {
    let messageId;

    beforeEach(async () => {
      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient: counselorId,
          content: { text: 'Original message' }
        });

      messageId = messageResponse.body.data._id;
    });

    test('should edit own message successfully', async () => {
      const response = await request(app)
        .put(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Edited message' })
        .expect(200);

      expect(response.body.message).toBe('Message edited successfully');
    });

    test('should not allow editing others messages', async () => {
      await request(app)
        .put(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({ text: 'Trying to edit' })
        .expect(403);
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    let messageId;

    beforeEach(async () => {
      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient: counselorId,
          content: { text: 'Message to delete' }
        });

      messageId = messageResponse.body.data._id;
    });

    test('should delete own message successfully', async () => {
      const response = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ deleteForEveryone: false })
        .expect(200);

      expect(response.body.message).toBe('Message deleted successfully');
    });

    test('should not allow deleting others messages', async () => {
      await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(403);
    });
  });

  describe('POST /api/messages/:messageId/react', () => {
    let messageId;

    beforeEach(async () => {
      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient: counselorId,
          content: { text: 'Message to react to' }
        });

      messageId = messageResponse.body.data._id;
    });

    test('should add reaction to message', async () => {
      const response = await request(app)
        .post(`/api/messages/${messageId}/react`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({ emoji: '👍' })
        .expect(200);

      expect(response.body.message).toBe('Reaction updated successfully');
      expect(response.body.reactions).toBeDefined();
    });
  });

  describe('POST /api/messages/:messageId/report', () => {
    let messageId;

    beforeEach(async () => {
      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient: counselorId,
          content: { text: 'Inappropriate message' }
        });

      messageId = messageResponse.body.data._id;
    });

    test('should report message successfully', async () => {
      const response = await request(app)
        .post(`/api/messages/${messageId}/report`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          reason: 'harassment',
          description: 'This message is inappropriate'
        })
        .expect(200);

      expect(response.body.message).toBe('Message reported successfully');
    });

    test('should not allow reporting own message', async () => {
      await request(app)
        .post(`/api/messages/${messageId}/report`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'harassment',
          description: 'Test'
        })
        .expect(400);
    });
  });

  describe('GET /api/messages/conversations', () => {
    beforeEach(async () => {
      // Send messages to create conversations
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient: counselorId,
          content: { text: 'Private message' }
        });

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          group: groupId,
          content: { text: 'Group message' }
        });
    });

    test('should get user conversations', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.conversations).toBeDefined();
      expect(Array.isArray(response.body.conversations)).toBe(true);
    });

    test('should filter conversations by type', async () => {
      const response = await request(app)
        .get('/api/messages/conversations?type=private')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      response.body.conversations.forEach(conv => {
        expect(conv.type).toBe('private');
      });
    });
  });

  describe('GET /api/messages/search', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient: counselorId,
          content: { text: 'searchable message content' }
        });
    });

    test('should search messages successfully', async () => {
      const response = await request(app)
        .get('/api/messages/search?query=searchable')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/messages/search?query=test')
        .expect(401);
    });
  });
});