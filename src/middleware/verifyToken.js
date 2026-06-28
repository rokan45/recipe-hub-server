import { verifyJwt, JWT_COOKIE_NAME } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * Verify Token Middleware
 * Reads the custom JWT from the HTTPOnly cookie, verifies it,
 * and attaches the decoded user info to req.user.
 * Protects all dashboard / private API routes.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.[JWT_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: no token provided" });
    }

    const decoded = verifyJwt(token);
    req.user = decoded; // { id, email, role }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
};

/**
 * Verify Admin Middleware
 * Must be used AFTER verifyToken.
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: admin access required" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Forbidden: account blocked" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error verifying admin role" });
  }
};

/**
 * Verify Not Blocked
 * Ensures a logged in user hasn't been blocked by an admin.
 */
export const verifyNotBlocked = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error verifying user status" });
  }
};
