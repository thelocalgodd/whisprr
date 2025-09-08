import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (e) {
    console.error("MongoDB Connection Error");
    process.exit(1);
  }
}

export default connectDB;
