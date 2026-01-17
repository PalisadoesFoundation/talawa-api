import type { AggregatedMetrics } from "../../workers/metrics/types";
import type { CacheService } from "../caching/CacheService";
import { CacheNamespace } from "../caching/cacheConfig";

/**
 * Logger interface for metrics cache operations.
 */
type Logger = {
	debug: (obj: object, msg?: string) => void;
	warn: (obj: object, msg?: string) => void;
	error: (obj: object, msg?: string) => void;
};

/**
 * Service for caching aggregated metrics data.
 * Provides methods to cache and retrieve metrics snapshots with configurable TTL.
 *
 * All cache operations are wrapped with try/catch for graceful degradation.
 * Cache failures should not break metrics collection or request handling.
 */
export class MetricsCacheService {
	constructor(
		private readonly cache: CacheService,
		private readonly logger?: Logger,
		private readonly defaultTtlSeconds: number = 300,
	) {}

	/**
	 * Cache aggregated metrics with a timestamp identifier.
	 *
	 * @param metrics - The aggregated metrics to cache
	 * @param timestamp - Timestamp identifier (milliseconds since epoch as string)
	 * @param ttlSeconds - Optional TTL override (defaults to configured default)
	 * @returns Promise that resolves when caching is complete (or fails silently)
	 *
	 * @example
	 * ```typescript
	 * await metricsCache.cacheAggregatedMetrics(metrics, "1705320000000", 600);
	 * ```
	 */
	async cacheAggregatedMetrics(
		metrics: AggregatedMetrics,
		timestamp: string,
		ttlSeconds?: number,
	): Promise<void> {
		if (!metrics || !timestamp) {
			this.logger?.warn(
				{
					msg: "metrics cache: invalid input",
					hasMetrics: !!metrics,
					hasTimestamp: !!timestamp,
				},
				"Skipping cache operation due to invalid input",
			);
			return;
		}

		try {
			const key = this.getAggregatedMetricsKey(timestamp);
			// Validate and normalize TTL - use default if not provided, non-positive, or non-finite
			let ttl = this.defaultTtlSeconds;
			if (
				ttlSeconds !== undefined &&
				Number.isFinite(ttlSeconds) &&
				ttlSeconds > 0
			) {
				ttl = ttlSeconds;
			} else if (ttlSeconds !== undefined) {
				this.logger?.warn(
					{
						msg: "metrics cache: invalid ttl",
						providedTtl: ttlSeconds,
						usingDefault: this.defaultTtlSeconds,
					},
					"Invalid TTL provided (non-finite or non-positive), using default",
				);
			}
			await this.cache.set(key, metrics, ttl);
			this.logger?.debug(
				{
					key,
					ttlSeconds: ttl,
					timestamp,
				},
				"Metrics cached successfully",
			);
		} catch (error) {
			this.logger?.error(
				{
					msg: "metrics cache: set failed",
					timestamp,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				"Failed to cache aggregated metrics",
			);
		}
	}

	/**
	 * Retrieve cached aggregated metrics by timestamp.
	 *
	 * @param timestamp - Timestamp identifier (milliseconds since epoch as string)
	 * @returns Cached metrics or null if not found/expired
	 *
	 * @example
	 * ```typescript
	 * const metrics = await metricsCache.getCachedMetrics("1705320000000");
	 * if (metrics) {
	 *   // Use cached metrics
	 * }
	 * ```
	 */
	async getCachedMetrics(timestamp: string): Promise<AggregatedMetrics | null> {
		if (!timestamp) {
			return null;
		}

		try {
			const key = this.getAggregatedMetricsKey(timestamp);
			const metrics = await this.cache.get<AggregatedMetrics>(key);
			if (metrics) {
				this.logger?.debug(
					{
						key,
						timestamp,
					},
					"Metrics retrieved from cache",
				);
			}
			return metrics;
		} catch (error) {
			this.logger?.error(
				{
					msg: "metrics cache: get failed",
					timestamp,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				"Failed to retrieve cached metrics",
			);
			return null;
		}
	}

	/**
	 * Retrieve cached aggregated metrics by time window (hourly or daily).
	 *
	 * @param windowType - Type of time window ('hourly' or 'daily')
	 * @param date - Date string in format 'YYYY-MM-DD' for daily or 'YYYY-MM-DD-HH' for hourly
	 * @returns Cached metrics or null if not found/expired
	 *
	 * @example
	 * ```typescript
	 * // Get hourly metrics for 2024-01-15 at 14:00
	 * const metrics = await metricsCache.getCachedMetricsByWindow('hourly', '2024-01-15-14');
	 *
	 * // Get daily metrics for 2024-01-15
	 * const metrics = await metricsCache.getCachedMetricsByWindow('daily', '2024-01-15');
	 * ```
	 */
	async getCachedMetricsByWindow(
		windowType: "hourly" | "daily",
		date: string,
	): Promise<AggregatedMetrics | null> {
		if (!date) {
			return null;
		}

		try {
			const key = this.getWindowedMetricsKey(windowType, date);
			const metrics = await this.cache.get<AggregatedMetrics>(key);
			if (metrics) {
				this.logger?.debug(
					{
						key,
						windowType,
						date,
					},
					"Windowed metrics retrieved from cache",
				);
			}
			return metrics;
		} catch (error) {
			this.logger?.error(
				{
					msg: "metrics cache: get windowed failed",
					windowType,
					date,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				"Failed to retrieve cached windowed metrics",
			);
			return null;
		}
	}

	/**
	 * Cache aggregated metrics for a time window (hourly or daily).
	 *
	 * @param metrics - The aggregated metrics to cache
	 * @param windowType - Type of time window ('hourly' or 'daily')
	 * @param date - Date string in format 'YYYY-MM-DD' for daily or 'YYYY-MM-DD-HH' for hourly
	 * @param ttlSeconds - Optional TTL override (defaults to longer TTL for windowed metrics)
	 * @returns Promise that resolves when caching is complete (or fails silently)
	 *
	 * @example
	 * ```typescript
	 * // Cache hourly metrics with default TTL (3600 seconds)
	 * await metricsCache.cacheWindowedMetrics(metrics, 'hourly', '2024-01-15-14');
	 *
	 * // Cache daily metrics with custom TTL
	 * await metricsCache.cacheWindowedMetrics(metrics, 'daily', '2024-01-15', 86400);
	 * ```
	 */
	async cacheWindowedMetrics(
		metrics: AggregatedMetrics,
		windowType: "hourly" | "daily",
		date: string,
		ttlSeconds?: number,
	): Promise<void> {
		if (!metrics || !date) {
			this.logger?.warn(
				{
					msg: "metrics cache: invalid windowed input",
					hasMetrics: !!metrics,
					hasDate: !!date,
				},
				"Skipping cache operation due to invalid input",
			);
			return;
		}

		try {
			const key = this.getWindowedMetricsKey(windowType, date);
			// Use longer TTL for windowed metrics: hourly = 3600s, daily = 86400s
			const defaultWindowTtl = windowType === "hourly" ? 3600 : 86400;
			// Validate and normalize TTL - use default if not provided, non-positive, or non-finite
			let ttl = defaultWindowTtl;
			if (
				ttlSeconds !== undefined &&
				Number.isFinite(ttlSeconds) &&
				ttlSeconds > 0
			) {
				ttl = ttlSeconds;
			} else if (ttlSeconds !== undefined) {
				this.logger?.warn(
					{
						msg: "metrics cache: invalid windowed ttl",
						providedTtl: ttlSeconds,
						usingDefault: defaultWindowTtl,
					},
					"Invalid TTL provided (non-finite or non-positive), using default",
				);
			}
			await this.cache.set(key, metrics, ttl);
			this.logger?.debug(
				{
					key,
					ttlSeconds: ttl,
					windowType,
					date,
				},
				"Windowed metrics cached successfully",
			);
		} catch (error) {
			this.logger?.error(
				{
					msg: "metrics cache: set windowed failed",
					windowType,
					date,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				"Failed to cache windowed metrics",
			);
		}
	}

	/**
	 * Invalidate metrics cache entries matching a pattern.
	 *
	 * @param pattern - Optional glob pattern (e.g., "metrics:aggregated:*" or "metrics:aggregated:hourly:*")
	 *                  If not provided, invalidates all metrics cache entries
	 * @returns Promise that resolves when invalidation is complete (or fails silently)
	 *
	 * @example
	 * ```typescript
	 * // Invalidate all metrics
	 * await metricsCache.invalidateMetricsCache();
	 *
	 * // Invalidate only hourly metrics
	 * await metricsCache.invalidateMetricsCache("aggregated:hourly:*");
	 * ```
	 */
	async invalidateMetricsCache(pattern?: string): Promise<void> {
		try {
			// Validate pattern if provided - only allow safe characters
			if (pattern) {
				// Allow alphanumeric, dashes, underscores, colons, and asterisks (for wildcards)
				const safePatternRegex = /^[a-zA-Z0-9_\-:*]+$/;
				if (!safePatternRegex.test(pattern)) {
					this.logger?.warn(
						{
							msg: "metrics cache: invalid pattern",
							pattern,
						},
						"Pattern contains invalid characters, skipping invalidation",
					);
					return;
				}
			}

			// Normalize pattern by stripping any leading namespace:metrics: or metrics: prefix
			let normalizedPattern = pattern;
			if (normalizedPattern) {
				// Strip leading CacheNamespace:metrics: if present
				const fullPrefix = `${CacheNamespace}:metrics:`;
				if (normalizedPattern.startsWith(fullPrefix)) {
					normalizedPattern = normalizedPattern.slice(fullPrefix.length);
				} else if (normalizedPattern.startsWith("metrics:")) {
					// Strip leading metrics: if present
					normalizedPattern = normalizedPattern.slice("metrics:".length);
				}
			}

			// Construct cache pattern efficiently
			const cachePattern = normalizedPattern
				? `${CacheNamespace}:metrics:${normalizedPattern}`
				: `${CacheNamespace}:metrics:*`;
			await this.cache.clearByPattern(cachePattern);
			this.logger?.debug(
				{
					pattern: cachePattern,
				},
				"Metrics cache invalidated",
			);
		} catch (error) {
			this.logger?.error(
				{
					msg: "metrics cache: invalidation failed",
					pattern,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				"Failed to invalidate metrics cache",
			);
		}
	}

	/**
	 * Generate cache key for aggregated metrics by timestamp.
	 *
	 * @param timestamp - Timestamp identifier
	 * @returns Cache key in format: `${CacheNamespace}:metrics:aggregated:${timestamp}`
	 */
	private getAggregatedMetricsKey(timestamp: string): string {
		return `${CacheNamespace}:metrics:aggregated:${timestamp}`;
	}

	/**
	 * Generate cache key for windowed metrics (hourly or daily).
	 *
	 * @param windowType - Type of time window ('hourly' or 'daily')
	 * @param date - Date string in format 'YYYY-MM-DD' for daily or 'YYYY-MM-DD-HH' for hourly
	 * @returns Cache key in format: `${CacheNamespace}:metrics:aggregated:${windowType}:${date}`
	 */
	private getWindowedMetricsKey(
		windowType: "hourly" | "daily",
		date: string,
	): string {
		return `${CacheNamespace}:metrics:aggregated:${windowType}:${date}`;
	}
}
