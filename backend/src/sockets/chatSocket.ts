import { Server, Socket } from "socket.io";
import { type UserPayload } from "../types/custom.js";
import { saveTheRoomMessage, addMessageReaction, editMessage, deleteMessage } from "../services/messages/messageService.js";
import prisma from "../prismaClient.js";

export interface CustomSocket extends Socket {
  user?: UserPayload;
}

export default function chatSocket(io: Server) {
  const roomPresence: Record<string, Set<string>> = {};

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

      // Track presence of the user
      if (!roomPresence[roomId]) roomPresence[roomId] = new Set();

      if (customSocket.user?.id) {
        roomPresence[roomId].add(customSocket.user.id);
      }
    
      // Notify only others in the room (not the joiner)
      customSocket.to(roomChannel).emit("presence:entered", {
        user: customSocket.user ?? null,
        roomId,
      });

      // Send presence list to the joiner 
      customSocket.emit("presence:list", {
        roomId,
        users: Array.from(roomPresence[roomId]),
      });
    });

    // User closed/switched away from the room UI
    customSocket.on("exitRoom", (roomId: string) => {
      if (!roomId) return;
      const roomChannel = `room:${roomId}`;
      console.log(`socket ${socket.id} exits ${roomChannel}`);
      customSocket.leave(roomChannel);

      // Remove from tracking/presence
      if (roomPresence[roomId] && customSocket.user?.id) {
        roomPresence[roomId].delete(customSocket.user.id);
      }

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
        } catch (err) {
          console.error("Failed to create message:", err);
        }
      }
    );

    customSocket.on("message:edit", async (data: { id: number; roomId: number; text: string }) => {
      const { id, roomId, text } = data;
      try {
        const editedMessage = await editMessage({ id, roomId, text });

        const roomChannel = `room:${roomId}`;
        io.to(roomChannel).emit("message:edited", editedMessage);
      } catch (err) {
        console.error("Failed to create message:", err);
      }
    });

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

    customSocket.on("message:react", async(data: { emoji: string, userId: number, messageId: number }) => {
      try {
        const { emoji, userId, messageId } = data;

        // 1️⃣ Save reaction in DB
        const reaction = await addMessageReaction({ emoji, userId, messageId });

        // 2️⃣ Find the room of the message
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { roomId: true },
        });

        if (!message) return;

        const roomChannel = `room:${message.roomId}`;

        // 3️⃣ Broadcast the new reaction to everyone in the room
        // All clients will receive 'message:reaction:new'
        io.to(roomChannel).emit("message:reaction:new", {
          messageId,
          reaction,
        });
      } catch (err) {
        console.error("Failed to create reaction:", err);
      }
    });

    customSocket.on("message:delete", async({ id, roomId }: { id: number; roomId: number }) => {
      try {
        await deleteMessage(id);
        const roomChannel = `room:${roomId}`;
        io.to(roomChannel).emit("message:deleted", { id, roomId });
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    }); 

    customSocket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id} (${reason})`);

      const userId = customSocket.user?.id;
      if (!userId) return;

      try {
        // Loop through all rooms in presence memory
        for (const [roomId, members] of Object.entries(roomPresence)) {

          // If this room contains the user, remove them and notify others
          if (members.has(userId)) {

            // Remove from memory
            members.delete(userId);

            // Notify room
            io.to(`room:${roomId}`).emit("presence:left", {
              user: customSocket.user,
              roomId,
            });

            console.log(`Removed user ${userId} from room ${roomId} due to disconnect`);
          }
        }
      } catch (err) {
        console.error("Error broadcasting presence on disconnect:", err);
      }
    });

  });
}
