import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Report from "../models/report.model.js";
import ContentFlag from "../models/contentFlag.model.js";
import CounselorApplication from "../models/counselorApplication.model.js";
import Group from "../models/group.model.js";
import Resource from "../models/resource.model.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/whisprr";

// Sample data
const sampleUsers = [
  {
    username: "admin_user",
    email: "admin@anonymous.com",
    password: "password123",
    fullName: "Administrator",
    role: "admin",
    isVerified: true,
    bio: "Platform administrator",
    status: "Online"
  },
  {
    username: "mod_user",
    email: "mod@anonymous.com", 
    password: "password123",
    fullName: "Moderator",
    role: "moderator",
    isVerified: true,
    bio: "Community moderator",
    status: "Available"
  },
  {
    username: "counselor_1",
    email: "counselor1@anonymous.com",
    password: "password123",
    fullName: "Licensed Counselor",
    role: "counselor",
    isVerified: true,
    bio: "Mental health professional",
    status: "Available for sessions"
  },
  {
    username: "counselor_2",
    email: "counselor2@anonymous.com",
    password: "password123",
    fullName: "Therapy Specialist",
    role: "counselor", 
    isVerified: true,
    bio: "Specialized in anxiety and depression",
    status: "In session"
  },
  {
    username: "user_001",
    email: "user1@anonymous.com",
    password: "password123",
    fullName: "Anonymous User",
    role: "user",
    isVerified: true,
    bio: "Seeking mental health support",
    status: "Looking for help"
  },
  {
    username: "user_002", 
    email: "user2@anonymous.com",
    password: "password123",
    fullName: "Community Member",
    role: "user",
    isVerified: true,
    bio: "Student dealing with stress",
    status: "Active"
  },
  {
    username: "user_003",
    email: "user3@anonymous.com",
    password: "password123",
    fullName: "Anonymous Person",
    role: "user",
    isVerified: false,
    bio: "New to the platform",
    status: "Exploring"
  },
  {
    username: "user_004",
    email: "user4@anonymous.com",
    password: "password123", 
    fullName: "Platform User",
    role: "user",
    isVerified: true,
    bio: "Advocate for mental health",
    status: "Helping others"
  },
  {
    username: "user_005",
    email: "user5@anonymous.com",
    password: "password123",
    fullName: "Anonymous Individual",
    role: "user",
    isVerified: true,
    bio: "Working professional",
    status: "Managing stress"
  },
  {
    username: "user_006",
    email: "user6@anonymous.com",
    password: "password123",
    fullName: "Community Helper",
    role: "user",
    isVerified: true,
    bio: "Volunteer peer supporter",
    status: "Ready to help"
  }
];

const sampleMessages = [
  "Hello everyone! Hope you're all doing well today 😊",
  "I'm feeling a bit anxious about my upcoming presentation. Any tips?",
  "Thanks for the support yesterday, it really helped!",
  "Remember to take breaks and practice self-care 💚",
  "Does anyone have experience with meditation apps?",
  "I had a breakthrough in therapy today. Feeling hopeful!",
  "It's okay to not be okay sometimes. You're not alone.",
  "Looking for accountability partners for daily walks",
  "Gratitude practice has been life-changing for me",
  "Anyone want to share what made them smile today?"
];

const sampleGroupNames = [
  "Anxiety Support Group",
  "Depression Recovery",
  "Student Mental Health",
  "Workplace Stress Relief",
  "Mindfulness & Meditation",
  "LGBTQ+ Safe Space",
  "New Parents Support",
  "Grief & Loss Support"
];

