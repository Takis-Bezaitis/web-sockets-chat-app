import { create } from "zustand";
import { type User } from "../types/custom";
import { API } from "../api/api";

interface AuthState {
    user: User | null;
    token: string | null;
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    logout: () => void;
    checkAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,

    setUser: (user) => 
        set(() => ({
            user
        })),
    
    setToken: (token) =>
        set(() => ({
            token
        })),

    logout: () => 
        set(() => ({
            user: null,
            token: null,
        })),
    
    checkAuth: async () => {
        try {
            const res = await fetch(API.auth.me, {
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

