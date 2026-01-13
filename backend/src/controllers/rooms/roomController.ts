import { type Request, type Response } from "express";
import { getAllRooms, createNewRoom, deleteRoom as deleteRoomService, joinTheRoom, leaveTheRoom, getAllRoomUsers, getTheUserRoomsWithMembership } from "../../services/rooms/roomService.js";
import { type AuthRequest, type RoomDTO, type ApiResponse, type UserRoomDTO, type RoomUsers, type RoomWithMembershipDTO } from "../../types/custom.js";
import { io } from "../../index.js";

export const getRooms = async (_req: Request, res: Response<ApiResponse<RoomDTO[]>>): Promise<void> => {
    try {
        const rooms = await getAllRooms();
        res.json({ data: rooms });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms.'});
    }
};

export const createRoom = async(req: Request, res:Response<ApiResponse<RoomDTO>>): Promise<void> => {
    try {
        const { name, isPrivate } = req.body;
        const userId = (req as AuthRequest).user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const newRoom = await createNewRoom(Number(userId), name, isPrivate);
        await joinTheRoom(Number(userId), newRoom.id);

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
    } catch (error) {
        if (error instanceof Error && error.message === 'Room already exists.') {
            res.status(409).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to create new room.' });
    }
};

export const deleteRoom = async (req: Request<{ roomId: string }>, 
    res: Response<ApiResponse<{ id: number }>>): Promise<void> => {
    try {
        const { roomId } = req.params;
        const userId = (req as AuthRequest).user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        await deleteRoomService(Number(userId), Number(roomId));

        io.emit("room:deleted", {
            roomId: Number(roomId),
        });

        res.status(200).json({ data: { id: Number(roomId) } })
        
    } catch (error) {
        if (error instanceof Error && error.message === "ROOM_NOT_FOUND_OR_FORBIDDEN") {
            res.status(404).json({ error: "Room not found or access denied." });
            return;
        }
        res.status(500).json({ error: 'Failed to delete room.'});
    }
}

export const joinRoom = async (req: Request<{ roomId: string }>, res:Response<ApiResponse<UserRoomDTO>>): Promise<void> => {
    try {
        const { roomId } = req.params;
        const userId = (req as AuthRequest).user?.id; // from middleware (decoded JWT)

        if (!userId || !roomId) {
            res.status(400).json({ error: "Missing userId or roomId." });
            return;
        }

        const joined = await joinTheRoom(Number(userId), Number(roomId));

        // Emit event to clients in that room
        io.to(roomId.toString()).emit("roomMembershipUpdated", { roomId });

        res.json({ data: joined });
        
    } catch (error) {
        if (error instanceof Error) {
            // Custom error handling
            if (error.message.includes("already joined")) {
            res.status(400).json({ error: error.message });
            return;
            }
            res.status(500).json({ error: error.message });
        } else {
            // In case a non-Error is thrown
            res.status(500).json({ error: 'Unknown error occurred.' });
        }
    }
};

export const leaveRoom = async (req: Request<{ roomId: string }>, res: Response<ApiResponse<UserRoomDTO>>): Promise<void> => {
    try {
        const { roomId } = req.params;
        const userId = (req as AuthRequest).user?.id; 

        if (!roomId || !userId) {
            res.status(400).json({ error: "Missing userId or roomId." });
            return;
        }

        const left = await leaveTheRoom(Number(userId), Number(roomId));

        // Emit event to clients in that room
        io.to(roomId.toString()).emit("roomMembershipUpdated", { roomId });
        
        res.json({ data: left });
    } catch (error) {
        if (error instanceof Error) {
        // user-friendly errors
        if (error.message.includes("not a member")) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Unknown error occurred." });
        }
    }

};

export const getRoomUsers = async (req: Request<{ roomId: string }>, res: Response<ApiResponse<RoomUsers[]>>): Promise<void> => {
    try {
        const { roomId } = req.params;
        const roomUsers = await getAllRoomUsers(Number(roomId));
        
        res.json({ data: roomUsers });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch room users.'});
    }
};

export const getUserRoomsWithMembership = async (req: Request<{ userId: string}>, res: Response<ApiResponse<RoomWithMembershipDTO[]>>): Promise<void> => {
    try {
        const { userId } = req.params;
        const rooms = await getTheUserRoomsWithMembership(Number(userId));
        res.json({ data: rooms });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user's rooms." })
    }
};