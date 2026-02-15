import type { FastifyBaseLogger } from "fastify";
import { describe, expect, it, vi } from "vitest";
import { runBestEffortInvalidation } from "~/src/graphql/utils/runBestEffortInvalidation";

function createMockLogger(): FastifyBaseLogger {
	return {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	} as unknown as FastifyBaseLogger;
}

describe("runBestEffortInvalidation", () => {
	it("resolves when all invalidation promises succeed and does not log", async () => {
		const logger = createMockLogger();

		await expect(
			runBestEffortInvalidation(
				[Promise.resolve(), Promise.resolve()],
				"user",
				logger,
			),
		).resolves.toBeUndefined();

		expect(logger.error).not.toHaveBeenCalled();
	});

	it("does not throw when one invalidation promise rejects and logs the failure", async () => {
		const logger = createMockLogger();
		const err0 = new Error("boom");

		await expect(
			runBestEffortInvalidation(
				[Promise.reject(err0), Promise.resolve()],
				"user",
				logger,
			),
		).resolves.toBeUndefined();

		expect(logger.error).toHaveBeenCalledTimes(1);
		expect(logger.error).toHaveBeenCalledWith(
			expect.objectContaining({
				err: err0,
				entity: "user",
				opIndex: 0,
			}),
			"Cache invalidation failed",
		);
	});

	it("logs each rejection with the correct opIndex and preserves order by index", async () => {
		const logger = createMockLogger();
		const err0 = new Error("err0");
		const err2 = new Error("err2");

		await expect(
			runBestEffortInvalidation(
				[Promise.reject(err0), Promise.resolve(), Promise.reject(err2)],
				"post",
				logger,
			),
		).resolves.toBeUndefined();

		expect(logger.error).toHaveBeenCalledTimes(2);
		expect(logger.error).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				err: err0,
				entity: "post",
				opIndex: 0,
			}),
			"Cache invalidation failed",
		);
		expect(logger.error).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				err: err2,
				entity: "post",
				opIndex: 2,
			}),
			"Cache invalidation failed",
		);
	});

	it("waits for all invalidation promises to settle before resolving", async () => {
		vi.useFakeTimers();
		const logger = createMockLogger();

		const p10 = new Promise<void>((resolve) => {
			setTimeout(resolve, 10);
		});
		const p50 = new Promise<void>((resolve) => {
			setTimeout(resolve, 50);
		});

		let resolved = false;
		const runPromise = runBestEffortInvalidation(
			[p10, p50],
			"user",
			logger,
		).then(() => {
			resolved = true;
		});

		await vi.advanceTimersByTimeAsync(10);
		// Give promise callbacks a chance to run after timer advancement.
		await Promise.resolve();
		expect(resolved).toBe(false);

		await vi.advanceTimersByTimeAsync(40);
		await runPromise;
		expect(resolved).toBe(true);

		vi.useRealTimers();
	});
});
