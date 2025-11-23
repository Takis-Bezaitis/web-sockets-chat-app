// backend/src/sockets/chatSocket.ts
import { Server, Socket } from "socket.io";
import { type UserPayload } from "../types/custom.js";
import { saveTheRoomMessage } from "../services/messages/messageService.js";

export interface CustomSocket extends Socket {
  user?: UserPayload;
}

export default function chatSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const customSocket = socket as CustomSocket;
    console.log(`User connected: ${socket.id}`);

    // --- ROOM SUBSCRIPTION (UI-level) ---
    // User opened a room in the UI and wants real-time updates for that room.
    customSocket.on("enterRoom", (roomId: string) => {
      if (!roomId) return;
      const roomChannel = `room:${roomId}`;
      console.log(`socket ${socket.id} enters ${roomChannel}`);
      customSocket.join(roomChannel);
      // Optionally notify only others in the room (not the joiner)
      customSocket.to(roomChannel).emit("presence:entered", {
        user: customSocket.user ?? null,
        roomId,
      });
    });

    // User closed/switched away from the room UI
    customSocket.on("exitRoom", (roomId: string) => {
      if (!roomId) return;
      const roomChannel = `room:${roomId}`;
      console.log(`socket ${socket.id} exits ${roomChannel}`);
      customSocket.leave(roomChannel);
      customSocket.to(roomChannel).emit("presence:left", {
        user: customSocket.user ?? null,
        roomId,
      });
    });

    // --- ROOM MEMBERSHIP (application-level) ---
    // These are semantic membership actions.
    // You might call these after a successful REST POST /rooms/:id/join
    // or you may call your membership service here to persist membership.
    customSocket.on("joinRoom", (roomId: string) => {
      // NOTE: Keep membership persistence in your REST endpoint or implement here.
      console.log(
        `membership join request by ${customSocket.user?.email ?? socket.id} for room ${roomId}`
      );
      // Notify room members 
      customSocket.join(`room:${roomId}`);
      customSocket.to(`room:${roomId}`).emit("membership:joined", {
        roomId,
      });
    });

    customSocket.on("leaveRoom", (roomId: string) => {
      console.log(
        `membership leave request by ${customSocket.user?.email ?? socket.id} for room ${roomId}`
      );
      // Notify room members
      customSocket.leave(`room:${roomId}`);
      customSocket.to(`room:${roomId}`).emit("membership:left", {
        roomId,
      });
    });

    // --- MESSAGES ---
    // Client -> server: create a message
    customSocket.on(
      "message:create",
      async (data: { roomId: string; text: string }) => {
        try {
          if (!customSocket.user) return;
          const { roomId, text } = data;
          if (!roomId || !text) return;

          // Persist message (this also invalidates Redis cache in your service).
          const saved = await saveTheRoomMessage({
            text,
            userId: Number(customSocket.user.id),
            roomId: Number(roomId),
          });

          // Broadcast the new message to everyone subscribed to that room channel.
          // Using room channel naming 'room:{id}' so it's consistent across code.
          const channel = `room:${roomId}`;
          io.to(channel).emit("message:new", saved);

          // Optionally acknowledge the sender (if client expects an ack)
          customSocket.emit("message:ack", { success: true, message: saved });
        } catch (err) {
          console.error("Failed to create message:", err);
          customSocket.emit("message:ack", { success: false, error: "server_error" });
        }
      }
    );

    // --- TYPING INDICATOR ---
    // Typing events only forwarded to other sockets in the room
    customSocket.on("typing", (payload: { roomId: string; user: string }) => {
      if (!payload?.roomId) return;
      const channel = `room:${payload.roomId}`;
      // notify everyone except the sender
      customSocket.to(channel).emit("typing:someone", {
        roomId: payload.roomId,
        userEmail: payload.user,
      });
    });

    customSocket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id} (${reason})`);
    });
  });
}
