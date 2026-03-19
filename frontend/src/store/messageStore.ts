import { create } from "zustand";
import type { Message, MessageReaction } from "../types/custom";

interface MessageState {
  messagesByRoom: Record<number, Message[]>;
  loadingByRoom: Record<number, boolean>;
  cursorByRoom: Record<number, number | null>;
  hasMoreByRoom: Record<number, boolean>;
  draftByRoom: Record<number, string>;
  replyingToByRoom: Record<number, Message | null>;

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

  setReplyingTo: (roomId: number, msg: Message | null) => void;

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

const updateMessageInTree = (
  messages: Message[],
  messageId: number,
  updater: (msg: Message) => Message
): Message[] => {
  return messages.map((msg) => {
    if (msg.id === messageId) {
      return updater(msg);
    }
    if (msg.replies?.length) {
      return { ...msg, replies: updateMessageInTree(msg.replies, messageId, updater) };
    }
    return msg;
  });
};

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByRoom: {},
  loadingByRoom: {},
  cursorByRoom: {},
  hasMoreByRoom: {},
  draftByRoom: {},
  replyingToByRoom: {},

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
  
  setReplyingTo: (roomId, message) => {
    set((state) => ({
      replyingToByRoom: {...state.replyingToByRoom, [roomId]: message}
    }))
  },

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

    // If the message is a reply, insert it into the parent’s replies
    if (msg.replyToId) {
      const updated = updateMessageInTree(prev, msg.replyToId, (parent) => ({
        ...parent,
        replies: [...(parent.replies ?? []), msg],
      }));
      return { messagesByRoom: { ...state.messagesByRoom, [roomId]: updated } };
    }

    // Otherwise, it's a top-level message
    return { messagesByRoom: { ...state.messagesByRoom, [roomId]: [...prev, msg] } };
  });

  if (options?.notifyNew && messageStoreCallbacks[roomId]) {
    messageStoreCallbacks[roomId].forEach((cb) => cb(msg));
  }
},

  updateEditedMessage: (updatedMsg: Message) =>
    set((state) => {
      const updated = { ...state.messagesByRoom };

      for (const roomId in updated) {
        updated[roomId] = updateMessageInTree(updated[roomId], updatedMsg.id, (msg) => ({
          ...msg,
          ...updatedMsg,
          replies: msg.replies, // preserve existing replies
        }));
      }

      return { messagesByRoom: updated };
    }),

  deleteMessageFromRoom: (id, roomId) => {
    const deleteMessageInTree = (messages: Message[], messageId: number): Message[] => {
      return messages
        .filter((msg) => msg.id !== messageId)
        .map((msg) =>
          msg.replies ? { ...msg, replies: deleteMessageInTree(msg.replies, messageId) } : msg
        );
    };

    set((state) => {
      const updated = { ...state.messagesByRoom };

      const messages = updated[roomId] ?? [];
      updated[roomId] = deleteMessageInTree(messages, id);

      return { messagesByRoom: updated };
    });
  },

  addReactionToMessage: (messageId, reaction) => {
    set((state) => {
      const updated = { ...state.messagesByRoom };

      for (const roomId in updated) {
        updated[roomId] = updateMessageInTree(updated[roomId], messageId, (msg) => {
          const currentReactions = msg.reactions ?? [];
          const existingIndex = currentReactions.findIndex(
            (r) => r.userId === reaction.userId && r.emoji === reaction.emoji
          );

          let newReactions;
          if (existingIndex !== -1) {
            newReactions = [
              ...currentReactions.slice(0, existingIndex),
              ...currentReactions.slice(existingIndex + 1),
            ];
          } else {
            newReactions = [...currentReactions, reaction];
          }

          return { ...msg, reactions: newReactions };
        });
      }

      return { messagesByRoom: updated };
    });
  },

  getLoadingForRoom: (roomId) => {
    return get().loadingByRoom[roomId] ?? false;
  },

}));
