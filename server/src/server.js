require("dotenv").config();

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/database");
const {
  handleConnection,
  setupSocketHandlers,
} = require("./websocket/socketHandlers");

const authRoutes = require("./routes/auth");
const counselorRoutes = require("./routes/counselors");
const messageRoutes = require("./routes/messages");
const groupRoutes = require("./routes/groups");
const callRoutes = require("./routes/calls");
const adminRoutes = require("./routes/admin");
const moderationRoutes = require("./routes/moderation");
const resourceRoutes = require("./routes/resources");
const notificationRoutes = require("./routes/notifications");

const { middleware, rateLimiters } = require("./middleware/security");

const app = express();
const server = createServer(app);

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://localhost:3002",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Access-Control-Allow-Origin",
    "Firebase-Token",
    "X-CSRF-Token",
  ],
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

app.set("trust proxy", 1);

app.use(middleware.requestId);
app.use(middleware.requestLogger);

if (process.env.NODE_ENV === "production") {
  app.use(middleware.helmet);
}

app.use(cors(corsOptions));
app.use(compression());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(middleware.securityHeaders);
app.use(middleware.detectSuspiciousActivity);
app.use(middleware.preventBruteForce);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(middleware.mongoSanitize);
app.use(middleware.hpp);
app.use(middleware.sanitizeInput);

app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.get("/", (req, res) => {
  res.json({
    name: "Whisprr API",
    version: "1.0.0",
    description: "Anonymous counseling platform backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/counselors", counselorRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

app.use((error, req, res, next) => {
  console.error("Global error handler:", {
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    requestId: req.requestId,
    url: req.url,
    method: req.method,
    body: req.body,
    userId: req.user?._id,
  });

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: Object.values(error.errors).map((e) => e.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({
      error: `${field} already exists`,
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request entity too large",
    });
  }

  res.status(error.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    requestId: req.requestId,
  });
});

io.on("connection", async (socket) => {
  try {
    await handleConnection(socket, io);
    setupSocketHandlers(socket, io);
  } catch (error) {
    console.error("Socket connection error:", error);
    socket.disconnect();
  }
});

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed.");

    if (global.mongoose && global.mongoose.connection) {
      global.mongoose.connection.close(() => {
        console.log("MongoDB connection closed.");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`
🚀 Whisprr Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || "development"}
🗄️  Database: Connected to MongoDB
🔥 Firebase: ${process.env.FIREBASE_PROJECT_ID ? "Enabled" : "Disabled"}
🔗 API Base: http://localhost:${PORT}/api
📊 Health Check: http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
