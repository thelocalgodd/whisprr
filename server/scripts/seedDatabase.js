require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Import all models
const User = require("../src/models/User");
const Message = require("../src/models/Message");
const Group = require("../src/models/Group");
const Session = require("../src/models/Session");
const Resource = require("../src/models/Resource");
const Notification = require("../src/models/Notification");

// Model validation enums - matching exactly from models
const userRoles = ["user", "counselor", "admin"];
const authMethods = ["password", "firebase"];
const verificationStatuses = [
  "pending",
  "approved",
  "rejected",
  "not_submitted",
];

const groupCategories = [
  "anxiety",
  "depression",
  "relationships",
  "trauma",
  "addiction",
  "grief",
  "self-esteem",
  "stress",
  "other",
];
const groupTypes = ["public", "private", "support-circle"];
const memberRoles = ["member", "moderator", "admin"];
const postingPermissions = ["all", "counselors-only", "moderators-only"];

const messageTypes = ["text", "image", "file", "audio", "video", "system"];

const sessionTypes = ["private", "group", "counseling", "support-circle"];
const sessionStatuses = ["active", "paused", "ended", "scheduled"];
const sentimentTypes = ["positive", "neutral", "negative", "mixed"];
const crisisSeverities = ["low", "medium", "high", "critical"];

const resourceTypes = [
  "article",
  "video",
  "audio",
  "pdf",
  "exercise",
  "worksheet",
  "guide",
  "tool",
];
const resourceCategories = [
  "mental-health",
  "coping-strategies",
  "self-help",
  "crisis-support",
  "relationships",
  "mindfulness",
  "therapy-techniques",
  "educational",
];
const resourceStatuses = [
  "draft",
  "pending-review",
  "approved",
  "rejected",
  "archived",
];
const visibilityTypes = ["public", "users-only", "counselors-only", "premium"];
const targetAudiences = [
  "teens",
  "adults",
  "seniors",
  "parents",
  "couples",
  "professionals",
];
const difficulties = ["beginner", "intermediate", "advanced"];
const licensingTypes = [
  "proprietary",
  "creative-commons",
  "public-domain",
  "custom",
];

const notificationTypes = [
  "message",
  "group_invite",
  "group_join",
  "group_leave",
  "counselor_request",
  "counselor_assignment",
  "session_scheduled",
  "session_reminder",
  "crisis_alert",
  "moderation_warning",
  "account_update",
  "system_announcement",
  "call_request",
  "call_missed",
  "resource_shared",
  "report_update",
];
const priorities = ["low", "normal", "high", "urgent"];
const notificationCategories = [
  "communication",
  "support",
  "security",
  "system",
  "social",
];

// Helper function to generate random date within range
const randomDate = (start = new Date(2024, 0, 1), end = new Date()) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Helper function to pick random element from array
const pickRandom = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to generate random boolean
const randomBoolean = () => Math.random() > 0.5;

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://thelocalgodd:!tlgspeed@whisprr.olusj6m.mongodb.net/?retryWrites=true&w=majority&appName=whisprr"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Message.deleteMany({});
    await Group.deleteMany({});
    await Session.deleteMany({});
    await Resource.deleteMany({});
    await Notification.deleteMany({});
    console.log("✅ Database cleared");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    throw error;
  }
};

