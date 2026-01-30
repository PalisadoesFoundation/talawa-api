import { Type } from "typebox";

export const baseConfigSchema = Type.Object({
	/**
	 * The frontend URL allowed for CORS.
	 */
	FRONTEND_URL: Type.String({
		minLength: 1,
		format: "uri",
	}),
	/**
	 * Base url that is exposed to the clients for making requests to the talawa api server at runtime.
	 */
	API_BASE_URL: Type.String({
		minLength: 1,
	}),
	/**
	 * URL to the instagram account of the community.
	 */
	API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: Type.Optional(
		Type.Integer({
			minimum: 1,
		}),
	),
	/**
	 * Name of the community.
	 */
	API_COMMUNITY_NAME: Type.String({
		minLength: 1,
	}),
	/**
	 * Used for providing the host of the domain on which talawa api will run.
	 */
	API_HOST: Type.String({
		minLength: 1,
	}),
	/**
	 * Used for providing the decision for whether to enable pretty logging with pino.js logger. It is useful to enable prettier logging in development environments for easier developer log comprehension.
	 */
	API_IS_PINO_PRETTY: Type.Boolean(),
	/**
	 * Used for providing the log level for the logger used in talawa api.
	 *
	 * @privateRemarks
	 * Log levels should only be changed when the developers know what they're doing. Otherwise the default log level of `info` should be used.
	 */
	API_LOG_LEVEL: Type.Enum({
		debug: "debug",
		error: "error",
		fatal: "fatal",
		info: "info",
		trace: "trace",
		warn: "warn",
	}),
	/**
	 * Used for providing the port of the domain on which the server will run.
	 */
	API_PORT: Type.Number({
		maximum: 65535,
		minimum: 0,
	}),
	/**
	 * Optional JSON object to override default cache TTL values per entity type.
	 *
	 * **Format**: JSON object with entity keys and TTL values in seconds.
	 *
	 * **Valid keys**: `user`, `organization`, `event`, `post`
	 *
	 * **Example**: `'{"user": 600, "organization": 600, "event": 240, "post": 120}'`
	 *
	 * **Error Handling**:
	 * - If the JSON is malformed, the entire value is ignored and default TTLs are used.
	 *   A warning is logged via `console.warn` in `src/services/caching/cacheConfig.ts`.
	 * - Unknown keys are silently ignored (no warning).
	 * - Non-numeric or non-positive values for valid keys are ignored with a warning log.
	 *
	 * **Defaults** (defined in `src/services/caching/cacheConfig.ts`):
	 * - `user`: 300 seconds (5 minutes)
	 * - `organization`: 300 seconds (5 minutes)
	 * - `event`: 120 seconds (2 minutes)
	 * - `post`: 60 seconds (1 minute)
	 *
	 * @see src/services/caching/cacheConfig.ts for TTL parsing logic and defaults.
	 */
	CACHE_ENTITY_TTLS: Type.Optional(
		Type.String({
			minLength: 2, // Minimum valid JSON: "{}"
			format: "json", // Validates JSON syntax at schema-time
		}),
	),
	/**
	 * Maximum capacity of a user's request bucket for rate limiting.
	 */
	API_RATE_LIMIT_BUCKET_CAPACITY: Type.Number({
		minimum: 0,
	}),

	/**
	 * Rate at which a user's request bucket refills per second for rate limiting.
	 */
	API_RATE_LIMIT_REFILL_RATE: Type.Number({
		minimum: 0,
	}),
	/**
	 * Cron schedule for the recurring event instance generation background worker.
	 * Default: "0 * * * *" (every hour at minute 0)
	 */
	RECURRING_EVENT_GENERATION_CRON_SCHEDULE: Type.Optional(
		Type.String({
			minLength: 9, // Minimum valid cron: "* * * * *"
		}),
	),

	/**
	 * Cron schedule for the old event instance cleanup background worker.
	 * Default: "0 2 * * *" (daily at 2 AM UTC)
	 */
	OLD_EVENT_INSTANCES_CLEANUP_CRON_SCHEDULE: Type.Optional(
		Type.String({
			minLength: 9, // Minimum valid cron: "* * * * *"
		}),
	),
});
