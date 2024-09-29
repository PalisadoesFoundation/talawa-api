import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "../constants";

// Create a new Redis instance
const RedisCache = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT || 6379,
  password: REDIS_PASSWORD,
});

// Configure Redis settings if no password is set
if (!REDIS_PASSWORD) {
  // Set the maximum memory limit of the cache to 100MB
  RedisCache.config("SET", "maxmemory", 100 * 1024 * 1024);

  // Set the eviction policy to "Least Frequently Used, evicted first" algorithm
  RedisCache.config("SET", "maxmemory-policy", "allkeys-lfu");
}

export default RedisCache;
