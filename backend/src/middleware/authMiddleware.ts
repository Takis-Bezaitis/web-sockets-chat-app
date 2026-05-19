import { type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type AuthRequest } from "../types/custom.js";
import { AppError } from "../utils/AppError.js";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer ")) { 
      token = req.headers.authorization.split(" ")[1]; 
    }

    if (!token) {
      console.log("AUTH FAILED - NO TOKEN FOUND");
      throw new AppError("Not authenticated", 401);
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, { 
      issuer: "chat-app", 
      audience: "chat-app-users",
    }) as { id: string; email: string; username: string };

    req.user = decoded; 
    next(); 
  } catch (error) {
    console.log("AUTH FAILED - INVALID OR EXPIRED TOKEN");
    throw new AppError("Invalid or expired token", 401);
  }
}
