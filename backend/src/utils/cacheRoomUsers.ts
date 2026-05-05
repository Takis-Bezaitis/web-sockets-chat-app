import redis from "./redisClient.js";
import { type RoomUsers } from "../types/custom.js";
import { CACHE_CONFIG } from "../constants/cache.js";

export const getCachedRoomUsers = async (roomId: number): Promise<RoomUsers[] | null> => {
  const key = `v${CACHE_CONFIG.VERSION}:room:${roomId}:users`;
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
  const key = `v${CACHE_CONFIG.VERSION}:room:${roomId}:users`;
  await redis.set(key, JSON.stringify(roomUsers), "EX", CACHE_CONFIG.MESSAGES.TTL_SECONDS);
};

export const invalidateRoomUsersCache = async (roomId: number) => {
  const key = `v${CACHE_CONFIG.VERSION}:room:${roomId}:users`;
  await redis.del(key);
};