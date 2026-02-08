import { create } from "zustand";
import type { RoomWithMembershipDTO } from "../types/custom";

interface RoomState {
  rooms: Record<number, RoomWithMembershipDTO>;
  setRooms: (rooms: RoomWithMembershipDTO[]) => void;
  addRoom: (room: RoomWithMembershipDTO) => void;
  deleteRoom: (roomId: number) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: {},

  setRooms: (rooms) =>
    set(() => ({
      rooms: Object.fromEntries(rooms.map((r) => [r.id, r])),
    })),

  addRoom: (room) =>
    set((state) => ({
      rooms: {
        ...state.rooms,
        [room.id]: room,
      },
    })),

  deleteRoom: (roomId: number) =>
    set((state) => {
      const { [roomId]: _, ...remainingRooms } = state.rooms;

      return {
        rooms: remainingRooms,
      };
    }),

}));
