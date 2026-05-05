import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useAuthStore } from "./authStore";
import type { Message } from "../types/custom";
import { useMessageStore } from "./messageStore";
import { usePresenceStore } from "./presenceStore";
import { useTypingStore } from "./typingStore";
import { useInvitationStore } from "./invitationStore";
import { useRoomStore } from "./roomStore";

interface SocketState {
  socket: Socket | null;
  currentRoomId: number | null;
  connect: () => void;
  disconnect: () => void;
  enterApp: () => void;
  enterRoom: (roomId: number) => Promise<void>;
  exitRoom: (roomId: number) => void;
  sendMessage: (roomId: number, text: string, replyToId: number | null) => void;
 }

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  currentRoomId: null,
  
  connect: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    if (get().socket) return; 

    const socket = io(
      import.meta.env.VITE_BACKEND_URL || window.location.origin,
      { withCredentials: true }
    );

    socket.on("connect", () => {
      console.log("✅ socket connected", socket.id);
      // Mark the local user as online locally
      const localUserId = useAuthStore.getState().user?.id;
      if (localUserId) {
        usePresenceStore.getState().setOnlineStatus(Number(localUserId), true);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("⛔ socket disconnected", reason);
      // Mark local user offline on disconnect
      const localUserId = useAuthStore.getState().user?.id;
      if (localUserId) {
        usePresenceStore.getState().setOnlineStatus(Number(localUserId), false);
      }
      set({ socket: null });
    });

    socket.on("onlineUsers:list", (payload: { onlineUsers:string[] }) => {
      payload.onlineUsers.forEach((userId: string) => {
        usePresenceStore.getState().setOnlineStatus(Number(userId), true);
      });
    });

    socket.on("onlineUser:added", (payload: { userId:string }) => {
      usePresenceStore.getState().setOnlineStatus(Number(payload.userId), true);
    });

     socket.on("onlineUser:removed", (payload: { userId:string }) => {
      usePresenceStore.getState().setOnlineStatus(Number(payload.userId), false);
    });

    socket.on("room:created", ({ room }) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      if (!room.isPrivate) {
        useRoomStore.getState().addRoom({
          ...room,
          isMember: false,
        });
        return;
      }

      if (room.creatorId === user.id) {
        useRoomStore.getState().addRoom({
          ...room,
          isMember: true,
        });
      }
    });

    socket.on("room:deleted", ({ roomId }: { roomId: number }) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      useRoomStore.getState().deleteRoom(roomId);
    });

    socket.on("room:invited", ({ invitation }) => {
      useInvitationStore.getState().addInvitation(invitation);
    });

    // Central socket listeners
    // New messages broadcasted by server
    socket.on("message:new", (msg: Message) => {
      useMessageStore.getState().appendMessage(Number(msg.roomId), msg, { notifyNew: true });
    });

    socket.on("message:edited", (msg: Message) => {
      useMessageStore.getState().updateEditedMessage(msg);
    });

    // Typing indicator
    socket.on("typing:someone", (payload: { roomId: string; userEmail: string }) => {
      useTypingStore.getState().setTyping(Number(payload.roomId), payload.userEmail);
    });

    // Presence events (UI-level)
    socket.on("presence:entered", (payload: { user: { id: string; email?: string } | null; roomId: string }) => {
      if (!payload.user?.id) return;
      // Mark any other user that has just entered the room (not the local user aka 'me') as online
      usePresenceStore.getState().setUserInRoom(Number(payload.roomId), Number(payload.user.id), true);
    });

    socket.on("presence:left", (payload: { user: { id: string; email?: string } | null; roomId: string }) => {
      if (!payload.user?.id) return;
      // Mark any other user that has just left the room (not the local user aka 'me') as offine
      usePresenceStore.getState().setUserInRoom(Number(payload.roomId), Number(payload.user.id), false);
    });

    socket.on("message:reaction:new", ({ messageId, reaction }) => {
      useMessageStore.getState().addReactionToMessage(messageId, reaction);
    });

    socket.on("presence:list", ({ roomId, users }) => {
      users.forEach((userId: string) => {
        usePresenceStore.getState().setUserInRoom(Number(roomId), Number(userId), true);
      });
    });
   
    socket.on("message:deleted", ({id, roomId}: {id: number, roomId:number}) => {
      useMessageStore.getState().deleteMessageFromRoom(id, roomId);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (!socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    set({ socket: null, currentRoomId: null });
  },

  enterApp: async () => {
    
  },

  // Enter a room: subscribe socket, fetch messages (cache-backed), set currentRoom
  enterRoom: async (roomId: number) => {
    const { socket } = get();
    if (!socket) {
      console.warn("Socket not connected; connecting now.");
      get().connect();
    }

    socket?.emit("enterRoom", roomId.toString());

    const localUserId = useAuthStore.getState().user?.id;
    if (localUserId) {
      usePresenceStore.getState().setUserInRoom(roomId, Number(localUserId), true);
    }

    if (useMessageStore.getState().getMessagesForRoom(roomId).length > 0) {
      set({ currentRoomId: roomId });
      return;
    }

    await useMessageStore.getState().fetchRoomMessages(roomId);
    set({ currentRoomId: roomId });
  },

  exitRoom: (roomId: number) => {
    const { socket } = get();
    socket?.emit("exitRoom", roomId.toString());
    // Mark local user offline
    const localUserId = useAuthStore.getState().user?.id;
    if (localUserId) {
      usePresenceStore.getState().setUserInRoom(roomId, Number(localUserId), false);
    }
    set({ currentRoomId: null });
  },

  sendMessage: (roomId: number, text: string, replyToId: number | null = null) => {
    const { socket } = get();
    const { user } = useAuthStore.getState();
    if (!socket || !user) {
      console.warn("No socket or user to send message");
      return;
    }
    socket.emit("message:create", { roomId: roomId.toString(), text, replyToId });
  },
  
}));
