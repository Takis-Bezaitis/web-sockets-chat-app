import { type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type AuthRequest } from "../types/custom.js";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token = req.cookies.token; // read cookie
    console.log("authMiddleware token: ",token);

     // If no cookie token, try Authorization header (for Thunder Client, mobile apps, etc.)
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    console.log("authMiddleware decoded: ",decoded);
    console.log("authMiddleware JWT_SECRET: ",JWT_SECRET);

    req.user = decoded; // attach user info to request

    next(); // proceed to route handler
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
