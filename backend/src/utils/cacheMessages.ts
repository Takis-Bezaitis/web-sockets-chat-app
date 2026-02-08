import redis from "./redisClient.js";
import { type MessageDTO } from "../types/custom.js";

const CACHE_VERSION = 1;     // increment to invalidate old caches
const MESSAGES_TTL_SECONDS = 30;      // seconds

export const getCachedRoomMessages = async (cacheKey: string): Promise<MessageDTO[] | null> => {
  const key = `v${CACHE_VERSION}:room:${cacheKey}`;
  const cached = await redis.get(key);

  if (!cached) return null;
  try {
    return JSON.parse(cached) as MessageDTO[];
  } catch (err) {
    console.error("Failed to parse cached messages:", err);
    return null;
  }
};

export const setCachedRoomMessages = async (cacheKey: string, messages: MessageDTO[]) => {
  const key = `v${CACHE_VERSION}:room:${cacheKey}`;
  await redis.set(key, JSON.stringify(messages), "EX", MESSAGES_TTL_SECONDS);
};

export const invalidateRoomMessagesCache = async (roomId: number) => {
  const pattern = `v${CACHE_VERSION}:room:${roomId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(keys);
};
