export const CACHE_CONFIG = {
  VERSION: 1,

  MESSAGES: {
    TTL_SECONDS: 30,
  },

  ROOM_USERS: {
    TTL_SECONDS: 30,
  },

  PRESENCE: {
    ONLINE_USERS_KEY: "online:users",
    USER_SOCKET_SET_KEY: (userId: string) => `online:user:socketSet:${userId}`,
    TTL_SECONDS: 60,
  },

  REDIS: {
    SCAN_COUNT: 100,
  },
} as const;