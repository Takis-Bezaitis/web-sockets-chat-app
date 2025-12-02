import { create } from "zustand";

interface TypingState {
  typingUserByRoom: Record<number, string | null>;
  setTyping: (roomId: number, email: string | null) => void;
}

export const useTypingStore = create<TypingState>((set) => ({
  typingUserByRoom: {},

  setTyping: (roomId, email) => {
    set((state) => ({
      typingUserByRoom: { ...state.typingUserByRoom, [roomId]: email }
    }));

    // auto-clear after 1s
    setTimeout(() => {
      set((state) => ({
        typingUserByRoom: { ...state.typingUserByRoom, [roomId]: null }
      }));
    }, 1000);
  }
}));
