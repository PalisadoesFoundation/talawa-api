import type { CacheService } from "./CacheService";

/**
 * Type representing a Redis-like client interface.
 * Compatible with @fastify/redis client.
 */
type RedisLike = {
	get(key: string): Promise<string | null>;
	setex(key: string, ttl: number, value: string): Promise<unknown>;
	set?(
		key: string,
		value: string,
		mode?: string,
		ttl?: number,
	): Promise<unknown>;
	del(...keys: string[]): Promise<number>;
	scan(
		cursor: string,
		match: string,
		pattern: string,
		count: string,
		countValue: number,
	): Promise<[string, string[]]>;
	mget(...keys: string[]): Promise<(string | null)[]>;
};

/**
 * Logger interface for cache operations.
 */
type Logger = {
	debug: (obj: object, msg?: string) => void;
	warn: (obj: object, msg?: string) => void;
	error: (obj: object, msg?: string) => void;
};

/**
 * Redis-backed implementation of CacheService.
 * All operations are wrapped with try/catch for graceful degradation.
 */
export class RedisCacheService implements CacheService {
	constructor(
		private readonly redis: RedisLike,
		private readonly logger: Logger,
	) {}

	async get<T>(key: string): Promise<T | null> {
		try {
			const raw = await this.redis.get(key);
			return raw ? (JSON.parse(raw) as T) : null;
		} catch (err) {
			this.logger.warn({ msg: "cache get failed", key, err });
			return null;
		}
	}

	async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
		try {
			const str = JSON.stringify(value);
			await this.redis.setex(key, ttlSeconds, str);
		} catch (err) {
			this.logger.warn({ msg: "cache set failed", key, ttlSeconds, err });
		}
	}

	async del(keys: string | string[]): Promise<void> {
		try {
			const arr = Array.isArray(keys) ? keys : [keys];
			if (arr.length) {
				await this.redis.del(...arr);
			}
		} catch (err) {
			this.logger.warn({ msg: "cache del failed", keys, err });
		}
	}

	async clearByPattern(pattern: string): Promise<void> {
		// Use SCAN to avoid blocking Redis with KEYS command
		try {
			let cursor = "0";
			do {
				const [next, keys] = await this.redis.scan(
					cursor,
					"MATCH",
					pattern,
					"COUNT",
					1000,
				);
				cursor = next;
				if (keys.length) {
					await this.redis.del(...keys);
				}
			} while (cursor !== "0");
		} catch (err) {
			this.logger.warn({ msg: "cache clearByPattern failed", pattern, err });
		}
	}

	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		if (!keys.length) {
			return [];
		}
		try {
			const results = await this.redis.mget(...keys);
			return results.map((r) => {
				if (r === null) return null;
				try {
					return JSON.parse(r) as T;
				} catch {
					return null;
				}
			});
		} catch (err) {
			this.logger.warn({ msg: "cache mget failed", keys, err });
			return keys.map(() => null);
		}
	}

	async mset<T>(
		entries: Array<{ key: string; value: T; ttlSeconds: number }>,
	): Promise<void> {
		if (!entries.length) {
			return;
		}
		try {
			// Use Promise.allSettled to persist successful entries even if some fail.
			// This is more resilient than Promise.all which aborts on first failure.
			const results = await Promise.allSettled(
				entries.map((e) =>
					this.redis
						.setex(e.key, e.ttlSeconds, JSON.stringify(e.value))
						.then(() => e.key),
				),
			);

			// Log any individual failures
			for (const result of results) {
				if (result.status === "rejected") {
					this.logger.warn({
						msg: "cache mset partial failure",
						err: result.reason,
					});
				}
			}
		} catch (err) {
			// Fallback for unexpected errors (e.g., before Promise.allSettled runs)
			this.logger.warn({ msg: "cache mset failed", err });
		}
	}
}
