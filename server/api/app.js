import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import { errorHandler } from "../middleware/error-handler.js";

// Import routes
import authRoutes from "../routes/auth.route.js";
import userRoutes from "../routes/user.route.js";
import conversationRoutes from "../routes/conversation.route.js";
import messageRoutes from "../routes/message.route.js";
import searchRoutes from "../routes/search.route.js";
import notificationRoutes from "../routes/notification.route.js";
import uploadRoutes from "../routes/upload.route.js";
import groupRoutes from "../routes/group.route.js";
import chatRoutes from "../routes/chat.route.js";
import adminRoutes from "../routes/admin.route.js";
import resourceRoutes from "../routes/resource.route.js";

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.ADMIN_URL || "http://localhost:3001",
    "http://localhost:3002",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
// app.use(mongoSanitize());
app.use(xss());

// Apply rate limiting to API routes
app.use("/api/", limiter);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/resources", resourceRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Whisprr API");
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
