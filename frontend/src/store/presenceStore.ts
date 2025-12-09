import { create } from "zustand";

interface PresenceState {
  onlineUsers: Record<number, boolean>;
  setOnlineStatus: (userId: number, isOnline: boolean) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: {},

  setOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline }
    }))
}));
