import { create } from "zustand";
import { API } from "../api/api";

export type PublicUserDTO = {
  id: number;
  username: string;
};

type UsersStore = {
  users: PublicUserDTO[];
  isLoading: boolean;
  error: string | null;

  fetchUsers: () => Promise<void>;
  addUser: (user: PublicUserDTO) => void;
};

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(API.users, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      set({ users: data.data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      set({ isLoading: false });
    }
  },

  addUser: (user) =>
    set((state) => ({
      users: [...state.users, user],
    })),
}));
