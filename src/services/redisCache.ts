import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "../constants";

const RedisCache = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT || 6379,
  password: REDIS_PASSWORD,
});

// Setting the limit of the max memory of the cache to 100MB
if (!REDIS_PASSWORD) {
  RedisCache.config("SET", "maxmemory", 100 * 1024 * 1024);
  // Setting the eviction policy to Least Frequently Used ,evicted first algorithm
  RedisCache.config("SET", "maxmemory-policy", "allkeys-lfu");
}

export default RedisCache;
