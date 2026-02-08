import redis from "./redisClient.js";

const ONLINE_USERS_KEY = "online:users";
const USER_SOCKET_SET_KEY = (userId: string) => `online:user:socketSet:${userId}`;

/* ---------------- ONLINE USERS ---------------- */

export const addUserToOnlineUsers = async (userId: string, socketId: string) => {
  const key = USER_SOCKET_SET_KEY(userId);

  await redis.sadd(key, socketId); // use set, no conflict with old string
  const count = await redis.scard(key);

  if (count === 1) {
    await redis.sadd(ONLINE_USERS_KEY, userId);
    return true; // user just became online
  }

  return false;
};
 

export const removeUserFromOnlineUsers = async (userId: string, socketId: string) => {
  const key = USER_SOCKET_SET_KEY(userId);

  await redis.srem(key, socketId);
  const count = await redis.scard(key);

  if (count === 0) {
    await redis.del(key);
    await redis.srem(ONLINE_USERS_KEY, userId);
    return true; // user just went offline
  }

  return false;
};


export const getOnlineUsers = async (): Promise<string[]> => {
  return redis.smembers(ONLINE_USERS_KEY);
};





/* ---------------- ROOM PRESENCE (your existing logic is fine) ---------------- */

const PRESENCE_TTL_SECONDS = 60;

export const addUserToRoomPresence = async (userId: string, roomId: string) => {
  await redis.multi()
    .sadd(`presence:room:${roomId}`, userId)
    .sadd(`presence:user:${userId}`, roomId)
    .expire(`presence:room:${roomId}`, PRESENCE_TTL_SECONDS)
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
  await redis.expire(`presence:room:${roomId}`, PRESENCE_TTL_SECONDS);
  await redis.expire(`presence:user:${userId}`, PRESENCE_TTL_SECONDS);
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
