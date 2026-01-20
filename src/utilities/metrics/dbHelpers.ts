/**
 * Database helper utilities for metrics operations.
 * Provides reusable functions for metrics calculations, time window utilities,
 * and query builders for metrics persistence (if added in the future).
 */

/**
 * Calculates the mean (average) of an array of numbers.
 *
 * @param values - Array of numeric values
 * @returns The mean value, or 0 if the array is empty
 * @throws {Error} If values array is null or undefined
 *
 * @example
 * ```typescript
 * const avg = calculateMean([10, 20, 30, 40, 50]);
 * // Returns: 30
 * ```
 */
export function calculateMean(values: number[]): number {
	if (values === null || values === undefined) {
		throw new Error("Values array cannot be null or undefined");
	}

	if (values.length === 0) {
		return 0;
	}

	const sum = values.reduce((acc, val) => {
		if (!Number.isFinite(val)) {
			throw new Error("All values must be finite numbers");
		}
		return acc + val;
	}, 0);

	return sum / values.length;
}

/**
 * Calculates the median of an array of numbers.
 * For even-length arrays, returns the average of the two middle values.
 *
 * @param values - Array of numeric values
 * @returns The median value, or 0 if the array is empty
 * @throws {Error} If values array is null or undefined
 *
 * @example
 * ```typescript
 * const median = calculateMedian([10, 20, 30, 40, 50]);
 * // Returns: 30
 *
 * const medianEven = calculateMedian([10, 20, 30, 40]);
 * // Returns: 25 (average of 20 and 30)
 * ```
 */
export function calculateMedian(values: number[]): number {
	if (values === null || values === undefined) {
		throw new Error("Values array cannot be null or undefined");
	}

	if (values.length === 0) {
		return 0;
	}

	// Pre-validate all values before sorting
	for (const value of values) {
		if (!Number.isFinite(value)) {
			throw new Error("All values must be finite numbers");
		}
	}

	// Create a sorted copy to avoid mutating the original array
	const sorted = [...values].sort((a, b) => a - b);

	const mid = Math.floor(sorted.length / 2);

	if (sorted.length % 2 === 0) {
		// Even number of elements: return average of two middle values
		const lower = sorted[mid - 1];
		const upper = sorted[mid];
		/* v8 ignore next 3 */
		if (lower === undefined || upper === undefined) {
			throw new Error("Unexpected error: array index out of bounds");
		}
		return (lower + upper) / 2;
	}

	// Odd number of elements: return middle value
	const middle = sorted[mid];
	/* v8 ignore next 3 */
	if (middle === undefined) {
		throw new Error("Unexpected error: array index out of bounds");
	}
	return middle;
}

/**
 * Calculates a percentile value from an array of numbers.
 * Uses linear interpolation for values between data points.
 *
 * @param values - Array of numeric values
 * @param percentile - Percentile to calculate (0-100)
 * @returns The percentile value
 * @throws {Error} If values array is null, undefined, or empty
 * @throws {Error} If percentile is not between 0 and 100
 *
 * @example
 * ```typescript
 * const p95 = calculatePercentile([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 95);
 * // Returns: 95.5 (linear interpolation between 90 and 100)
 *
 * const p50 = calculatePercentile([10, 20, 30, 40, 50], 50);
 * // Returns: 30 (median)
 * ```
 */
export function calculatePercentile(
	values: number[],
	percentile: number,
): number {
	if (values === null || values === undefined) {
		throw new Error("Values array cannot be null or undefined");
	}

	if (values.length === 0) {
		throw new Error("Values array cannot be empty for percentile calculation");
	}

	if (!Number.isFinite(percentile) || percentile < 0 || percentile > 100) {
		throw new Error(
			`Percentile must be a finite number between 0 and 100. Got: ${percentile}`,
		);
	}

	// Pre-validate all values before sorting
	for (const value of values) {
		if (!Number.isFinite(value)) {
			throw new Error("All values must be finite numbers");
		}
	}

	// Create a sorted copy to avoid mutating the original array
	const sorted = [...values].sort((a, b) => a - b);

	// Handle edge cases
	if (percentile === 0) {
		const first = sorted[0];
		/* v8 ignore next 3 */
		if (first === undefined) {
			throw new Error("Unexpected error: array index out of bounds");
		}
		return first;
	}

	if (percentile === 100) {
		const last = sorted[sorted.length - 1];
		/* v8 ignore next 3 */
		if (last === undefined) {
			throw new Error("Unexpected error: array index out of bounds");
		}
		return last;
	}

	// Calculate position using linear interpolation
	const position = (percentile / 100) * (sorted.length - 1);
	const lowerIndex = Math.floor(position);
	const upperIndex = Math.ceil(position);
	const weight = position - lowerIndex;

	// If lower and upper are the same, return that value
	if (lowerIndex === upperIndex) {
		const value = sorted[lowerIndex];
		/* v8 ignore next 3 */
		if (value === undefined) {
			throw new Error("Unexpected error: array index out of bounds");
		}
		return value;
	}

	// Linear interpolation between lower and upper values
	const lowerValue = sorted[lowerIndex];
	const upperValue = sorted[upperIndex];
	/* v8 ignore next 3 */
	if (lowerValue === undefined || upperValue === undefined) {
		throw new Error("Unexpected error: array index out of bounds");
	}
	return lowerValue * (1 - weight) + upperValue * weight;
}

