import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token, auth denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ 
      message: "Error verifying admin status",
      error: error.message 
    });
  }
};

export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ 
        message: "Error verifying user role",
        error: error.message 
      });
    }
  };
};

// Default export for backward compatibility
export default authenticateToken;
