import { Readable } from "node:stream";
import { vi } from "vitest";
import type { PubSub } from "~/src/graphql/pubsub";

export function createMockPubSub(): PubSub {
	return {
		publish: vi.fn(),
		subscribe: vi.fn().mockResolvedValue(
			Object.assign(
				new Readable({
					read() {}, // Empty Readable Stream (mocks real event streams)
				}),
				{ [Symbol.asyncIterator]: async function* () {} },
			),
		),
	};
}
