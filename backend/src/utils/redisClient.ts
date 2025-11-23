import Redis from "ioredis";

const redis = new Redis.default(process.env.REDIS_URL!)

redis.on("connect", () => {
  console.log("✅ Connected to Redis");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

export default redis;
