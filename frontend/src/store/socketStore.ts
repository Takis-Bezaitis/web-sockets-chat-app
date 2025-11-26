// frontend/src/store/socketStore.ts
import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useAuthStore } from "./authStore";
import type { Message } from "../types/custom";

interface SocketState {
  socket: Socket | null;
  currentRoomId: number | null;
  messagesByRoom: Record<number, Message[]>;
  typingUserByRoom: Record<number, string | null>;
  onlineUsers: Record<number, boolean>;
  connect: () => void;
  disconnect: () => void;
  enterRoom: (roomId: number) => Promise<void>;
  exitRoom: (roomId: number) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  sendMessage: (roomId: number, text: string) => void;
  appendMessage: (roomId: number, msg: Message) => void;
  getMessagesForRoom: (roomId: number) => Message[];
  clearRoomMessages: (roomId: number) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  currentRoomId: null,
  messagesByRoom: {},
  typingUserByRoom: {},
  onlineUsers: {},

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
        get().setOnlineStatus(String(localUserId), true);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("⛔ socket disconnected", reason);
      // Mark local user offline on disconnect
      const localUserId = useAuthStore.getState().user?.id;
      if (localUserId) {
        get().setOnlineStatus(String(localUserId), false);
      }
      set({ socket: null });
    });

    // Central socket listeners
    // New messages broadcasted by server
    socket.on("message:new", (msg: Message) => {
      console.log("📩 message:new", msg);
      // append to the correct room list (ensure immutability)
      set((state) => {
        const roomId = Number(msg.roomId);
        const prev = state.messagesByRoom[roomId] ?? [];
        return { messagesByRoom: { ...state.messagesByRoom, [roomId]: [...prev, msg] } };
      });
    });

    // Typing indicator
    socket.on("typing:someone", (payload: { roomId: string; userEmail: string }) => {
      const roomId = Number(payload.roomId);
      console.log("userEmail:",payload.userEmail)
      set((state) => ({ typingUserByRoom: { ...state.typingUserByRoom, [roomId]: payload.userEmail } }));
      const { typingUserByRoom } = get();
      console.log("typingUserByRoom:",typingUserByRoom)
      // clear after timeout
      setTimeout(() => {
        set((state) => ({ typingUserByRoom: { ...state.typingUserByRoom, [roomId]: null } }));
      }, 1000);
    });

    // Presence events (UI-level)
    socket.on("presence:entered", (payload: { user: { id: string; email?: string } | null; roomId: string }) => {
      console.log("presence:entered", payload);
      if (!payload.user?.id) return;
      // Mark any other user that has just entered the room (not the local user aka 'me') as online
      get().setOnlineStatus(String(payload.user.id), true);
    });

    socket.on("presence:left", (payload: { user: { id: string; email?: string } | null; roomId: string }) => {
      console.log("presence:left", payload);
      if (!payload.user?.id) return;
      // Mark any other user that has just left the room (not the local user aka 'me') as offine
      get().setOnlineStatus(String(payload.user.id), false);
    });

    socket.on("presence:list", ({ roomId, users }) => {
      console.log("presence:list roomId:", roomId);
      console.log("presence:list users:", users);

      users.forEach((userId: string) => {
        get().setOnlineStatus(userId, true);
      });
    });
    /*
    socket.on("membership:joined", (payload: any) => {
      console.log("membership:joined", payload);
    });

    socket.on("membership:left", (payload: any) => {
      console.log("membership:left", payload);
    });
    */
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
    const { socket, messagesByRoom } = get();
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
      get().setOnlineStatus(String(localUserId), true);
    }

    // If we already have cached messages in the store, skip fetch
    if (messagesByRoom[roomId] && messagesByRoom[roomId].length > 0) {
      set({ currentRoomId: roomId });
      return;
    }

    // Fetch messages for the room via HTTP (server-side redis caching is used)
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_MESSAGES_BASE_URL}/${roomId}/room-messages`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "fetch_failed" }));
        console.error("Failed to fetch room messages", err);
        set({ currentRoomId: roomId });
        return;
      }
      const data = await res.json();
      const msgs: Message[] = data.data ?? data; // adapt depending on your API shape
      set((state) => ({ messagesByRoom: { ...state.messagesByRoom, [roomId]: msgs } }));
      set({ currentRoomId: roomId });
    } catch (err) {
      console.error("Error fetching messages for room", roomId, err);
      set({ currentRoomId: roomId });
    }
  },

  exitRoom: (roomId: number) => {
    const { socket } = get();
    socket?.emit("exitRoom", roomId.toString());
    // Mark local user offline
    const localUserId = useAuthStore.getState().user?.id;
    if (localUserId) {
      get().setOnlineStatus(String(localUserId), false);
    }

    set({ currentRoomId: null });
  },

  setOnlineStatus: (userId: string, isOnline: boolean ) => 
    set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [userId]: isOnline
    }
  })),

  sendMessage: (roomId: number, text: string) => {
    const { socket } = get();
    const { user } = useAuthStore.getState();
    if (!socket || !user) {
      console.warn("No socket or user to send message");
      return;
    }
    // emit creation request; server will save, invalidate cache, and broadcast
    socket.emit("message:create", { roomId: roomId.toString(), text });
    // we rely on server `message:new` broadcast to append the saved message
    // (optionally implement optimistic UI if desired)
  },

  appendMessage: (roomId: number, msg: Message) => {
    set((state) => {
      const prev = state.messagesByRoom[roomId] ?? [];
      return { messagesByRoom: { ...state.messagesByRoom, [roomId]: [...prev, msg] } };
    });
  },

  getMessagesForRoom: (roomId: number) => {
    const { messagesByRoom } = get();
    return messagesByRoom[roomId] ?? [];
  },

  clearRoomMessages: (roomId: number) => {
    set((state) => {
      const copy = { ...state.messagesByRoom };
      delete copy[roomId];
      return { messagesByRoom: copy };
    });
  },
}));
