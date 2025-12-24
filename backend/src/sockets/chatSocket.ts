import { Server, Socket } from "socket.io";
import { type UserPayload } from "../types/custom.js";
import { saveTheRoomMessage, addMessageReaction, editMessage, deleteMessage } from "../services/messages/messageService.js";
import prisma from "../prismaClient.js";
import {
  addUserToRoomPresence,
  removeUserFromRoomPresence,
  getRoomPresence,
  refreshRoomPresence,
  removeUserFromAllRooms,
} from "../utils/presence.js";

export interface CustomSocket extends Socket {
  user?: UserPayload;
}

export default function chatSocket(io: Server) {

  io.on("connection", (socket: Socket) => {
    const customSocket = socket as CustomSocket;
    console.log(`User connected: ${socket.id}`);

    // IMPORTANT — add the socket to a user-specific room
    customSocket.join(`user:${customSocket.user?.id}`);
    
    // --- ROOM SUBSCRIPTION (UI-level) ---
    // User opened a room in the UI and wants real-time updates for that room.
    customSocket.on("enterRoom", async (roomId: string) => {
      if (!roomId || !customSocket.user) return;

      const roomChannel = `room:${roomId}`;
      console.log(`socket ${socket.id} enters ${roomChannel}`);
      customSocket.join(roomChannel);

      await addUserToRoomPresence(customSocket.user.id, roomId);

      // Notify only others in the room (not the joiner)
      customSocket.to(roomChannel).emit("presence:entered", {
        user: customSocket.user,
        roomId,
      });

      // Send presence list to the joiner 
      const users = await getRoomPresence(roomId);
      customSocket.emit("presence:list", {
        roomId,
        users,
      });
    });


    // User closed/switched away from the room UI
    customSocket.on("exitRoom", async (roomId: string) => {
      if (!roomId || !customSocket.user) return;
      const roomChannel = `room:${roomId}`;
      console.log(`socket ${socket.id} exits ${roomChannel}`);
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

    /* Video listeners */

    customSocket.on("video:call-request", (data) => {
      console.log("video:call-request data:",data)
      io.to(`user:${data.calleeId}`).emit("video:call-request", data);
    });

    customSocket.on("video:call-response", (data) => {
      console.log("video:call-response!!", data);
      io.to(`user:${data.callerId}`).emit("video:call-response", data);
    });

    customSocket.on("video:webrtc-offer", (data) => {
      //console.log("video:webrtc-offer:", data)
      io.to(`user:${data.calleeId}`).emit("video:webrtc-offer", data);
    });

    customSocket.on("video:webrtc-answer", (data) => {
      io.to(`user:${data.callerId}`).emit("video:webrtc-answer", data);
    });

    customSocket.on("video:webrtc-ice-candidate", (data) => {
      console.log("video:webrtc-ice-candidate:",data)
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

      const userId = customSocket.user?.id;
      if (!userId) return;

      const rooms = await removeUserFromAllRooms(userId);
      
      rooms.forEach(roomId => {
        io.to(`room:${roomId}`).emit("presence:left", {
          user: customSocket.user,
          roomId,
        });
      });
    });

  });
}
