# Whisprr Backend API

A comprehensive backend server for an anonymous counseling platform built with Node.js, Express.js, MongoDB, Socket.io, and WebRTC.

## 🚀 Features

- **Dual Authentication System**: JWT-based and Firebase Anonymous Authentication
- **Real-time Messaging**: Encrypted group and private messaging with Socket.io
- **Voice/Video Calls**: WebRTC integration for counselor sessions
- **Counselor Verification**: Document upload and admin approval system
- **Safety & Moderation**: Crisis keyword detection, content reporting, panic button
- **Resource Library**: Counselors and admins can upload educational resources
- **Admin Dashboard**: Comprehensive user management and analytics
- **Security**: Rate limiting, input sanitization, CSRF protection, and more

## 📋 Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Socket.io Events](#socketio-events)
- [Database Models](#database-models)
- [Security Features](#security-features)
- [Deployment](#deployment)

## 🛠 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd whisprr/server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create upload directories**
```bash
mkdir -p uploads/{messages,resources,verification}
```

5. **Start the development server**
```bash
npm run dev
```

## 🔧 Environment Variables

Create a `.env` file in the server root with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/whisprr
MONGODB_URI_TEST=mongodb://localhost:27017/whisprr_test

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Encryption Keys
ENCRYPTION_KEY=your_32_character_encryption_key_here
ENCRYPTION_IV=your_16_char_iv

# Frontend URLs
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Crisis Detection Keywords
CRISIS_KEYWORDS=suicide,kill myself,end it all,harm myself,self-harm

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📊 API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "password": "string (min 8 chars)",
  "email": "string (optional)",
  "role": "user|counselor" (default: user)
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "role": "user",
    "isAnonymous": false
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

#### Firebase Authentication
```http
POST /api/auth/firebase
Headers:
  Firebase-Token: firebase_id_token
```

#### Get Profile
```http
GET /api/auth/profile
Headers:
  Authorization: Bearer jwt_token
```

#### Update Profile
```http
PUT /api/auth/profile
Headers:
  Authorization: Bearer jwt_token
Content-Type: application/json

{
  "profile": {
    "displayName": "string",
    "bio": "string",
    "pronouns": "string"
  },
  "preferences": {
    "theme": "light|dark|auto",
    "language": "en"
  }
}
```

### Messages Routes (`/api/messages`)

#### Send Message
```http
POST /api/messages
Headers:
  Authorization: Bearer jwt_token
Content-Type: application/json

{
  "recipient": "user_id (for private messages)",
  "group": "group_id (for group messages)",
  "content": {
    "text": "message content"
  },
  "messageType": "text|image|file|audio|video",
  "replyTo": "message_id (optional)"
}
```

#### Get Messages
```http
GET /api/messages/:conversationId?page=1&limit=50
Headers:
  Authorization: Bearer jwt_token
```

#### Get Conversations
```http
GET /api/messages/conversations?type=private|group
Headers:
  Authorization: Bearer jwt_token
```

### Groups Routes (`/api/groups`)

#### Create Group
```http
POST /api/groups
Headers:
  Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "string (3-100 chars)",
  "description": "string (10-500 chars)",
  "category": "anxiety|depression|relationships|trauma|addiction|grief|self-esteem|stress|other",
  "type": "public|private|support-circle",
  "maxMembers": 100,
  "requiresApproval": false
}
```

#### Get Groups
```http
GET /api/groups?page=1&limit=20&category=anxiety&search=keyword
```

#### Join Group
```http
POST /api/groups/:groupId/join
Headers:
  Authorization: Bearer jwt_token
```

### Counselor Routes (`/api/counselors`)

#### Apply for Verification
```http
POST /api/counselors/apply-verification
Headers:
  Authorization: Bearer jwt_token
Content-Type: multipart/form-data

{
  "specializations": ["anxiety", "depression"],
  "certifications": [
    {
      "name": "Licensed Clinical Social Worker",
      "issuer": "State Board",
      "dateObtained": "2020-01-01"
    }
  ],
  "documents": [file uploads]
}
```

#### Get Counselors
```http
GET /api/counselors?verified=true&available=true&specialization=anxiety&sortBy=rating
```

### Calls Routes (`/api/calls`)

#### Initiate Call
```http
POST /api/calls/initiate
Headers:
  Authorization: Bearer jwt_token
Content-Type: application/json

{
  "recipientId": "user_id (for private call)",
  "groupId": "group_id (for group call)",
  "callType": "voice|video"
}
```

#### Join Call
```http
POST /api/calls/:callId/join
Headers:
  Authorization: Bearer jwt_token
```

### Admin Routes (`/api/admin`)

#### Get Dashboard Statistics
```http
GET /api/admin/dashboard
Headers:
  Authorization: Bearer jwt_token (admin role required)
```

#### Get Users
```http
GET /api/admin/users?role=counselor&status=active&search=username
Headers:
  Authorization: Bearer jwt_token (admin role required)
```

### Moderation Routes (`/api/moderation`)

#### Report Content
```http
POST /api/moderation/report
Headers:
  Authorization: Bearer jwt_token
Content-Type: application/json

{
  "contentId": "message_id or user_id",
  "contentType": "message|user|group",
  "reason": "harassment|hate_speech|inappropriate_content|spam|self_harm|threatening_behavior|other",
  "description": "string (10-500 chars)"
}
```

#### Panic Button
```http
POST /api/moderation/panic
Headers:
  Authorization: Bearer jwt_token
Content-Type: application/json

{
  "location": "optional location info",
  "severity": "critical"
}
```

#### Get Crisis Resources
```http
GET /api/moderation/crisis-resources
```

### Resources Routes (`/api/resources`)

#### Create Resource
```http
POST /api/resources
Headers:
  Authorization: Bearer jwt_token (counselor or admin role required)
Content-Type: multipart/form-data

{
  "title": "string (5-200 chars)",
  "description": "string (10-1000 chars)",
  "type": "article|video|audio|pdf|exercise|worksheet|guide|tool",
  "category": "mental-health|coping-strategies|self-help|crisis-support|relationships|mindfulness|therapy-techniques|educational",
  "tags": "tag1,tag2,tag3",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": 30,
  "file": [file upload]
}
```

#### Get Resources
```http
GET /api/resources?category=mental-health&type=article&difficulty=beginner&search=keyword&page=1&limit=20
```

## 🔌 Socket.io Events

### Client to Server Events

#### Connection
```javascript
// Client connects with JWT token
socket.auth = { token: 'jwt_token' };
socket.connect();
```

#### Send Message
```javascript
socket.emit('message:send', {
  recipient: 'user_id', // or group: 'group_id'
  content: { text: 'Hello' },
  messageType: 'text'
});
```

#### Join Room
```javascript
socket.emit('room:join', {
  roomId: 'conversation_id_or_group_id',
  roomType: 'conversation|group|call'
});
```

#### Typing Indicator
```javascript
socket.emit('message:typing', {
  conversationId: 'conversation_id',
  isTyping: true
});
```

### Server to Client Events

#### New Message
```javascript
socket.on('message:new', (data) => {
  console.log('New message:', data.message);
  console.log('Crisis detected:', data.crisisDetected);
});
```

#### User Status
```javascript
socket.on('user:online', (data) => {
  console.log('User came online:', data.userId);
});

socket.on('user:offline', (data) => {
  console.log('User went offline:', data.userId);
});
```

#### Call Events
```javascript
socket.on('call:signal', (data) => {
  // Handle WebRTC signaling
});

socket.on('call:user-joined', (data) => {
  console.log('User joined call:', data.userId);
});
```

## 🗃️ Database Models

### User Model
```javascript
{
  username: String, // Required, unique
  email: String, // Optional
  password: String, // Required if not Firebase user
  firebaseUid: String, // For Firebase users
  role: 'user|counselor|admin',
  authMethod: 'password|firebase',
  isAnonymous: Boolean,
  
  counselorInfo: {
    isVerified: Boolean,
    verificationStatus: 'pending|approved|rejected|not_submitted',
    specializations: [String],
    certifications: [{
      name: String,
      issuer: String,
      dateObtained: Date
    }],
    rating: Number,
    totalSessions: Number
  },
  
  profile: {
    displayName: String,
    bio: String,
    avatar: String,
    pronouns: String
  },
  
  privacy: {
    blockList: [ObjectId],
    allowDirectMessages: Boolean
  },
  
  statistics: {
    totalMessages: Number,
    totalGroupsJoined: Number,
    totalSessionsAttended: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  sender: ObjectId, // Required
  recipient: ObjectId, // For private messages
  group: ObjectId, // For group messages
  conversationId: String, // Required
  messageType: 'text|image|file|audio|video|system',
  
  content: {
    text: String,
    encryptedText: String, // AES encrypted
    mediaUrl: String,
    fileName: String,
    fileSize: Number
  },
  
  status: {
    sent: Boolean,
    delivered: Boolean,
    read: Boolean,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date
  },
  
  reactions: [{
    user: ObjectId,
    emoji: String,
    timestamp: Date
  }],
  
  crisis: {
    detected: Boolean,
    keywords: [String],
    severity: 'low|medium|high|critical'
  },
  
  expiresAt: Date, // Auto-delete after 30 days
  
  createdAt: Date,
  updatedAt: Date
}
```

### Group Model
```javascript
{
  name: String, // Required
  description: String, // Required
  category: String, // Required
  type: 'public|private|support-circle',
  creator: ObjectId,
  moderators: [ObjectId],
  
  members: [{
    user: ObjectId,
    role: 'member|moderator|admin',
    joinedAt: Date,
    isMuted: Boolean
  }],
  
  settings: {
    maxMembers: Number,
    requiresApproval: Boolean,
    allowedUserTypes: {
      users: Boolean,
      counselors: Boolean
    }
  },
  
  statistics: {
    totalMessages: Number,
    totalMembers: Number,
    lastActivity: Date
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Messages**: 30 messages per minute
- **File Uploads**: 10 uploads per hour
- **Calls**: 20 call initiations per hour

### Input Sanitization
- XSS protection with `xss` library
- NoSQL injection prevention with `express-mongo-sanitize`
- Parameter pollution prevention with `hpp`
- Suspicious pattern detection

### Encryption
- Message content encrypted with AES
- JWT tokens for authentication
- Secure HTTP headers with Helmet.js

### Content Moderation
- Crisis keyword detection
- Automated content flagging
- Manual moderation tools for counselors/admins
- User reporting system

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure MongoDB connection
4. Set up Firebase (if using)
5. Configure CORS for your frontend domains

### Production Considerations
- Use PM2 or similar process manager
- Set up MongoDB replica set
- Configure Redis for session storage (optional)
- Enable HTTPS
- Set up monitoring and logging
- Configure file storage (AWS S3, etc.)

### Docker Setup
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Check Endpoint
```http
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2023-12-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "production"
}
```

## 📝 API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": ["validation error 1", "validation error 2"],
  "requestId": "unique_request_id"
}
```

### Pagination Response
```json
{
  "data": [/* array of items */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📜 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Whisprr Backend API** - Secure, scalable, and feature-rich backend for anonymous counseling platform.