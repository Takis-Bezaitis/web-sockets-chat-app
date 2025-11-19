import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
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
    // Cookies are in socket.handshake.headers.cookie
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error("Not authenticated: no cookies"));
    }
    const parsed = cookie.parse(cookies);
    const token = parsed.token; // same name we used in res.cookie()

    if (!token) {
      return next(new Error("Not authenticated: no token"));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    // Attach user info to socket
    (socket as CustomSocket).user = decoded;

    next(); // success, go to connection handler
  } catch (err) {
    next(new Error("Not authenticated: invalid token"));
  }
}