/**
 * Options for generating time windows.
 */
export interface TimeWindowOptions {
	/**
	 * Size of each time window in milliseconds.
	 * Defaults to 60000 (1 minute).
	 */
	windowSizeMs?: number;
	/**
	 * Whether to align windows to boundaries (e.g., minute boundaries).
	 * Defaults to false.
	 */
	alignToBoundaries?: boolean;
}

/**
 * Represents a single time window.
 */
export interface TimeWindow {
	/**
	 * Start time of the window (inclusive).
	 */
	start: Date;
	/**
	 * End time of the window (exclusive).
	 */
	end: Date;
}

/**
 * Generates an array of time windows for a given time range.
 * Windows are non-overlapping and cover the entire range.
 *
 * @param startTime - Start time of the range
 * @param endTime - End time of the range
 * @param options - Optional configuration for window generation
 *   - `windowSizeMs`: Size of each window in milliseconds (default: 60000 = 1 minute)
 *   - `alignToBoundaries`: When true, aligns windows to fixed time boundaries
 *     (e.g., minute or hour boundaries) by flooring the startTime to the nearest
 *     windowSizeMs multiple. This ensures consistent bucketing but may cause the
 *     first window's start time to precede the requested startTime.
 * @returns Array of time windows
 * @throws {Error} If startTime or endTime is invalid
 * @throws {Error} If startTime is after endTime
 * @throws {Error} If windowSizeMs is invalid
 *
 * @example
 * ```typescript
 * const windows = getTimeWindows(
 *   new Date('2024-01-01T00:00:00Z'),
 *   new Date('2024-01-01T01:00:00Z'),
 *   { windowSizeMs: 15 * 60 * 1000 } // 15 minutes
 * );
 * // Returns 4 windows of 15 minutes each
 *
 * // With alignToBoundaries: true, if startTime is 10:00:15,
 * // the first window will start at 10:00:00 (aligned to minute boundary)
 * ```
 */
export function getTimeWindows(
	startTime: Date,
	endTime: Date,
	options?: TimeWindowOptions,
): TimeWindow[] {
	if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
		throw new Error(`startTime must be a valid Date. Got: ${startTime}`);
	}

	if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
		throw new Error(`endTime must be a valid Date. Got: ${endTime}`);
	}

	if (startTime >= endTime) {
		throw new Error(
			`startTime must be before endTime. startTime: ${startTime.toISOString()}, endTime: ${endTime.toISOString()}`,
		);
	}

	const windowSizeMs = options?.windowSizeMs ?? 60_000; // Default: 1 minute

	if (!Number.isFinite(windowSizeMs) || windowSizeMs <= 0) {
		throw new Error(
			`windowSizeMs must be a positive finite number. Got: ${windowSizeMs}`,
		);
	}

	const windows: TimeWindow[] = [];
	let currentStart = new Date(startTime);

	if (options?.alignToBoundaries) {
		// Align to window boundaries (e.g., minute boundaries)
		const startMs = currentStart.getTime();
		const alignedStartMs = Math.floor(startMs / windowSizeMs) * windowSizeMs;
		currentStart = new Date(alignedStartMs);
	}

	while (currentStart < endTime) {
		const currentEnd = new Date(
			Math.min(currentStart.getTime() + windowSizeMs, endTime.getTime()),
		);
		windows.push({
			start: new Date(currentStart),
			end: new Date(currentEnd),
		});
		currentStart = currentEnd;
	}

	return windows;
}

/**
 * Normalizes a time range to ensure valid start and end times.
 * If startTime is after endTime, they are swapped.
 * If either is invalid, an error is thrown.
 *
 * @param startTime - Start time of the range
 * @param endTime - End time of the range
 * @returns Normalized time range with start and end properties
 * @throws {Error} If either time is invalid
 *
 * @example
 * ```typescript
 * const range = normalizeTimeRange(
 *   new Date('2024-01-01T12:00:00Z'),
 *   new Date('2024-01-01T10:00:00Z')
 * );
 * // Returns: { start: endTime, end: startTime } (swapped)
 * ```
 */
export function normalizeTimeRange(
	startTime: Date,
	endTime: Date,
): { start: Date; end: Date } {
	if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
		throw new Error(`startTime must be a valid Date. Got: ${startTime}`);
	}

	if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
		throw new Error(`endTime must be a valid Date. Got: ${endTime}`);
	}

	// Swap if startTime is after endTime
	if (startTime > endTime) {
		return {
			start: new Date(endTime),
			end: new Date(startTime),
		};
	}

	return {
		start: new Date(startTime),
		end: new Date(endTime),
	};
}
