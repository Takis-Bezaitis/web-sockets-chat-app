import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useAuthStore } from "./authStore";
import type { Message } from "../types/custom";
import { useMessageStore } from "./messageStore";
import { usePresenceStore } from "./presenceStore";
import { useTypingStore } from "./typingStore";

interface SocketState {
  socket: Socket | null;
  currentRoomId: number | null;
  connect: () => void;
  disconnect: () => void;
  enterRoom: (roomId: number) => Promise<void>;
  exitRoom: (roomId: number) => void;
  sendMessage: (roomId: number, text: string) => void;
 }

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  currentRoomId: null,
  
  connect: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    if (get().socket) return; // already connected

    const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      withCredentials: true,
    });

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

    // Central socket listeners
    // New messages broadcasted by server
    socket.on("message:new", (msg: Message) => {
      console.log("📩 message:new", msg);
      useMessageStore.getState().appendMessage(Number(msg.roomId), msg);
    });

    // Typing indicator
    socket.on("typing:someone", (payload: { roomId: string; userEmail: string }) => {
      useTypingStore.getState().setTyping(Number(payload.roomId), payload.userEmail);
    });

    // Presence events (UI-level)
    socket.on("presence:entered", (payload: { user: { id: string; email?: string } | null; roomId: string }) => {
      console.log("presence:entered", payload);
      if (!payload.user?.id) return;
      // Mark any other user that has just entered the room (not the local user aka 'me') as online
      usePresenceStore.getState().setOnlineStatus(Number(payload.user.id), true);
    });

    socket.on("presence:left", (payload: { user: { id: string; email?: string } | null; roomId: string }) => {
      console.log("presence:left", payload);
      if (!payload.user?.id) return;
      // Mark any other user that has just left the room (not the local user aka 'me') as offine
      usePresenceStore.getState().setOnlineStatus(Number(payload.user.id), false);
    });

    socket.on("message:reaction:new", ({ messageId, reaction }) => {
      console.log("message:reaction:new", messageId, reaction)
      useMessageStore.getState().addReactionToMessage(messageId, reaction);
    });

    socket.on("presence:list", ({ roomId, users }) => {
      console.log("presence:list roomId:", roomId);
      //console.log("presence:list users:", users);

      users.forEach((userId: string) => {
        usePresenceStore.getState().setOnlineStatus(Number(userId), true);
      });
    });
   

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (!socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    set({ socket: null, currentRoomId: null });
    console.log("🧹 socket disconnected & listeners removed");
  },

  // Enter a room: subscribe socket, fetch messages (cache-backed), set currentRoom
  enterRoom: async (roomId: number) => {
    const { socket } = get();
    if (!socket) {
      console.warn("Socket not connected; connecting now.");
      get().connect();
      // Wait a small amount: in your app you can also await a 'connect' event if needed.
    }

    // join socket.io room (UI-level)
    socket?.emit("enterRoom", roomId.toString());

    // Mark local user online
    const localUserId = useAuthStore.getState().user?.id;
    if (localUserId) {
      usePresenceStore.getState().setOnlineStatus(Number(localUserId), true);
    }

    // If we already have cached messages in the store, skip fetch
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
      usePresenceStore.getState().setOnlineStatus(Number(localUserId), false);
    }
    set({ currentRoomId: null });
  },

  sendMessage: (roomId: number, text: string) => {
    const { socket } = get();
    const { user } = useAuthStore.getState();
    if (!socket || !user) {
      console.warn("No socket or user to send message");
      return;
    }
    socket.emit("message:create", { roomId: roomId.toString(), text });
  },
  
}));
