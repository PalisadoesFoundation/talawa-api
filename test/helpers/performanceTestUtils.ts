import Fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { EnvConfig } from "~/src/envConfigSchema";
import type { CacheService } from "~/src/services/caching/CacheService";

/**
 * Options for creating a test app.
 */
export interface CreateTestAppOptions {
	/**
	 * Custom envConfig values to use. Defaults to empty object.
	 */
	envConfig?: Partial<EnvConfig>;
	/**
	 * Logger level. Defaults to "silent".
	 */
	loggerLevel?: "silent" | "error" | "warn" | "info" | "debug" | "trace";
	/**
	 * Whether to enable full logging (overrides loggerLevel). Defaults to false.
	 */
	loggerEnabled?: boolean;
	/**
	 * Custom cache service instance. If not provided, a new MockCacheService is created.
	 */
	cache?: CacheService;
}

/**
 * Mock CacheService implementation for testing.
 * Implements all CacheService methods with in-memory storage.
 */
export class MockCacheService implements CacheService {
	store = new Map<string, unknown>();

	async get<T>(key: string): Promise<T | null> {
		return (this.store.get(key) as T) ?? null;
	}

	async set<T>(key: string, value: T, _ttlSeconds: number): Promise<void> {
		this.store.set(key, value);
	}

	async del(keys: string | string[]): Promise<void> {
		const keysArray = Array.isArray(keys) ? keys : [keys];
		for (const key of keysArray) {
			this.store.delete(key);
		}
	}

	async clearByPattern(pattern: string): Promise<void> {
		// Convert glob pattern to regex (supports * as wildcard)
		const regexPattern = pattern
			.replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special regex chars except *
			.replace(/\*/g, ".*"); // Convert * to .*
		const regex = new RegExp(`^${regexPattern}$`);

		for (const key of this.store.keys()) {
			if (regex.test(key)) {
				this.store.delete(key);
			}
		}
	}

	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		return keys.map((k) => (this.store.get(k) as T) ?? null);
	}

	async mset<T>(
		entries: Array<{ key: string; value: T; ttlSeconds: number }>,
	): Promise<void> {
		for (const entry of entries) {
			await this.set(entry.key, entry.value, entry.ttlSeconds);
		}
	}
}

/**
 * Creates a mock cacheService plugin that satisfies the performancePlugin dependency.
 * The plugin decorates the FastifyInstance with 'cache' and is named 'cacheService'.
 *
 * @param cacheService - The CacheService instance to use
 * @returns A Fastify plugin
 */
export function createMockCacheServicePlugin(cacheService: CacheService) {
	return fp(
		async (app: FastifyInstance) => {
			app.decorate("cache", cacheService);
		},
		{ name: "cacheService" },
	);
}

/**
 * Creates a properly configured Fastify test app with required decorators and plugins.
 * Includes envConfig decorator and cacheService plugin that performancePlugin depends on.
 *
 * @param options - Optional configuration for the test app
 * @returns Configured FastifyInstance ready for plugin registration
 */
export function createTestApp(
	options: CreateTestAppOptions = {},
): FastifyInstance {
	const {
		envConfig = {},
		loggerLevel = "silent",
		loggerEnabled = false,
		cache,
	} = options;

	const app = Fastify({
		logger: loggerEnabled ? true : { level: loggerLevel },
	});

	// Add required envConfig decorator
	app.decorate("envConfig", envConfig as EnvConfig);

	// Register mock cacheService plugin (satisfies performancePlugin dependency)
	const cacheService = cache ?? new MockCacheService();
	app.register(createMockCacheServicePlugin(cacheService));

	return app;
}