// Seed Users
const seedUsers = async () => {
  console.log("👥 Seeding users...");
  const users = [];

  // Create admin users
  for (let i = 1; i <= 2; i++) {
    const admin = new User({
      username: `admin${i}`,
      email: `admin${i}@whisprr.com`,
      password: await bcrypt.hash("Admin123!", 10),
      role: "admin",
      authMethod: "password",
      isAnonymous: false,
      profile: {
        displayName: `Admin ${i}`,
        bio: `System administrator ${i}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin${i}`,
        timezone: "UTC",
        languages: ["English"],
      },
      security: {
        emailVerified: true,
        twoFactorEnabled: false,
      },
      notifications: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      notificationPreferences: {
        inApp: true,
        email: true,
        push: true,
      },
      status: {
        isOnline: randomBoolean(),
        lastSeen: randomDate(),
      },
    });
    users.push(admin);
  }

  // Create counselor users
  const counselorSpecializations = [
    ["Depression", "Anxiety", "Stress Management"],
    ["Relationships", "Family Issues", "Communication"],
    ["Addiction", "Recovery", "Behavioral Issues"],
    ["Trauma", "PTSD", "Grief Counseling"],
    ["Career Counseling", "Life Coaching", "Personal Development"],
  ];

  for (let i = 1; i <= 5; i++) {
    const counselor = new User({
      username: `counselor${i}`,
      email: `counselor${i}@whisprr.com`,
      password: await bcrypt.hash("Counselor123!", 10),
      role: "counselor",
      authMethod: "password",
      isAnonymous: false,
      counselorInfo: {
        isVerified: i <= 3, // First 3 counselors are verified
        verificationStatus:
          i <= 3 ? "approved" : i === 4 ? "pending" : "not_submitted",
        verificationDocuments: i <= 4 ? [`/docs/certificate_${i}.pdf`] : [],
        specializations: counselorSpecializations[i - 1],
        certifications:
          i <= 3
            ? [
                {
                  name: `Professional Counseling Certificate`,
                  issuer: "International Counseling Association",
                  dateObtained: randomDate(
                    new Date(2020, 0, 1),
                    new Date(2023, 0, 1)
                  ),
                  documentUrl: `/docs/cert_${i}.pdf`,
                },
              ]
            : [],
        availabilityStatus: randomBoolean(),
        rating: 3.5 + Math.random() * 1.5,
        totalSessions: Math.floor(Math.random() * 100),
      },
      profile: {
        displayName: `Dr. Counselor ${i}`,
        bio: `Experienced counselor specializing in ${counselorSpecializations[i - 1].join(", ")}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=counselor${i}`,
        pronouns: i % 2 === 0 ? "she/her" : "he/him",
        timezone: "UTC",
        languages: ["English", "Spanish"],
      },
      security: {
        emailVerified: true,
        twoFactorEnabled: i <= 2,
      },
      notifications: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      notificationPreferences: {
        inApp: true,
        email: true,
        push: i <= 3,
      },
      status: {
        isOnline: randomBoolean(),
        lastSeen: randomDate(),
      },
      statistics: {
        totalMessages: Math.floor(Math.random() * 500),
        totalSessions: Math.floor(Math.random() * 100),
        totalGroups: Math.floor(Math.random() * 10),
      },
    });
    users.push(counselor);
  }

  // Create regular users
  for (let i = 1; i <= 20; i++) {
    const isAnonymous = i > 15; // Last 5 users are anonymous
    const user = new User({
      username: isAnonymous
        ? `Anonymous_${crypto.randomBytes(3).toString("hex").toUpperCase()}`
        : `user${i}`,
      email: isAnonymous ? undefined : `user${i}@example.com`,
      password: await bcrypt.hash("User123!", 10),
      role: "user",
      authMethod: "password",
      isAnonymous: isAnonymous,
      profile: {
        displayName: isAnonymous ? undefined : `User ${i}`,
        bio: isAnonymous
          ? undefined
          : `Regular user seeking support and guidance`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
        timezone: "UTC",
        languages: ["English"],
      },
      privacy: {
        showOnlineStatus: !isAnonymous,
        allowDirectMessages: true,
        blockList: [],
      },
      security: {
        emailVerified: !isAnonymous,
        twoFactorEnabled: false,
        loginAttempts: Math.floor(Math.random() * 3),
      },
      notifications: {
        inApp: true,
        email: !isAnonymous,
        push: !isAnonymous && randomBoolean(),
        sms: false,
      },
      notificationPreferences: {
        inApp: true,
        email: !isAnonymous,
        push: !isAnonymous && randomBoolean(),
      },
      status: {
        isOnline: randomBoolean(),
        lastSeen: randomDate(),
      },
      statistics: {
        totalMessages: Math.floor(Math.random() * 200),
        totalSessions: Math.floor(Math.random() * 20),
        totalGroups: Math.floor(Math.random() * 5),
      },
      subscription: {
        type: i <= 5 ? "premium" : i <= 10 ? "free" : "free",
        startDate: i <= 5 ? randomDate(new Date(2024, 0, 1)) : undefined,
        endDate: i <= 5 ? new Date(2025, 11, 31) : undefined,
        autoRenew: i <= 5,
      },
    });
    users.push(user);
  }

  const savedUsers = await User.insertMany(users);
  console.log(`✅ Created ${savedUsers.length} users`);
  return savedUsers;
};

