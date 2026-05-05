import { type Request, type Response } from "express";
import { type AuthRequest, type ApiResponse, type MessageDTO, type MessageReaction } from "../../types/custom.js";
import * as messageService from "../../services/messages/messageService.js";
import prisma from "../../prismaClient.js";
import { AppError } from "../../utils/AppError.js";
import { MESSAGE_MAX_LENGTH } from "../../constants/message.js";

export const getAllMessages = async (_: Request, res: Response<ApiResponse<MessageDTO[]>>): Promise<void> => {
  const allMessages = await messageService.getAllMessages();
  res.status(200).json({ data: allMessages });
};

 
export const getRoomMessages = async (
  req: Request<{ roomId: string }, {}, {}, { limit?: string; before?: string }>,
  res: Response<ApiResponse<MessageDTO[]>>
): Promise<void> => {
  const { roomId } = req.params;
  const limit = Number(req.query.limit) || 30;
  const before = req.query.before ? Number(req.query.before) : undefined;

  if (!roomId) {
    throw new AppError("Missing roomId.", 400);
  }

  const messages = await messageService.getMessagesByRoom(
    Number(roomId),
    limit,
    before
  );

  res.status(200).json({ data: messages });
};


export const saveRoomMessage = async (
   req: Request<{ roomId: string}> & AuthRequest, 
   res: Response<ApiResponse<MessageDTO>>): Promise<void> => {
  const { roomId } = req.params;
  const { text } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!roomId) {
    throw new AppError("Missing roomId.", 400);
  }

  if (typeof text !== "string" || text.trim().length === 0 || text.length > MESSAGE_MAX_LENGTH) {
    throw new AppError("Invalid message", 400);
  }

  // Save message to DB
  const message = await messageService.createMessage({
    text,
    userId: Number(userId),
    roomId: Number(roomId),
  });

  // Fetch user's email to include in the DTO
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { email: true, username: true }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  // Construct the DTO
  const messageDTO: MessageDTO = {
    id: message.id,
    text: message.text,
    createdAt: message.createdAt,
    userId: message.userId,
    email: user.email,
    roomId: message.roomId,
    username: user.username,
    reactions: [],
  };

  res.status(201).json({ data: messageDTO });
};

export const reactToMessage = async(req: Request<{ messageId: string }> & AuthRequest, 
  res: Response<ApiResponse<MessageReaction>>): Promise<void> => {
  const { messageId } = req.params;
  const { emoji }: { emoji: string } = req.body;
  const userId = Number(req.user?.id);

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const reaction = await messageService.addReactionToMessage({ messageId: Number(messageId), emoji, userId });
  res.status(201).json({ data: reaction });
};