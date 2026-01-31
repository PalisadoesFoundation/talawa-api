import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Pre-merge validation: confirms that withMutationMetrics adds <1–2 ms per mutation
 * overhead (target from critical validations). Uses real timers and multiple
 * iterations to estimate per-call overhead.
 */
describe("withMutationMetrics overhead (pre-merge validation)", () => {
	const ITERATIONS = 300;
	const MAX_AVG_OVERHEAD_MS = 2;

	beforeEach(() => {
		vi.useRealTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should add less than 2 ms average overhead per mutation when perf is used", async () => {
		const perf = createPerformanceTracker();
		const resolver = vi.fn().mockResolvedValue("ok");
		const wrappedResolver = withMutationMetrics(
			{ operationName: "mutation:overhead-test" },
			resolver,
		);
		const contextWithPerf = { perf } as { perf?: PerformanceTracker };

		// Baseline: call resolver directly (no wrapper path that uses perf)
		const baselineStart = performance.now();
		for (let i = 0; i < ITERATIONS; i++) {
			await resolver(null, {}, contextWithPerf);
		}
		const baselineMs = performance.now() - baselineStart;

		// With perf: wrapped resolver with context.perf set
		const withPerfStart = performance.now();
		for (let i = 0; i < ITERATIONS; i++) {
			await wrappedResolver(null, {}, contextWithPerf);
		}
		const withPerfMs = performance.now() - withPerfStart;

		const overheadMs = withPerfMs - baselineMs;
		const avgOverheadPerCallMs = overheadMs / ITERATIONS;

		expect(resolver).toHaveBeenCalledTimes(ITERATIONS * 2); // baseline + withPerf
		expect(avgOverheadPerCallMs).toBeLessThan(MAX_AVG_OVERHEAD_MS);
	});
});
