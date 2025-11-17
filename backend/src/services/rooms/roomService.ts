import prisma from "../../prismaClient.js"
import { type RoomDTO, type UserRoomDTO, type RoomUsers } from "../../types/custom.js"

export const getAllRooms = async (): Promise<RoomDTO[]> => {
    return prisma.room.findMany({
        select: { id: true, name: true },
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
    })

    return {
        user: deleted.user,
        room: deleted.room,
        joinedAt: deleted.joinedAt?.toISOString(), // convert Date -> string
    };
};

export const getAllRoomUsers = async (roomId: number): Promise<RoomUsers[]> => {
    const users = await prisma.userRoom.findMany({
    where: { roomId },
    select: {
      user: {
        select: { id: true, username: true, email: true }
      }
    }
  });

  // Flatten the data 
  return users.map(u => u.user);
};

export const getTheUserRoomsWithMembership = async (userId: number) => {
    const rooms = await prisma.room.findMany();

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
    }));
};