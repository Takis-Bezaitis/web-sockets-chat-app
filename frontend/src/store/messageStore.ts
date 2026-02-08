import { create } from "zustand";
import type { Message, MessageReaction } from "../types/custom";

interface MessageState {
  messagesByRoom: Record<number, Message[]>;
  loadingByRoom: Record<number, boolean>;
  cursorByRoom: Record<number, number | null>;
  hasMoreByRoom: Record<number, boolean>;
  draftByRoom: Record<number, string>;

  getMessagesForRoom: (roomId: number) => Message[];
  clearRoomMessages: (roomId: number) => void;

  fetchRoomMessages: (roomId: number) => Promise<void>;
  appendMessage: (roomId: number, msg: Message, options?: { notifyNew?: boolean }) => void;
  updateEditedMessage: (msg: Message) => void;
  deleteMessageFromRoom: (id: number, roomId: number) => void;

  addReactionToMessage: (messageId:number, reaction: MessageReaction) => void;
  getLoadingForRoom: (roomId: number) => boolean;

  getDraftForRoom: (roomId: number) => string;
  setDraftForRoom: (roomId: number, draft: string) => void;

}

const messageStoreCallbacks: Record<number, ((msg: Message) => void)[]> = {};

export const onNewMessage = (roomId: number, cb: (msg: Message) => void) => {
  if (!messageStoreCallbacks[roomId]) messageStoreCallbacks[roomId] = [];
  messageStoreCallbacks[roomId].push(cb);

  return () => {
    messageStoreCallbacks[roomId] = messageStoreCallbacks[roomId].filter(
      (fn) => fn !== cb
    );
  };
};


export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByRoom: {},
  loadingByRoom: {},
  cursorByRoom: {},
  hasMoreByRoom: {},
  draftByRoom: {},

  getMessagesForRoom: (roomId) => {
    return get().messagesByRoom[roomId] ?? [];
  },

  getDraftForRoom: (roomId) => {
    return get().draftByRoom[roomId] ?? "";
  },

  setDraftForRoom: (roomId, draft) => {
    set((state) => ({
      draftByRoom: {...state.draftByRoom, [roomId]: draft}
    }))},
  
  clearRoomMessages: (roomId) => {
  set((state) => {
    const messages = { ...state.messagesByRoom };
    const cursors = { ...state.cursorByRoom };
    const hasMore = { ...state.hasMoreByRoom };
    const loading = { ...state.loadingByRoom };

    delete messages[roomId];
    delete cursors[roomId];
    delete hasMore[roomId];
    delete loading[roomId];

    return {
      messagesByRoom: messages,
      cursorByRoom: cursors,
      hasMoreByRoom: hasMore,
      loadingByRoom: loading
    };
  });
},


 fetchRoomMessages: async (roomId: number) => {
    const { cursorByRoom, hasMoreByRoom, loadingByRoom } = get();
    
    if (loadingByRoom[roomId]) return;
    if (hasMoreByRoom[roomId] === false) return;

    set((state) => ({
      loadingByRoom: { ...state.loadingByRoom, [roomId]: true }
    }));

    try {
      const before = cursorByRoom[roomId];

      const url = before
        ? `${import.meta.env.VITE_BACKEND_MESSAGES_BASE_URL}/${roomId}/room-messages?before=${before}&limit=30`
        : `${import.meta.env.VITE_BACKEND_MESSAGES_BASE_URL}/${roomId}/room-messages?limit=30`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return;

      const data = await res.json();
      const newMessages: Message[] = data.data ?? data;

      set((state) => {
        const prevMessages = state.messagesByRoom[roomId] ?? [];

        return {
          messagesByRoom: {
            ...state.messagesByRoom,
            // prepend older messages
            [roomId]: [...newMessages, ...prevMessages]
          },
          cursorByRoom: {
            ...state.cursorByRoom,
            // cursor = oldest message we just received
            [roomId]:
              newMessages.length > 0
                ? newMessages[0].id
                : state.cursorByRoom[roomId] ?? null
          },
          hasMoreByRoom: {
            ...state.hasMoreByRoom,
            // if fewer than limit, backend has no more
            [roomId]: newMessages.length === 30
          }
        };
      });
    } catch (err) {
      console.error("fetchRoomMessages failed:", err);
    } finally {
      set((state) => ({
        loadingByRoom: { ...state.loadingByRoom, [roomId]: false }
      }));
    }
  },

  appendMessage: (roomId, msg, options?: { notifyNew?: boolean }) => {
    set((state) => {
      const prev = state.messagesByRoom[roomId] ?? [];
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: [...prev, msg]
        }
      };
    });

    if (options?.notifyNew && messageStoreCallbacks[roomId]) {
      messageStoreCallbacks[roomId].forEach((cb) => cb(msg));
    }
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
