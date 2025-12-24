import redis from "./redisClient.js";

const PRESENCE_TTL_SECONDS = 60; // seconds

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
