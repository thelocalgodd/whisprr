const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Group = require('../src/models/Group');

describe('Group Endpoints', () => {
  let userToken, counselorToken, adminToken;
  let userId, counselorId, adminId, groupId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/whisprr_test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
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
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/groups', () => {
    test('should create group successfully', async () => {
      const groupData = {
        name: 'Anxiety Support Group',
        description: 'A supportive community for people dealing with anxiety',
        category: 'anxiety',
        type: 'public',
        maxMembers: 50
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.message).toBe('Group created successfully');
      expect(response.body.group.name).toBe(groupData.name);
      expect(response.body.group.creator._id).toBe(userId);
    });

    test('should validate required fields', async () => {
      const groupData = {
        name: 'Test Group'
        // Missing description and category
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
          description: 'Test description',
          category: 'anxiety'
        })
        .expect(401);
    });

    test('should restrict support-circle creation to counselors/admins', async () => {
      const groupData = {
        name: 'Support Circle',
        description: 'Professional support circle',
        category: 'trauma',
        type: 'support-circle'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .send(groupData)
        .expect(403);

      expect(response.body.error).toBe('Only counselors and admins can create support circles');
    });
  });

  describe('GET /api/groups', () => {
    beforeEach(async () => {
      // Create test groups
      const group1 = new Group({
        name: 'Anxiety Support',
        description: 'For anxiety support',
        category: 'anxiety',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });

      const group2 = new Group({
        name: 'Depression Help',
        description: 'For depression support',
        category: 'depression',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });

      await group1.save();
      await group2.save();
    });

    test('should get list of groups', async () => {
      const response = await request(app)
        .get('/api/groups')
        .expect(200);

      expect(response.body.groups).toBeDefined();
      expect(Array.isArray(response.body.groups)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter groups by category', async () => {
      const response = await request(app)
        .get('/api/groups?category=anxiety')
        .expect(200);

      response.body.groups.forEach(group => {
        expect(group.category).toBe('anxiety');
      });
    });

    test('should search groups by name', async () => {
      const response = await request(app)
        .get('/api/groups?search=Anxiety')
        .expect(200);

      expect(response.body.groups.length).toBeGreaterThan(0);
      expect(response.body.groups[0].name).toContain('Anxiety');
    });

    test('should sort groups by different criteria', async () => {
      const response = await request(app)
        .get('/api/groups?sortBy=newest')
        .expect(200);

      expect(response.body.groups).toBeDefined();
    });
  });

  describe('GET /api/groups/:groupId', () => {
    beforeEach(async () => {
      const group = new Group({
        name: 'Test Group',
        description: 'Test group for viewing',
        category: 'anxiety',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });
      await group.save();
      groupId = group._id;
    });

    test('should get group details', async () => {
      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.group).toBeDefined();
      expect(response.body.group._id).toBe(groupId.toString());
      expect(response.body.membership).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .get(`/api/groups/${groupId}`)
        .expect(401);
    });

    test('should return 404 for non-existent group', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/groups/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('POST /api/groups/:groupId/join', () => {
    beforeEach(async () => {
      const group = new Group({
        name: 'Joinable Group',
        description: 'A group to join',
        category: 'anxiety',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });
      await group.save();
      groupId = group._id;
    });

    test('should join group successfully', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Successfully joined the group');
    });

    test('should not allow joining twice', async () => {
      // Join once
      await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${userToken}`);

      // Try to join again
      const response = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.error).toBe('Already a member of this group');
    });

    test('should require authentication', async () => {
      await request(app)
        .post(`/api/groups/${groupId}/join`)
        .expect(401);
    });
  });

  describe('POST /api/groups/:groupId/leave', () => {
    beforeEach(async () => {
      const group = new Group({
        name: 'Leavable Group',
        description: 'A group to leave',
        category: 'anxiety',
        creator: counselorId,
        members: [
          { user: counselorId, role: 'admin' },
          { user: userId, role: 'member' }
        ]
      });
      await group.save();
      groupId = group._id;
    });

    test('should leave group successfully', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Successfully left the group');
    });

    test('should not allow creator to leave', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(400);

      expect(response.body.error).toBe('Group creator cannot leave. Transfer ownership or delete the group.');
    });

    test('should not allow leaving if not a member', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Not a member of this group');
    });
  });

  describe('PUT /api/groups/:groupId', () => {
    beforeEach(async () => {
      const group = new Group({
        name: 'Editable Group',
        description: 'A group to edit',
        category: 'anxiety',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });
      await group.save();
      groupId = group._id;
    });

    test('should update group successfully', async () => {
      const updateData = {
        description: 'Updated description',
        maxMembers: 75
      };

      const response = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Group updated successfully');
      expect(response.body.group.description).toBe(updateData.description);
    });

    test('should require admin/moderator permissions', async () => {
      await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Unauthorized update' })
        .expect(403);
    });
  });

  describe('DELETE /api/groups/:groupId', () => {
    beforeEach(async () => {
      const group = new Group({
        name: 'Deletable Group',
        description: 'A group to delete',
        category: 'anxiety',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });
      await group.save();
      groupId = group._id;
    });

    test('should delete group successfully', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.message).toBe('Group deleted successfully');
    });

    test('should require creator or admin permissions', async () => {
      await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/groups/my-groups', () => {
    beforeEach(async () => {
      const group = new Group({
        name: 'My Group',
        description: 'User\'s group',
        category: 'anxiety',
        creator: counselorId,
        members: [
          { user: counselorId, role: 'admin' },
          { user: userId, role: 'member' }
        ]
      });
      await group.save();
    });

    test('should get user\'s groups', async () => {
      const response = await request(app)
        .get('/api/groups/my-groups')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.groups).toBeDefined();
      expect(Array.isArray(response.body.groups)).toBe(true);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/groups/my-groups')
        .expect(401);
    });
  });

  describe('POST /api/groups/:groupId/schedule-session', () => {
    beforeEach(async () => {
      const group = new Group({
        name: 'Session Group',
        description: 'Group for sessions',
        category: 'anxiety',
        creator: counselorId,
        members: [{ user: counselorId, role: 'admin' }]
      });
      await group.save();
      groupId = group._id;
    });

    test('should schedule session successfully', async () => {
      const sessionData = {
        title: 'Anxiety Management Session',
        description: 'Learn anxiety coping strategies',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        maxParticipants: 10
      };

      const response = await request(app)
        .post(`/api/groups/${groupId}/schedule-session`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send(sessionData)
        .expect(200);

      expect(response.body.message).toBe('Session scheduled successfully');
      expect(response.body.session).toBeDefined();
    });

    test('should require moderator or counselor permissions', async () => {
      await request(app)
        .post(`/api/groups/${groupId}/schedule-session`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Session',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        })
        .expect(403);
    });
  });
});