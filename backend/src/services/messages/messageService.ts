import prisma from "../../prismaClient.js";
import { type MessageDTO } from "../../types/custom.js";

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
  const messages = await prisma.message.findMany({
    where: { roomId },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((m) => ({
    id: m.id,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    userId: m.userId,
    email: m.user.email,
    roomId: m.roomId
  }));
};
