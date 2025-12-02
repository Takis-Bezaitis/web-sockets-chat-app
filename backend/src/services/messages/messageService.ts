import prisma from "../../prismaClient.js";
import { type MessageDTO, type MessageReaction } from "../../types/custom.js";
import { getCachedRoomMessages, setCachedRoomMessages, invalidateRoomMessagesCache } from "../../utils/cacheMessages.js";

interface SaveMessageInput {
  text: string;
  userId: number;
  roomId: number;
}

export const getAllTheMessages = async (): Promise<MessageDTO[]> => {
  const messages = await prisma.message.findMany({
    include: {
      user: { select: { email: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Map to DTO
  return messages.map((msg) => ({
    id: msg.id,
    userId: msg.userId,
    email: msg.user.email,  // flatten user.email
    text: msg.text,
    createdAt: msg.createdAt.toISOString(),
    roomId: msg.roomId,
    username: msg.user.username,
  }));
};

export const saveTheRoomMessage = async (
  { text, userId, roomId }: SaveMessageInput
): Promise<MessageDTO> => {
  // Create the message
  const message = await prisma.message.create({
    data: { text, userId, roomId },
    include: { user: { select: { email: true, username: true } } } // fetch email from User
  });

   // Invalidate Redis cache for this room
  await invalidateRoomMessagesCache(roomId);

  // Return a MessageDTO to the controller
  return {
    id: message.id,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
    userId: message.userId,
    email: message.user.email,
    roomId: message.roomId,
    username: message.user.username,
    reactions: []
  };
};

export const getTheRoomMessages = async (roomId: number): Promise<MessageDTO[]> => {
  // 1️⃣ Try Redis cache first
  const cached = await getCachedRoomMessages(roomId);
  if (cached) return cached;

  // 2️⃣ Fallback to Prisma if not cached
  const messages = await prisma.message.findMany({
    where: { roomId },
    include: {
      user: { select: { email: true, username: true } },
      reactions: {
        include: {
          user: { select: { id: true, username: true } } // include user info for reactions
        }
      }
    },
    orderBy: { createdAt: "asc" },
  });

  const dto = messages.map((m) => ({
    id: m.id,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    userId: m.userId,
    email: m.user.email,
    username: m.user.username,
    roomId: m.roomId,
    reactions: m.reactions.map((r) => ({
      userId: r.userId,
      username: r.user.username,
      emoji: r.emoji
    }))
  }));

  // 3️⃣ Store in Redis cache
  await setCachedRoomMessages(roomId, dto);

  return dto;
};

interface AddMessageReactionInput  {
  messageId: number;
  emoji: string;
  userId: number;
};

export const addMessageReaction = async({ messageId, emoji, userId }: AddMessageReactionInput ): Promise<MessageReaction> => {
  // Check if exists
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
    include: { user: { select: { id: true, username: true } } }
  });

  if (existing) {
    return {
      userId: existing.user.id,
      username: existing.user.username,
      emoji: existing.emoji,
    };
  }
  
  // Else create
  const reaction = await prisma.messageReaction.create({
    data: { messageId, emoji, userId },
    include: { user: { select: { id: true, username: true } } },
  });

  // Invalidate Redis cache for the room of this message
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (message) {
    await invalidateRoomMessagesCache(message.roomId);
  }
  
  return {
    userId: reaction.user.id,
    username: reaction.user.username,
    emoji: reaction.emoji,
  };
}