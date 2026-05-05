import redis from "./redisClient.js";
import { type MessageDTO } from "../types/custom.js";
import { CACHE_CONFIG } from "../constants/cache.js";

export const getCachedRoomMessages = async (cacheKey: string): Promise<MessageDTO[] | null> => {
  const key = `v${CACHE_CONFIG.VERSION}:room:${cacheKey}`;
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
  const key = `v${CACHE_CONFIG.VERSION}:room:${cacheKey}`;
  await redis.set(key, JSON.stringify(messages), "EX", CACHE_CONFIG.MESSAGES.TTL_SECONDS);
};

export const invalidateRoomMessagesCache = async (roomId: number) => {
  const pattern = `v${CACHE_CONFIG.VERSION}:room:${roomId}:*`;

  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", CACHE_CONFIG.REDIS.SCAN_COUNT);
    cursor = nextCursor;

    if (keys.length > 0) {
      await redis.del(keys);
    }
  } while (cursor !== "0");
};
