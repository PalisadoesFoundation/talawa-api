import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "../../constants";

const OrganizationCache = new Redis({
    host:REDIS_HOST!,
    port: REDIS_PORT,
});

// Setting the limit of the max memory of the cache to 100MB
OrganizationCache.config('SET' , 'maxmemory' , 100 * 1024 * 1024)

// Setting the eviction policy to Least Frequently Used ,evicted first algorithm
OrganizationCache.config('SET', 'maxmemory-policy', 'allkeys-lfu');


export default OrganizationCache;
