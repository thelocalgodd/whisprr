const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Message = require('../src/models/Message');
const Group = require('../src/models/Group');

describe('Admin Endpoints', () => {
  let userToken, counselorToken, adminToken;
  let userId, counselorId, adminId;

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

    // Make admin user an actual admin
    await User.findByIdAndUpdate(adminResponse.body.user.id, { role: 'admin' });

    userToken = userResponse.body.tokens.accessToken;
    counselorToken = counselorResponse.body.tokens.accessToken;
    adminToken = adminResponse.body.tokens.accessToken;
    userId = userResponse.body.user.id;
    counselorId = counselorResponse.body.user.id;
    adminId = adminResponse.body.user.id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/admin/dashboard', () => {
    beforeEach(async () => {
      // Create some test data for dashboard stats
      const group = new Group({
        name: 'Test Group',
        description: 'Test group for stats',
        category: 'anxiety',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });
      await group.save();

      const message = new Message({
        sender: userId,
        recipient: counselorId,
        conversationId: [userId, counselorId].sort().join('-'),
        content: { text: 'Test message' }
      });
      await message.save();
    });

    test('should get dashboard statistics for admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.overview).toBeDefined();
      expect(response.body.overview.totalUsers).toBeDefined();
      expect(response.body.overview.totalCounselors).toBeDefined();
      expect(response.body.overview.totalGroups).toBeDefined();
      expect(response.body.overview.totalMessages).toBeDefined();
      expect(response.body.moderation).toBeDefined();
      expect(response.body.charts).toBeDefined();
    });

    test('should reject request from non-admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });
  });

  describe('GET /api/admin/users', () => {
    test('should get users list for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=counselor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.users.forEach(user => {
        expect(user.role).toBe('counselor');
      });
    });

    test('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    test('should search users', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=testuser')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users/:userId', () => {
    test('should get user details for admin', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBe(userId);
      expect(response.body.activity).toBeDefined();
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /api/admin/users/:userId/ban', () => {
    test('should ban user successfully', async () => {
      const banData = {
        reason: 'Violation of community guidelines',
        duration: 1440, // 24 hours in minutes
        permanent: false
      };

      const response = await request(app)
        .post(`/api/admin/users/${userId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(banData)
        .expect(200);

      expect(response.body.message).toBe('User banned successfully');
      expect(response.body.user.isBanned).toBe(true);
      expect(response.body.user.banReason).toBe(banData.reason);
    });

    test('should not allow banning admin users', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${adminId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test ban',
          permanent: false
        })
        .expect(403);

      expect(response.body.error).toBe('Cannot ban admin users');
    });

    test('should validate ban reason', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Short', // Too short
          permanent: false
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .post(`/api/admin/users/${userId}/ban`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'Unauthorized ban attempt',
          permanent: false
        })
        .expect(403);
    });
  });

  describe('POST /api/admin/users/:userId/unban', () => {
    beforeEach(async () => {
      // Ban the user first
      await User.findByIdAndUpdate(userId, {
        isBanned: true,
        banReason: 'Test ban',
        banExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    });

    test('should unban user successfully', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/unban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User unbanned successfully');
      expect(response.body.user.isBanned).toBe(false);
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .post(`/api/admin/users/${userId}/unban`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/reports', () => {
    beforeEach(async () => {
      // Create a message with reports
      const message = new Message({
        sender: userId,
        recipient: counselorId,
        conversationId: [userId, counselorId].sort().join('-'),
        content: { text: 'Reported message' },
        reports: [{
          reportedBy: counselorId,
          reason: 'harassment',
          description: 'This message is inappropriate',
          status: 'pending'
        }]
      });
      await message.save();
    });

    test('should get reports list for admin', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.reports).toBeDefined();
      expect(Array.isArray(response.body.reports)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter reports by status', async () => {
      const response = await request(app)
        .get('/api/admin/reports?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.reports.forEach(report => {
        expect(report.report.status).toBe('pending');
      });
    });

    test('should filter reports by type', async () => {
      const response = await request(app)
        .get('/api/admin/reports?type=messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.reports.forEach(report => {
        expect(report.type).toBe('message');
      });
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/system-health', () => {
    test('should get system health status for admin', async () => {
      const response = await request(app)
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.database).toBeDefined();
      expect(response.body.metrics.server).toBeDefined();
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/crisis-alerts', () => {
    beforeEach(async () => {
      // Create a message with crisis detection
      const message = new Message({
        sender: userId,
        recipient: counselorId,
        conversationId: [userId, counselorId].sort().join('-'),
        content: { text: 'I want to kill myself' },
        crisis: {
          detected: true,
          keywords: ['kill myself'],
          severity: 'high'
        }
      });
      await message.save();
    });

    test('should get crisis alerts for admin', async () => {
      const response = await request(app)
        .get('/api/admin/crisis-alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.alerts).toBeDefined();
      expect(Array.isArray(response.body.alerts)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/api/admin/crisis-alerts?severity=high')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.alerts.forEach(alert => {
        expect(alert.crisis.severity).toBe('high');
      });
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .get('/api/admin/crisis-alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/admin/crisis-alerts/:messageId', () => {
    let messageId;

    beforeEach(async () => {
      const message = new Message({
        sender: userId,
        recipient: counselorId,
        conversationId: [userId, counselorId].sort().join('-'),
        content: { text: 'Crisis message' },
        crisis: {
          detected: true,
          keywords: ['crisis'],
          severity: 'medium'
        }
      });
      await message.save();
      messageId = message._id;
    });

    test('should update crisis alert successfully', async () => {
      const updateData = {
        actionTaken: 'Contacted emergency services',
        notes: 'User was provided with crisis resources'
      };

      const response = await request(app)
        .put(`/api/admin/crisis-alerts/${messageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Crisis alert updated successfully');
      expect(response.body.alert.actionTaken).toBe(updateData.actionTaken);
    });

    test('should return 404 for non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/admin/crisis-alerts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actionTaken: 'Test action'
        })
        .expect(404);
    });

    test('should reject request from non-admin', async () => {
      await request(app)
        .put(`/api/admin/crisis-alerts/${messageId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          actionTaken: 'Unauthorized update'
        })
        .expect(403);
    });
  });
});