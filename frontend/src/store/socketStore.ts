import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useAuthStore } from "./authStore";
import type { Message } from "../types/custom";

interface OutgoingMessagePayload {
  roomId: string;
  text: string;
}

interface SocketState {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (roomId: string, text: string) => void;
  messages: Message[];
  addMessages: (msgs: Message[]) => void;
  clearMessages: () => void;
  fetchedAll: boolean;
  setFetchedAll: (value: boolean) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  messages: [],
  fetchedAll: false,

  connect: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    // Already connected?
    if (get().socket) return;

    // Token is not needed, cookie will be sent automatically
    const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      withCredentials: true, // important for sending cookies
    });

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
      set({ socket: null });
    });

    // 🔹 Listen for new messages broadcast from the backend
    socket.on("newMessage", (msg: Message) => {
      console.log("📩 Received new message:", msg);
      set((state) => ({ messages: [...state.messages, msg] }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
        socket.removeAllListeners(); // clean up all event listeners
        socket.disconnect();
        set({ socket: null });
        console.log("🧹 Socket disconnected and listeners removed.");
    }
  },

  sendMessage: (roomId: string, text: string) => {
    const { socket } = get();
    const { user } = useAuthStore.getState();
    
    if (!socket || !user) {
      console.warn("⚠️ Cannot send message — socket or user missing");
      return;
    }

    const payload: OutgoingMessagePayload = { roomId: roomId.toString(), text };
    socket.emit("chatMessage", payload);
    
  },

  addMessages: (msgs: Message[]) => set((state) => ({ messages: [...state.messages, ...msgs] })),

  // Clear messages (for when switching rooms, optional)
  clearMessages: () => set({ messages: [] }),

  setFetchedAll: (value: boolean) => set({ fetchedAll: value }),
}));

// Auto-connect when user logs in / disconnect when logout
useAuthStore.subscribe((state) => {
  const socketStore = useSocketStore.getState();
  if (state.user) {
    socketStore.connect();
  } else {
    socketStore.disconnect();
  }
});
