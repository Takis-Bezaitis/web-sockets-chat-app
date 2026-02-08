import { create } from "zustand";

interface PresenceState {
  onlineUsers: Record<number, boolean>;
  usersInRoom: Record<number, Record<number, boolean>>;

  setOnlineStatus: (userId: number, isOnline: boolean) => void;
  setUserInRoom: (roomId: number, userId: number, isPresent: boolean) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: {},
  usersInRoom: {},

  setOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline }
    })),

  setUserInRoom: (roomId, userId, isPresent) =>
    set((state) => ({
      usersInRoom: {
        ...state.usersInRoom,
        [roomId]: {
          ...(state.usersInRoom[roomId] ?? {}),
          [userId]: isPresent
        }
      }
    }))

}));
