import { isDeepStrictEqual } from "node:util";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";

/**
 * This function is used to narrow the type of a value passed to it to not be equal to `null` or `undefined`. More information can be found at the following links:
 *
 * {@link https://github.com/vitest-dev/vitest/issues/2883#issuecomment-2176048122}
 *
 * {@link https://github.com/vitest-dev/vitest/issues/5702#issuecomment-2176048295}
 *
 * @example
 *
 * const func = (name: string | null | undefined) => {
 * 	assertToBeNonNullish(name);
 * 	console.log(name.length);
 * }
 */
export function assertToBeNonNullish<T>(
	value: T | null | undefined,
	message?: string,
): asserts value is T {
	if (value === undefined || value === null) {
		throw new Error(message ?? "Not a non-nullish value.");
	}
}

/**
 * This function is useful for checking if the sequence passed to it as the first argument is a subsequence of the sequence passed to it as the second argument. A subsequence is a sequence that can be derived from another sequence by deleting some or no elements from the latter without changing the order of the remaining elements.
 *
 * @example
 * if(isSubsequence([3, 4, 1, 9, 2], [1, 2]){
 * 	console.log("[1, 2] is a subsequence of [3, 4, 1, 9, 2].")
 * }
 */
export const isSubSequence = <T>(sequence: T[], subsequence: T[]) => {
	let j = 0;
	// Iterate through the sequence to find the subsequence in order.
	for (let i = 0; i < sequence.length; i += 1) {
		if (isDeepStrictEqual(sequence[i], subsequence[j])) {
			j += 1;
		}
		// Return true if the matching for the entire subsequence has completed.
		if (j === subsequence.length) {
			return true;
		}
	}
	// Return true or false depending on whether the matching for the entire subsequence has completed along with the loop exit.
	return j === subsequence.length;
};

export type MetricsSnapshotPredicate = (snapshot: PerfSnapshot) => boolean;

export async function waitForMetricsSnapshot(
	app: { onMetricsSnapshot?: (snapshot: PerfSnapshot) => void },
	predicate: MetricsSnapshotPredicate,
	timeoutMs = 2000,
): Promise<PerfSnapshot> {
	return await new Promise((resolve, reject) => {
		const previous = app.onMetricsSnapshot;
		let resolved = false;
		const timer = setTimeout(() => {
			if (resolved) return;
			resolved = true;
			app.onMetricsSnapshot = previous;
			reject(new Error("Timed out waiting for metrics snapshot."));
		}, timeoutMs);

		app.onMetricsSnapshot = (snapshot) => {
			previous?.(snapshot);
			if (resolved || !predicate(snapshot)) return;
			resolved = true;
			clearTimeout(timer);
			app.onMetricsSnapshot = previous;
			resolve(snapshot);
		};
	});
}
