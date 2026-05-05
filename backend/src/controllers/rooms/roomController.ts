import { type Request, type Response } from "express";
import * as roomService from "../../services/rooms/roomService.js";
import { type AuthRequest, type RoomDTO, type ApiResponse, type UserRoomDTO, type RoomUsers, type RoomWithMembershipDTO } from "../../types/custom.js";
import { io } from "../../index.js";
import { AppError } from "../../utils/AppError.js";

export const getRooms = async (_req: Request, res: Response<ApiResponse<RoomDTO[]>>): Promise<void> => {
    const rooms = await roomService.getRooms();
    res.json({ data: rooms });
};

export const createRoom = async(req: Request, res:Response<ApiResponse<RoomDTO>>): Promise<void> => {
    const { name, isPrivate } = req.body;
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    const newRoom = await roomService.createRoom(Number(userId), name, isPrivate);
    await roomService.joinRoom(Number(userId), newRoom.id);

    io.emit("room:created", {
    room: {
            id: newRoom.id,
            name: newRoom.name,
            isPrivate: newRoom.isPrivate,
            creatorId: userId,
            hasUserMessages: newRoom.hasUserMessages
        },
    });

    res.status(201).json({ data: newRoom });
};

export const deleteRoom = async (req: Request<{ roomId: string }>, 
    res: Response<ApiResponse<{ id: number }>>): Promise<void> => {
    const { roomId } = req.params;
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    await roomService.deleteRoom(Number(userId), Number(roomId));

    io.emit("room:deleted", {
        roomId: Number(roomId),
    });

    res.status(200).json({ data: { id: Number(roomId) } });
}

export const joinRoom = async (req: Request<{ roomId: string }>, res:Response<ApiResponse<UserRoomDTO>>): Promise<void> => {
    const { roomId } = req.params;
    const userId = (req as AuthRequest).user?.id; // from middleware (decoded JWT)

    if (!userId || !roomId) {
        throw new AppError("Missing userId or roomId.", 400);
    }

    const joined = await roomService.joinRoom(Number(userId), Number(roomId));
    res.json({ data: joined });
};

export const leaveRoom = async (req: Request<{ roomId: string }>, res: Response<ApiResponse<UserRoomDTO>>): Promise<void> => {
    const { roomId } = req.params;
    const userId = (req as AuthRequest).user?.id; 

    if (!roomId || !userId) {
        throw new AppError("Missing userId or roomId.", 400);
    }

    const left = await roomService.leaveRoom(Number(userId), Number(roomId));
    res.json({ data: left });
};

export const getRoomUsers = async (req: Request<{ roomId: string }>, res: Response<ApiResponse<RoomUsers[]>>): Promise<void> => {
    const { roomId } = req.params;
    const roomUsers = await roomService.getRoomUsers(Number(roomId));
    res.json({ data: roomUsers });
};

export const getUserRoomsWithMembership = async (req: Request<{ userId: string}>, res: Response<ApiResponse<RoomWithMembershipDTO[]>>): Promise<void> => {
    const { userId } = req.params;
    const rooms = await roomService.getUserRoomsWithMembership(Number(userId));
    res.json({ data: rooms });
};