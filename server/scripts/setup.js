#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Whisprr Server Setup Script\n');

// Create required directories
const directories = [
  'uploads',
  'uploads/messages',
  'uploads/resources', 
  'uploads/verification',
  'logs'
];

console.log('📁 Creating directories...');
directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created ${dir}`);
  } else {
    console.log(`✅ ${dir} already exists`);
  }
});

// Generate environment file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('\n🔧 Setting up environment variables...');
  
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Generate secure keys
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  
  // Replace placeholder values
  envContent = envContent.replace('your_super_secret_jwt_key_here_change_in_production', jwtSecret);
  envContent = envContent.replace('your_refresh_token_secret_here', jwtRefreshSecret);
  envContent = envContent.replace('your_32_character_encryption_key_here', encryptionKey);
  envContent = envContent.replace('your_session_secret_here', sessionSecret);
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with secure keys');
} else if (!fs.existsSync(envExamplePath)) {
  console.log('❌ .env.example not found');
} else {
  console.log('✅ .env file already exists');
}

// Create a basic gitignore if it doesn't exist
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Uploads (development)
uploads/*/
!uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/

# Coverage
coverage/

# PM2
ecosystem.config.js
.pm2/

# Temporary files
temp/
tmp/
`;

  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Created .gitignore file');
}

// Create gitkeep files for upload directories
directories.filter(dir => dir.startsWith('uploads/')).forEach(dir => {
  const gitkeepPath = path.join(__dirname, '..', dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
});

console.log('\n🎉 Setup completed successfully!\n');

console.log('📋 Next steps:');
console.log('1. Update .env file with your MongoDB URI and other settings');
console.log('2. Install dependencies: npm install');
console.log('3. Start development server: npm run dev');
console.log('4. Visit http://localhost:5000/health to verify server is running\n');

console.log('🔧 Optional configurations:');
console.log('- Set up Firebase for anonymous authentication');
console.log('- Configure email settings for notifications');
console.log('- Set up Redis for better session management');
console.log('- Configure TURN servers for WebRTC\n');

console.log('📖 For more information, check README.md');