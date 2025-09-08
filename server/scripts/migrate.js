import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/user.model.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/whisprr";

const migrations = [
  {
    name: "001_add_user_indexes",
    description: "Add missing indexes to User model",
    up: async () => {
      console.log("Creating user indexes...");
      await User.createIndexes();
    },
    down: async () => {
      console.log("Dropping user indexes...");
      await User.collection.dropIndexes();
    }
  },
  {
    name: "002_update_user_roles",
    description: "Ensure all users have valid roles",
    up: async () => {
      console.log("Updating user roles...");
      await User.updateMany(
        { role: { $nin: ["user", "counselor", "admin", "moderator"] } },
        { $set: { role: "user" } }
      );
    },
    down: async () => {
      console.log("Reverting user role updates...");
      // This is a one-way migration for data consistency
    }
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

async function runMigrations() {
  console.log("🔄 Running database migrations...");
  
  try {
    await connectDB();
    
    for (const migration of migrations) {
      console.log(`\n📄 Running migration: ${migration.name}`);
      console.log(`Description: ${migration.description}`);
      
      try {
        await migration.up();
        console.log(`✅ Migration ${migration.name} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error);
        throw error;
      }
    }
    
    console.log("\n🎉 All migrations completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
    process.exit(0);
  }
}

async function rollbackMigrations() {
  console.log("⏪ Rolling back database migrations...");
  
  try {
    await connectDB();
    
    for (const migration of migrations.reverse()) {
      console.log(`\n📄 Rolling back migration: ${migration.name}`);
      
      try {
        await migration.down();
        console.log(`✅ Rollback ${migration.name} completed`);
      } catch (error) {
        console.error(`❌ Rollback ${migration.name} failed:`, error);
        throw error;
      }
    }
    
    console.log("\n🎉 All rollbacks completed successfully!");
    
  } catch (error) {
    console.error("❌ Rollback failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run migrations if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollbackMigrations();
  } else {
    runMigrations();
  }
}

export { runMigrations, rollbackMigrations };