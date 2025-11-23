import redis from "./redisClient.js";
import { type MessageDTO } from "../types/custom.js";

const CACHE_VERSION = 1;          // increment to invalidate old caches
const TTL_SECONDS = 30;      // 1 hour

export const getCachedRoomMessages = async (roomId: number): Promise<MessageDTO[] | null> => {
  const key = `v${CACHE_VERSION}:room:${roomId}:messages`;
  const cached = await redis.get(key);

  if (!cached) return null;
  try {
    return JSON.parse(cached) as MessageDTO[];
  } catch (err) {
    console.error("Failed to parse cached messages:", err);
    return null;
  }
};

export const setCachedRoomMessages = async (roomId: number, messages: MessageDTO[]) => {
  const key = `v${CACHE_VERSION}:room:${roomId}:messages`;
  await redis.set(key, JSON.stringify(messages), "EX", TTL_SECONDS);
};

export const invalidateRoomMessagesCache = async (roomId: number) => {
  const key = `v${CACHE_VERSION}:room:${roomId}:messages`;
  await redis.del(key);
};
