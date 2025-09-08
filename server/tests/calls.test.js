const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Session = require('../src/models/Session');

describe('Call Endpoints', () => {
  let userToken, counselorToken, adminToken;
  let userId, counselorId, adminId, groupId, callId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/whisprr_test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
    await Session.deleteMany({});

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
      name: 'Call Test Group',
      description: 'A test group for calls',
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

  describe('POST /api/calls/initiate', () => {
    test('should initiate private voice call successfully', async () => {
      const callData = {
        recipientId: counselorId,
        callType: 'voice'
      };

      const response = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(callData)
        .expect(201);

      expect(response.body.message).toBe('Call initiated successfully');
      expect(response.body.callId).toBeDefined();
      expect(response.body.session.callType).toBe('voice');
    });

    test('should initiate video call successfully', async () => {
      const callData = {
        recipientId: counselorId,
        callType: 'video'
      };

      const response = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(callData)
        .expect(201);

      expect(response.body.session.callType).toBe('video');
      expect(response.body.session.callInfo.isVideoCall).toBe(true);
    });

    test('should initiate group call successfully', async () => {
      const callData = {
        groupId: groupId,
        callType: 'voice'
      };

      const response = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(callData)
        .expect(201);

      expect(response.body.message).toBe('Call initiated successfully');
      expect(response.body.session.type).toBe('group');
    });

    test('should require recipient or group', async () => {
      const response = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ callType: 'voice' })
        .expect(400);

      expect(response.body.error).toBe('Recipient or group required for call');
    });

    test('should not allow both recipient and group', async () => {
      const response = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipientId: counselorId,
          groupId: groupId,
          callType: 'voice'
        })
        .expect(400);

      expect(response.body.error).toBe('Cannot call both recipient and group simultaneously');
    });

    test('should handle blocked users', async () => {
      // Block the user first
      await User.findByIdAndUpdate(counselorId, {
        $push: { 'privacy.blockList': userId }
      });

      const response = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipientId: counselorId,
          callType: 'voice'
        })
        .expect(403);

      expect(response.body.error).toBe('You are blocked by this user');
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/calls/initiate')
        .send({
          recipientId: counselorId,
          callType: 'voice'
        })
        .expect(401);
    });
  });

  describe('POST /api/calls/:callId/join', () => {
    beforeEach(async () => {
      // Initiate a call first
      const callResponse = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipientId: counselorId,
          callType: 'voice'
        });
      
      callId = callResponse.body.callId;
    });

    test('should join call successfully', async () => {
      const response = await request(app)
        .post(`/api/calls/${callId}/join`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.message).toBe('Joined call successfully');
      expect(response.body.session.iceServers).toBeDefined();
    });

    test('should not join inactive call', async () => {
      // End the call first
      await Session.findByIdAndUpdate(callId, { status: 'ended' });

      const response = await request(app)
        .post(`/api/calls/${callId}/join`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(400);

      expect(response.body.error).toBe('Call is not active');
    });

    test('should not join if not invited', async () => {
      const response = await request(app)
        .post(`/api/calls/${callId}/join`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.error).toBe('You are not invited to this call');
    });
  });

  describe('POST /api/calls/:callId/leave', () => {
    beforeEach(async () => {
      const callResponse = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipientId: counselorId,
          callType: 'voice'
        });
      
      callId = callResponse.body.callId;

      // Join the call
      await request(app)
        .post(`/api/calls/${callId}/join`)
        .set('Authorization', `Bearer ${counselorToken}`);
    });

    test('should leave call successfully', async () => {
      const response = await request(app)
        .post(`/api/calls/${callId}/leave`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.message).toBe('Left call successfully');
    });

    test('should end call when last participant leaves', async () => {
      // Both participants leave
      await request(app)
        .post(`/api/calls/${callId}/leave`)
        .set('Authorization', `Bearer ${counselorToken}`);

      const response = await request(app)
        .post(`/api/calls/${callId}/leave`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.callEnded).toBe(true);
    });
  });

  describe('POST /api/calls/:callId/end', () => {
    beforeEach(async () => {
      const callResponse = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipientId: counselorId,
          callType: 'voice'
        });
      
      callId = callResponse.body.callId;
    });

    test('should end call successfully as host', async () => {
      const response = await request(app)
        .post(`/api/calls/${callId}/end`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Call ended successfully');
      expect(response.body.session.duration).toBeDefined();
    });

    test('should not allow non-participant to end call', async () => {
      const response = await request(app)
        .post(`/api/calls/${callId}/end`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.error).toBe('You are not a participant in this call');
    });
  });

  describe('PUT /api/calls/:callId/settings', () => {
    beforeEach(async () => {
      const callResponse = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipientId: counselorId,
          callType: 'video'
        });
      
      callId = callResponse.body.callId;
    });

    test('should update call settings successfully', async () => {
      const response = await request(app)
        .put(`/api/calls/${callId}/settings`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          audioEnabled: false,
          videoEnabled: true
        })
        .expect(200);

      expect(response.body.message).toBe('Call settings updated successfully');
      expect(response.body.participant.audioEnabled).toBe(false);
      expect(response.body.participant.videoEnabled).toBe(true);
    });

    test('should not update settings for non-participant', async () => {
      const response = await request(app)
        .put(`/api/calls/${callId}/settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          audioEnabled: false
        })
        .expect(403);

      expect(response.body.error).toBe('You are not a participant in this call');
    });
  });

  describe('GET /api/calls/history', () => {
    beforeEach(async () => {
      // Create a completed call session
      const session = new Session({
        participants: [userId, counselorId],
        type: 'private',
        status: 'ended',
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
        duration: 60,
        callInfo: {
          isVoiceCall: true,
          isVideoCall: false,
          callDuration: 60,
          participants: [
            { user: userId, joinedAt: new Date() },
            { user: counselorId, joinedAt: new Date() }
          ]
        }
      });
      await session.save();
    });

    test('should get call history successfully', async () => {
      const response = await request(app)
        .get('/api/calls/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.calls).toBeDefined();
      expect(Array.isArray(response.body.calls)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter by call type', async () => {
      const response = await request(app)
        .get('/api/calls/history?type=voice')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      response.body.calls.forEach(call => {
        expect(call.callInfo.isVoiceCall).toBe(true);
      });
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/calls/history')
        .expect(401);
    });
  });

  describe('GET /api/calls/active', () => {
    test('should return null when no active call', async () => {
      const response = await request(app)
        .get('/api/calls/active')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.activeCall).toBe(null);
    });

    test('should return active call when exists', async () => {
      // Create active call
      const callResponse = await request(app)
        .post('/api/calls/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipientId: counselorId,
          callType: 'voice'
        });

      const response = await request(app)
        .get('/api/calls/active')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.activeCall).toBeDefined();
      expect(response.body.activeCall.id).toBe(callResponse.body.callId);
    });
  });

  describe('POST /api/calls/:callId/feedback', () => {
    beforeEach(async () => {
      // Create completed session
      const session = new Session({
        participants: [userId, counselorId],
        type: 'counseling',
        counselor: counselorId,
        status: 'ended',
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
        callInfo: {
          isVoiceCall: true,
          isVideoCall: false
        }
      });
      await session.save();
      callId = session._id;
    });

    test('should submit feedback successfully', async () => {
      const feedbackData = {
        rating: 5,
        comment: 'Excellent counseling session',
        isHelpful: true
      };

      const response = await request(app)
        .post(`/api/calls/${callId}/feedback`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(feedbackData)
        .expect(200);

      expect(response.body.message).toBe('Feedback submitted successfully');
      expect(response.body.feedback).toBeDefined();
    });

    test('should validate rating range', async () => {
      const response = await request(app)
        .post(`/api/calls/${callId}/feedback`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 6,
          comment: 'Invalid rating'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should not allow feedback from non-participant', async () => {
      const response = await request(app)
        .post(`/api/calls/${callId}/feedback`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rating: 5,
          comment: 'Not a participant'
        })
        .expect(403);

      expect(response.body.error).toBe('You did not participate in this call');
    });
  });

  describe('GET /api/calls/counselor-stats', () => {
    beforeEach(async () => {
      // Create some session history for counselor
      const session = new Session({
        participants: [userId, counselorId],
        type: 'counseling',
        counselor: counselorId,
        status: 'ended',
        duration: 1800,
        callInfo: {
          isVoiceCall: true,
          callDuration: 1800
        },
        feedback: [{
          user: userId,
          rating: 5,
          comment: 'Great session'
        }]
      });
      await session.save();
    });

    test('should get counselor statistics', async () => {
      const response = await request(app)
        .get('/api/calls/counselor-stats')
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalSessions).toBeDefined();
      expect(response.body.recentSessions).toBeDefined();
    });

    test('should require counselor role', async () => {
      const response = await request(app)
        .get('/api/calls/counselor-stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Counselor access required');
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/calls/counselor-stats')
        .expect(401);
    });
  });
});