import prisma from "../../prismaClient.js";
import { type MessageDTO } from "../../types/custom.js";
import { getCachedRoomMessages, setCachedRoomMessages, invalidateRoomMessagesCache } from "../../utils/cacheMessages.js";

interface SaveMessageInput {
  text: string;
  userId: number;
  roomId: number;
}

export const getAllTheMessages = async (): Promise<MessageDTO[]> => {
  const messages = await prisma.message.findMany({
    include: {
      user: { select: { email: true } },
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
  }));
};

export const saveTheRoomMessage = async (
  { text, userId, roomId }: SaveMessageInput
): Promise<MessageDTO> => {
  // Create the message
  const message = await prisma.message.create({
    data: { text, userId, roomId },
    include: { user: { select: { email: true } } } // fetch email from User
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
  };
};

export const getTheRoomMessages = async (roomId: number): Promise<MessageDTO[]> => {
  // 1️⃣ Try Redis cache first
  const cached = await getCachedRoomMessages(roomId);
  if (cached) return cached;

  // 2️⃣ Fallback to Prisma if not cached
  const messages = await prisma.message.findMany({
    where: { roomId },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const dto = messages.map((m) => ({
    id: m.id,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    userId: m.userId,
    email: m.user.email,
    roomId: m.roomId,
  }));

  // 3️⃣ Store in Redis cache
  await setCachedRoomMessages(roomId, dto);

  return dto;
};
