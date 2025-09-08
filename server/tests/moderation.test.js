const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Message = require('../src/models/Message');
const Group = require('../src/models/Group');

describe('Moderation Endpoints', () => {
  let userToken, counselorToken, adminToken;
  let userId, counselorId, adminId, messageId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/whisprr_test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
    await Group.deleteMany({});

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

    // Create test message
    const message = new Message({
      sender: userId,
      recipient: counselorId,
      conversationId: [userId, counselorId].sort().join('-'),
      content: { text: 'Test message for moderation' },
      moderation: {
        flagged: true,
        flagReason: 'Inappropriate content'
      }
    });
    await message.save();
    messageId = message._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/moderation/messages/:messageId', () => {
    test('should moderate message as counselor', async () => {
      const moderationData = {
        action: 'warn',
        reason: 'Inappropriate language',
        notifyUser: true
      };

      const response = await request(app)
        .post(`/api/moderation/messages/${messageId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send(moderationData)
        .expect(200);

      expect(response.body.message).toBe('Message moderated successfully');
      expect(response.body.action).toBe('warn');
    });

    test('should moderate message as admin', async () => {
      const moderationData = {
        action: 'delete',
        reason: 'Violates community guidelines'
      };

      const response = await request(app)
        .post(`/api/moderation/messages/${messageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(moderationData)
        .expect(200);

      expect(response.body.action).toBe('delete');
    });

    test('should reject invalid moderation action', async () => {
      const response = await request(app)
        .post(`/api/moderation/messages/${messageId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          action: 'invalid_action',
          reason: 'Test'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid moderation action');
    });

    test('should reject request from regular user', async () => {
      await request(app)
        .post(`/api/moderation/messages/${messageId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'warn',
          reason: 'Unauthorized attempt'
        })
        .expect(403);
    });

    test('should require authentication', async () => {
      await request(app)
        .post(`/api/moderation/messages/${messageId}`)
        .send({
          action: 'warn',
          reason: 'No auth'
        })
        .expect(401);
    });
  });

  describe('GET /api/moderation/flagged', () => {
    beforeEach(async () => {
      // Create additional flagged content
      const crisisMessage = new Message({
        sender: userId,
        recipient: counselorId,
        conversationId: [userId, counselorId].sort().join('-'),
        content: { text: 'I want to end it all' },
        crisis: {
          detected: true,
          keywords: ['end it all'],
          severity: 'high'
        }
      });
      await crisisMessage.save();

      const reportedMessage = new Message({
        sender: userId,
        recipient: counselorId,
        conversationId: [userId, counselorId].sort().join('-'),
        content: { text: 'Reported content' },
        reports: [{
          reportedBy: counselorId,
          reason: 'harassment',
          description: 'Inappropriate behavior',
          status: 'pending'
        }]
      });
      await reportedMessage.save();
    });

    test('should get flagged content as counselor', async () => {
      const response = await request(app)
        .get('/api/moderation/flagged')
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter by content type', async () => {
      const response = await request(app)
        .get('/api/moderation/flagged?type=crisis')
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      response.body.messages.forEach(msg => {
        expect(msg.crisis.detected).toBe(true);
      });
    });

    test('should filter by severity', async () => {
      const response = await request(app)
        .get('/api/moderation/flagged?type=crisis&severity=high')
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      response.body.messages.forEach(msg => {
        expect(msg.crisis.severity).toBe('high');
      });
    });

    test('should reject request from regular user', async () => {
      await request(app)
        .get('/api/moderation/flagged')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /api/moderation/report', () => {
    test('should report content successfully', async () => {
      const reportData = {
        contentId: messageId,
        contentType: 'message',
        reason: 'harassment',
        description: 'This message contains harassment and inappropriate content'
      };

      const response = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.message).toBe('Content reported successfully');
      expect(response.body.reportId).toBe(messageId);
    });

    test('should report user successfully', async () => {
      const reportData = {
        contentId: userId,
        contentType: 'user',
        reason: 'inappropriate_content',
        description: 'User has been posting inappropriate content repeatedly'
      };

      const response = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.message).toBe('Content reported successfully');
    });

    test('should validate report reason', async () => {
      const response = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          contentId: messageId,
          contentType: 'message',
          reason: 'invalid_reason',
          description: 'Test description'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should not allow reporting own content', async () => {
      const response = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          contentId: messageId,
          contentType: 'message',
          reason: 'harassment',
          description: 'Self report attempt'
        })
        .expect(400);

      expect(response.body.error).toBe('Cannot report your own content');
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/moderation/report')
        .send({
          contentId: messageId,
          contentType: 'message',
          reason: 'harassment',
          description: 'No auth report'
        })
        .expect(401);
    });
  });

  describe('POST /api/moderation/block/:userId', () => {
    test('should block user successfully', async () => {
      const response = await request(app)
        .post(`/api/moderation/block/${counselorId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('User blocked successfully');
      expect(response.body.blockedUser.id).toBe(counselorId);
    });

    test('should not allow blocking self', async () => {
      const response = await request(app)
        .post(`/api/moderation/block/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot block yourself');
    });

    test('should not allow blocking already blocked user', async () => {
      // Block user first
      await User.findByIdAndUpdate(userId, {
        $push: { 'privacy.blockList': counselorId }
      });

      const response = await request(app)
        .post(`/api/moderation/block/${counselorId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.error).toBe('User is already blocked');
    });

    test('should require authentication', async () => {
      await request(app)
        .post(`/api/moderation/block/${counselorId}`)
        .expect(401);
    });
  });

  describe('DELETE /api/moderation/block/:userId', () => {
    beforeEach(async () => {
      // Block user first
      await User.findByIdAndUpdate(userId, {
        $push: { 'privacy.blockList': counselorId }
      });
    });

    test('should unblock user successfully', async () => {
      const response = await request(app)
        .delete(`/api/moderation/block/${counselorId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('User unblocked successfully');
      expect(response.body.unblockedUserId).toBe(counselorId);
    });

    test('should not unblock user that is not blocked', async () => {
      const response = await request(app)
        .delete(`/api/moderation/block/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.error).toBe('User is not blocked');
    });
  });

  describe('GET /api/moderation/blocked', () => {
    beforeEach(async () => {
      await User.findByIdAndUpdate(userId, {
        $push: { 'privacy.blockList': counselorId }
      });
    });

    test('should get blocked users list', async () => {
      const response = await request(app)
        .get('/api/moderation/blocked')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.blockedUsers).toBeDefined();
      expect(Array.isArray(response.body.blockedUsers)).toBe(true);
      expect(response.body.blockedUsers.length).toBeGreaterThan(0);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/moderation/blocked')
        .expect(401);
    });
  });

  describe('POST /api/moderation/panic', () => {
    test('should activate panic button successfully', async () => {
      const panicData = {
        location: 'New York, NY',
        severity: 'critical'
      };

      const response = await request(app)
        .post('/api/moderation/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send(panicData)
        .expect(200);

      expect(response.body.message).toBe('Emergency alert sent successfully');
      expect(response.body.alertId).toBeDefined();
      expect(response.body.resources).toBeDefined();
      expect(response.body.resources.hotlines).toBeDefined();
      expect(response.body.resources.emergencyServices).toBe('911');
    });

    test('should work without location', async () => {
      const response = await request(app)
        .post('/api/moderation/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ severity: 'high' })
        .expect(200);

      expect(response.body.message).toBe('Emergency alert sent successfully');
      expect(response.body.resources).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/moderation/panic')
        .send({ severity: 'critical' })
        .expect(401);
    });
  });

  describe('GET /api/moderation/crisis-resources', () => {
    test('should get crisis resources without authentication', async () => {
      const response = await request(app)
        .get('/api/moderation/crisis-resources')
        .expect(200);

      expect(response.body.resources).toBeDefined();
      expect(response.body.resources.immediate).toBeDefined();
      expect(response.body.resources.hotlines).toBeDefined();
      expect(response.body.resources.online).toBeDefined();
      expect(response.body.resources.selfCare).toBeDefined();
    });

    test('should include emergency numbers', async () => {
      const response = await request(app)
        .get('/api/moderation/crisis-resources')
        .expect(200);

      expect(response.body.resources.immediate.emergency).toBe('911');
      expect(response.body.resources.immediate.suicidePrevention).toBe('988');
    });

    test('should include self-care techniques', async () => {
      const response = await request(app)
        .get('/api/moderation/crisis-resources')
        .expect(200);

      expect(response.body.resources.selfCare).toBeDefined();
      expect(Array.isArray(response.body.resources.selfCare)).toBe(true);
      expect(response.body.resources.selfCare.length).toBeGreaterThan(0);
    });
  });
});