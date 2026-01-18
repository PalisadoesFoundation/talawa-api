import { describe, expect, it } from "vitest";
import {
	calculateMean,
	calculateMedian,
	calculatePercentile,
	getTimeWindows,
	normalizeTimeRange,
} from "~/src/utilities/metrics/dbHelpers";

/**
 * Tests for dbHelpers utility functions.
 * Tests statistical calculations, time window utilities, and edge cases.
 */
describe("dbHelpers", () => {
	describe("calculateMean", () => {
		it("should calculate mean of positive numbers", () => {
			const result = calculateMean([10, 20, 30, 40, 50]);
			expect(result).toBe(30);
		});

		it("should calculate mean of negative numbers", () => {
			const result = calculateMean([-10, -20, -30]);
			expect(result).toBe(-20);
		});

		it("should calculate mean of mixed positive and negative numbers", () => {
			const result = calculateMean([-10, 0, 10, 20]);
			expect(result).toBe(5);
		});

		it("should return 0 for empty array", () => {
			const result = calculateMean([]);
			expect(result).toBe(0);
		});

		it("should calculate mean of single value", () => {
			const result = calculateMean([42]);
			expect(result).toBe(42);
		});

		it("should calculate mean of two values", () => {
			const result = calculateMean([10, 20]);
			expect(result).toBe(15);
		});

		it("should calculate mean of decimal numbers", () => {
			const result = calculateMean([1.5, 2.5, 3.5]);
			expect(result).toBeCloseTo(2.5, 5);
		});

		it("should calculate mean with zero values", () => {
			const result = calculateMean([0, 10, 20]);
			expect(result).toBeCloseTo(10, 5);
		});

		it("should throw error for null values array", () => {
			expect(() => {
				calculateMean(null as unknown as number[]);
			}).toThrow("Values array cannot be null or undefined");
		});

		it("should throw error for undefined values array", () => {
			expect(() => {
				calculateMean(undefined as unknown as number[]);
			}).toThrow("Values array cannot be null or undefined");
		});

		it("should throw error for array containing Infinity", () => {
			expect(() => {
				calculateMean([1, 2, Infinity]);
			}).toThrow("All values must be finite numbers");
		});

		it("should throw error for array containing -Infinity", () => {
			expect(() => {
				calculateMean([1, 2, -Infinity]);
			}).toThrow("All values must be finite numbers");
		});

		it("should throw error for array containing NaN", () => {
			expect(() => {
				calculateMean([1, 2, Number.NaN]);
			}).toThrow("All values must be finite numbers");
		});
	});

	describe("calculateMedian", () => {
		it("should calculate median of odd-length array", () => {
			const result = calculateMedian([10, 20, 30, 40, 50]);
			expect(result).toBe(30);
		});

		it("should calculate median of even-length array", () => {
			const result = calculateMedian([10, 20, 30, 40]);
			expect(result).toBe(25); // Average of 20 and 30
		});

		it("should calculate median of unsorted array", () => {
			const result = calculateMedian([50, 10, 30, 20, 40]);
			expect(result).toBe(30);
		});

		it("should return 0 for empty array", () => {
			const result = calculateMedian([]);
			expect(result).toBe(0);
		});

		it("should calculate median of single value", () => {
			const result = calculateMedian([42]);
			expect(result).toBe(42);
		});

		it("should calculate median of two values", () => {
			const result = calculateMedian([10, 20]);
			expect(result).toBe(15);
		});

		it("should calculate median of decimal numbers", () => {
			const result = calculateMedian([1.5, 2.5, 3.5, 4.5]);
			expect(result).toBe(3); // Average of 2.5 and 3.5
		});

		it("should calculate median with duplicate values", () => {
			const result = calculateMedian([10, 10, 20, 20, 30]);
			expect(result).toBe(20);
		});

		it("should not mutate original array", () => {
			const original = [50, 10, 30, 20, 40];
			const copy = [...original];
			calculateMedian(original);
			expect(original).toEqual(copy);
		});

		it("should throw error for null values array", () => {
			expect(() => {
				calculateMedian(null as unknown as number[]);
			}).toThrow("Values array cannot be null or undefined");
		});

		it("should throw error for undefined values array", () => {
			expect(() => {
				calculateMedian(undefined as unknown as number[]);
			}).toThrow("Values array cannot be null or undefined");
		});

		it("should throw error for array containing Infinity", () => {
			expect(() => {
				calculateMedian([1, 2, Infinity]);
			}).toThrow("All values must be finite numbers");
		});

		it("should throw error for array containing NaN", () => {
			expect(() => {
				calculateMedian([1, 2, Number.NaN]);
			}).toThrow("All values must be finite numbers");
		});
	});

	describe("calculatePercentile", () => {
		it("should calculate p50 (median) percentile", () => {
			const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
			const result = calculatePercentile(values, 50);
			expect(result).toBe(55); // Average of 50 and 60
		});

		it("should calculate p95 percentile", () => {
			const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
			const result = calculatePercentile(values, 95);
			expect(result).toBe(95);
		});

		it("should calculate p99 percentile", () => {
			const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
			const result = calculatePercentile(values, 99);
			expect(result).toBeCloseTo(99, 0);
		});

		it("should return minimum value for p0", () => {
			const values = [10, 20, 30, 40, 50];
			const result = calculatePercentile(values, 0);
			expect(result).toBe(10);
		});

		it("should return maximum value for p100", () => {
			const values = [10, 20, 30, 40, 50];
			const result = calculatePercentile(values, 100);
			expect(result).toBe(50);
		});

		it("should calculate percentile for single value", () => {
			const result = calculatePercentile([42], 50);
			expect(result).toBe(42);
		});

		it("should calculate percentile for two values", () => {
			const result = calculatePercentile([10, 20], 50);
			expect(result).toBe(15);
		});

		it("should calculate percentile for unsorted array", () => {
			const values = [50, 10, 30, 20, 40];
			const result = calculatePercentile(values, 50);
			expect(result).toBe(30);
		});

		it("should calculate percentile with decimal interpolation", () => {
			const values = [10, 20, 30, 40, 50];
			const result = calculatePercentile(values, 25);
			expect(result).toBe(20);
		});

		it("should not mutate original array", () => {
			const original = [50, 10, 30, 20, 40];
			const copy = [...original];
			calculatePercentile(original, 50);
			expect(original).toEqual(copy);
		});

		it("should throw error for null values array", () => {
			expect(() => {
				calculatePercentile(null as unknown as number[], 50);
			}).toThrow("Values array cannot be null or undefined");
		});

		it("should throw error for undefined values array", () => {
			expect(() => {
				calculatePercentile(undefined as unknown as number[], 50);
			}).toThrow("Values array cannot be null or undefined");
		});

		it("should throw error for empty array", () => {
			expect(() => {
				calculatePercentile([], 50);
			}).toThrow("Values array cannot be empty for percentile calculation");
		});

		it("should throw error for percentile less than 0", () => {
			expect(() => {
				calculatePercentile([1, 2, 3], -1);
			}).toThrow("Percentile must be a finite number between 0 and 100");
		});

		it("should throw error for percentile greater than 100", () => {
			expect(() => {
				calculatePercentile([1, 2, 3], 101);
			}).toThrow("Percentile must be a finite number between 0 and 100");
		});

		it("should throw error for NaN percentile", () => {
			expect(() => {
				calculatePercentile([1, 2, 3], Number.NaN);
			}).toThrow("Percentile must be a finite number between 0 and 100");
		});

		it("should throw error for Infinity percentile", () => {
			expect(() => {
				calculatePercentile([1, 2, 3], Infinity);
			}).toThrow("Percentile must be a finite number between 0 and 100");
		});

		it("should throw error for array containing Infinity", () => {
			expect(() => {
				calculatePercentile([1, 2, Infinity], 50);
			}).toThrow("All values must be finite numbers");
		});

		it("should throw error for array containing NaN", () => {
			expect(() => {
				calculatePercentile([1, 2, Number.NaN], 50);
			}).toThrow("All values must be finite numbers");
		});
	});

	describe("getTimeWindows", () => {
		it("should generate time windows with default window size", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T10:05:00Z"); // 5 minutes
			const windows = getTimeWindows(startTime, endTime);

			expect(windows.length).toBe(5); // 5 one-minute windows
			expect(windows[0]?.start).toEqual(startTime);
			expect(windows[windows.length - 1]?.end).toEqual(endTime);
		});

		it("should generate time windows with custom window size", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T11:00:00Z"); // 1 hour
			const windows = getTimeWindows(startTime, endTime, {
				windowSizeMs: 15 * 60 * 1000, // 15 minutes
			});

			expect(windows.length).toBe(4); // 4 fifteen-minute windows
			expect(windows[0]?.start).toEqual(startTime);
			expect(windows[windows.length - 1]?.end).toEqual(endTime);
		});

		it("should generate windows that cover entire range", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T10:02:30Z"); // 2.5 minutes
			const windows = getTimeWindows(startTime, endTime, {
				windowSizeMs: 60 * 1000, // 1 minute
			});

			expect(windows.length).toBe(3); // 3 windows to cover 2.5 minutes
			expect(windows[0]?.start).toEqual(startTime);
			expect(windows[windows.length - 1]?.end).toEqual(endTime);
		});

		it("should generate non-overlapping windows", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T10:03:00Z");
			const windows = getTimeWindows(startTime, endTime, {
				windowSizeMs: 60 * 1000,
			});

			for (let i = 0; i < windows.length - 1; i++) {
				expect(windows[i]?.end).toEqual(windows[i + 1]?.start);
			}
		});

		it("should align windows to boundaries when alignToBoundaries is true", () => {
			const startTime = new Date("2024-01-01T10:00:15Z"); // 15 seconds past minute
			const endTime = new Date("2024-01-01T10:05:00Z");
			const windows = getTimeWindows(startTime, endTime, {
				windowSizeMs: 60 * 1000,
				alignToBoundaries: true,
			});

			// First window should start at aligned boundary (10:00:00)
			expect(windows[0]?.start.getTime()).toBeLessThanOrEqual(
				startTime.getTime(),
			);
		});

		it("should not align windows to boundaries when alignToBoundaries is false", () => {
			const startTime = new Date("2024-01-01T10:00:15Z");
			const endTime = new Date("2024-01-01T10:05:00Z");
			const windows = getTimeWindows(startTime, endTime, {
				windowSizeMs: 60 * 1000,
				alignToBoundaries: false,
			});

			expect(windows[0]?.start).toEqual(startTime);
		});

		it("should handle single window when range is smaller than window size", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T10:00:30Z"); // 30 seconds
			const windows = getTimeWindows(startTime, endTime, {
				windowSizeMs: 60 * 1000, // 1 minute
			});

			expect(windows.length).toBe(1);
			expect(windows[0]?.start).toEqual(startTime);
			expect(windows[0]?.end).toEqual(endTime);
		});

		it("should create new Date objects for windows", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T10:02:00Z");
			const windows = getTimeWindows(startTime, endTime);

			// Windows should be new Date objects, not references
			windows.forEach((window) => {
				expect(window.start).toBeInstanceOf(Date);
				expect(window.end).toBeInstanceOf(Date);
				expect(window.start).not.toBe(startTime);
				expect(window.end).not.toBe(endTime);
			});
		});

		it("should throw error when startTime equals endTime", () => {
			const time = new Date("2024-01-01T10:00:00Z");
			expect(() => {
				getTimeWindows(time, time);
			}).toThrow("startTime must be before endTime");
		});

		it("should throw error when startTime is after endTime", () => {
			const startTime = new Date("2024-01-01T12:00:00Z");
			const endTime = new Date("2024-01-01T10:00:00Z");
			expect(() => {
				getTimeWindows(startTime, endTime);
			}).toThrow("startTime must be before endTime");
		});

		it("should throw error for invalid windowSizeMs (zero)", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T11:00:00Z");
			expect(() => {
				getTimeWindows(startTime, endTime, { windowSizeMs: 0 });
			}).toThrow("windowSizeMs must be a positive finite number");
		});

		it("should throw error for invalid windowSizeMs (negative)", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T11:00:00Z");
			expect(() => {
				getTimeWindows(startTime, endTime, { windowSizeMs: -1000 });
			}).toThrow("windowSizeMs must be a positive finite number");
		});

		it("should throw error for invalid windowSizeMs (Infinity)", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T11:00:00Z");
			expect(() => {
				getTimeWindows(startTime, endTime, {
					windowSizeMs: Infinity,
				});
			}).toThrow("windowSizeMs must be a positive finite number");
		});

		it("should throw error for invalid windowSizeMs (NaN)", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T11:00:00Z");
			expect(() => {
				getTimeWindows(startTime, endTime, {
					windowSizeMs: Number.NaN,
				});
			}).toThrow("windowSizeMs must be a positive finite number");
		});
	});

	describe("normalizeTimeRange", () => {
		it("should return normalized range when startTime is before endTime", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T12:00:00Z");
			const result = normalizeTimeRange(startTime, endTime);

			expect(result.start).toEqual(startTime);
			expect(result.end).toEqual(endTime);
		});

		it("should swap times when startTime is after endTime", () => {
			const startTime = new Date("2024-01-01T12:00:00Z");
			const endTime = new Date("2024-01-01T10:00:00Z");
			const result = normalizeTimeRange(startTime, endTime);

			expect(result.start).toEqual(endTime);
			expect(result.end).toEqual(startTime);
		});

		it("should create new Date objects", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T12:00:00Z");
			const result = normalizeTimeRange(startTime, endTime);

			expect(result.start).not.toBe(startTime);
			expect(result.end).not.toBe(endTime);
			expect(result.start.getTime()).toBe(startTime.getTime());
			expect(result.end.getTime()).toBe(endTime.getTime());
		});

		it("should handle same time (startTime equals endTime)", () => {
			const time = new Date("2024-01-01T10:00:00Z");
			const result = normalizeTimeRange(time, time);

			expect(result.start).toEqual(time);
			expect(result.end).toEqual(time);
		});

		it("should throw error for invalid startTime (NaN)", () => {
			const invalidDate = new Date("invalid");
			const endTime = new Date("2024-01-01T12:00:00Z");
			expect(() => {
				normalizeTimeRange(invalidDate, endTime);
			}).toThrow("startTime must be a valid Date");
		});

		it("should throw error for invalid endTime (NaN)", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const invalidDate = new Date("invalid");
			expect(() => {
				normalizeTimeRange(startTime, invalidDate);
			}).toThrow("endTime must be a valid Date");
		});

		it("should throw error for null startTime", () => {
			const endTime = new Date("2024-01-01T12:00:00Z");
			expect(() => {
				normalizeTimeRange(null as unknown as Date, endTime);
			}).toThrow("startTime must be a valid Date");
		});

		it("should throw error for null endTime", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			expect(() => {
				normalizeTimeRange(startTime, null as unknown as Date);
			}).toThrow("endTime must be a valid Date");
		});

		it("should throw error for undefined startTime", () => {
			const endTime = new Date("2024-01-01T12:00:00Z");
			expect(() => {
				normalizeTimeRange(undefined as unknown as Date, endTime);
			}).toThrow("startTime must be a valid Date");
		});

		it("should throw error for undefined endTime", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			expect(() => {
				normalizeTimeRange(startTime, undefined as unknown as Date);
			}).toThrow("endTime must be a valid Date");
		});
	});
});
