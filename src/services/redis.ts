import { Redis } from "ioredis";

export const OrganizationCache = new Redis({
    host:'localhost',
    port: 6379
});

