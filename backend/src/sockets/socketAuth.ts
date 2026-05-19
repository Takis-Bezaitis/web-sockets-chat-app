import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { type UserPayload } from "../types/custom.js";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET");
}

export interface CustomSocket extends Socket {
  user: UserPayload;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Not authenticated: no token"));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    (socket as CustomSocket).user = decoded;

    next();
  } catch (err) {
    next(new Error("Not authenticated: invalid token"));
  }
}
