import { type Request, type Response } from "express";
import { type AuthRequest, type ApiResponse, type MessageDTO, type MessageReaction } from "../../types/custom.js";
import * as messageService from "../../services/messages/messageService.js";
import prisma from "../../prismaClient.js";

export const getAllMessages = async (_: Request, res: Response<ApiResponse<MessageDTO[]>>): Promise<void> => {
  try {
    const allMessages = await messageService.getAllMessages();
    res.status(200).json({ data: allMessages });
  } catch (error) {
    console.error("Error fetching the messages.", error);
    res.status(500).json({ error: "Failed to get the messages." });
  }
};

 
export const getRoomMessages = async (
  req: Request<{ roomId: string }, {}, {}, { limit?: string; before?: string }>,
  res: Response<ApiResponse<MessageDTO[]>>
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const limit = Number(req.query.limit) || 30;
    const before = req.query.before ? Number(req.query.before) : undefined;

    if (!roomId) {
      res.status(400).json({ error: "Missing roomId." });
      return;
    }

    const messages = await messageService.getMessagesByRoom(
      Number(roomId),
      limit,
      before
    );

    res.status(200).json({ data: messages });
  } catch (error) {
    console.error("Error fetching room messages:", error);
    res.status(500).json({ error: "Failed to get the room messages." });
  }
};


export const saveRoomMessage = async (
   req: Request<{ roomId: string}> & AuthRequest, 
   res: Response<ApiResponse<MessageDTO>>): Promise<void> => {
      
 try {
    const { roomId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!text || !roomId) {
      res.status(400).json({ error: "Missing roomId or text" });
      return;
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
      res.status(404).json({ error: "User not found" });
      return;
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
 } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save message" });
 }
};

export const reactToMessage = async(req: Request<{ messageId: string }> & AuthRequest, 
  res: Response<ApiResponse<MessageReaction>>): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { emoji }: { emoji: string } = req.body;
    const userId = Number(req.user?.id);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const reaction = await messageService.addReactionToMessage({ messageId: Number(messageId), emoji, userId });
    res.status(201).json({ data: reaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save reaction" });
  }
};