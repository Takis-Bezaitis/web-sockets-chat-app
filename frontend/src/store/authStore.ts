import { create } from "zustand";
import { type User } from "../types/custom";

interface AuthState {
    user: User | null;
    setUser: (user: User) => void;
    logout: () => void;
    checkAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,

    setUser: (user) => 
        set(() => ({
            user
        })),

    logout: () => 
        set(() => ({
            user: null
        })),
    
    checkAuth: async () => {
        try {
            const res = await fetch(import.meta.env.VITE_BACKEND_AUTH_ME_URL, {
                method: "GET",
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                set({ user: data.user });
            } else {
                console.warn("Auth check failed:", res.status);
                set({ user: null });
            }
        } catch {
            set({ user: null });
        }
    },
}));

