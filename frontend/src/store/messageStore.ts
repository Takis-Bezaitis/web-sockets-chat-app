import { create } from "zustand";
import type { Message, MessageReaction } from "../types/custom";
import { MESSAGES_LIMIT } from "../constants/message";
import { API } from "../api/api";

interface MessageState {
  messagesByRoom: Record<number, Message[]>;
  loadingByRoom: Record<number, boolean>;
  cursorByRoom: Record<number, number | null>;
  hasMoreByRoom: Record<number, boolean>;
  draftByRoom: Record<number, string>;
  replyingToByRoom: Record<number, Message | null>;
  anchorMessageIdByRoom: Record<number, number>;
  anchorOffsetByRoom: Record<number, number>;

  getMessagesForRoom: (roomId: number) => Message[];

  fetchRoomMessages: (roomId: number) => Promise<void>;
  appendMessage: (roomId: number, msg: Message, options?: { notifyNew?: boolean }) => void;
  updateEditedMessage: (msg: Message) => void;
  deleteMessageFromRoom: (id: number, roomId: number) => void;

  addReactionToMessage: (messageId:number, reaction: MessageReaction) => void;
  getLoadingForRoom: (roomId: number) => boolean;

  getDraftForRoom: (roomId: number) => string;
  setDraftForRoom: (roomId: number, draft: string) => void;

  setReplyingTo: (roomId: number, msg: Message | null) => void;

  setAnchorMessageId: (roomId: number, messageId: number) => void;
  getAnchorMessageId: (roomId: number) => number | null;

  setAnchorOffset: (roomId: number, offset: number) => void;
  getAnchorOffset: (roomId: number) => number;

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
  anchorMessageIdByRoom: {},
  anchorOffsetByRoom: {},

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

 fetchRoomMessages: async (roomId: number) => {
  const { cursorByRoom, hasMoreByRoom, loadingByRoom, messagesByRoom } = get();
  
  const hasMessages = (messagesByRoom[roomId]?.length ?? 0) > 0;

  if (hasMessages && cursorByRoom[roomId] === undefined) return;
  if (loadingByRoom[roomId]) return;
  if (hasMoreByRoom[roomId] === false) return;

  set((state) => ({
    loadingByRoom: { ...state.loadingByRoom, [roomId]: true }
  }));

  try {
    const before = cursorByRoom[roomId];
    const url = before
      ? `${API.messages}/${roomId}/room-messages?before=${before}&limit=${MESSAGES_LIMIT}`
      : `${API.messages}/${roomId}/room-messages?limit=${MESSAGES_LIMIT}`;

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return;

    const data = await res.json();
    const incomingMessages: Message[] = data.data ?? data;

    set((state) => {
      const prevMessages = state.messagesByRoom[roomId] ?? [];

      // Deduplicate
      const existingIds = new Set(prevMessages.map(m => m.id));
      const newMessages = incomingMessages.filter(
        (m) => !existingIds.has(m.id)
      );

      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          // prepend older messages
          [roomId]: [...newMessages, ...prevMessages]
        },
        cursorByRoom: {
          ...state.cursorByRoom,
          [roomId]:
            incomingMessages.length > 0
              ? incomingMessages[0].id
              : state.cursorByRoom[roomId] ?? null
        },
        hasMoreByRoom: {
          ...state.hasMoreByRoom,
          [roomId]: incomingMessages.length === MESSAGES_LIMIT
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

    // Prevent duplicate top-level messages
    if (!msg.replyToId && prev.some(m => m.id === msg.id)) {
      return state;
    }

    // the message is a reply
    if (msg.replyToId) {
      const updated = updateMessageInTree(prev, msg.replyToId, (parent) => {
        const existingReplies = parent.replies ?? [];

        // Prevent duplicate replies
        if (existingReplies.some(r => r.id === msg.id)) {
          return parent;
        }

        return {
          ...parent,
          replies: [...existingReplies, msg],
        };
      });

      return { messagesByRoom: { ...state.messagesByRoom, [roomId]: updated } };
    }

    // the message is a top-level message
    return {
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: [...prev, msg],
      },
    };
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
          replies: msg.replies, 
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

  setAnchorMessageId: (roomId, messageId) => {
    if (get().anchorMessageIdByRoom[roomId] === messageId) return;

    set((state) => ({
      anchorMessageIdByRoom: {
        ...state.anchorMessageIdByRoom,
        [roomId]: messageId,
      },
    }));
  },

  getAnchorMessageId: (roomId) => {
    return get().anchorMessageIdByRoom[roomId] ?? null;
  },
  
  setAnchorOffset: (roomId, offset) => {
    if (get().anchorOffsetByRoom[roomId] === offset) return;
    
    set((state) => ({
      anchorOffsetByRoom: {
        ...state.anchorOffsetByRoom,
        [roomId]: offset,
      },
    }));
  },

  getAnchorOffset: (roomId) => {
    return get().anchorOffsetByRoom[roomId] ?? 0;
  },

}));
