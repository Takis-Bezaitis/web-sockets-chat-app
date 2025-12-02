import { create } from "zustand";
import type { Message, MessageReaction } from "../types/custom";

interface MessageState {
  messagesByRoom: Record<number, Message[]>;

  getMessagesForRoom: (roomId: number) => Message[];
  clearRoomMessages: (roomId: number) => void;

  fetchRoomMessages: (roomId: number) => Promise<void>;
  appendMessage: (roomId: number, msg: Message) => void;

  addReactionToMessage: (messageId:number, reaction: MessageReaction) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByRoom: {},

  getMessagesForRoom: (roomId) => {
    return get().messagesByRoom[roomId] ?? [];
  },

  clearRoomMessages: (roomId) => {
    set((state) => {
      const copy = { ...state.messagesByRoom };
      delete copy[roomId];
      return { messagesByRoom: copy };
    });
  },

  fetchRoomMessages: async (roomId: number) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_MESSAGES_BASE_URL}/${roomId}/room-messages`,
        { credentials: "include" }
      );

      if (!res.ok) {
        console.warn("Failed to fetch messages");
        return;
      }

      const data = await res.json();
      const msgs: Message[] = data.data ?? data;

      set((state) => ({
        messagesByRoom: { ...state.messagesByRoom, [roomId]: msgs }
      }));
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  },

  appendMessage: (roomId, msg) => {
    set((state) => {
      const prev = state.messagesByRoom[roomId] ?? [];
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: [...prev, msg]
        }
      };
    });
  },

  addReactionToMessage: (messageId, reaction) => {
    set((state) => {
      const updated = { ...state.messagesByRoom };

      // Search every room until we find the message
      for (const roomId in updated) {
        const messages = updated[roomId];

        const index = messages.findIndex((m) => m.id === messageId);
        if (index === -1) continue; // not in this room

        const msg = messages[index];

        // Initialize reactions if missing
        const currentReactions = msg.reactions ?? [];

        // Prevent duplicate identical reactions
        const alreadyExists = currentReactions.some(
          (r) => r.userId === reaction.userId && r.emoji === reaction.emoji
        );
        
        if (alreadyExists) return { messagesByRoom: updated };

        // Update the message
        const updatedMessage = {
          ...msg,
          reactions: [...currentReactions, reaction],
        };

        // Update the array inside the room
        updated[roomId] = [
          ...messages.slice(0, index),
          updatedMessage,
          ...messages.slice(index + 1),
        ];

        // Stop looping—message found
        break;
      }

      return { messagesByRoom: updated };
    });
  },
}));