// Seed Groups
const seedGroups = async (users) => {
  console.log("👥 Seeding groups...");
  const groups = [];
  const counselors = users.filter((u) => u.role === "counselor");
  const regularUsers = users.filter((u) => u.role === "user");

  const groupTopics = [
    {
      name: "Depression Support Group",
      description: "A safe space for those dealing with depression",
      category: "depression",
    },
    {
      name: "Anxiety Warriors",
      description: "Support group for managing anxiety and panic attacks",
      category: "anxiety",
    },
    {
      name: "Relationship Advice",
      description: "Discuss relationship challenges and get advice",
      category: "relationships",
    },
    {
      name: "Trauma Recovery Circle",
      description: "Support for trauma survivors and their healing journey",
      category: "trauma",
    },
    {
      name: "Addiction Recovery",
      description: "Support for those on the path to recovery",
      category: "addiction",
    },
    {
      name: "Grief and Loss Support",
      description: "Support for those dealing with loss and grief",
      category: "grief",
    },
    {
      name: "Self-Esteem Building",
      description: "Building confidence and self-worth together",
      category: "self-esteem",
    },
    {
      name: "Stress Management Circle",
      description: "Learn techniques to manage daily stress",
      category: "stress",
    },
    {
      name: "General Support Group",
      description: "Open discussion for various life challenges",
      category: "other",
    },
    {
      name: "Mindfulness and Wellness",
      description: "Focus on mindfulness and personal wellness",
      category: "other",
    },
  ];

  for (const topic of groupTopics) {
    const creator = pickRandom(counselors);
    const memberCount = 5 + Math.floor(Math.random() * 15);
    const selectedMembers = regularUsers.slice(0, memberCount);

    const group = new Group({
      name: topic.name,
      description: topic.description,
      category: topic.category,
      type: pickRandom(groupTypes),
      creator: creator._id,
      moderators: [creator._id],
      members: [
        ...selectedMembers.map((m) => ({
          user: m._id,
          joinedAt: randomDate(),
          role: "member",
          isMuted: false,
        })),
        {
          user: creator._id,
          joinedAt: randomDate(new Date(2024, 0, 1), new Date(2024, 3, 1)),
          role: "admin",
          isMuted: false,
        },
      ],
      settings: {
        maxMembers: Math.random() > 0.3 ? 100 : 50,
        isPublic: Math.random() > 0.3,
        requiresApproval: Math.random() > 0.6,
        allowedUserTypes: {
          users: true,
          counselors: true,
        },
        autoDelete: {
          enabled: Math.random() > 0.8,
          afterDays: 30,
        },
        postingPermissions: pickRandom(postingPermissions),
      },
      rules: [
        { rule: "Be respectful and supportive", order: 1 },
        { rule: "No judgmental comments", order: 2 },
        { rule: "Maintain confidentiality", order: 3 },
        { rule: "No spam or self-promotion", order: 4 },
        { rule: "Stay on topic", order: 5 },
      ],
      tags: [topic.category, "support", "mental-health"],
      schedule: {
        isScheduled: Math.random() > 0.7,
        sessions: [],
      },
      statistics: {
        totalMessages: Math.floor(Math.random() * 500),
        totalMembers: memberCount + 1,
        activeMembers: Math.floor((memberCount + 1) * 0.7),
        lastActivity: randomDate(),
      },
      moderation: {
        reports: [],
        bannedUsers: [],
        warnings: [],
      },
      isActive: true,
      isArchived: false,
    });
    groups.push(group);
  }

  const savedGroups = await Group.insertMany(groups);
  console.log(`✅ Created ${savedGroups.length} groups`);
  return savedGroups;
};

