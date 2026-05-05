import { Server, Socket } from "socket.io";
import { type UserPayload } from "../types/custom.js";
import { createMessage, addReactionToMessage, editMessage, deleteMessage } from "../services/messages/messageService.js";
import prisma from "../prismaClient.js";
import {
  addUserToRoomPresence,
  removeUserFromRoomPresence,
  getRoomPresence,
  refreshRoomPresence,
  removeUserFromOnlineUsers,
  removeUserFromAllRooms,
  addUserToOnlineUsers,
  getOnlineUsers,
} from "../utils/presence.js";
import { MESSAGE_MAX_LENGTH } from "../constants/message.js";

export interface CustomSocket extends Socket {
  user?: UserPayload;
}

export async function syncOnlineUsers(customSocket: CustomSocket) {
  const userId = customSocket.user?.id;
  if (!userId) return;

  const wasAdded = await addUserToOnlineUsers(userId, customSocket.id);

  const onlineUsers = await getOnlineUsers();
  customSocket.emit("onlineUsers:list", { onlineUsers });

  if (wasAdded) {
    customSocket.broadcast.emit("onlineUser:added", { userId });
  }
}

export default function chatSocket(io: Server) {

  io.on("connection", (socket: Socket) => {
    const customSocket = socket as CustomSocket;
    if (!customSocket.user) return;
    customSocket.data.userId = customSocket.user.id;
    console.log(`User connected: ${socket.id}`);

    customSocket.join(`user:${customSocket.user.id}`);
    syncOnlineUsers(customSocket);

    customSocket.on("enterRoom", async (roomId: string) => {
      if (!roomId || !customSocket.user) return;

      const roomChannel = `room:${roomId}`;
      customSocket.join(roomChannel);

      await addUserToRoomPresence(customSocket.user.id, roomId);

      customSocket.to(roomChannel).emit("presence:entered", {
        user: customSocket.user,
        roomId,
      });

      const users = await getRoomPresence(roomId);
      customSocket.emit("presence:list", {
        roomId,
        users,
      });
    });

    customSocket.on("exitRoom", async (roomId: string) => {
      if (!roomId || !customSocket.user) return;
      const roomChannel = `room:${roomId}`;
      customSocket.leave(roomChannel);

      await removeUserFromRoomPresence(customSocket.user.id, roomId);

      customSocket.to(roomChannel).emit("presence:left", {
        user: customSocket.user,
        roomId,
      });
    });

    customSocket.on("presence:heartbeat", async (roomId: string) => {
      if (!roomId || !customSocket.user) return;
      await refreshRoomPresence(customSocket.user.id, roomId);
    });
    
    customSocket.on("joinRoom", (roomId: number) => {
      // Notify room members 
      customSocket.join(`room:${roomId}`);
      
      customSocket.to(`room:${roomId}`).emit("membership:joined", {
        roomId,
        userLeft: {
          id: Number(customSocket.user!.id),
          username: customSocket.user!.username,
        },
      });
    });

    customSocket.on("leaveRoom", (roomId: number) => {
      // Notify room members
      io.to(`room:${roomId}`).emit("membership:left", { 
        roomId,
        userLeft: {
          id: Number(customSocket.user!.id),
          username: customSocket.user!.username,
        },
      });

      customSocket.leave(`room:${roomId}`);
     });

    // --- MESSAGES ---
    // Client -> server: create a message
    customSocket.on(
      "message:create",
      async (data: { roomId: string; text: string; replyToId?: number }) => {
        try {
          if (!customSocket.user) return;
          const { roomId, text, replyToId } = data;
          
          if (!roomId || typeof text !== "string" || text.trim().length === 0 || text.length > MESSAGE_MAX_LENGTH) {
            return;
          }

          const saved = await createMessage({
            text,
            userId: Number(customSocket.user.id),
            roomId: Number(roomId),
            replyToId: replyToId ?? null
          });

          // Broadcast the new message to everyone subscribed to that room channel.
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
        const reaction = await addReactionToMessage({ emoji, userId, messageId });

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

    /* Video listeners */

    customSocket.on("video:call-request", (data) => {
      io.to(`user:${data.calleeId}`).emit("video:call-request", data);
    });

    customSocket.on("video:call-response", (data) => {
      io.to(`user:${data.callerId}`).emit("video:call-response", data);
    });

    customSocket.on("video:webrtc-offer", (data) => {
      io.to(`user:${data.calleeId}`).emit("video:webrtc-offer", data);
    });

    customSocket.on("video:webrtc-answer", (data) => {
      io.to(`user:${data.callerId}`).emit("video:webrtc-answer", data);
    });

    customSocket.on("video:webrtc-ice-candidate", (data) => {
      io.to(`user:${data.targetUserId}`).emit("video:webrtc-ice-candidate", data);
    });

    customSocket.on("video:call-ended", (data) => {
      io.to(`user:${data.targetUserId}`).emit("video:call-ended");
    });

    customSocket.on("video:media-state", ({ targetUserId, micMuted, cameraOff }) => {
      io.to(`user:${targetUserId}`).emit("video:remote-media-state",
        { micMuted, cameraOff });
    });

    /* --------------- */

    customSocket.on("disconnect", async (reason) => {
      console.log(`User disconnected: ${socket.id} (${reason})`);

      const userId = customSocket.data.userId;

      if (!userId) return;

      const rooms = await removeUserFromAllRooms(userId);
      
      rooms.forEach(roomId => {
        io.to(`room:${roomId}`).emit("presence:left", {
          user: customSocket.user,
          roomId,
        });
      });

      const wasRemoved = await removeUserFromOnlineUsers(userId, customSocket.id);

      if (wasRemoved) {
        customSocket.broadcast.emit("onlineUser:removed", { userId });
      }
    });
  });
}
