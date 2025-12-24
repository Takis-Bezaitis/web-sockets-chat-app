import redis from "./redisClient.js";
import { type RoomUsers } from "../types/custom.js";

const CACHE_VERSION = 1;     // increment to invalidate old caches
const ROOM_TTL_SECONDS = 30;      // seconds

export const getCachedRoomUsers = async (roomId: number): Promise<RoomUsers[] | null> => {
  const key = `v${CACHE_VERSION}:room:${roomId}:users`;
  const cached = await redis.get(key);

  if (!cached) return null;
  try {
    return JSON.parse(cached) as RoomUsers[];
  } catch (err) {
    console.error("Failed to parse cached room users:", err);
    return null;
  }
};

export const setCachedRoomUsers = async (roomId: number, roomUsers: RoomUsers[]) => {
  const key = `v${CACHE_VERSION}:room:${roomId}:users`;
  await redis.set(key, JSON.stringify(roomUsers), "EX", ROOM_TTL_SECONDS);
};

export const invalidateRoomUsersCache = async (roomId: number) => {
  const key = `v${CACHE_VERSION}:room:${roomId}:users`;
  await redis.del(key);
};