// Seed Sessions
const seedSessions = async (users) => {
  console.log("📅 Seeding sessions...");
  const sessions = [];
  const counselors = users.filter(
    (u) => u.role === "counselor" && u.counselorInfo.isVerified
  );
  const clients = users.filter((u) => u.role === "user" && !u.isAnonymous);

  for (let i = 0; i < 30; i++) {
    const counselor = pickRandom(counselors);
    const client = pickRandom(clients);
    const sessionDate = randomDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    const status = pickRandom(sessionStatuses);

    const session = new Session({
      participants: [counselor._id, client._id],
      type: pickRandom(sessionTypes),
      counselor: counselor._id,
      status: status,
      startTime: status === "completed" ? sessionDate : undefined,
      endTime:
        status === "completed"
          ? new Date(sessionDate.getTime() + 60 * 60 * 1000)
          : undefined,
      scheduledTime: status === "scheduled" ? sessionDate : undefined,
      duration: status === "completed" ? 3600 : undefined,
      callInfo: {
        isVoiceCall: randomBoolean(),
        isVideoCall: randomBoolean(),
        callStartTime: status === "completed" ? sessionDate : undefined,
        callEndTime:
          status === "completed"
            ? new Date(sessionDate.getTime() + 60 * 60 * 1000)
            : undefined,
        callDuration: status === "completed" ? 3600 : undefined,
        participants:
          status === "completed"
            ? [
                {
                  user: counselor._id,
                  joinedAt: sessionDate,
                  leftAt: new Date(sessionDate.getTime() + 60 * 60 * 1000),
                  audioEnabled: true,
                  videoEnabled: randomBoolean(),
                },
                {
                  user: client._id,
                  joinedAt: sessionDate,
                  leftAt: new Date(sessionDate.getTime() + 60 * 60 * 1000),
                  audioEnabled: true,
                  videoEnabled: randomBoolean(),
                },
              ]
            : [],
      },
      feedback:
        status === "completed"
          ? [
              {
                user: client._id,
                rating: Math.floor(3 + Math.random() * 3), // 3-5 rating
                comment: "Very helpful session, thank you!",
                isHelpful: true,
                timestamp: new Date(sessionDate.getTime() + 60 * 60 * 1000),
              },
            ]
          : [],
      notes:
        status === "completed"
          ? {
              counselorNotes:
                "Session went well. Client showed progress in managing anxiety.",
              actionItems: [
                "Practice breathing exercises",
                "Journal daily emotions",
              ],
              followUpRequired: randomBoolean(),
              followUpDate: randomBoolean()
                ? new Date(sessionDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                : undefined,
              tags: ["anxiety", "progress", "breathing"],
            }
          : {},
      summary:
        status === "completed"
          ? {
              generatedSummary:
                "Productive session focusing on anxiety management techniques.",
              keyPoints: [
                "Client showed improvement",
                "Introduced new coping strategies",
              ],
              sentiment: pickRandom(sentimentTypes),
              topics: ["anxiety", "coping-strategies"],
            }
          : {},
      crisis: {
        flagged: Math.random() > 0.95, // Very rarely flag for crisis
        severity:
          Math.random() > 0.95 ? pickRandom(crisisSeverities) : undefined,
        interventionRequired: false,
        referralMade: false,
      },
      privacy: {
        isAnonymous: client.isAnonymous || false,
        dataRetentionDays: 30,
        consentGiven: true,
      },
      billing: {
        isPaid: status === "completed",
        amount: status === "completed" ? pickRandom([0, 50, 75, 100]) : 0,
        currency: "USD",
        paymentMethod: "subscription",
        transactionId:
          status === "completed"
            ? `txn_${crypto.randomBytes(8).toString("hex")}`
            : undefined,
      },
      isDeleted: false,
    });
    sessions.push(session);
  }

  const savedSessions = await Session.insertMany(sessions);
  console.log(`✅ Created ${savedSessions.length} sessions`);
  return savedSessions;
};

// Seed Messages
const seedMessages = async (users, groups) => {
  console.log("💬 Seeding messages...");
  const messages = [];

  // Sample message contents
  const sampleMessages = [
    "How is everyone doing today?",
    "I've been feeling much better lately",
    "Thank you for the support",
    "Can anyone relate to this feeling?",
    "I had a breakthrough in therapy today",
    "Remember to take care of yourselves",
    "This group has been so helpful",
    "I'm struggling today",
    "Does anyone have advice for dealing with anxiety?",
    "Sending positive vibes to everyone",
    "I appreciate this safe space",
    "Today was a good day",
    "Small steps lead to big changes",
    "You're not alone in this",
    "Keep going, you're doing great!",
  ];

  // Create direct messages between users
  for (let i = 0; i < 100; i++) {
    const sender = pickRandom(users);
    const recipient = pickRandom(users.filter((u) => u._id !== sender._id));

    const message = new Message({
      sender: sender._id,
      recipient: recipient._id,
      conversationId: [sender._id, recipient._id].sort().join("-"),
      messageType: "text",
      content: {
        text: pickRandom(sampleMessages),
      },
      encryption: {
        isEncrypted: true,
        algorithm: "AES",
      },
      status: {
        sent: true,
        delivered: randomBoolean(),
        read: Math.random() > 0.3,
        sentAt: randomDate(),
        deliveredAt: randomBoolean() ? randomDate() : undefined,
        readAt: Math.random() > 0.5 ? randomDate() : undefined,
      },
      metadata: {
        edited: Math.random() > 0.9,
        editedAt: Math.random() > 0.9 ? randomDate() : undefined,
      },
    });
    messages.push(message);
  }

  // Create group messages
  for (const group of groups) {
    const messageCount = 10 + Math.floor(Math.random() * 40);
    for (let i = 0; i < messageCount; i++) {
      const sender = pickRandom(
        users.filter((u) =>
          group.members.some(
            (member) => member.user.toString() === u._id.toString()
          )
        )
      );

      const message = new Message({
        sender: sender._id,
        group: group._id,
        conversationId: `group-${group._id}`,
        messageType: pickRandom(["text", "text", "text", "image", "system"]),
        content: {
          text: pickRandom(sampleMessages),
        },
        encryption: {
          isEncrypted: true,
          algorithm: "AES",
        },
        status: {
          sent: true,
          delivered: true,
          read: Math.random() > 0.2,
          sentAt: randomDate(),
          deliveredAt: randomDate(),
          readAt: Math.random() > 0.4 ? randomDate() : undefined,
        },
        reactions:
          Math.random() > 0.7
            ? [
                {
                  user: pickRandom(users)._id,
                  emoji: pickRandom(["👍", "❤️", "🤗", "💪", "🌟"]),
                  timestamp: randomDate(),
                },
              ]
            : [],
      });
      messages.push(message);
    }
  }

  const savedMessages = await Message.insertMany(messages);
  console.log(`✅ Created ${savedMessages.length} messages`);
  return savedMessages;
};

// Seed Resources
const seedResources = async (users) => {
  console.log("📚 Seeding resources...");
  const resources = [];
  const counselors = users.filter((u) => u.role === "counselor");
  const admins = users.filter((u) => u.role === "admin");

  const resourceData = [
    {
      title: "Understanding Depression: A Comprehensive Guide",
      description:
        "Learn about the causes, symptoms, and treatment options for depression",
      category: "mental-health",
      type: "article",
      tags: ["depression", "mental-health", "treatment"],
      targetAudience: ["adults"],
      difficulty: "beginner",
    },
    {
      title: "Anxiety Management Techniques",
      description: "Practical exercises and strategies for managing anxiety",
      category: "coping-strategies",
      type: "video",
      tags: ["anxiety", "coping-strategies", "self-help"],
      targetAudience: ["adults", "teens"],
      difficulty: "intermediate",
    },
    {
      title: "Building Healthy Relationships",
      description: "Guide to developing and maintaining healthy relationships",
      category: "relationships",
      type: "guide",
      tags: ["relationships", "communication", "boundaries"],
      targetAudience: ["couples", "adults"],
      difficulty: "beginner",
    },
    {
      title: "Stress Reduction Meditation",
      description: "Guided meditation for stress relief and relaxation",
      category: "mindfulness",
      type: "audio",
      tags: ["meditation", "stress", "relaxation"],
      targetAudience: ["adults", "seniors"],
      difficulty: "beginner",
    },
    {
      title: "Crisis Hotline Numbers",
      description: "Emergency contact numbers for immediate help",
      category: "crisis-support",
      type: "pdf",
      tags: ["crisis", "emergency", "hotline"],
      targetAudience: ["adults", "teens"],
      difficulty: "beginner",
    },
    {
      title: "Self-Care Worksheet",
      description: "Daily self-care activities for mental wellness",
      category: "self-help",
      type: "worksheet",
      tags: ["self-care", "wellness", "daily-routine"],
      targetAudience: ["adults"],
      difficulty: "beginner",
    },
    {
      title: "Understanding Trauma and PTSD",
      description: "Educational resource about trauma and its effects",
      category: "mental-health",
      type: "article",
      tags: ["trauma", "ptsd", "recovery"],
      targetAudience: ["adults", "professionals"],
      difficulty: "intermediate",
    },
    {
      title: "Cognitive Behavioral Therapy Techniques",
      description: "Professional CBT techniques and exercises for therapists",
      category: "therapy-techniques",
      type: "guide",
      tags: ["cbt", "therapy", "professional"],
      targetAudience: ["professionals"],
      difficulty: "advanced",
    },
    {
      title: "Teen Mental Health Educational Video",
      description:
        "Resources specifically for teenagers dealing with mental health",
      category: "educational",
      type: "video",
      tags: ["teen", "youth", "mental-health"],
      targetAudience: ["teens", "parents"],
      difficulty: "beginner",
    },
    {
      title: "Mindfulness Exercise Collection",
      description: "Collection of mindfulness exercises for daily practice",
      category: "mindfulness",
      type: "exercise",
      tags: ["mindfulness", "exercises", "practice"],
      targetAudience: ["adults", "teens"],
      difficulty: "intermediate",
    },
  ];

  for (const data of resourceData) {
    const author = pickRandom([...counselors, ...admins]);

    const resource = new Resource({
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      content: {
        text:
          data.type === "article"
            ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. This is comprehensive educational content about mental health topics."
            : undefined,
        fileUrl:
          data.type !== "article"
            ? `/resources/${data.type}/${data.title.toLowerCase().replace(/\s+/g, "-")}.${data.type === "video" ? "mp4" : data.type === "audio" ? "mp3" : "pdf"}`
            : undefined,
        duration:
          data.type === "video" || data.type === "audio"
            ? Math.floor(5 + Math.random() * 55)
            : undefined,
        pages:
          data.type === "pdf" || data.type === "guide"
            ? Math.floor(5 + Math.random() * 20)
            : undefined,
      },
      author: {
        name: `${author.username}`,
        credentials:
          author.role === "counselor"
            ? "Licensed Professional Counselor"
            : "Content Creator",
        bio: `Experienced ${author.role} specializing in mental health support`,
      },
      uploadedBy: author._id,
      approvedBy:
        author.role === "admin" ? author._id : pickRandom(admins)?._id,
      status: pickRandom(resourceStatuses),
      visibility: pickRandom(visibilityTypes),
      tags: data.tags,
      targetAudience: data.targetAudience,
      language: "en",
      difficulty: data.difficulty,
      estimatedTime: Math.floor(10 + Math.random() * 50),
      metadata: {
        views: Math.floor(Math.random() * 1000),
        downloads: Math.floor(Math.random() * 500),
        likes: Math.floor(Math.random() * 200),
        bookmarks: [], // Will be populated with user IDs later if needed
        ratings:
          Math.random() > 0.5
            ? [
                {
                  user: pickRandom(users)._id,
                  rating: Math.floor(3 + Math.random() * 3),
                  comment: "Very helpful resource!",
                  timestamp: randomDate(),
                },
              ]
            : [],
        averageRating: 3.5 + Math.random() * 1.5,
      },
      relatedResources: [],
      prerequisites: [],
      attachments: [],
      accessibility: {
        hasTranscript: data.type === "video" || data.type === "audio",
        hasClosedCaptions: data.type === "video",
        hasAudioDescription: data.type === "video" && Math.random() > 0.7,
        isScreenReaderFriendly: true,
      },
      licensing: {
        type: pickRandom(licensingTypes),
        details: "Licensed for educational and therapeutic use",
        attribution: `Created by ${author.username}`,
      },
      version: {
        number: "1.0.0",
        lastUpdated: randomDate(),
        changeLog: [
          {
            version: "1.0.0",
            changes: "Initial release",
            date: randomDate(),
          },
        ],
      },
      seo: {
        metaTitle: data.title,
        metaDescription: data.description,
        keywords: data.tags,
        slug: data.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-"),
      },
      isActive: true,
      publishedAt: randomDate(new Date(2024, 0, 1)),
    });
    resources.push(resource);
  }

  const savedResources = await Resource.insertMany(resources);
  console.log(`✅ Created ${savedResources.length} resources`);
  return savedResources;
};

// Seed Notifications
const seedNotifications = async (users, groups, sessions, messages) => {
  console.log("🔔 Seeding notifications...");
  const notifications = [];

  // Create various types of notifications for each user
  for (const user of users) {
    // Recent message notifications
    const userMessages = messages
      .filter(
        (m) => m.recipient && m.recipient.toString() === user._id.toString()
      )
      .slice(0, 3);

    for (const message of userMessages) {
      notifications.push(
        new Notification({
          recipient: user._id,
          sender: message.sender,
          type: "message",
          title: "New message received",
          message: "You have a new message in your conversation",
          data: {
            messageId: message._id,
          },
          priority: "normal",
          category: "communication",
          status: {
            read: randomBoolean(),
            readAt: randomBoolean() ? randomDate() : undefined,
          },
          delivery: {
            inApp: true,
            push: randomBoolean(),
            email: randomBoolean(),
            delivered: true,
            deliveredAt: randomDate(),
          },
          createdAt: randomDate(),
        })
      );
    }

    // Group invite notifications
    if (user.role === "user") {
      const randomGroup = pickRandom(groups);
      notifications.push(
        new Notification({
          recipient: user._id,
          type: "group_invite",
          title: "Group Invitation",
          message: `You've been invited to join "${randomGroup.name}"`,
          data: {
            groupId: randomGroup._id,
          },
          priority: "normal",
          category: "social",
          status: {
            read: randomBoolean(),
            readAt: randomBoolean() ? randomDate() : undefined,
          },
          delivery: {
            inApp: true,
            push: true,
            email: false,
            delivered: true,
            deliveredAt: randomDate(),
          },
          createdAt: randomDate(),
        })
      );
    }

    // Session notifications for clients and counselors
    const userSessions = sessions
      .filter((s) => s.client === user._id || s.counselor === user._id)
      .slice(0, 2);

    for (const session of userSessions) {
      if (session.status === "scheduled") {
        notifications.push(
          new Notification({
            recipient: user._id,
            type: "session_reminder",
            title: "Upcoming Session Reminder",
            message: `Your session is scheduled for ${session.scheduledFor}`,
            data: {
              sessionId: session._id,
            },
            priority: "high",
            category: "support",
            status: {
              read: randomBoolean(),
              readAt: randomBoolean() ? randomDate() : undefined,
            },
            delivery: {
              inApp: true,
              push: true,
              email: true,
              delivered: true,
              deliveredAt: randomDate(),
            },
            createdAt: randomDate(),
          })
        );
      }
    }

    // System announcements for all users
    if (Math.random() > 0.7) {
      notifications.push(
        new Notification({
          recipient: user._id,
          type: "system_announcement",
          title: "System Maintenance Notice",
          message:
            "Scheduled maintenance will occur this weekend from 2-4 AM UTC",
          priority: "normal",
          category: "system",
          status: {
            read: randomBoolean(),
            readAt: randomBoolean() ? randomDate() : undefined,
          },
          delivery: {
            inApp: true,
            push: false,
            email: true,
            delivered: true,
            deliveredAt: randomDate(),
          },
          metadata: {
            source: "system",
            tags: ["maintenance", "announcement"],
          },
          createdAt: randomDate(),
        })
      );
    }

    // Account update notifications
    if (Math.random() > 0.8) {
      notifications.push(
        new Notification({
          recipient: user._id,
          type: "account_update",
          title: "Security Update",
          message: "Your password was successfully changed",
          priority: "high",
          category: "security",
          status: {
            read: true,
            readAt: randomDate(),
          },
          delivery: {
            inApp: true,
            push: true,
            email: true,
            delivered: true,
            deliveredAt: randomDate(),
          },
          createdAt: randomDate(),
        })
      );
    }

    // Crisis alert for counselors and admins
    if (user.role === "counselor" || user.role === "admin") {
      if (Math.random() > 0.9) {
        notifications.push(
          new Notification({
            recipient: user._id,
            type: "crisis_alert",
            title: "Crisis Alert: Immediate Attention Required",
            message:
              "A user has triggered crisis keywords and needs immediate support",
            priority: "urgent",
            category: "security",
            status: {
              read: false,
              readAt: undefined,
            },
            delivery: {
              inApp: true,
              push: true,
              email: true,
              delivered: true,
              deliveredAt: new Date(),
            },
            data: {
              additionalInfo: {
                severity: "high",
                keywords: ["help", "crisis"],
              },
            },
            createdAt: new Date(),
          })
        );
      }
    }

    // Counselor verification notifications
    if (
      user.role === "counselor" &&
      user.counselorInfo.verificationStatus === "pending"
    ) {
      notifications.push(
        new Notification({
          recipient: user._id,
          type: "counselor_request",
          title: "Verification Status Update",
          message: "Your counselor verification is under review",
          priority: "normal",
          category: "support",
          status: {
            read: randomBoolean(),
            readAt: randomBoolean() ? randomDate() : undefined,
          },
          delivery: {
            inApp: true,
            push: true,
            email: true,
            delivered: true,
            deliveredAt: randomDate(),
          },
          createdAt: randomDate(),
        })
      );
    }
  }

  const savedNotifications = await Notification.insertMany(notifications);
  console.log(`✅ Created ${savedNotifications.length} notifications`);
  return savedNotifications;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    console.log("================================");

    await connectDB();

    // Ask for confirmation before clearing
    if (process.argv.includes("--clear")) {
      await clearDatabase();
    } else {
      console.log(
        "💡 Tip: Use --clear flag to clear existing data before seeding"
      );
    }

    // Seed data in order
    const users = await seedUsers();
    const groups = await seedGroups(users);
    const sessions = await seedSessions(users);
    const messages = await seedMessages(users, groups);
    const resources = await seedResources(users);
    const notifications = await seedNotifications(
      users,
      groups,
      sessions,
      messages
    );

    console.log("================================");
    console.log("✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Groups: ${groups.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(`   - Messages: ${messages.length}`);
    console.log(`   - Resources: ${resources.length}`);
    console.log(`   - Notifications: ${notifications.length}`);

    console.log("\n🔐 Test Credentials:");
    console.log("   Admin: admin1@whisprr.com / Admin123!");
    console.log("   Counselor: counselor1@whisprr.com / Counselor123!");
    console.log("   User: user1@example.com / User123!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run the seeding
seedDatabase();
