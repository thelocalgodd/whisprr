const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const { app } = require('../src/server');
const User = require('../src/models/User');

describe('Counselor Endpoints', () => {
  let userToken, counselorToken, adminToken;
  let userId, counselorId, adminId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/whisprr_test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});

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

  describe('POST /api/counselors/apply-verification', () => {
    test('should allow counselor to apply for verification', async () => {
      const response = await request(app)
        .post('/api/counselors/apply-verification')
        .set('Authorization', `Bearer ${counselorToken}`)
        .field('specializations', JSON.stringify(['anxiety', 'depression']))
        .field('certifications', JSON.stringify([{
          name: 'Licensed Clinical Social Worker',
          issuer: 'State Board',
          dateObtained: '2020-01-01'
        }]))
        .expect(200);

      expect(response.body.message).toBe('Verification application submitted successfully');
      expect(response.body.verificationStatus).toBe('pending');
    });

    test('should reject application from non-counselor', async () => {
      const response = await request(app)
        .post('/api/counselors/apply-verification')
        .set('Authorization', `Bearer ${userToken}`)
        .field('specializations', JSON.stringify(['anxiety']))
        .expect(403);

      expect(response.body.error).toBe('Only counselors and admins can apply for verification');
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/counselors/apply-verification')
        .expect(401);
    });
  });

  describe('GET /api/counselors/verification-status', () => {
    beforeEach(async () => {
      // Apply for verification first
      await request(app)
        .post('/api/counselors/apply-verification')
        .set('Authorization', `Bearer ${counselorToken}`)
        .field('specializations', JSON.stringify(['anxiety']));
    });

    test('should return verification status for counselor', async () => {
      const response = await request(app)
        .get('/api/counselors/verification-status')
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.verificationStatus).toBe('pending');
      expect(response.body.isVerified).toBe(false);
    });

    test('should reject request from non-counselor', async () => {
      await request(app)
        .get('/api/counselors/verification-status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  describe('POST /api/counselors/:counselorId/approve', () => {
    beforeEach(async () => {
      // Apply for verification
      await request(app)
        .post('/api/counselors/apply-verification')
        .set('Authorization', `Bearer ${counselorToken}`)
        .field('specializations', JSON.stringify(['anxiety']));
    });

    test('should allow admin to approve counselor verification', async () => {
      const response = await request(app)
        .post(`/api/counselors/${counselorId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Credentials verified' })
        .expect(200);

      expect(response.body.message).toBe('Counselor verification approved');
      expect(response.body.counselor.isVerified).toBe(true);
    });

    test('should reject approval from non-admin', async () => {
      await request(app)
        .post(`/api/counselors/${counselorId}/approve`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(403);
    });
  });

  describe('GET /api/counselors', () => {
    beforeEach(async () => {
      // Create and approve a verified counselor
      await User.findByIdAndUpdate(counselorId, {
        'counselorInfo.isVerified': true,
        'counselorInfo.verificationStatus': 'approved',
        'counselorInfo.specializations': ['anxiety', 'depression'],
        'counselorInfo.rating': 4.5
      });
    });

    test('should return list of counselors', async () => {
      const response = await request(app)
        .get('/api/counselors')
        .expect(200);

      expect(response.body.counselors).toBeDefined();
      expect(Array.isArray(response.body.counselors)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter by verified status', async () => {
      const response = await request(app)
        .get('/api/counselors?verified=true')
        .expect(200);

      response.body.counselors.forEach(counselor => {
        expect(counselor.counselorInfo.isVerified).toBe(true);
      });
    });

    test('should filter by specialization', async () => {
      const response = await request(app)
        .get('/api/counselors?specialization=anxiety')
        .expect(200);

      response.body.counselors.forEach(counselor => {
        expect(counselor.counselorInfo.specializations).toContain('anxiety');
      });
    });
  });

  describe('PUT /api/counselors/availability', () => {
    test('should allow counselor to update availability', async () => {
      const response = await request(app)
        .put('/api/counselors/availability')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({ available: false })
        .expect(200);

      expect(response.body.message).toBe('Availability updated successfully');
      expect(response.body.availabilityStatus).toBe(false);
    });

    test('should reject request from non-counselor', async () => {
      await request(app)
        .put('/api/counselors/availability')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/counselors/specializations', () => {
    test('should allow counselor to update specializations', async () => {
      const response = await request(app)
        .put('/api/counselors/specializations')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({ specializations: ['trauma', 'relationships'] })
        .expect(200);

      expect(response.body.message).toBe('Specializations updated successfully');
      expect(response.body.specializations).toEqual(['trauma', 'relationships']);
    });

    test('should reject request from non-counselor', async () => {
      await request(app)
        .put('/api/counselors/specializations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  describe('GET /api/counselors/stats', () => {
    test('should return counselor statistics', async () => {
      const response = await request(app)
        .get('/api/counselors/stats')
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalSessions).toBeDefined();
      expect(response.body.stats.rating).toBeDefined();
    });

    test('should reject request from non-counselor', async () => {
      await request(app)
        .get('/api/counselors/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });
});