const sampleResources = [
  {
    title: "Understanding Anxiety: A Beginner's Guide",
    type: "article", 
    category: "anxiety",
    content: "Anxiety is a natural response to stress, but when it becomes overwhelming...",
    author: "Licensed Counselor",
    tags: ["anxiety", "beginners", "coping-strategies"],
    isPublished: true,
    featured: true
  },
  {
    title: "5 Minute Daily Meditation",
    type: "video",
    category: "mindfulness", 
    content: "A guided meditation session perfect for beginners...",
    author: "Therapy Specialist",
    tags: ["meditation", "mindfulness", "daily-practice"],
    isPublished: true,
    featured: false
  },
  {
    title: "Coping with Depression Worksheet",
    type: "worksheet",
    category: "depression",
    content: "Interactive worksheet to help identify triggers and coping mechanisms...",
    author: "Platform Team",
    tags: ["depression", "worksheet", "coping"],
    isPublished: true,
    featured: true
  },
  {
    title: "Building Healthy Relationships",
    type: "article",
    category: "relationships",
    content: "Communication is key to maintaining healthy relationships...",
    author: "Therapy Specialist", 
    tags: ["relationships", "communication", "healthy-habits"],
    isPublished: true,
    featured: false
  }
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log("🧹 Clearing existing data...");
  
  await User.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});
  await Report.deleteMany({});
  await ContentFlag.deleteMany({});
  await CounselorApplication.deleteMany({});
  await Group.deleteMany({});
  await Resource.deleteMany({});
  
  console.log("✅ Database cleared");
}

async function createUsers() {
  console.log("👥 Creating users...");
  
  const users = [];
  
  for (const userData of sampleUsers) {
    const user = new User({
      ...userData,
      isOnline: Math.random() > 0.5,
      lastSeen: new Date(Date.now() - Math.random() * 86400000 * 7), // Random within last week
    });
    
    await user.save();
    users.push(user);
  }
  
  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function createConversationsAndMessages(users) {
  console.log("💬 Creating conversations and messages...");
  
  const conversations = [];
  const messages = [];
  
  // Create some 1-on-1 conversations
  for (let i = 0; i < 15; i++) {
    const user1 = users[Math.floor(Math.random() * users.length)];
    const user2 = users[Math.floor(Math.random() * users.length)];
    
    if (user1._id.toString() !== user2._id.toString()) {
      const conversation = new Conversation({
        conversationType: "private",
        participants: [
          { userId: user1._id, role: "member" },
          { userId: user2._id, role: "member" }
        ],
        createdBy: user1._id,
        lastMessage: null,
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 3) // Random within last 3 days
      });
      
      await conversation.save();
      conversations.push(conversation);
      
      // Add 3-8 messages per conversation
      const messageCount = 3 + Math.floor(Math.random() * 6);
      let lastMessageId = null;
      
      for (let j = 0; j < messageCount; j++) {
        const sender = Math.random() > 0.5 ? user1 : user2;
        const messageText = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        
        const message = new Message({
          conversationId: conversation._id,
          senderId: sender._id,
          content: messageText,
          messageType: "text",
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 3 + (j * 300000)) // Spread over time
        });
        
        await message.save();
        messages.push(message);
        lastMessageId = message._id;
      }
      
      // Update conversation with last message
      conversation.lastMessage = lastMessageId;
      conversation.lastActivity = messages[messages.length - 1].timestamp;
      await conversation.save();
    }
  }
  
  console.log(`✅ Created ${conversations.length} conversations with ${messages.length} messages`);
  return { conversations, messages };
}

async function createGroups(users) {
  console.log("👥 Creating groups...");
  
  const groups = [];
  const counselors = users.filter(u => u.role === 'counselor');
  const regularUsers = users.filter(u => u.role === 'user');
  
  for (const groupName of sampleGroupNames) {
    const admin = counselors[Math.floor(Math.random() * counselors.length)];
    const memberCount = 5 + Math.floor(Math.random() * 15); // 5-20 members
    const members = [admin._id];
    
    // Add random users as members
    const shuffledUsers = [...regularUsers].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(memberCount - 1, shuffledUsers.length); i++) {
      members.push(shuffledUsers[i]._id);
    }
    
    const group = new Group({
      name: groupName,
      description: `A supportive community for ${groupName.toLowerCase()}`,
      type: "support",
      privacy: "public",
      admin: admin._id,
      members: members.map(memberId => ({
        user: memberId,
        role: memberId.toString() === admin._id.toString() ? "admin" : "member",
        joinedAt: new Date(Date.now() - Math.random() * 86400000 * 30) // Random within last month
      })),
      memberCount: members.length,
      isActive: true
    });
    
    await group.save();
    groups.push(group);
  }
  
  console.log(`✅ Created ${groups.length} groups`);
  return groups;
}

