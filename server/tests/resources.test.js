const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Resource = require('../src/models/Resource');

describe('Resource Endpoints', () => {
  let userToken, counselorToken, adminToken;
  let userId, counselorId, adminId, resourceId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/whisprr_test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Resource.deleteMany({});

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

  describe('POST /api/resources', () => {
    test('should create resource as counselor', async () => {
      const resourceData = {
        title: 'Managing Anxiety: A Comprehensive Guide',
        description: 'Learn effective techniques to manage anxiety and stress in daily life',
        type: 'article',
        category: 'mental-health',
        tags: 'anxiety,stress,coping',
        targetAudience: 'adults,teens',
        difficulty: 'beginner',
        estimatedTime: '15',
        content: JSON.stringify({
          text: 'This is a comprehensive guide to managing anxiety...'
        })
      };

      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${counselorToken}`)
        .field('title', resourceData.title)
        .field('description', resourceData.description)
        .field('type', resourceData.type)
        .field('category', resourceData.category)
        .field('tags', resourceData.tags)
        .field('targetAudience', resourceData.targetAudience)
        .field('difficulty', resourceData.difficulty)
        .field('estimatedTime', resourceData.estimatedTime)
        .field('content', resourceData.content)
        .expect(201);

      expect(response.body.message).toBe('Resource created successfully');
      expect(response.body.resource.title).toBe(resourceData.title);
      expect(response.body.resource.status).toBe('pending-review');
    });

    test('should create resource as admin with auto-approval', async () => {
      const resourceData = {
        title: 'Admin Resource',
        description: 'Resource created by admin',
        type: 'guide',
        category: 'coping-strategies',
        tags: 'admin,guide',
        difficulty: 'intermediate'
      };

      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', resourceData.title)
        .field('description', resourceData.description)
        .field('type', resourceData.type)
        .field('category', resourceData.category)
        .field('tags', resourceData.tags)
        .field('difficulty', resourceData.difficulty)
        .expect(201);

      expect(response.body.resource.status).toBe('approved');
    });

    test('should reject resource creation from regular user', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'User Resource')
        .field('description', 'This should be rejected')
        .field('type', 'article')
        .field('category', 'mental-health')
        .expect(403);

      expect(response.body.error).toBe('Only counselors and admins can create resources');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${counselorToken}`)
        .field('title', 'Test') // Too short
        .field('type', 'article')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should handle file upload', async () => {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-document.txt');
      fs.writeFileSync(testFilePath, 'Test document content');

      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${counselorToken}`)
        .field('title', 'Resource with File')
        .field('description', 'A resource with an attached file')
        .field('type', 'pdf')
        .field('category', 'educational')
        .attach('file', testFilePath)
        .expect(201);

      expect(response.body.resource.content.fileUrl).toBeDefined();
      expect(response.body.resource.content.fileName).toBe('test-document.txt');

      // Cleanup
      fs.unlinkSync(testFilePath);
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/resources')
        .field('title', 'Unauthenticated Resource')
        .expect(401);
    });
  });

  describe('GET /api/resources', () => {
    beforeEach(async () => {
      // Create approved resources
      const resource1 = new Resource({
        title: 'Anxiety Management',
        description: 'Guide to managing anxiety',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved',
        visibility: 'public',
        tags: ['anxiety', 'stress'],
        difficulty: 'beginner',
        metadata: { views: 100, averageRating: 4.5 }
      });

      const resource2 = new Resource({
        title: 'Advanced Therapy Techniques',
        description: 'Professional therapy methods',
        type: 'guide',
        category: 'therapy-techniques',
        uploadedBy: counselorId,
        status: 'approved',
        visibility: 'counselors-only',
        tags: ['therapy', 'professional'],
        difficulty: 'advanced',
        metadata: { views: 50, averageRating: 4.8 }
      });

      await resource1.save();
      await resource2.save();
    });

    test('should get public resources without authentication', async () => {
      const response = await request(app)
        .get('/api/resources')
        .expect(200);

      expect(response.body.resources).toBeDefined();
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      
      // Should only show public resources
      response.body.resources.forEach(resource => {
        expect(resource.visibility).toBe('public');
      });
    });

    test('should show counselor-only resources to counselors', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.resources.length).toBeGreaterThan(0);
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/resources?category=mental-health')
        .expect(200);

      response.body.resources.forEach(resource => {
        expect(resource.category).toBe('mental-health');
      });
    });

    test('should filter by difficulty', async () => {
      const response = await request(app)
        .get('/api/resources?difficulty=beginner')
        .expect(200);

      response.body.resources.forEach(resource => {
        expect(resource.difficulty).toBe('beginner');
      });
    });

    test('should search by title and description', async () => {
      const response = await request(app)
        .get('/api/resources?search=Anxiety')
        .expect(200);

      expect(response.body.resources.length).toBeGreaterThan(0);
    });

    test('should sort by popularity', async () => {
      const response = await request(app)
        .get('/api/resources?sortBy=popularity&sortOrder=desc')
        .expect(200);

      expect(response.body.resources).toBeDefined();
    });

    test('should sort by rating', async () => {
      const response = await request(app)
        .get('/api/resources?sortBy=rating&sortOrder=desc')
        .expect(200);

      expect(response.body.resources).toBeDefined();
    });
  });

  describe('GET /api/resources/:resourceId', () => {
    beforeEach(async () => {
      const resource = new Resource({
        title: 'Test Resource',
        description: 'A test resource for viewing',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved',
        visibility: 'public',
        content: { text: 'This is the full content of the resource' }
      });
      await resource.save();
      resourceId = resource._id;
    });

    test('should get resource details and increment view count', async () => {
      const response = await request(app)
        .get(`/api/resources/${resourceId}`)
        .expect(200);

      expect(response.body.resource).toBeDefined();
      expect(response.body.resource._id).toBe(resourceId.toString());
      expect(response.body.resource.content.text).toBeDefined();
    });

    test('should require authentication for private resources', async () => {
      // Create private resource
      const privateResource = new Resource({
        title: 'Private Resource',
        description: 'Only for authenticated users',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved',
        visibility: 'users-only'
      });
      await privateResource.save();

      const response = await request(app)
        .get(`/api/resources/${privateResource._id}`)
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    test('should return 404 for non-existent resource', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/resources/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/resources/:resourceId', () => {
    beforeEach(async () => {
      const resource = new Resource({
        title: 'Editable Resource',
        description: 'A resource that can be edited',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved'
      });
      await resource.save();
      resourceId = resource._id;
    });

    test('should update own resource successfully', async () => {
      const updateData = {
        description: 'Updated description',
        tags: 'updated,tags',
        difficulty: 'intermediate'
      };

      const response = await request(app)
        .put(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Resource updated successfully');
      expect(response.body.resource.description).toBe(updateData.description);
    });

    test('should not allow updating others resources', async () => {
      const response = await request(app)
        .put(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Unauthorized update'
        })
        .expect(403);

      expect(response.body.error).toBe('Not authorized to update this resource');
    });

    test('should allow admin to update any resource', async () => {
      const response = await request(app)
        .put(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          visibility: 'public'
        })
        .expect(200);

      expect(response.body.resource.status).toBe('approved');
    });
  });

  describe('DELETE /api/resources/:resourceId', () => {
    beforeEach(async () => {
      const resource = new Resource({
        title: 'Deletable Resource',
        description: 'A resource that can be deleted',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved'
      });
      await resource.save();
      resourceId = resource._id;
    });

    test('should delete own resource successfully', async () => {
      const response = await request(app)
        .delete(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .expect(200);

      expect(response.body.message).toBe('Resource deleted successfully');
    });

    test('should not allow deleting others resources', async () => {
      await request(app)
        .delete(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('should allow admin to delete any resource', async () => {
      const response = await request(app)
        .delete(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Resource deleted successfully');
    });
  });

  describe('POST /api/resources/:resourceId/rate', () => {
    beforeEach(async () => {
      const resource = new Resource({
        title: 'Ratable Resource',
        description: 'A resource that can be rated',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved',
        visibility: 'public'
      });
      await resource.save();
      resourceId = resource._id;
    });

    test('should rate resource successfully', async () => {
      const ratingData = {
        rating: 5,
        comment: 'Excellent resource, very helpful!'
      };

      const response = await request(app)
        .post(`/api/resources/${resourceId}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(ratingData)
        .expect(200);

      expect(response.body.message).toBe('Rating submitted successfully');
      expect(response.body.averageRating).toBeDefined();
      expect(response.body.totalRatings).toBe(1);
    });

    test('should validate rating range', async () => {
      const response = await request(app)
        .post(`/api/resources/${resourceId}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 6,
          comment: 'Invalid rating'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should not allow rating own resource', async () => {
      const response = await request(app)
        .post(`/api/resources/${resourceId}/rate`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          rating: 5,
          comment: 'Self rating attempt'
        })
        .expect(400);

      expect(response.body.error).toBe('Cannot rate your own resource');
    });

    test('should require authentication', async () => {
      await request(app)
        .post(`/api/resources/${resourceId}/rate`)
        .send({
          rating: 5,
          comment: 'No auth rating'
        })
        .expect(401);
    });
  });

  describe('POST /api/resources/:resourceId/bookmark', () => {
    beforeEach(async () => {
      const resource = new Resource({
        title: 'Bookmarkable Resource',
        description: 'A resource that can be bookmarked',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved',
        visibility: 'public'
      });
      await resource.save();
      resourceId = resource._id;
    });

    test('should bookmark resource successfully', async () => {
      const response = await request(app)
        .post(`/api/resources/${resourceId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Resource bookmarked');
      expect(response.body.bookmarked).toBe(true);
      expect(response.body.totalBookmarks).toBe(1);
    });

    test('should toggle bookmark (remove bookmark)', async () => {
      // Bookmark first
      await request(app)
        .post(`/api/resources/${resourceId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`);

      // Toggle (remove bookmark)
      const response = await request(app)
        .post(`/api/resources/${resourceId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Bookmark removed');
      expect(response.body.bookmarked).toBe(false);
    });

    test('should require authentication', async () => {
      await request(app)
        .post(`/api/resources/${resourceId}/bookmark`)
        .expect(401);
    });
  });

  describe('GET /api/resources/my-bookmarks', () => {
    beforeEach(async () => {
      const resource = new Resource({
        title: 'Bookmarked Resource',
        description: 'A bookmarked resource',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'approved',
        visibility: 'public',
        metadata: {
          bookmarks: [userId]
        }
      });
      await resource.save();
    });

    test('should get user bookmarks', async () => {
      const response = await request(app)
        .get('/api/resources/my-bookmarks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.bookmarks).toBeDefined();
      expect(Array.isArray(response.body.bookmarks)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/resources/my-bookmarks')
        .expect(401);
    });
  });

  describe('Admin Resource Management', () => {
    beforeEach(async () => {
      const resource = new Resource({
        title: 'Pending Resource',
        description: 'A resource pending approval',
        type: 'article',
        category: 'mental-health',
        uploadedBy: counselorId,
        status: 'pending-review'
      });
      await resource.save();
      resourceId = resource._id;
    });

    describe('GET /api/resources/pending', () => {
      test('should get pending resources for admin', async () => {
        const response = await request(app)
          .get('/api/resources/pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.resources).toBeDefined();
        expect(Array.isArray(response.body.resources)).toBe(true);
        response.body.resources.forEach(resource => {
          expect(resource.status).toBe('pending-review');
        });
      });

      test('should reject request from non-admin', async () => {
        await request(app)
          .get('/api/resources/pending')
          .set('Authorization', `Bearer ${counselorToken}`)
          .expect(403);
      });
    });

    describe('POST /api/resources/:resourceId/approve', () => {
      test('should approve resource successfully', async () => {
        const response = await request(app)
          .post(`/api/resources/${resourceId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ visibility: 'public' })
          .expect(200);

        expect(response.body.message).toBe('Resource approved successfully');
        expect(response.body.resource.status).toBe('approved');
        expect(response.body.resource.visibility).toBe('public');
      });

      test('should reject request from non-admin', async () => {
        await request(app)
          .post(`/api/resources/${resourceId}/approve`)
          .set('Authorization', `Bearer ${counselorToken}`)
          .expect(403);
      });
    });

    describe('POST /api/resources/:resourceId/reject', () => {
      test('should reject resource successfully', async () => {
        const response = await request(app)
          .post(`/api/resources/${resourceId}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Does not meet quality standards' })
          .expect(200);

        expect(response.body.message).toBe('Resource rejected');
        expect(response.body.resource.status).toBe('rejected');
      });

      test('should reject request from non-admin', async () => {
        await request(app)
          .post(`/api/resources/${resourceId}/reject`)
          .set('Authorization', `Bearer ${counselorToken}`)
          .expect(403);
      });
    });
  });
});