import prisma from "../../prismaClient.js";
import { type RoomDTO, type UserRoomDTO, type RoomUsers } from "../../types/custom.js";
import { getCachedRoomUsers, setCachedRoomUsers, invalidateRoomUsersCache } from "../../utils/cacheRoomUsers.js";

export const getAllRooms = async (): Promise<RoomDTO[]> => {
    return prisma.room.findMany({
        select: { id: true, name: true, creatorId: true, hasUserMessages: true },
    });
}; 

export const createNewRoom = async (userId: number, name: string, isPrivate: boolean): Promise<RoomDTO> => {
    const existing = await prisma.room.findUnique({
        where: { name },
    });

    if (existing) {
        throw new Error('Room already exists.');
    }

    return prisma.room.create({
        data: { creatorId: userId, name, isPrivate }
    });
};

export const deleteRoom = async (userId: number, roomId: number) => {
    const room = await prisma.room.findFirst({
        where: {
        id: roomId,
        creatorId: userId,
        },
    });

    if (!room) {
        throw new Error("ROOM_NOT_FOUND_OR_FORBIDDEN");
    }

    await prisma.userRoom.deleteMany({
        where: { roomId },
    });

    await prisma.room.delete({
        where: { id: roomId },
    });
};


export const joinTheRoom = async (userId: number, roomId: number): Promise<UserRoomDTO> => {
    // Check if already joined
    const existing = await prisma.userRoom.findUnique({
        where: {
            userId_roomId: { userId, roomId },
            //Prisma automatically creates a userId_roomId compound key because of @@id([userId, roomId])
        },
    });

    if (existing) {
        throw new Error('User already joined this room');
    };

    const record = await prisma.userRoom.create({
        data: {userId, roomId},
        select: {
            user: { select: { id: true, username: true, email: true } },
            room: { select: { id: true, name: true } },
            joinedAt: true,
        }
    });

    await invalidateRoomUsersCache(roomId);

    return {
        ...record,
        joinedAt: record.joinedAt.toISOString(), // <-- convert Date → string here
    };
};

export const leaveTheRoom = async (userId: number, roomId: number): Promise<UserRoomDTO> => {
    const existing = await prisma.userRoom.findUnique({
        where: {
            userId_roomId: { userId, roomId },
        },
        select: {
            user: { select: { id:true, username: true, email: true } },
            room: { select: { id: true, name: true}},
            joinedAt: true
        }
    })

    if (!existing) {
        throw new Error("User is not a member of this room");
    }

    const deleted  = await prisma.userRoom.delete({
        where: {
            userId_roomId: {userId, roomId}
        },
        select: { 
            user: { select: { id:true, username: true, email: true }},
            room: { select: { id: true, name: true}},
            joinedAt: true
        },
    });

    await prisma.roomInvitation.deleteMany({
        where: {
            roomId,
            inviteeId: userId,
        },
    });

    await invalidateRoomUsersCache(roomId);
    
    return {
        user: deleted.user,
        room: deleted.room,
        joinedAt: deleted.joinedAt?.toISOString(),
    };
};

export const getAllRoomUsers = async (roomId: number): Promise<RoomUsers[]> => {
    // 1️⃣ Try Redis cache first
    const cached = await getCachedRoomUsers(roomId);
    if (cached) return cached;

    // 2️⃣ Fallback to Prisma if not cached
    const roomUsers = await prisma.userRoom.findMany({
    where: { roomId },
    select: {
      user: {
        select: { id: true, username: true, email: true }
      }
    }
  });

  // Flatten the data
  const users = roomUsers.map(u => u.user);

  // 3️⃣ Store in Redis cache
  await setCachedRoomUsers(roomId, users);
   
  return users;
};

export const getTheUserRoomsWithMembership = async (userId: number) => {
    const rooms = await prisma.room.findMany({
        select: {
        id: true,
        name: true,
        isPrivate: true,
        creatorId: true,
        hasUserMessages: true,
        },
    });

    // Get all rooms the user is a member of
    const userRooms  = await prisma.userRoom.findMany({
        where: { userId },
        select: { roomId: true }
    })

    const joinedRoomIds = new Set(userRooms.map((ur) => ur.roomId));

    return rooms.map((room) => ({
        id: room.id,
        name: room.name,
        isMember: joinedRoomIds.has(room.id),
        isPrivate: room.isPrivate,
        creatorId: room.creatorId,
        hasUserMessages: room.hasUserMessages,
    }));
};