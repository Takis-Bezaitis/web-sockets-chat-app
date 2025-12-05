import { create } from "zustand";
import type { Message, MessageReaction } from "../types/custom";

interface MessageState {
  messagesByRoom: Record<number, Message[]>;
  loadingByRoom: Record<number, boolean>;

  getMessagesForRoom: (roomId: number) => Message[];
  clearRoomMessages: (roomId: number) => void;

  fetchRoomMessages: (roomId: number) => Promise<void>;
  appendMessage: (roomId: number, msg: Message) => void;
  updateEditedMessage: (msg: Message) => void;
  deleteMessageFromRoom: (id: number, roomId: number) => void;

  addReactionToMessage: (messageId:number, reaction: MessageReaction) => void;
  getLoadingForRoom: (roomId: number) => boolean;

}

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByRoom: {},
  loadingByRoom: {},

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
    const alreadyLoaded = get().messagesByRoom[roomId];
    if (alreadyLoaded) return;

    set((state) => ({
      loadingByRoom: { ...state.loadingByRoom, [roomId]: true }
    }));

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
    } finally {
      set((state) => ({
        loadingByRoom: { ...state.loadingByRoom, [roomId]: false }
      }));
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

  updateEditedMessage: (updatedMsg: Message) =>
  set((state) => {
    const messages = state.messagesByRoom[updatedMsg.roomId];
    if (!messages) return state;

    return {
      messagesByRoom: {
        ...state.messagesByRoom,
        [updatedMsg.roomId]: messages.map((m) =>
          m.id === updatedMsg.id ? updatedMsg : m
        ),
      },
    };
  }),

  deleteMessageFromRoom: (id, roomId) => {
    set((state) => {
      const updated = { ...state.messagesByRoom };

      const messages = updated[roomId];
      updated[roomId] = messages.filter((msg) => msg.id !== id);

      return { messagesByRoom: updated };
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

        // Check if the reaction already exists
        const existingIndex = currentReactions.findIndex(
          (r) => r.userId === reaction.userId && r.emoji === reaction.emoji
        );

        let newReactions;
        if (existingIndex !== -1) {
          // Reaction exists → remove it (toggle off)
          newReactions = [
            ...currentReactions.slice(0, existingIndex),
            ...currentReactions.slice(existingIndex + 1),
          ];
        } else {
          // Reaction does not exist → add it
          newReactions = [...currentReactions, reaction];
        }

        // Update the message
        const updatedMessage = {
          ...msg,
          reactions: newReactions,
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

  getLoadingForRoom: (roomId) => {
    return get().loadingByRoom[roomId] ?? false;
  },

}));
