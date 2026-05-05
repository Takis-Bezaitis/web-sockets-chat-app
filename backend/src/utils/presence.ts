import redis from "./redisClient.js";
import { CACHE_CONFIG } from "../constants/cache.js";

/* ---------------- ONLINE USERS ---------------- */

export const addUserToOnlineUsers = async (userId: string, socketId: string) => {
  const key = CACHE_CONFIG.PRESENCE.USER_SOCKET_SET_KEY(userId);

  await redis.sadd(key, socketId);
  await redis.expire(key, CACHE_CONFIG.PRESENCE.TTL_SECONDS);
  const count = await redis.scard(key);

  if (count === 1) {
    await redis.sadd(CACHE_CONFIG.PRESENCE.ONLINE_USERS_KEY, userId);
    return true; // user just became online
  }

  return false;
};
 

export const removeUserFromOnlineUsers = async (userId: string, socketId: string) => {
  const key = CACHE_CONFIG.PRESENCE.USER_SOCKET_SET_KEY(userId);

  await redis.srem(key, socketId);
  const count = await redis.scard(key);

  if (count === 0) {
    await redis.del(key);
    await redis.srem(CACHE_CONFIG.PRESENCE.ONLINE_USERS_KEY, userId);
    return true; // user just went offline
  }

  return false;
};


export const getOnlineUsers = async (): Promise<string[]> => {
  const users = await redis.smembers(CACHE_CONFIG.PRESENCE.ONLINE_USERS_KEY);

  const validUsers: string[] = [];

  for (const userId of users) {
    const exists = await redis.exists(CACHE_CONFIG.PRESENCE.USER_SOCKET_SET_KEY(userId));
    if (exists) {
      validUsers.push(userId);
    } else {
      await redis.srem(CACHE_CONFIG.PRESENCE.ONLINE_USERS_KEY, userId); 
    }
  }

  return validUsers;
};



/* ---------------- ROOM PRESENCE ---------------- */

export const addUserToRoomPresence = async (userId: string, roomId: string) => {
  await redis.multi()
    .sadd(`presence:room:${roomId}`, userId)
    .sadd(`presence:user:${userId}`, roomId)
    .expire(`presence:room:${roomId}`, CACHE_CONFIG.PRESENCE.TTL_SECONDS)
    .exec();
};

export const removeUserFromRoomPresence = async (userId: string, roomId: string) => {
  await redis.multi()
    .srem(`presence:room:${roomId}`, userId)
    .srem(`presence:user:${userId}`, roomId)
    .exec();
};

export const getRoomPresence = async (roomId: string): Promise<string[]> => {
  return redis.smembers(`presence:room:${roomId}`);
};

export const refreshRoomPresence = async (userId: string, roomId: string) => {
  await redis.expire(`presence:room:${roomId}`, CACHE_CONFIG.PRESENCE.TTL_SECONDS);
  await redis.expire(`presence:user:${userId}`, CACHE_CONFIG.PRESENCE.TTL_SECONDS);
};

export const removeUserFromAllRooms = async (userId: string): Promise<string[]> => {
  const rooms = await redis.smembers(`presence:user:${userId}`);

  if (rooms.length === 0) return [];

  const pipeline = redis.multi();
  rooms.forEach(roomId => {
    pipeline.srem(`presence:room:${roomId}`, userId);
  });
  pipeline.del(`presence:user:${userId}`);
  await pipeline.exec();

  return rooms;
};
