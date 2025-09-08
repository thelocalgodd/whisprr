# Whisprr Backend

A comprehensive real-time messaging application backend built with Node.js, Express, MongoDB, and Socket.IO.

## Features

### Core Features
- **Real-time messaging** with WebSocket support
- **User authentication** and authorization
- **Private and group conversations**
- **File uploads** (images, videos, audio, documents)
- **Message reactions** and replies
- **Read receipts** and typing indicators
- **User online/offline status**
- **Message search** and filtering
- **Push notifications**
- **User profiles** and contact management

### Advanced Features
- **Message editing and deletion**
- **Message forwarding**
- **Message pinning**
- **Conversation archiving and muting**
- **User blocking and privacy settings**
- **Comprehensive notification system**
- **Rate limiting and security**
- **Image compression and thumbnail generation**
- **Comprehensive logging and error handling**

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **File Upload**: Multer
- **Image Processing**: Sharp
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Custom logging system

## Project Structure

```
server/
├── api/
│   ├── app.js              # Express app configuration
│   └── server.js           # Server entry point
├── controllers/
│   ├── auth.controller.js       # Authentication logic
│   ├── user.controller.js       # User management
│   ├── conversation.controller.js   # Conversation management
│   ├── message.controller.js    # Message handling
│   ├── upload.controller.js     # File upload handling
│   ├── search.controller.js     # Search functionality
│   └── notification.controller.js  # Notification system
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── error-handler.js    # Error handling middleware
├── models/
│   ├── user.model.js       # User schema
│   ├── conversation.model.js   # Conversation schema
│   ├── message.model.js    # Message schema
│   └── group.model.js      # Group schema (legacy)
├── routes/
│   ├── auth.route.js       # Authentication routes
│   ├── user.route.js       # User routes
│   ├── conversation.route.js   # Conversation routes
│   ├── message.route.js    # Message routes
│   ├── upload.route.js     # File upload routes
│   ├── search.route.js     # Search routes
│   └── notification.route.js  # Notification routes
├── sockets/
│   └── index.js            # Socket.IO configuration
├── utils/
│   └── logger.js           # Logging utility
├── config/
│   └── db.js               # Database configuration
├── uploads/                # File upload directory
│   ├── images/
│   ├── videos/
│   ├── audio/
│   ├── files/
│   ├── avatars/
│   └── thumbnails/
├── logs/                   # Application logs
├── .env.example           # Environment variables template
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm >= 8.0.0

### 1. Clone the Repository
```bash
git clone <repository-url>
cd whisprr/server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/whisprr
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### 4. Start MongoDB
Make sure MongoDB is running on your system.

### 5. Start the Server
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### User Endpoints
- `GET /api/v1/users/profile/:userId` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/search` - Search users
- `GET /api/v1/users/contacts` - Get user contacts
- `POST /api/v1/users/contacts` - Add contact
- `DELETE /api/v1/users/contacts/:contactId` - Remove contact
- `POST /api/v1/users/block` - Block user
- `DELETE /api/v1/users/block/:userId` - Unblock user

### Conversation Endpoints
- `POST /api/v1/conversations/create` - Create conversation
- `GET /api/v1/conversations` - Get user conversations
- `GET /api/v1/conversations/:conversationId` - Get conversation details
- `PUT /api/v1/conversations/:conversationId` - Update conversation
- `DELETE /api/v1/conversations/:conversationId` - Delete conversation
- `POST /api/v1/conversations/:conversationId/participants` - Add participant
- `DELETE /api/v1/conversations/:conversationId/participants/:userId` - Remove participant

### Message Endpoints
- `POST /api/v1/messages/send` - Send message
- `GET /api/v1/messages/conversation/:conversationId` - Get conversation messages
- `PUT /api/v1/messages/:messageId` - Edit message
- `DELETE /api/v1/messages/:messageId` - Delete message
- `PUT /api/v1/messages/:messageId/read` - Mark message as read
- `POST /api/v1/messages/:messageId/react` - React to message
- `POST /api/v1/messages/:messageId/forward` - Forward message

### Upload Endpoints
- `POST /api/v1/upload/single` - Upload single file
- `POST /api/v1/upload/multiple` - Upload multiple files
- `GET /api/v1/upload/media/:filename` - Get uploaded media
- `DELETE /api/v1/upload/media/:filename` - Delete uploaded media

### Search Endpoints
- `GET /api/v1/search/global` - Global search
- `GET /api/v1/search/messages` - Search messages
- `GET /api/v1/search/users` - Search users
- `GET /api/v1/search/conversations` - Search conversations

### Notification Endpoints
- `GET /api/v1/notifications` - Get notifications
- `GET /api/v1/notifications/unread-count` - Get unread notification count
- `PUT /api/v1/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/v1/notifications/read-all` - Mark all notifications as read
- `DELETE /api/v1/notifications/:notificationId` - Delete notification

## WebSocket Events

### Client to Server Events
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `send-message` - Send a message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `mark-read` - Mark messages as read
- `call-user` - Initiate a call
- `accept-call` - Accept incoming call
- `reject-call` - Reject incoming call

### Server to Client Events
- `new-message` - New message received
- `user-typing` - User typing status
- `message-read` - Message read receipt
- `user-online` - User came online
- `user-offline` - User went offline
- `notification` - New notification
- `incoming-call` - Incoming call
- `call-accepted` - Call accepted
- `call-rejected` - Call rejected

## Database Models

### User Model
- User authentication and profile information
- Contacts and blocked users
- Notification settings and preferences
- Online status and activity tracking

### Conversation Model
- Private and group conversation support
- Participant management with roles
- Conversation settings and preferences
- Archive and mute functionality

### Message Model
- Text, media, and system messages
- Reply and forward functionality
- Reactions and read receipts
- Message editing and deletion

## Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **XSS Protection** with helmet and xss-clean
- **CORS** configuration for cross-origin requests
- **File Upload Security** with type and size validation

## Logging

The application includes comprehensive logging:
- **Error Logging** - All errors with stack traces
- **Request Logging** - HTTP requests with response times
- **Security Logging** - Authentication and authorization events
- **Performance Logging** - Slow operations and bottlenecks
- **Socket Logging** - WebSocket connection events

Logs are stored in the `logs/` directory with daily rotation.

## Development

### Scripts
```bash
npm run dev      # Start development server with hot reload
npm run start    # Start production server
npm run lint     # Check code formatting
npm run format   # Format code with Prettier
```

### Environment Variables
See `.env.example` for all available configuration options.

### Adding New Features
1. Create appropriate model in `models/`
2. Create controller in `controllers/`
3. Create routes in `routes/`
4. Add route to `api/app.js`
5. Update Socket.IO events in `sockets/index.js` if needed

## Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure SMTP for email notifications
5. Set up reverse proxy (nginx)
6. Configure SSL/TLS certificates
7. Set up process manager (PM2)

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.