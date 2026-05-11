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
            const refreshRes = await fetch(API.auth.refresh, {
                method: "POST",
                credentials: "include",
            });

            if (!refreshRes.ok) {
                set({ user: null, token: null });
                return;
            }

            const data = await refreshRes.json();

            set({
                user: data.user,
                token: data.token,
            });

        } catch {
            set({ user: null, token: null });
        }
    },
}));