async function createReports(users, messages) {
  console.log("📋 Creating reports...");
  
  const reports = [];
  const reasons = ["harassment", "spam", "inappropriate", "abuse", "other"];
  const priorities = ["low", "medium", "high", "urgent"];
  const statuses = ["open", "reviewed", "resolved", "dismissed"];
  
  for (let i = 0; i < 20; i++) {
    const reporter = users[Math.floor(Math.random() * users.length)];
    const target = users[Math.floor(Math.random() * users.length)];
    
    if (reporter._id.toString() !== target._id.toString()) {
      const reportType = Math.random() > 0.5 ? "message" : "user";
      
      const report = new Report({
        type: reportType,
        reporter: reporter._id,
        target: target._id,
        messageId: reportType === "message" && messages.length > 0 ? 
          messages[Math.floor(Math.random() * messages.length)]._id : undefined,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        description: "This content violates community guidelines and needs review.",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)]
      });
      
      await report.save();
      reports.push(report);
    }
  }
  
  console.log(`✅ Created ${reports.length} reports`);
  return reports;
}

async function createContentFlags(users, messages) {
  console.log("🚩 Creating content flags...");
  
  const flags = [];
  const categories = ["harassment", "hate-speech", "violence", "sexual", "spam", "self-harm", "other"];
  const severities = ["low", "medium", "high", "critical"];
  const statuses = ["open", "reviewed", "actioned", "dismissed"];
  const detectionMethods = ["AI", "user-report", "manual"];
  
  const flaggedContent = [
    "This is inappropriate content that needs review",
    "Spam message promoting fake products",
    "Harassing message targeting specific user",
    "Content containing hate speech",
    "Violent threats against other users",
    "Self-harm related concerning content",
    "Sexual content inappropriate for platform"
  ];
  
  for (let i = 0; i < 15; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const content = flaggedContent[Math.floor(Math.random() * flaggedContent.length)];
    
    const flag = new ContentFlag({
      contentType: "message",
      messageId: messages.length > 0 ? messages[Math.floor(Math.random() * messages.length)]._id : undefined,
      userId: user._id,
      content: content,
      category: categories[Math.floor(Math.random() * categories.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      confidence: 0.3 + Math.random() * 0.7, // 0.3 to 1.0
      detectionMethod: detectionMethods[Math.floor(Math.random() * detectionMethods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
    
    await flag.save();
    flags.push(flag);
  }
  
  console.log(`✅ Created ${flags.length} content flags`);
  return flags;
}

async function createCounselorApplications(users) {
  console.log("📋 Creating counselor applications...");
  
  const applications = [];
  const specializations = ["anxiety", "depression", "trauma", "substance_abuse", "family_therapy", "couples_therapy"];
  const statuses = ["submitted", "under_review", "pending_documents", "approved", "rejected"];
  
  // Create applications for some regular users
  const regularUsers = users.filter(u => u.role === 'user');
  
  for (let i = 0; i < 8; i++) {
    const user = regularUsers[i];
    if (!user) continue;
    
    const application = new CounselorApplication({
      userId: user._id,
      applicationData: {
        firstName: "Anonymous",
        lastName: "Applicant",
        dateOfBirth: new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        phoneNumber: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        address: {
          street: `${Math.floor(Math.random() * 9999)} Main St`,
          city: "Anytown",
          state: "CA",
          zipCode: String(Math.floor(Math.random() * 90000) + 10000),
          country: "United States"
        },
        education: [{
          degree: "Master of Social Work",
          institution: "University of California",
          graduationYear: 2015 + Math.floor(Math.random() * 8),
          gpa: 3.2 + Math.random() * 0.8
        }],
        licenses: [{
          licenseType: "Licensed Clinical Social Worker",
          licenseNumber: `LCSW${Math.floor(Math.random() * 10000)}`,
          issuingState: "CA",
          issueDate: new Date(2018, 0, 1),
          expirationDate: new Date(2025, 0, 1),
          status: "active"
        }],
        experience: [{
          position: "Clinical Therapist",
          organization: "Community Mental Health Center",
          startDate: new Date(2018, 0, 1),
          endDate: Math.random() > 0.5 ? new Date(2023, 0, 1) : null,
          isCurrent: Math.random() > 0.5,
          description: "Provided individual and group therapy for adults with various mental health conditions."
        }],
        specializations: specializations.slice(0, 2 + Math.floor(Math.random() * 3)),
        motivation: "I am passionate about helping people overcome mental health challenges and believe in the power of accessible mental health care through technology.",
        availability: {
          hoursPerWeek: 20 + Math.floor(Math.random() * 40),
          preferredSchedule: ["mornings", "afternoons", "evenings", "flexible"][Math.floor(Math.random() * 4)],
          timeZone: "America/Los_Angeles"
        },
        agreements: {
          termsOfService: true,
          privacyPolicy: true,
          codeOfConduct: true,
          continuingEducation: true
        }
      },
      status: statuses[Math.floor(Math.random() * statuses.length)],
      submittedAt: new Date(Date.now() - Math.random() * 86400000 * 30)
    });
    
    await application.save();
    applications.push(application);
  }
  
  console.log(`✅ Created ${applications.length} counselor applications`);
  return applications;
}

async function createResources(users) {
  console.log("📚 Creating resources...");
  
  const resources = [];
  const counselors = users.filter(u => u.role === 'counselor');
  
  for (const resourceData of sampleResources) {
    const author = resourceData.author === "Platform Team" ? 
      users.find(u => u.role === 'admin') :
      counselors.find(u => u.fullName === resourceData.author) || counselors[0];
    
    const resource = new Resource({
      ...resourceData,
      author: author._id,
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 200),
      downloads: resourceData.type === "worksheet" ? Math.floor(Math.random() * 100) : 0
    });
    
    await resource.save();
    resources.push(resource);
  }
  
  console.log(`✅ Created ${resources.length} resources`);
  return resources;
}

async function addUserRelationships(users) {
  console.log("👥 Adding user relationships...");
  
  // Add some contacts and blocked users
  for (const user of users.slice(0, 8)) { // Only for first 8 users
    const otherUsers = users.filter(u => u._id.toString() !== user._id.toString());
    
    // Add 2-5 contacts
    const contactCount = 2 + Math.floor(Math.random() * 4);
    const contacts = otherUsers.slice(0, contactCount);
    
    for (const contact of contacts) {
      user.addContact(contact._id, Math.random() > 0.7 ? `Nickname for ${contact.username}` : null);
    }
    
    // Block 0-2 users
    if (Math.random() > 0.6) {
      const blockedUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      user.blockUser(blockedUser._id);
    }
    
    await user.save();
  }
  
  console.log("✅ Added user relationships");
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  
  try {
    await connectDB();
    await clearDatabase();
    
    const users = await createUsers();
    const { conversations, messages } = await createConversationsAndMessages(users);
    const groups = await createGroups(users);
    const reports = await createReports(users, messages);
    const contentFlags = await createContentFlags(users, messages);
    const applications = await createCounselorApplications(users);
    const resources = await createResources(users);
    
    await addUserRelationships(users);
    
    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`
📊 Summary:
- Users: ${users.length}
- Conversations: ${conversations.length}
- Messages: ${messages.length}  
- Groups: ${groups.length}
- Reports: ${reports.length}
- Content Flags: ${contentFlags.length}
- Counselor Applications: ${applications.length}
- Resources: ${resources.length}
    `);
    
    console.log("\n👤 Sample Login Credentials (username / password):");
    console.log("Admin: admin_user / password123");
    console.log("Moderator: mod_user / password123");
    console.log("Counselor: counselor_1 / password123");
    console.log("User: user_001 / password123");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seeder
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;